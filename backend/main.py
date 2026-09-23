import json
import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from models import UserProfile, EvaluationResponse, FeedbackRequest, LoginRequest, SignupRequest, AuthResponse, ProfileUpdateRequest
from models_db import User
from db import get_db, init_db
from auth_utils import hash_password, verify_password, generate_jwt_token, decode_jwt_token
from services.evaluator import evaluate_scheme_eligibility
from services.conflicts import detect_scheme_conflicts
from services.overlap import analyze_document_overlaps
from services.ranker import rank_and_score_schemes
from services.data_cleaner import sanitize_scheme_object

app = FastAPI(
    title="YojanaBundle API",
    description="Smart Eligibility & Scheme Bundling Planner for Farmers",
    version="2.1.0"
)

# Initialize Database tables on application startup
@app.on_event("startup")
def startup_event():
    init_db()

# Enable CORS for local React dev server ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "schemes.json")
FEEDBACK_PATH = os.path.join(os.path.dirname(__file__), "feedback_log.json")

security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Reusable FastAPI dependency for extracting and verifying JWT Bearer tokens
    and fetching the authenticated user from the SQLite database.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_jwt_token(token)
    except ValueError as e:
        err_msg = str(e)
        if "expired" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

# Global Exception Handler to catch any unhandled exceptions gracefully
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An unexpected error occurred during profile evaluation.",
            "detail": str(exc),
            "path": request.url.path
        }
    )

def load_schemes() -> List[Dict[str, Any]]:
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Schemes database file not found at {DATA_PATH}")
    
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        raw_schemes = json.load(f)

    cleaned_schemes = [sanitize_scheme_object(s) for s in raw_schemes]
    return cleaned_schemes

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "YojanaBundle Backend Engine v2.1 (Hardened)", "version": "2.1.0"}

@app.get("/api/schemes")
def get_all_schemes():
    schemes = load_schemes()
    return {"total": len(schemes), "schemes": schemes}

@app.post("/api/auth/login", response_model=AuthResponse)
def auth_login(req: LoginRequest, db: Session = Depends(get_db)):
    if not req.identifier or not req.password:
        raise HTTPException(status_code=400, detail="Identifier and Password are required")

    email = req.identifier.strip().lower()

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = generate_jwt_token(
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role
    )

    return AuthResponse(status="success", token=token, user=user.to_dict())

@app.post("/api/auth/signup", response_model=AuthResponse)
def auth_signup(req: SignupRequest, db: Session = Depends(get_db)):
    if not req.name or not req.identifier:
        raise HTTPException(status_code=400, detail="Name and Identifier are required")
    if not req.password:
        raise HTTPException(status_code=400, detail="Password is required")

    email = req.identifier.strip().lower()

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account with this email already exists"
        )

    pwd_hash = hash_password(req.password)
    user_id = f"usr_{uuid.uuid4().hex[:10]}"

    new_user = User(
        id=user_id,
        name=req.name.strip(),
        email=email,
        password_hash=pwd_hash,
        role=req.role or "Farmer"
    )
    new_user.profile_attributes = req.profileAttributes or {}

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = generate_jwt_token(
        user_id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role
    )

    return AuthResponse(status="success", token=token, user=new_user.to_dict())

@app.get("/api/auth/me")
def auth_me(current_user: User = Depends(get_current_user)):
    return {"status": "success", "user": current_user.to_dict()}

@app.patch("/api/auth/profile")
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates authenticated user's profile attributes in SQLite database.
    """
    existing_attributes = current_user.profile_attributes or {}
    update_data = req.model_dump(exclude_unset=True) if hasattr(req, 'model_dump') else req.dict(exclude_unset=True)
    
    # Merge non-null updated fields
    merged_attributes = {**existing_attributes, **update_data}
    current_user.profile_attributes = merged_attributes

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {"status": "success", "user": current_user.to_dict()}


@app.post("/api/evaluate", response_model=EvaluationResponse)
def evaluate_profile(profile: UserProfile):
    all_schemes = load_schemes()
    owned_docs = profile.owned_documents if profile.owned_documents is not None else []

    eligible_schemes = []
    ineligible_schemes = []

    for scheme in all_schemes:
        is_eligible, reasons = evaluate_scheme_eligibility(profile, scheme)
        if is_eligible:
            eligible_schemes.append(scheme)
        else:
            ineligible_schemes.append({
                "scheme": scheme,
                "disqualification_reasons": reasons
            })

    conflicts, secondary_ids = detect_scheme_conflicts(eligible_schemes)
    insights, callouts = analyze_document_overlaps(eligible_schemes, owned_docs)
    ranked = rank_and_score_schemes(eligible_schemes, owned_docs, secondary_ids)

    total_benefit = sum(s.get("benefit_amount", 0.0) for s in eligible_schemes)
    
    total_required_unique = len(insights)
    owned_unique = sum(1 for i in insights if i.is_owned)
    doc_readiness_pct = round((owned_unique / total_required_unique * 100.0), 1) if total_required_unique > 0 else 100.0

    action_checklist = []
    for r in ranked:
        s = r.scheme
        action_checklist.append({
            "step": len(action_checklist) + 1,
            "scheme_id": s.get("id", "UNKNOWN"),
            "scheme_name": s.get("name", "Untitled Scheme"),
            "priority_tier": r.priority_tier,
            "composite_score": r.composite_score,
            "benefit_display": s.get("benefit_display", ""),
            "benefit_display_mr": s.get("benefit_display_mr"),
            "benefit_amount": s.get("benefit_amount", 0.0),
            "deadline_days": s.get("deadline_days", 30),
            "missing_documents": r.missing_documents,
            "all_required_documents": s.get("required_documents", []),
            "official_url": s.get("official_url", "https://myscheme.gov.in"),
            "is_mutually_exclusive_secondary": r.is_mutually_exclusive_secondary,
            "conflict_warning": r.conflict_warning,
            "application_steps": s.get("application_steps", []),
            "application_steps_mr": s.get("application_steps_mr", [])
        })

    return EvaluationResponse(
        total_eligible_schemes=len(eligible_schemes),
        total_potential_benefit=total_benefit,
        formatted_potential_benefit=f"₹{total_benefit:,.0f}",
        document_readiness_pct=doc_readiness_pct,
        ranked_schemes=ranked,
        ineligible_schemes=ineligible_schemes,
        document_insights=insights,
        high_leverage_callouts=callouts,
        conflicts_detected=conflicts,
        action_checklist=action_checklist
    )

@app.post("/api/feedback")
def record_feedback(fb: FeedbackRequest):
    feedback_entries = []
    if os.path.exists(FEEDBACK_PATH):
        try:
            with open(FEEDBACK_PATH, "r", encoding="utf-8") as f:
                feedback_entries = json.load(f)
        except Exception:
            feedback_entries = []

    new_entry = {
        "scheme_id": fb.scheme_id,
        "rating": fb.rating,
        "comment": fb.comment
    }
    feedback_entries.append(new_entry)

    with open(FEEDBACK_PATH, "w", encoding="utf-8") as f:
        json.dump(feedback_entries, f, indent=2)

    return {"status": "success", "message": "Feedback logged successfully", "recorded": new_entry}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

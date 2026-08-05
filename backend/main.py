import json
import os
import base64
import time
import hmac
import hashlib
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from models import UserProfile, EvaluationResponse, FeedbackRequest, LoginRequest, SignupRequest, AuthResponse
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
USERS_DB_PATH = os.path.join(os.path.dirname(__file__), "users_db.json")
JWT_SECRET = "yojana_bundle_secret_key_2026"

def generate_jwt_token(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature_raw = f"{header_b64}.{payload_b64}".encode()
    signature = base64.urlsafe_b64encode(
        hmac.new(JWT_SECRET.encode(), signature_raw, hashlib.sha256).digest()
    ).decode().rstrip("=")
    return f"{header_b64}.{payload_b64}.{signature}"

def decode_jwt_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid JWT format")
        payload_b64 = parts[1]
        padding = "=" * (4 - len(payload_b64) % 4)
        payload_json = base64.urlsafe_b64decode(payload_b64 + padding).decode()
        return json.loads(payload_json)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authorization token")

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
def auth_login(req: LoginRequest):
    if not req.identifier:
        raise HTTPException(status_code=400, detail="Identifier (Email or Phone) is required")
    
    is_email = "@" in req.identifier
    user_name = req.identifier.split("@")[0].capitalize() if is_email else f"User {req.identifier[-4:]}"
    role = "Farmer"

    user_data = {
        "id": f"usr_{int(time.time())}",
        "name": user_name,
        "identifier": req.identifier,
        "role": role,
        "savedSchemes": ["PM_KISAN"],
        "profileAttributes": {
            "annual_income": 180000,
            "category": "OBC",
            "state": "Maharashtra",
            "age": 35,
            "land_acres": 3.0,
            "occupation": role,
            "owned_documents": ["Aadhaar Card", "Bank Passbook"]
        }
    }

    token = generate_jwt_token({
        "sub": user_data["id"],
        "name": user_data["name"],
        "role": user_data["role"],
        "exp": int(time.time()) + 604800
    })

    return AuthResponse(status="success", token=token, user=user_data)

@app.post("/api/auth/signup", response_model=AuthResponse)
def auth_signup(req: SignupRequest):
    if not req.name or not req.identifier:
        raise HTTPException(status_code=400, detail="Name and Identifier are required")

    user_data = {
        "id": f"usr_{int(time.time())}",
        "name": req.name,
        "identifier": req.identifier,
        "role": "Farmer",
        "savedSchemes": [],
        "profileAttributes": req.profileAttributes or {
            "annual_income": 150000,
            "category": "General",
            "state": "Maharashtra",
            "age": 25,
            "land_acres": 2.5,
            "occupation": "Farmer",
            "owned_documents": ["Aadhaar Card", "Bank Passbook"]
        }
    }

    token = generate_jwt_token({
        "sub": user_data["id"],
        "name": user_data["name"],
        "role": user_data["role"],
        "exp": int(time.time()) + 604800
    })

    return AuthResponse(status="success", token=token, user=user_data)

@app.get("/api/auth/me")
def auth_me(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Bearer token")
    token = authorization.split(" ")[1]
    payload = decode_jwt_token(token)
    return {"status": "success", "user": payload}

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

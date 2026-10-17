import os
import re
import time
import secrets
import logging
import ipaddress
import base64
import hashlib
import hmac
import json
import urllib.parse
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from db import get_db
from models_db import Scheme, Feedback, User

logger = logging.getLogger("admin_security")

router = APIRouter(tags=["Admin"])

# In-memory tracking for failed authentication attempts (IP -> list of timestamps)
_failed_attempts: Dict[str, List[float]] = {}
_lockouts: Dict[str, float] = {}
_global_failed_attempts: List[float] = []

MAX_FAILED_ATTEMPTS = 5
ATTEMPT_WINDOW_SECONDS = 600.0   # 10 minutes
LOCKOUT_DURATION_SECONDS = 600.0  # 10 minutes

GLOBAL_MAX_FAILED_ATTEMPTS = 50
GLOBAL_WINDOW_SECONDS = 600.0    # 10 minutes

VALID_OPERATORS = {"<=", ">=", "==", "!=", "IN", "NOT_IN", "CONTAINS", "BETWEEN"}
VALID_CATEGORIES = {"GENERAL", "OBC", "SC", "ST", "EWS"}


class AdminLoginRequest(BaseModel):
    key: str


def get_trusted_proxy_count() -> int:
    """Retrieves TRUSTED_PROXY_COUNT from environment (default 0)."""
    try:
        raw_val = os.environ.get("TRUSTED_PROXY_COUNT", "0").strip()
        return max(0, int(raw_val))
    except (ValueError, TypeError, AttributeError):
        return 0


def _get_fallback_ip(request: Request) -> str:
    """Extracts fallback client host from ASGI scope."""
    if request.client and request.client.host:
        return request.client.host.strip()
    return "127.0.0.1"


def _is_valid_ip(ip_str: str) -> bool:
    """Validates if string is a syntactically valid IPv4 or IPv6 address."""
    try:
        ipaddress.ip_address(ip_str.strip())
        return True
    except (ValueError, TypeError):
        return False


def _get_client_ip(request: Request) -> str:
    """
    Extracts client IP address safely:
    - By default (TRUSTED_PROXY_COUNT <= 0): uses request.client.host and ignores X-Forwarded-For entirely.
    - If TRUSTED_PROXY_COUNT > 0: extracts client IP by counting TRUSTED_PROXY_COUNT proxies from the
      right side of X-Forwarded-For (never trusting the leftmost value, which the client controls).
      Specifically uses entry at index: -1 - TRUSTED_PROXY_COUNT (e.g. rightmost-minus-one for count=1).
    - If X-Forwarded-For is missing, malformed, contains non-IP values, or has fewer entries than
      TRUSTED_PROXY_COUNT + 1, falls back to request.client.host.
    """
    fallback_ip = _get_fallback_ip(request)
    trusted_count = get_trusted_proxy_count()

    if trusted_count <= 0:
        return fallback_ip

    forwarded = request.headers.get("X-Forwarded-For")
    if not forwarded:
        return fallback_ip

    raw_parts = [part.strip() for part in forwarded.split(",")]
    if any(not part for part in raw_parts) or len(raw_parts) < (trusted_count + 1):
        return fallback_ip

    relevant_ips = raw_parts[-(trusted_count + 1):]
    for ip_str in relevant_ips:
        if not _is_valid_ip(ip_str):
            return fallback_ip

    return raw_parts[-1 - trusted_count]


def reset_brute_force_state():
    """Clears in-memory brute force lockout, attempt states, and global failures (used for test isolation)."""
    _failed_attempts.clear()
    _lockouts.clear()
    _global_failed_attempts.clear()


def _clear_cache():
    """Helper to clear main schemes cache when a scheme is updated or created."""
    try:
        from main import clear_schemes_cache
        clear_schemes_cache()
    except Exception as exc:
        logger.warning(f"Could not clear schemes cache: {exc}")


def get_admin_secret_key() -> str:
    """
    Retrieves ADMIN_SECRET_KEY from environment at request time.
    """
    return os.environ.get("ADMIN_SECRET_KEY", "").strip()


# ---------------------------------------------------------------------------
# Cryptographic Session & CSRF Token Helpers
# ---------------------------------------------------------------------------

def _get_signing_key(admin_key: str) -> bytes:
    """Derives session signing key from ADMIN_SECRET_KEY using HMAC-SHA256."""
    return hmac.new(admin_key.encode("utf-8"), b"yojana-admin-session-v1", hashlib.sha256).digest()


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    padding = b"=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s.encode("ascii") + padding)


def create_session_token(admin_key: str) -> tuple[str, str, str, str]:
    """
    Creates a signed, stateless session token and its corresponding CSRF token.
    Returns: (token_str, csrf_token_str, expires_at_iso, session_id)
    """
    signing_key = _get_signing_key(admin_key)
    session_id = secrets.token_hex(16)  # 128-bit random session id
    now = int(time.time())
    expires_at = now + 86400  # 24 hours absolute

    payload = {
        "sid": session_id,
        "iat": now,
        "exp": expires_at,
        "v": "v1"
    }
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_b64 = _b64url_encode(payload_bytes)

    sig = hmac.new(signing_key, payload_bytes, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)

    token_str = f"{payload_b64}.{sig_b64}"

    # CSRF token derivation
    csrf_bytes = (session_id + "csrf").encode("utf-8")
    csrf_sig = hmac.new(signing_key, csrf_bytes, hashlib.sha256).digest()
    csrf_token = _b64url_encode(csrf_sig)

    expires_at_iso = datetime.fromtimestamp(expires_at, tz=timezone.utc).isoformat()
    return token_str, csrf_token, expires_at_iso, session_id


def generate_csrf_token(admin_key: str, session_id: str) -> str:
    """Derives CSRF token from signing key and session id."""
    signing_key = _get_signing_key(admin_key)
    csrf_bytes = (session_id + "csrf").encode("utf-8")
    csrf_sig = hmac.new(signing_key, csrf_bytes, hashlib.sha256).digest()
    return _b64url_encode(csrf_sig)


def verify_session_token(token_str: str, admin_key: str) -> Optional[Dict[str, Any]]:
    """
    Verifies signature and expiration of a session token.
    Returns payload dict if valid, None if invalid/tampered/expired.
    """
    if not token_str or "." not in token_str:
        return None

    parts = token_str.split(".")
    if len(parts) != 2:
        return None

    payload_b64, sig_b64 = parts[0], parts[1]

    try:
        payload_bytes = _b64url_decode(payload_b64)
    except Exception:
        return None

    signing_key = _get_signing_key(admin_key)
    expected_sig = hmac.new(signing_key, payload_bytes, hashlib.sha256).digest()
    expected_sig_b64 = _b64url_encode(expected_sig)

    if not secrets.compare_digest(sig_b64, expected_sig_b64):
        return None

    try:
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None

    if not isinstance(payload, dict):
        return None

    if payload.get("v") != "v1":
        return None

    exp = payload.get("exp")
    if not isinstance(exp, (int, float)):
        return None

    if time.time() > exp:
        return None

    if not payload.get("sid"):
        return None

    return payload


def is_cookie_secure(request: Request) -> bool:
    """
    Determines whether session cookie must have Secure flag set.
    Supports ADMIN_COOKIE_SECURE env var: auto (default), true, false.
    In auto mode: True if scheme is https or if X-Forwarded-Proto is https and TRUSTED_PROXY_COUNT > 0.
    """
    mode = os.environ.get("ADMIN_COOKIE_SECURE", "auto").strip().lower()
    if mode == "true":
        return True
    if mode == "false":
        return False
    # auto mode
    if request.url.scheme == "https":
        return True
    forwarded_proto = request.headers.get("X-Forwarded-Proto", "").strip().lower()
    if forwarded_proto == "https" and get_trusted_proxy_count() > 0:
        return True
    return False


def _verify_origin_match(request: Request):
    """
    Verifies that the request's Origin (or Referer if Origin is absent) matches the request Host.
    Raises 403 Forbidden on mismatch.
    """
    origin = request.headers.get("Origin")
    referer = request.headers.get("Referer")
    source = origin or referer
    if not source:
        return

    parsed = urllib.parse.urlparse(source)
    source_netloc = parsed.netloc.lower()
    source_host = source_netloc.split(":")[0]

    request_netloc = (request.headers.get("Host") or request.url.netloc or "").lower()
    request_host = request_netloc.split(":")[0]

    if source_netloc != request_netloc and source_host != request_host:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Origin mismatch."
        )


def require_admin_session(request: Request) -> Dict[str, Any]:
    """
    Security dependency for all /api/admin/* endpoints:
    1. Returns 404 if ADMIN_SECRET_KEY is unset or empty (admin disabled).
    2. Reads yb_admin_session from request.cookies.
    3. Verifies signature, structure, and 24h expiration using derived signing key.
    4. On failure (missing, tampered, expired): raises generic 401 Unauthorized.
    5. On state-changing methods (POST, PUT, DELETE): enforces CSRF token and Origin match.
    6. Returns verified session payload.
    """
    admin_secret = get_admin_secret_key()
    if not admin_secret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    cookie_token = request.cookies.get("yb_admin_session")
    if not cookie_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    payload = verify_session_token(cookie_token, admin_secret)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    # State-changing method protection (CSRF + Origin)
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        _verify_origin_match(request)
        provided_csrf = request.headers.get("X-CSRF-Token")
        expected_csrf = generate_csrf_token(admin_secret, payload["sid"])
        if not provided_csrf or not secrets.compare_digest(provided_csrf, expected_csrf):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Invalid or missing CSRF token."
            )

    return payload


# ---------------------------------------------------------------------------
# Authentication Endpoints (Login, Session, Logout)
# ---------------------------------------------------------------------------

@router.post("/api/admin/login")
def admin_login(
    payload: AdminLoginRequest,
    request: Request
):
    """
    Authenticates with ADMIN_SECRET_KEY, sets HttpOnly session cookie, and returns CSRF token.
    Reuses per-IP brute-force protection and global safety valve.
    """
    admin_secret = get_admin_secret_key()
    if not admin_secret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    client_ip = _get_client_ip(request)
    now = time.time()

    # 1. Check if IP is currently locked out
    lockout_until = _lockouts.get(client_ip, 0.0)
    if now < lockout_until:
        logger.warning(f"Admin attempt rejected: IP {client_ip} is locked out")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Try again later."
        )

    # Clean expired lockout
    if client_ip in _lockouts and now >= lockout_until:
        del _lockouts[client_ip]

    provided_key = payload.key.strip()
    is_valid_key = bool(provided_key and secrets.compare_digest(provided_key, admin_secret))

    if not is_valid_key:
        timestamp_str = datetime.utcnow().isoformat()
        logger.warning(f"Failed admin authentication attempt from IP: {client_ip} at {timestamp_str}")

        ip_attempts = [t for t in _failed_attempts.get(client_ip, []) if (now - t) < ATTEMPT_WINDOW_SECONDS]
        ip_attempts.append(now)
        _failed_attempts[client_ip] = ip_attempts

        global _global_failed_attempts
        _global_failed_attempts = [t for t in _global_failed_attempts if (now - t) < GLOBAL_WINDOW_SECONDS]
        _global_failed_attempts.append(now)

        if len(ip_attempts) >= MAX_FAILED_ATTEMPTS:
            _lockouts[client_ip] = now + LOCKOUT_DURATION_SECONDS
            logger.warning(f"Brute-force lockout triggered for IP: {client_ip} for {int(LOCKOUT_DURATION_SECONDS)}s")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Try again later."
            )

        if len(_global_failed_attempts) > GLOBAL_MAX_FAILED_ATTEMPTS:
            logger.warning(
                f"Global safety valve active: {len(_global_failed_attempts)} failed attempts in 10m. "
                f"Rejecting unauthenticated request from IP {client_ip} with 429."
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts globally. Try again later."
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )

    # Success: Clear failure count for this IP
    _failed_attempts.pop(client_ip, None)

    token_str, csrf_token, expires_at_iso, session_id = create_session_token(admin_secret)

    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "csrf_token": csrf_token,
            "expires_at": expires_at_iso
        }
    )
    response.set_cookie(
        key="yb_admin_session",
        value=token_str,
        max_age=86400,
        path="/api/admin",
        httponly=True,
        samesite="strict",
        secure=is_cookie_secure(request)
    )
    return response


@router.get("/api/admin/session")
def get_admin_session(
    session: Dict[str, Any] = Depends(require_admin_session)
):
    """
    Returns CSRF token and expiration if session cookie is valid.
    Called on page load to restore session after refresh.
    """
    admin_secret = get_admin_secret_key()
    csrf_token = generate_csrf_token(admin_secret, session["sid"])
    expires_at_iso = datetime.fromtimestamp(session["exp"], tz=timezone.utc).isoformat()
    return {
        "csrf_token": csrf_token,
        "expires_at": expires_at_iso
    }


@router.post("/api/admin/logout", status_code=status.HTTP_204_NO_CONTENT)
def admin_logout(
    request: Request
):
    """
    Clears the session cookie (Max-Age=0) and returns 204.
    Needs a valid session and CSRF token, but still clears the cookie if the session is already expired.
    """
    admin_secret = get_admin_secret_key()
    if not admin_secret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    cookie_token = request.cookies.get("yb_admin_session")

    # If cookie is present, verify Origin and CSRF
    if cookie_token:
        _verify_origin_match(request)

        signing_key = _get_signing_key(admin_secret)
        if "." in cookie_token:
            parts = cookie_token.split(".")
            if len(parts) == 2:
                payload_b64, sig_b64 = parts[0], parts[1]
                try:
                    payload_bytes = _b64url_decode(payload_b64)
                    expected_sig = hmac.new(signing_key, payload_bytes, hashlib.sha256).digest()
                    expected_sig_b64 = _b64url_encode(expected_sig)
                    if secrets.compare_digest(sig_b64, expected_sig_b64):
                        payload = json.loads(payload_bytes.decode("utf-8"))
                        session_id = payload.get("sid", "")
                        provided_csrf = request.headers.get("X-CSRF-Token")
                        expected_csrf = generate_csrf_token(admin_secret, session_id)
                        if not provided_csrf or not secrets.compare_digest(provided_csrf, expected_csrf):
                            raise HTTPException(
                                status_code=status.HTTP_403_FORBIDDEN,
                                detail="Forbidden: Invalid or missing CSRF token."
                            )
                except HTTPException:
                    raise
                except Exception:
                    pass

    # Clear cookie regardless (even if session expired)
    resp = Response(status_code=status.HTTP_204_NO_CONTENT)
    resp.delete_cookie(
        key="yb_admin_session",
        path="/api/admin",
        httponly=True,
        samesite="strict",
        secure=is_cookie_secure(request)
    )
    return resp


def validate_scheme_payload(payload: Dict[str, Any], is_create: bool = False, existing_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Validates scheme input payload before saving to database.
    Raises 422 with a specific explanation on any invalid field.
    """
    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="Request payload must be a JSON object.")

    # 1. ID checks
    if is_create:
        sid = payload.get("id")
        if not sid or not isinstance(sid, str) or not sid.strip():
            raise HTTPException(status_code=422, detail="Field 'id' is required and must be a non-empty string.")
    else:
        if "id" in payload and str(payload["id"]).strip() != existing_id:
            raise HTTPException(status_code=422, detail=f"Scheme ID cannot be modified (cannot change '{existing_id}' to '{payload['id']}').")

    # 2. Name & ShortName
    if is_create:
        if not payload.get("name") or not str(payload.get("name", "")).strip():
            raise HTTPException(status_code=422, detail="Field 'name' is required.")
        short = payload.get("shortName") or payload.get("short_name")
        if not short or not str(short).strip():
            raise HTTPException(status_code=422, detail="Field 'shortName' is required.")

    # 3. benefit_amount
    if "benefit_amount" in payload:
        amt = payload["benefit_amount"]
        try:
            val_f = float(amt)
            if val_f < 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail="Field 'benefit_amount' must be a number greater than or equal to 0.")

    # 4. closing_date
    if "closing_date" in payload:
        cd = payload["closing_date"]
        if cd is not None and str(cd).strip() != "":
            cd_str = str(cd).strip()
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", cd_str):
                raise HTTPException(status_code=422, detail="Field 'closing_date' must be in 'YYYY-MM-DD' format or null.")
            try:
                datetime.strptime(cd_str, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=422, detail="Field 'closing_date' must be a valid calendar date in 'YYYY-MM-DD' format.")

    # 5. rules
    if "rules" in payload:
        rules = payload["rules"]
        if not isinstance(rules, list):
            raise HTTPException(status_code=422, detail="Field 'rules' must be a list of rule objects.")
        for idx, rule in enumerate(rules):
            if not isinstance(rule, dict):
                raise HTTPException(status_code=422, detail=f"Rule at index {idx} must be a dictionary.")
            field = rule.get("field")
            if not field or not isinstance(field, str) or not field.strip():
                raise HTTPException(status_code=422, detail=f"Rule at index {idx} is missing a non-empty 'field' string.")
            op = str(rule.get("operator", "")).strip().upper()
            if op not in VALID_OPERATORS:
                raise HTTPException(
                    status_code=422,
                    detail=f"Rule at index {idx} has invalid operator '{op}'. Allowed: {sorted(list(VALID_OPERATORS))}."
                )
            if op == "BETWEEN":
                b_val = rule.get("value")
                if not isinstance(b_val, list) or len(b_val) != 2:
                    raise HTTPException(status_code=422, detail=f"Rule at index {idx} with 'BETWEEN' operator must have a 2-element list [min, max] as value.")
                try:
                    min_v = float(b_val[0])
                    max_v = float(b_val[1])
                    if min_v > max_v:
                        raise HTTPException(status_code=422, detail=f"Rule at index {idx} with 'BETWEEN' operator has min ({min_v}) greater than max ({max_v}).")
                except (ValueError, TypeError):
                    raise HTTPException(status_code=422, detail=f"Rule at index {idx} with 'BETWEEN' operator must contain numbers [min, max].")

    # 6. category_target
    if "category_target" in payload:
        cats = payload["category_target"]
        if not isinstance(cats, list):
            raise HTTPException(status_code=422, detail="Field 'category_target' must be a list of categories.")
        for c in cats:
            if not isinstance(c, str) or c.strip().upper() not in VALID_CATEGORIES:
                raise HTTPException(status_code=422, detail=f"Invalid category '{c}' in category_target. Allowed: General, OBC, SC, ST, EWS.")

    # 7. List of string fields
    for field_name in ["required_documents", "application_steps", "application_steps_mr", "mutually_exclusive_with"]:
        if field_name in payload:
            arr = payload[field_name]
            if not isinstance(arr, list) or not all(isinstance(x, str) for x in arr):
                raise HTTPException(status_code=422, detail=f"Field '{field_name}' must be a list of strings.")

    return payload


# ---------------------------------------------------------------------------
# Scheme Endpoints
# ---------------------------------------------------------------------------

@router.get("/api/admin/schemes")
def get_admin_schemes(
    db: Session = Depends(get_db),
    session: Dict[str, Any] = Depends(require_admin_session)
):
    """List all schemes directly from the DB, bypassing the TTL cache."""
    schemes = db.query(Scheme).order_by(Scheme.id.asc()).all()
    return {"total": len(schemes), "schemes": [s.to_dict() for s in schemes]}


@router.get("/api/admin/schemes/{id}")
def get_admin_scheme(
    id: str,
    db: Session = Depends(get_db),
    session: Dict[str, Any] = Depends(require_admin_session)
):
    """Retrieve full details of one scheme."""
    scheme = db.get(Scheme, id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{id}' not found.")
    return scheme.to_dict()


@router.put("/api/admin/schemes/{id}")
def update_admin_scheme(
    id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    session: Dict[str, Any] = Depends(require_admin_session)
):
    """Update an existing scheme after thorough validation."""
    scheme = db.get(Scheme, id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{id}' not found.")

    validate_scheme_payload(payload, is_create=False, existing_id=id)

    if "name" in payload:
        scheme.name = str(payload["name"]).strip()
    if "shortName" in payload:
        scheme.short_name = str(payload["shortName"]).strip()
    elif "short_name" in payload:
        scheme.short_name = str(payload["short_name"]).strip()
    if "level" in payload:
        scheme.level = str(payload["level"]).strip()
    if "government" in payload:
        scheme.government = str(payload["government"]).strip()
    if "government_mr" in payload:
        scheme.government_mr = payload["government_mr"]
    if "rules" in payload:
        scheme.rules = payload["rules"]
    if "category_target" in payload:
        scheme.category_target = payload["category_target"]
    if "benefit_amount" in payload:
        scheme.benefit_amount = float(payload["benefit_amount"])
    if "benefit_type" in payload:
        scheme.benefit_type = str(payload["benefit_type"]).strip()
    if "benefit_display" in payload:
        scheme.benefit_display = str(payload["benefit_display"]).strip()
    if "benefit_display_mr" in payload:
        scheme.benefit_display_mr = payload["benefit_display_mr"]
    if "closing_date" in payload:
        cd = payload["closing_date"]
        scheme.closing_date = str(cd).strip() if cd and str(cd).strip() else None
    if "required_documents" in payload:
        scheme.required_documents = payload["required_documents"]
    if "mutually_exclusive_with" in payload:
        scheme.mutually_exclusive_with = payload["mutually_exclusive_with"]
    if "description" in payload:
        scheme.description = str(payload["description"]).strip()
    if "description_mr" in payload:
        scheme.description_mr = payload["description_mr"]
    if "application_steps" in payload:
        scheme.application_steps = payload["application_steps"]
    if "application_steps_mr" in payload:
        scheme.application_steps_mr = payload["application_steps_mr"]
    if "official_url" in payload:
        scheme.official_url = str(payload["official_url"]).strip()

    scheme.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(scheme)
    _clear_cache()

    return {"status": "success", "scheme": scheme.to_dict()}


@router.post("/api/admin/schemes", status_code=status.HTTP_201_CREATED)
def create_admin_scheme(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    session: Dict[str, Any] = Depends(require_admin_session)
):
    """Create a new scheme with strict validation and duplicate ID rejection."""
    validate_scheme_payload(payload, is_create=True)
    sid = str(payload["id"]).strip()

    existing = db.get(Scheme, sid)
    if existing:
        raise HTTPException(status_code=409, detail=f"Scheme with ID '{sid}' already exists.")

    short_name = str(payload.get("shortName") or payload.get("short_name", sid)).strip()
    closing_date = payload.get("closing_date")
    if closing_date:
        closing_date = str(closing_date).strip() or None

    new_scheme = Scheme(
        id=sid,
        name=str(payload["name"]).strip(),
        short_name=short_name,
        level=str(payload.get("level", "Central")).strip(),
        government=str(payload.get("government", "Government of India")).strip(),
        government_mr=payload.get("government_mr"),
        rules=payload.get("rules", []),
        category_target=payload.get("category_target", ["General", "OBC", "SC", "ST", "EWS"]),
        benefit_amount=float(payload.get("benefit_amount", 0.0)),
        benefit_type=str(payload.get("benefit_type", "Direct Cash Transfer")).strip(),
        benefit_display=str(payload.get("benefit_display", "")).strip(),
        benefit_display_mr=payload.get("benefit_display_mr"),
        closing_date=closing_date,
        required_documents=payload.get("required_documents", ["Aadhaar Card"]),
        mutually_exclusive_with=payload.get("mutually_exclusive_with", []),
        description=str(payload.get("description", "")).strip(),
        description_mr=payload.get("description_mr"),
        application_steps=payload.get("application_steps", []),
        application_steps_mr=payload.get("application_steps_mr", []),
        official_url=str(payload.get("official_url", "https://myscheme.gov.in")).strip(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_scheme)
    db.commit()
    db.refresh(new_scheme)
    _clear_cache()

    return {"status": "success", "scheme": new_scheme.to_dict()}


# ---------------------------------------------------------------------------
# Feedback & Users Endpoints
# ---------------------------------------------------------------------------

@router.get("/api/admin/feedback")
def get_admin_feedback(
    scheme_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    session: Dict[str, Any] = Depends(require_admin_session)
):
    """List feedback newest first with pagination and optional scheme filter."""
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    query = db.query(Feedback)
    if scheme_id and scheme_id.strip():
        query = query.filter(Feedback.scheme_id == scheme_id.strip())

    total = query.count()
    items = query.order_by(Feedback.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [f.to_dict() for f in items]
    }


@router.get("/api/admin/users")
def get_admin_users(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    session: Dict[str, Any] = Depends(require_admin_session)
):
    """
    READ-ONLY list of users with profile summary.
    Never exposes password_hash or any sensitive credentials.
    """
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    query = db.query(User)
    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(or_(User.email.ilike(search), User.name.ilike(search)))

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for u in users:
        attrs = u.profile_attributes or {}
        items.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "profile_summary": {
                "category": attrs.get("category"),
                "land_acres": attrs.get("land_acres"),
                "annual_income": attrs.get("annual_income"),
                "state": attrs.get("state"),
                "occupation": attrs.get("occupation"),
                "documents_count": len(attrs.get("owned_documents") or [])
            }
        })

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items
    }


# ---------------------------------------------------------------------------
# HTML Admin Panel Route
# ---------------------------------------------------------------------------

@router.get("/admin-panel", response_class=HTMLResponse)
def get_admin_panel():
    """
    Serves the single self-contained HTML admin page.
    If ADMIN_SECRET_KEY is unset or empty, returns 404 (disabled).
    Contains no secrets and sends Cache-Control: no-store and X-Robots-Tag: noindex.
    """
    admin_secret = get_admin_secret_key()
    if not admin_secret:
        raise HTTPException(status_code=404, detail="Not Found")

    html_path = os.path.join(os.path.dirname(__file__), "admin_panel.html")
    if not os.path.exists(html_path):
        raise HTTPException(status_code=500, detail="Admin panel HTML template not found.")

    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    return HTMLResponse(
        content=html_content,
        headers={
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex"
        }
    )

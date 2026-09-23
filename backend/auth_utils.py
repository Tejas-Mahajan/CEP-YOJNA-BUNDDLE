import os
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import bcrypt
import jwt
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

JWT_SECRET = os.environ.get("JWT_SECRET", "yojana_bundle_jwt_secret_key_default_2026")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt with salt."""
    if not password:
        raise ValueError("Password cannot be empty")
    pwd_bytes = password.encode('utf-8')[:72]  # Truncate to bcrypt max length
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

def generate_jwt_token(user_id: str, email: str, name: str, role: str = "Farmer", extra_claims: Optional[Dict[str, Any]] = None) -> str:
    """
    Generates a PyJWT signed token with 24-hour expiration, user_id (sub), and email.
    """
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp())
    }
    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    Decodes and verifies a JWT token.
    Raises ValueError with specific messages for expired vs invalid tokens.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.PyJWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")

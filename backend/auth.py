"""
auth.py — Real username/password login for Urdhva.

- Passwords are hashed with bcrypt (never stored or compared in plaintext).
- Sessions are signed JWTs (PyJWT) carrying {sub, role, full_name, jti, exp}.
- Logout revokes the token's jti in the `revoked_tokens` table so it can no
  longer be used, even though JWTs are otherwise stateless.
- `get_current_user` / `require_role(...)` are FastAPI dependencies used to
  protect write endpoints in main.py.

NOTE: JWT_SECRET defaults to a fixed dev value so the demo runs out of the
box. Set the URDHVA_JWT_SECRET environment variable to a real secret before
deploying this anywhere beyond a local demo/judging environment.
"""

import os
import uuid
import datetime
import bcrypt
import jwt
from fastapi import Header, HTTPException, status
from database import get_connection

JWT_SECRET = os.environ.get("URDHVA_JWT_SECRET", "urdhva-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 12


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_access_token(username: str, role: str, full_name: str) -> str:
    now = datetime.datetime.utcnow()
    payload = {
        "sub": username,
        "role": role,
        "full_name": full_name,
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises HTTPException(401) on any invalid/expired/revoked token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM revoked_tokens WHERE jti = ?", (payload.get("jti"),))
    revoked = cursor.fetchone()
    conn.close()
    if revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session has been signed out. Please sign in again.")

    return payload


def _extract_bearer_token(authorization: str) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in required. Please log in to perform this action.",
        )
    return authorization.split(" ", 1)[1].strip()


def get_current_user(authorization: str = Header(default=None)) -> dict:
    """FastAPI dependency: returns {sub, role, full_name, jti, ...} for a
    valid bearer token, or raises 401."""
    token = _extract_bearer_token(authorization)
    return decode_access_token(token)


def require_role(*allowed_roles):
    """FastAPI dependency factory: require_role('corporator', 'builder')
    ensures the caller is authenticated AND holds one of the given roles."""

    def _dependency(authorization: str = Header(default=None)) -> dict:
        user = get_current_user(authorization)
        if allowed_roles and user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {', '.join(allowed_roles)}.",
            )
        return user

    return _dependency

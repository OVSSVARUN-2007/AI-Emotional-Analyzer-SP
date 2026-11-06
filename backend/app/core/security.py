"""JWT, Security, Rate-Limiting, Lockout, and Refresh Token utilities for Sentio."""

from __future__ import annotations

import hashlib
import os
import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
import jwt
from sqlalchemy import text

# Strong secret key for signing JWT tokens
JWT_SECRET = os.getenv("JWT_SECRET", "sentio-academic-emotional-intelligence-jwt-secret-key-2026-v1-secure")
ALGORITHM = "HS256"

# Short-lived access tokens (30 minutes) + Rotating refresh tokens (7 days)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# In-memory sliding window rate limiter
_RATE_LIMIT_STORE: dict[str, list[float]] = defaultdict(list)


def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash, with backward-compatibility for plain text seed passwords."""
    if not plain_password or not hashed_password:
        return False
    try:
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        pass
    return plain_password == hashed_password


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed short-lived JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def create_refresh_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> tuple[str, str, datetime]:
    """Create a rotating refresh token. Returns (token, token_hash, expires_at)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    jti = secrets.token_hex(16)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh", "jti": jti})
    raw_token = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    return raw_token, token_hash, expire


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") == "refresh":
            return None  # Refresh token cannot be used as access token
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def decode_refresh_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate a JWT refresh token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except (jwt.PyJWTError, Exception):
        return None


# ═══════════════════════════════════════════════════════
# RATE LIMITING (SLIDING WINDOW)
# ═══════════════════════════════════════════════════════
def check_rate_limit(key: str, max_requests: int = 5, window_seconds: int = 900) -> tuple[bool, int]:
    """Sliding-window rate limiter. Returns (is_allowed, retry_after_seconds)."""
    now = time.time()
    cutoff = now - window_seconds
    timestamps = [t for t in _RATE_LIMIT_STORE[key] if t > cutoff]
    _RATE_LIMIT_STORE[key] = timestamps

    if len(timestamps) >= max_requests:
        oldest = timestamps[0]
        retry_after = int(window_seconds - (now - oldest))
        return False, max(1, retry_after)

    _RATE_LIMIT_STORE[key].append(now)
    return True, 0


# ═══════════════════════════════════════════════════════
# ACCOUNT LOCKOUT (5 CONSECUTIVE FAILED ATTEMPTS)
# ═══════════════════════════════════════════════════════
LOCKOUT_THRESHOLD = 5
LOCKOUT_DURATION_MINUTES = 15


def is_account_locked(user_row: dict[str, Any]) -> tuple[bool, int]:
    """Check if user account is currently locked out. Returns (is_locked, remaining_seconds)."""
    locked_until = user_row.get("locked_until")
    if not locked_until:
        return False, 0

    if isinstance(locked_until, str):
        try:
            locked_until_dt = datetime.fromisoformat(locked_until.replace("Z", "+00:00"))
        except Exception:
            try:
                locked_until_dt = datetime.strptime(locked_until, "%Y-%m-%d %H:%M:%S")
            except Exception:
                return False, 0
    elif isinstance(locked_until, datetime):
        locked_until_dt = locked_until
    else:
        return False, 0

    if locked_until_dt.tzinfo is None:
        locked_until_dt = locked_until_dt.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    if now < locked_until_dt:
        remaining = int((locked_until_dt - now).total_seconds())
        return True, max(1, remaining)

    return False, 0

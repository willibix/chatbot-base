"""Security utilities for password hashing and JWT token management."""

from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(
    data: dict,
    session_started_at: float | None = None,
    last_refresh_at: float | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token with session tracking.

    Args:
        data: Token payload data (must include 'sub' for user ID)
        session_started_at: Unix timestamp when the session was first created
        last_refresh_at: Unix timestamp of the last refresh
        expires_delta: Optional custom expiration time
    """
    to_encode = data.copy()
    now = datetime.now(UTC)
    now_ts = now.timestamp()

    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update(
        {
            "exp": expire,
            "type": "access",
            "session_started_at": session_started_at or now_ts,
            "last_refresh_at": last_refresh_at or now_ts,
        }
    )
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    data: dict,
    session_started_at: float | None = None,
    last_refresh_at: float | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT refresh token with session tracking.

    Args:
        data: Token payload data (must include 'sub' for user ID)
        session_started_at: Unix timestamp when the session was first created
        last_refresh_at: Unix timestamp of the last refresh
        expires_delta: Optional custom expiration time
    """
    to_encode = data.copy()
    now = datetime.now(UTC)
    now_ts = now.timestamp()

    # Refresh token expires based on inactivity timeout
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_REFRESH_INACTIVITY_TIMEOUT_MINUTES)

    to_encode.update(
        {
            "exp": expire,
            "type": "refresh",
            "session_started_at": session_started_at or now_ts,
            "last_refresh_at": last_refresh_at or now_ts,
        }
    )
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def validate_session_constraints(payload: dict) -> tuple[bool, str | None]:
    """Validate session constraints from token payload.

    Returns:
        Tuple of (is_valid, error_message)
    """
    now = datetime.now(UTC).timestamp()
    session_started_at = payload.get("session_started_at")
    last_refresh_at = payload.get("last_refresh_at")

    if not session_started_at or not last_refresh_at:
        return True, None  # Legacy tokens without session tracking

    # Check maximum session duration (20 minutes)
    max_session_seconds = settings.JWT_MAX_SESSION_DURATION_MINUTES * 60
    if now - session_started_at > max_session_seconds:
        return False, "Session has exceeded maximum duration"

    # Check inactivity timeout (5 minutes since last refresh)
    inactivity_timeout_seconds = settings.JWT_REFRESH_INACTIVITY_TIMEOUT_MINUTES * 60
    if now - last_refresh_at > inactivity_timeout_seconds:
        return False, "Session expired due to inactivity"

    return True, None

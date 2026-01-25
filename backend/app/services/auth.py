"""Authentication service for user management and token operations."""

from datetime import UTC, datetime
from uuid import UUID

from sqlmodel import Session, select

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    validate_session_constraints,
    verify_password,
)
from app.models.user import User, UserCreate


class AuthService:
    """Service class for authentication operations."""

    def __init__(self, session: Session) -> None:
        """Initialize the auth service with a database session."""
        self.session = session

    def get_user_by_id(self, user_id: UUID) -> User | None:
        """Retrieve a user by ID."""
        statement = select(User).where(User.id == user_id)
        return self.session.exec(statement).first()

    def get_user_by_email(self, email: str) -> User | None:
        """Retrieve a user by email address."""
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def get_user_by_username(self, username: str) -> User | None:
        """Retrieve a user by username."""
        statement = select(User).where(User.username == username)
        return self.session.exec(statement).first()

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user with hashed password."""
        hashed_password = get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def authenticate_user(self, username: str, password: str) -> User | None:
        """Authenticate a user by username and password."""
        user = self.get_user_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def create_tokens(
        self,
        user: User,
        session_started_at: float | None = None,
        last_refresh_at: float | None = None,
    ) -> dict:
        """Create access and refresh tokens for a user.

        Args:
            user: The user to create tokens for
            session_started_at: Unix timestamp when session started (None for new session)
            last_refresh_at: Unix timestamp of last refresh (None for new session)
        """
        token_data = {"sub": str(user.id)}
        now = datetime.now(UTC).timestamp()

        # For new sessions, use current time
        if session_started_at is None:
            session_started_at = now
        if last_refresh_at is None:
            last_refresh_at = now

        access_token = create_access_token(
            data=token_data,
            session_started_at=session_started_at,
            last_refresh_at=last_refresh_at,
        )
        refresh_token = create_refresh_token(
            data=token_data,
            session_started_at=session_started_at,
            last_refresh_at=last_refresh_at,
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    def refresh_tokens(self, refresh_token: str) -> dict | None:
        """Refresh access and refresh tokens using a valid refresh token.

        Returns None if:
        - Token is invalid or expired
        - Token is not a refresh token
        - User doesn't exist or is inactive
        - Session has exceeded maximum duration (20 minutes)
        - Session has been inactive too long (5 minutes since last refresh)
        """
        payload = decode_token(refresh_token)
        if not payload:
            return None

        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            return None

        # Validate session constraints
        is_valid, _error_msg = validate_session_constraints(payload)
        if not is_valid:
            return None

        # Get user from token
        user_id = payload.get("sub")
        if not user_id:
            return None

        user = self.get_user_by_id(UUID(user_id))
        if not user or not user.is_active:
            return None

        # Create new tokens with preserved session start time and updated last refresh
        session_started_at = payload.get("session_started_at")
        now = datetime.now(UTC).timestamp()

        return self.create_tokens(
            user,
            session_started_at=session_started_at,
            last_refresh_at=now,  # Update last refresh to now
        )

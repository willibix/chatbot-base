"""Authentication service."""

from uuid import UUID

from sqlmodel import Session, select

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserCreate


class AuthService:
    """Service for authentication operations."""

    def __init__(self, session: Session):
        self.session = session

    def get_user_by_email(self, email: str) -> User | None:
        """Get a user by email."""
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def get_user_by_username(self, username: str) -> User | None:
        """Get a user by username."""
        statement = select(User).where(User.username == username)
        return self.session.exec(statement).first()

    def get_user_by_id(self, user_id: UUID) -> User | None:
        """Get a user by ID."""
        statement = select(User).where(User.id == user_id)
        return self.session.exec(statement).first()

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
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

    def create_tokens(self, user: User) -> dict[str, str]:
        """Create access and refresh tokens for a user."""
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    def refresh_tokens(self, refresh_token: str) -> dict[str, str] | None:
        """Refresh tokens using a valid refresh token."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        user = self.get_user_by_id(UUID(user_id))
        if not user or not user.is_active:
            return None

        return self.create_tokens(user)

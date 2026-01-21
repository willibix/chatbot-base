"""User model."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


if TYPE_CHECKING:
    from app.models.chat import ChatSession


class UserBase(SQLModel):
    """Base user model with shared attributes."""

    email: str = Field(unique=True, index=True, max_length=255)
    username: str = Field(unique=True, index=True, max_length=100)
    is_active: bool = Field(default=True)


class User(UserBase, table=True):
    """User database model."""

    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relationships
    chat_sessions: list["ChatSession"] = Relationship(back_populates="user")


class UserCreate(SQLModel):
    """Schema for creating a user."""

    email: EmailStr
    username: str = Field(max_length=100)
    password: str = Field(min_length=8, max_length=100)


class UserRead(UserBase):
    """Schema for reading a user."""

    id: UUID
    created_at: datetime


class UserLogin(SQLModel):
    """Schema for user login."""

    username: str
    password: str


class Token(SQLModel):
    """Schema for token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(SQLModel):
    """Schema for token refresh request."""

    refresh_token: str

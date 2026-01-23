"""Chat models."""

from datetime import UTC, datetime
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import sqlalchemy as sa
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, Relationship, SQLModel


if TYPE_CHECKING:
    from app.models.user import User


class MessageRole(str, Enum):
    """Message role enum."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatSessionBase(SQLModel):
    """Base chat session model."""

    title: str | None = Field(default=None, max_length=255)


class ChatSession(ChatSessionBase, table=True):
    """Chat session database model."""

    __tablename__ = "chat_sessions"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relationships
    user: "User" = Relationship(back_populates="chat_sessions")
    messages: list["Message"] = Relationship(
        back_populates="chat_session",
        sa_relationship_kwargs={"order_by": "Message.created_at.asc()"},
    )


class ChatSessionCreate(SQLModel):
    """Schema for creating a chat session."""

    title: str | None = None


class ChatSessionRead(ChatSessionBase):
    """Schema for reading a chat session."""

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class ChatSessionWithMessages(ChatSessionRead):
    """Schema for reading a chat session with messages."""

    messages: list["MessageRead"] = []


class MessageBase(SQLModel):
    """Base message model."""

    content: str


class Message(SQLModel, table=True):
    """Message database model."""

    __tablename__ = "messages"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    chat_session_id: UUID = Field(foreign_key="chat_sessions.id", index=True)
    content: str
    role: MessageRole = Field(
        sa_column=sa.Column(
            SAEnum("user", "assistant", "system", name="messagerole", create_constraint=False),
            nullable=False,
        )
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relationships
    chat_session: ChatSession = Relationship(back_populates="messages")


class MessageCreate(SQLModel):
    """Schema for creating a message."""

    content: str


class MessageRead(SQLModel):
    """Schema for reading a message."""

    id: UUID
    chat_session_id: UUID
    content: str
    role: MessageRole
    created_at: datetime


# Update forward references
ChatSessionWithMessages.model_rebuild()

"""Database models."""

from app.models.chat import ChatSession, Message
from app.models.user import User


# Rebuild models to resolve circular forward references (User <-> ChatSession)
User.model_rebuild()
ChatSession.model_rebuild()

__all__ = ["ChatSession", "Message", "User"]

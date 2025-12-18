"""Chat service."""

from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.models.chat import (
    ChatSession,
    ChatSessionCreate,
    Message,
    MessageRead,
    MessageRole,
)
from app.services.llm import LLMService


class ChatService:
    """Service for chat operations."""

    def __init__(self, session: Session):
        self.session = session
        self.llm_service = LLMService()

    def get_user_sessions(self, user_id: UUID) -> list[ChatSession]:
        """Get all chat sessions for a user."""
        statement = (
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())  # type: ignore[union-attr]
        )
        return list(self.session.exec(statement).all())

    def get_session(self, session_id: UUID, user_id: UUID) -> ChatSession | None:
        """Get a specific chat session."""
        statement = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        )
        return self.session.exec(statement).first()

    def create_session(self, user_id: UUID, data: ChatSessionCreate) -> ChatSession:
        """Create a new chat session."""
        chat_session = ChatSession(
            user_id=user_id,
            title=data.title or "New Chat",
        )
        self.session.add(chat_session)
        self.session.commit()
        self.session.refresh(chat_session)
        return chat_session

    def delete_session(self, session_id: UUID, user_id: UUID) -> bool:
        """Delete a chat session."""
        chat_session = self.get_session(session_id, user_id)
        if not chat_session:
            return False

        # Delete all messages in the session
        statement = select(Message).where(Message.chat_session_id == session_id)
        messages = self.session.exec(statement).all()
        for message in messages:
            self.session.delete(message)

        self.session.delete(chat_session)
        self.session.commit()
        return True

    def get_session_messages(self, session_id: UUID) -> list[Message]:
        """Get all messages for a chat session."""
        statement = (
            select(Message)
            .where(Message.chat_session_id == session_id)
            .order_by(Message.created_at.asc())  # type: ignore[union-attr]
        )
        return list(self.session.exec(statement).all())

    def add_message(self, session_id: UUID, content: str, role: MessageRole) -> Message:
        """Add a message to a chat session."""
        message = Message(
            chat_session_id=session_id,
            content=content,
            role=role,
        )
        self.session.add(message)

        # Update session timestamp
        statement = select(ChatSession).where(ChatSession.id == session_id)
        chat_session = self.session.exec(statement).first()
        if chat_session:
            chat_session.updated_at = datetime.now(timezone.utc)
            self.session.add(chat_session)

        self.session.commit()
        self.session.refresh(message)
        return message

    async def process_message(self, session_id: UUID, content: str) -> MessageRead:
        """Process a user message and get AI response."""
        # Save user message
        self.add_message(session_id, content, MessageRole.USER)

        # Get conversation history
        history = self.get_session_messages(session_id)

        # Generate AI response
        ai_response = await self.llm_service.generate_response(history)

        # Save AI response
        ai_message = self.add_message(session_id, ai_response, MessageRole.ASSISTANT)

        return MessageRead(
            id=ai_message.id,
            chat_session_id=ai_message.chat_session_id,
            content=ai_message.content,
            role=ai_message.role,
            created_at=ai_message.created_at,
        )

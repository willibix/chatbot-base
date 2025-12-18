"""Chat endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.chat import (
    ChatSession,
    ChatSessionCreate,
    ChatSessionRead,
    ChatSessionWithMessages,
    MessageCreate,
    MessageRead,
)
from app.models.user import User
from app.services.chat import ChatService

router = APIRouter()


@router.get("/sessions", response_model=list[ChatSessionRead])
async def get_chat_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> list[ChatSession]:
    """Get all chat sessions for the current user."""
    chat_service = ChatService(session)
    return chat_service.get_user_sessions(current_user.id)


@router.post("/sessions", response_model=ChatSessionRead, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> ChatSession:
    """Create a new chat session."""
    chat_service = ChatService(session)
    return chat_service.create_session(current_user.id, session_data)


@router.get("/sessions/{session_id}", response_model=ChatSessionWithMessages)
async def get_chat_session(
    session_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> ChatSession:
    """Get a specific chat session with messages."""
    chat_service = ChatService(session)
    chat_session = chat_service.get_session(session_id, current_user.id)

    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )

    return chat_session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    session_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> None:
    """Delete a chat session."""
    chat_service = ChatService(session)
    success = chat_service.delete_session(session_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )


@router.post("/sessions/{session_id}/messages", response_model=MessageRead)
async def send_message(
    session_id: UUID,
    message_data: MessageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MessageRead:
    """Send a message and get AI response."""
    chat_service = ChatService(session)

    # Verify session belongs to user
    chat_session = chat_service.get_session(session_id, current_user.id)
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )

    # Process message and get AI response
    response = await chat_service.process_message(session_id, message_data.content)
    return response

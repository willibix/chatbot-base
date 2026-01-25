"""Authentication endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.user import User, UserCreate, UserLogin, UserRead
from app.services.auth import AuthService


router = APIRouter()


class TokenResponse:
    """Token response schema."""

    def __init__(self, access_token: str, refresh_token: str, token_type: str = "bearer"):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.token_type = token_type


class RefreshTokenRequest(BaseModel):
    """Request body for token refresh."""

    refresh_token: str


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    session: Annotated[Session, Depends(get_session)],
) -> User:
    """Register a new user."""
    auth_service = AuthService(session)

    # Check if user already exists
    existing_user = auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    existing_username = auth_service.get_user_by_username(user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    return auth_service.create_user(user_data)


@router.post("/login")
async def login(
    credentials: UserLogin,
    session: Annotated[Session, Depends(get_session)],
) -> dict:
    """Login and get access and refresh tokens."""
    auth_service = AuthService(session)
    user = auth_service.authenticate_user(credentials.username, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = auth_service.create_tokens(user)
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }


@router.post("/refresh")
async def refresh_token(
    request: RefreshTokenRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict:
    """Refresh access token using refresh token.

    Session constraints:
    - Access token expires in 1 minute
    - Session closes if not refreshed within 5 minutes of last refresh
    - Maximum total session duration is 20 minutes
    """
    auth_service = AuthService(session)
    tokens = auth_service.refresh_tokens(request.refresh_token)

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token or session expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserRead)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get current authenticated user information."""
    return current_user

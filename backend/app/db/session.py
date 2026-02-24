"""Database session management."""

from collections.abc import Generator  # noqa: TC003 - FastAPI evaluates return annotations at runtime for Depends()

from sqlmodel import Session, create_engine

from app.core.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)


def get_session() -> Generator[Session]:
    """Get a database session."""
    with Session(engine) as session:
        yield session

"""Application configuration settings."""

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Project
    PROJECT_NAME: str = "Chatbot API"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:1420", "tauri://localhost"]
    )

    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "chatbot"
    POSTGRES_PASSWORD: str = "chatbot_dev_password"
    POSTGRES_DB: str = "chatbot"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def DATABASE_URL(self) -> str:
        """Construct database URL from components."""
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # JWT Authentication
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 240  # Access token expires in 4 hours
    JWT_REFRESH_INACTIVITY_TIMEOUT_MINUTES: int = 1440  # Session closes if no refresh in 24 hours
    JWT_MAX_SESSION_DURATION_MINUTES: int = 43200  # Maximum total session duration (30 days)

    # Ollama / LLM
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL_DEV: str = "llama3.2:3b"
    OLLAMA_MODEL_PROD: str = "llama4-scout"
    OLLAMA_MODEL: str = Field(default="llama3.2:3b")  # Override via env

    # Environment
    ENVIRONMENT: str = "development"  # development | staging | production


settings = Settings()

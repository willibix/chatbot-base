# Backend README

## Overview

FastAPI REST API backend for the Chatbot application with JWT authentication, chat session management, and LangChain + Ollama integration for AI responses.

## Quick Start

### With Docker (Recommended)

```bash
# From project root
docker compose --profile default up -d

# Run migrations
docker compose exec backend alembic upgrade head
```

### Without Docker

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or: .venv\Scripts\activate  # Windows

# Install dependencies
pip install -e ".[dev]"

# Set environment variables (or use .env file)
export DATABASE_URL="postgresql+psycopg://chatbot:chatbot_dev_password@localhost:5432/chatbot"
export OLLAMA_BASE_URL="http://localhost:11434"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Development

### Code Quality

```bash
# Format code
ruff format .

# Lint code
ruff check .

# Fix auto-fixable issues
ruff check . --fix
```

### Testing

```bash
pytest
pytest -v  # verbose
pytest --cov=app  # with coverage
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py        # API router
│   │   ├── deps.py          # Dependencies
│   │   └── endpoints/
│   │       ├── auth.py      # Authentication endpoints
│   │       └── chat.py      # Chat endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Settings
│   │   └── security.py      # JWT utilities
│   ├── db/
│   │   ├── __init__.py
│   │   └── session.py       # Database session
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User model
│   │   └── chat.py          # Chat models
│   └── services/
│       ├── __init__.py
│       ├── auth.py          # Auth service
│       ├── chat.py          # Chat service
│       └── llm.py           # LLM service
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/            # Migration files
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_health.py
├── alembic.ini
├── pyproject.toml
├── Dockerfile
└── Dockerfile.dev
```

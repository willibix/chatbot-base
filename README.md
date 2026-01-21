# Chatbot Application

A cross-platform chatbot application with a FastAPI backend and Tauri + React frontend. Features JWT authentication, chat session management, and AI-powered responses using LangChain and Ollama with any model supported (ollama.com/library).

## Architecture

```
chatbot-base/
├── backend/              # FastAPI REST API
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Configuration, security
│   │   ├── db/           # Database session
│   │   ├── models/       # SQLModel database models
│   │   └── services/     # Business logic
│   ├── alembic/          # Database migrations
│   └── tests/            # Backend tests
├── frontend/             # Tauri + React + Vite
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── store/        # Redux store & slices
│   │   ├── services/     # API client
│   │   └── hooks/        # Custom React hooks
│   └── src-tauri/        # Tauri Rust backend
├── scripts/              # Utility scripts
└── docker-compose.yml    # Docker development stack
```

## Prerequisites

### All Platforms

- **Docker & Docker Compose** - For running PostgreSQL, Ollama, and backend
- **Git** - Version control

### Backend Development (Optional)

- **Python 3.14+** - If running backend outside Docker
- **Ruff** - Python linter/formatter (`pip install ruff`)

### Frontend Development

- **Node.js 24+** - Use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows)
- **Rust** - Required for Tauri

### Tauri Prerequisites

#### Windows

1. **Microsoft C++ Build Tools**
   - Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Select "Desktop development with C++" workload
   
2. **WebView2**
   - Pre-installed on Windows 10 (1803+) and Windows 11
   - If missing, install [Evergreen Bootstrapper](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

3. **Rust**
   - Download and run [rustup-init.exe](https://rustup.rs/)
   - Follow the installation prompts

#### macOS

1. **Xcode** (Full version, not just Command Line Tools)
   ```bash
   # Install from Mac App Store, then launch to complete setup
   xcode-select --install
   ```

2. **Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
   ```

#### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Install Rust
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

### Mobile Development Prerequisites

#### Android (All Platforms)

1. Install [Android Studio](https://developer.android.com/studio)

2. Set environment variables:
   ```bash
   # Windows (PowerShell - add to profile)
   $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
   $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
   $env:NDK_HOME = "$env:ANDROID_HOME\ndk\<version>"

   # macOS/Linux (add to ~/.bashrc or ~/.zshrc)
   export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export NDK_HOME="$ANDROID_HOME/ndk/<version>"
   ```

3. Install SDK components via Android Studio SDK Manager:
   - Android SDK Platform (API 34+)
   - Android SDK Platform-Tools
   - NDK (Side by side)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools

4. Add Rust targets:
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi \
     i686-linux-android x86_64-linux-android
   ```

#### iOS (macOS Only)

1. Install Xcode (full version) from Mac App Store

2. Add Rust targets:
   ```bash
   rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
   ```

3. Install CocoaPods:
   ```bash
   brew install cocoapods
   ```

> **Note**: iOS development requires macOS. Cross-compilation from Windows/Linux is not supported.

## Quick Start

### 1. Clone and Configure

```bash
git clone <repository-url>
cd chatbot-base

# Create environment file
cp .env.example .env

# Edit .env with your settings (defaults work for development)
```

### 2. Start Backend Services

```bash
# CPU mode (default)
docker compose --profile default up -d

# OR with NVIDIA GPU
docker compose --profile nvidia up -d

# OR with AMD GPU
docker compose --profile amd up -d
```

This starts:
- PostgreSQL 18 database
- Ollama with auto-pulled `llama3.2:3b` model
- FastAPI backend with hot-reload

### 3. Run Database Migrations

```bash
# Enter the backend container
docker compose exec backend bash

# Run migrations
alembic upgrade head

# Exit container
exit
```

### 4. Start Frontend

```bash
cd frontend

# Install Node.js 24 (if using nvm)
nvm install 24
nvm use 24

# Install dependencies
npm install

# Development (web only)
npm run dev

# Development (desktop app)
npm run dev:tauri
```

### 5. Access the Application

- **Web**: http://localhost:1420
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Development Commands

### Backend

```bash
# Start services
docker compose --profile default up -d

# View logs
docker compose logs -f backend

# Run migrations
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Format code
docker compose exec backend ruff format .

# Lint code
docker compose exec backend ruff check .

# Run tests
docker compose exec backend pytest
```

### Frontend

```bash
cd frontend

# Web development
npm run dev

# Desktop development (Tauri)
npm run dev:tauri

# Build for web
npm run build

# Build desktop app
npm run build:tauri

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

### Mobile Development

```bash
cd frontend

# Initialize Android project (first time)
npm run android:init

# Run on Android device/emulator
npm run android:dev

# Build Android APK/AAB
npm run android:build

# Initialize iOS project (macOS only, first time)
npm run ios:init

# Run on iOS simulator
npm run ios:dev

# Build iOS app
npm run ios:build
```

## GPU Configuration

### NVIDIA GPU

1. Install [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html):
   ```bash
   # Ubuntu/Debian
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
     sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   sudo apt update && sudo apt install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

2. Start with NVIDIA profile:
   ```bash
   docker compose --profile nvidia up -d
   ```

### AMD GPU

1. Ensure ROCm drivers are installed

2. Start with AMD profile:
   ```bash
   docker compose --profile amd up -d
   ```

### CPU Fallback

```bash
docker compose --profile default up -d
# or simply
docker compose --profile cpu up -d
```

## Production Models

For production, use larger Llama models. After starting Ollama:

```bash
# Windows
.\scripts\pull-model.ps1 -Model llama4-scout

# Linux/macOS
./scripts/pull-model.sh llama4-scout
```

# Model selection
# Development: llama3.2:3b (lightweight, ~2GB)
# 

Some available production models:
- codellama:34b (for coding tasks, ~16GB total)
- llama4:16x17b (17B x 16 experts, ~109GB total)
- llama4:128x17b (17B x 128 experts, ~400GB total)
- llama3.3:70b (powerful, smaller than Llama 4, ~43GB total)

For all models list: https://ollama.com/library

Update your `.env` after pulling:
```env
OLLAMA_MODEL=llama4:16x17b
```

## Production Deployment

1. Generate secure secrets:
   ```bash
   # Generate JWT secret
   openssl rand -hex 32
   # Or: python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. Update `.env` for production:
   ```env
   ENVIRONMENT=production
   DEBUG=false
   POSTGRES_PASSWORD=<strong-random-password>
   JWT_SECRET_KEY=<your-generated-secret>
   OLLAMA_MODEL=llama4-scout
   CORS_ORIGINS=https://your-domain.com
   ```

3. Use production compose file:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login and get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/chat/sessions` | List chat sessions |
| POST | `/api/v1/chat/sessions` | Create new session |
| GET | `/api/v1/chat/sessions/{id}` | Get session with messages |
| DELETE | `/api/v1/chat/sessions/{id}` | Delete session |
| POST | `/api/v1/chat/sessions/{id}/messages` | Send message |

## Project Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLModel** - SQL database ORM with Pydantic
- **Alembic** - Database migrations
- **LangChain** - LLM orchestration
- **Ollama** - Local LLM hosting
- **PostgreSQL 18** - Database
- **Ruff** - Linting and formatting

### Frontend
- **Tauri v2** - Cross-platform app framework
- **React 19** - UI library
- **Vite 6** - Build tool
- **TypeScript** - Type safety
- **MUI (Material-UI) v6** - Component library
- **Redux Toolkit** - State management
- **React Router v7** - Routing
- **ESLint** - Linting (Airbnb rules)
- **Prettier** - Code formatting

## License

Apache 2.0
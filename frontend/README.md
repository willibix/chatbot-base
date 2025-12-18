# Frontend README

## Overview

Cross-platform chatbot frontend built with Tauri v2, React 19, and TypeScript. Supports web, desktop (Windows, macOS, Linux), and mobile (Android, iOS) from a single codebase.

## Quick Start

```bash
# Install Node.js 24 (using nvm)
nvm install 24
nvm use 24

# Install dependencies
npm install

# Start web development server
npm run dev

# Start desktop development (requires Rust)
npm run dev:tauri
```

## Development Commands

```bash
# Web
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build

# Desktop (Tauri)
npm run dev:tauri     # Start with Tauri
npm run build:tauri   # Build desktop app

# Mobile
npm run android:init  # Initialize Android project
npm run android:dev   # Run on Android
npm run android:build # Build Android APK/AAB
npm run ios:init      # Initialize iOS project (macOS only)
npm run ios:dev       # Run on iOS simulator
npm run ios:build     # Build iOS app

# Code Quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

## Project Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── main.tsx             # Entry point
│   ├── App.tsx              # Main app component
│   ├── index.css            # Global styles
│   ├── vite-env.d.ts        # Vite type declarations
│   ├── hooks/
│   │   └── useStore.ts      # Typed Redux hooks
│   ├── pages/
│   │   ├── LoginPage.tsx    # Login page
│   │   ├── RegisterPage.tsx # Registration page
│   │   └── ChatPage.tsx     # Main chat interface
│   ├── services/
│   │   └── api.ts           # API client
│   └── store/
│       ├── index.ts         # Redux store configuration
│       └── slices/
│           ├── authSlice.ts # Authentication state
│           └── chatSlice.ts # Chat state
├── src-tauri/               # Tauri Rust backend
│   ├── capabilities/        # Tauri permissions
│   ├── icons/               # App icons
│   ├── src/
│   │   ├── lib.rs           # Library entry
│   │   └── main.rs          # Desktop entry
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── .nvmrc                   # Node version
├── .prettierrc              # Prettier config
├── eslint.config.mjs        # ESLint config
├── index.html               # HTML template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── vite.config.ts           # Vite config
```

## Environment Variables

Create `.env` in the frontend folder:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Building for Production

### Web

```bash
npm run build
# Output: dist/
```

### Desktop

```bash
npm run build:tauri
# Output: src-tauri/target/release/bundle/
```

### Mobile

```bash
# Android
npm run android:build
# Output: src-tauri/gen/android/app/build/outputs/

# iOS (macOS only)
npm run ios:build
# Output: src-tauri/gen/apple/build/
```

## Tauri Configuration

Key settings in `src-tauri/tauri.conf.json`:

- `productName`: Application name
- `identifier`: Unique app identifier
- `build.devUrl`: Development server URL
- `app.windows`: Window configuration
- `plugins.http.scope`: Allowed HTTP origins

## Platform Support

| Platform | Development | Build | Notes |
|----------|-------------|-------|-------|
| Web | ✅ | ✅ | Primary development target |
| Windows | ✅ | ✅ | Requires Visual C++ Build Tools |
| macOS | ✅ | ✅ | Requires Xcode |
| Linux | ✅ | ✅ | Requires WebKit2GTK |
| Android | ✅ | ✅ | Requires Android Studio |
| iOS | macOS only | macOS only | Requires Xcode + CocoaPods |

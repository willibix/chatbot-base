import { useEffect, useMemo } from "react";

import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { NotificationProvider } from "./components/NotificationContext";
import { useAppDispatch, useAppSelector } from "./hooks/useStore";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { setSessionExpiredCallback } from "./services/api";
import { sessionExpired } from "./store/slices/authSlice";

// Detect if running in Tauri
const isTauri = typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

// Create theme based on mode
const createAppTheme = (mode: "light" | "dark") =>
    createTheme({
        palette: {
            mode,
            primary: {
                main: mode === "dark" ? "#90caf9" : "#1976d2",
            },
            secondary: {
                main: mode === "dark" ? "#f48fb1" : "#dc004e",
            },
            background: {
                default: mode === "dark" ? "#121212" : "#f5f5f5",
                paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
            },
        },
        typography: {
            fontFamily: "Roboto, Arial, sans-serif",
        },
    });

const globalStyles = (
    <GlobalStyles
        styles={{
            "*": {
                margin: 0,
                padding: 0,
                boxSizing: "border-box",
            },
            "html, body, #root": {
                height: "100%",
                width: "100%",
            },
            // Safe area insets for mobile devices (Android/iOS status bar)
            ":root": {
                "--safe-area-inset-top": "env(safe-area-inset-top, 0px)",
                "--safe-area-inset-bottom": "env(safe-area-inset-bottom, 0px)",
                "--safe-area-inset-left": "env(safe-area-inset-left, 0px)",
                "--safe-area-inset-right": "env(safe-area-inset-right, 0px)",
            },
        }}
    />
);

// Apply Android fallback for safe area inset
const useAndroidSafeArea = () => {
    useEffect(() => {
        if (!isTauri) return;

        // Check if we're on Android by looking at user agent or Tauri platform
        const isAndroid = /android/i.test(navigator.userAgent);

        if (isAndroid) {
            // Check if env() safe-area-inset-top is actually providing a value
            // If not, apply a fallback (typical Android status bar is ~24dp = ~24px at 1x density)
            const testEl = document.createElement("div");
            testEl.style.cssText = "position:fixed;top:env(safe-area-inset-top,0px);pointer-events:none;";
            document.body.appendChild(testEl);

            const computedTop = getComputedStyle(testEl).top;
            document.body.removeChild(testEl);

            // If the safe area is 0, apply Android fallback
            if (computedTop === "0px" || computedTop === "0") {
                // Use a sensible default for Android status bar height (24px is standard at 1x density)
                document.documentElement.style.setProperty("--safe-area-inset-top", "24px");
            }
        }
    }, []);
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }): React.ReactNode => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    if (!isAuthenticated) {
        return <Navigate replace to="/login" />;
    }

    return children;
};

// Hook to set up session expiration handling
const useSessionExpiredHandler = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Set up the callback that api.ts will call when session expires
        setSessionExpiredCallback(() => {
            dispatch(sessionExpired());
        });
    }, [dispatch]);
};

const App = () => {
    const themeMode = useAppSelector((state) => state.theme.mode);
    const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

    useAndroidSafeArea();
    useSessionExpiredHandler();

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {globalStyles}
            <NotificationProvider>
                <BrowserRouter>
                    <Routes>
                        <Route element={<LoginPage />} path="/login" />
                        <Route element={<RegisterPage />} path="/register" />
                        <Route
                            path="/chat"
                            element={
                                <ProtectedRoute>
                                    <ChatPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/chat/:sessionId"
                            element={
                                <ProtectedRoute>
                                    <ChatPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route element={<Navigate replace to="/chat" />} path="/" />
                    </Routes>
                </BrowserRouter>
            </NotificationProvider>
        </ThemeProvider>
    );
};

export default App;

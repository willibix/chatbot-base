import { useEffect } from "react";

import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { NotificationProvider } from "./components/NotificationContext";
import { useAppSelector } from "./hooks/useStore";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Detect if running in Tauri
const isTauri = typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#90caf9",
        },
        secondary: {
            main: "#f48fb1",
        },
        background: {
            default: "#121212",
            paper: "#1e1e1e",
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
                // Use a sensible default for Android status bar height (28px works for most devices)
                document.documentElement.style.setProperty("--safe-area-inset-top", "28px");
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

const App = () => {
    useAndroidSafeArea();

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

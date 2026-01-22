import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { NotificationProvider } from "./contexts/NotificationContext";
import { useAppSelector } from "./hooks/useStore";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

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
        }}
    />
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }): React.ReactNode => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    if (!isAuthenticated) {
        return <Navigate replace to="/login" />;
    }

    return children;
};

const App = () => (
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

export default App;

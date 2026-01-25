import { useEffect, useState } from "react";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../hooks/useStore";
import { getCurrentUser, login } from "../services/api";
import { clearSessionExpiredFlag, setCredentials, setError, setLoading } from "../store/slices/authSlice";

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLoading, error, sessionExpired: isSessionExpired } = useAppSelector((state) => state.auth);

    // Clear session expired flag when user starts typing
    useEffect(() => {
        if (isSessionExpired && (username || password)) {
            dispatch(clearSessionExpiredFlag());
        }
    }, [username, password, isSessionExpired, dispatch]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        dispatch(setLoading(true));
        dispatch(setError(null));

        try {
            const tokens = await login(username, password);
            localStorage.setItem("accessToken", tokens.access_token);
            localStorage.setItem("refreshToken", tokens.refresh_token);

            const user = await getCurrentUser();

            dispatch(
                setCredentials({
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                    },
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                }),
            );

            navigate("/chat");
        } catch (err) {
            dispatch(setError(err instanceof Error ? err.message : "Login failed"));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ paddingTop: "var(--safe-area-inset-top)" }}>
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                <Box noValidate component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {isSessionExpired ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Your session has expired. Please sign in again.
                        </Alert>
                    ) : null}
                    {error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    ) : null}
                    <TextField
                        autoFocus
                        fullWidth
                        required
                        autoComplete="username"
                        id="username"
                        label="Username"
                        margin="normal"
                        name="username"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                    />
                    <TextField
                        fullWidth
                        required
                        autoComplete="current-password"
                        id="password"
                        label="Password"
                        margin="normal"
                        name="password"
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        value={password}
                    />
                    <Button fullWidth disabled={isLoading} sx={{ mt: 3, mb: 2 }} type="submit" variant="contained">
                        {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                    <Box sx={{ textAlign: "center" }}>
                        <Link component={RouterLink} to="/register" variant="body2">
                            Don&apos;t have an account? Sign Up
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default LoginPage;

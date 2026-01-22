import { useState } from "react";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
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
import { getCurrentUser, login, register } from "../services/api";
import { setCredentials, setError, setLoading } from "../store/slices/authSlice";

const RegisterPage = () => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            dispatch(setError("Passwords do not match"));
            return;
        }

        if (password.length < 8) {
            dispatch(setError("Password must be at least 8 characters"));
            return;
        }

        dispatch(setLoading(true));
        dispatch(setError(null));

        try {
            await register(email, username, password);

            // Auto-login after registration
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
            dispatch(setError(err instanceof Error ? err.message : "Registration failed"));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                    <PersonAddIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign up
                </Typography>
                <Box noValidate component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    ) : null}
                    <TextField
                        autoFocus
                        fullWidth
                        required
                        autoComplete="email"
                        id="email"
                        label="Email Address"
                        margin="normal"
                        name="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                    />
                    <TextField
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
                        autoComplete="new-password"
                        id="password"
                        label="Password"
                        margin="normal"
                        name="password"
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        value={password}
                    />
                    <TextField
                        fullWidth
                        required
                        id="confirmPassword"
                        label="Confirm Password"
                        margin="normal"
                        name="confirmPassword"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type="password"
                        value={confirmPassword}
                    />
                    <Button fullWidth disabled={isLoading} sx={{ mt: 3, mb: 2 }} type="submit" variant="contained">
                        {isLoading ? "Signing up..." : "Sign Up"}
                    </Button>
                    <Box sx={{ textAlign: "center" }}>
                        <Link component={RouterLink} to="/login" variant="body2">
                            Already have an account? Sign in
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default RegisterPage;

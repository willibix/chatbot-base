import { createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

interface User {
    id: string;
    email: string;
    username: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    sessionExpired: boolean; // Flag to show session expired message
}

const initialState: AuthState = {
    user: null,
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    isAuthenticated: !!localStorage.getItem("accessToken"),
    isLoading: false,
    error: null,
    sessionExpired: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setCredentials: (
            state,
            action: PayloadAction<{
                user: User;
                accessToken: string;
                refreshToken: string;
            }>,
        ) => {
            const { user, accessToken, refreshToken } = action.payload;
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;
            state.error = null;
            state.sessionExpired = false;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
        },
        setTokens: (
            state,
            action: PayloadAction<{
                accessToken: string;
                refreshToken: string;
            }>,
        ) => {
            const { accessToken, refreshToken } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;
            state.sessionExpired = false;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.error = null;
            state.sessionExpired = false;
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        },
        sessionExpired: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.error = null;
            state.sessionExpired = true;
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        },
        clearSessionExpiredFlag: (state) => {
            state.sessionExpired = false;
        },
    },
});

export const { setLoading, setError, setCredentials, setTokens, logout, sessionExpired, clearSessionExpiredFlag } =
    authSlice.actions;
export default authSlice.reducer;

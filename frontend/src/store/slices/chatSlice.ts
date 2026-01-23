import { createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

export interface Message {
    id: string;
    chatSessionId: string;
    content: string;
    role: "user" | "assistant" | "system";
    createdAt: string;
}

export interface ChatSession {
    id: string;
    userId: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
    messages?: Message[];
}

interface ChatState {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    messages: Message[];
    isLoading: boolean;
    isSending: boolean;
    sendingSessionId: string | null;
    error: string | null;
}

const initialState: ChatState = {
    sessions: [],
    currentSession: null,
    messages: [],
    isLoading: false,
    isSending: false,
    sendingSessionId: null,
    error: null,
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setSending: (state, action: PayloadAction<{ sending: boolean; sessionId?: string | null }>) => {
            state.isSending = action.payload.sending;
            state.sendingSessionId = action.payload.sending ? (action.payload.sessionId ?? null) : null;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setSessions: (state, action: PayloadAction<ChatSession[]>) => {
            state.sessions = action.payload;
        },
        setCurrentSession: (state, action: PayloadAction<ChatSession | null>) => {
            state.currentSession = action.payload;
            state.messages = action.payload?.messages ?? [];
        },
        addSession: (state, action: PayloadAction<ChatSession>) => {
            state.sessions.unshift(action.payload);
        },
        removeSession: (state, action: PayloadAction<string>) => {
            state.sessions = state.sessions.filter((s) => s.id !== action.payload);
            if (state.currentSession?.id === action.payload) {
                state.currentSession = null;
                state.messages = [];
            }
        },
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload;
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            // Only add to displayed messages if it belongs to the current session
            if (state.currentSession?.id === action.payload.chatSessionId) {
                state.messages.push(action.payload);
            }
        },
        clearChat: (state) => {
            state.currentSession = null;
            state.messages = [];
        },
    },
});

export const {
    setLoading,
    setSending,
    setError,
    setSessions,
    setCurrentSession,
    addSession,
    removeSession,
    setMessages,
    addMessage,
    clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;

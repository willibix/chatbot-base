import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import chatReducer from "./slices/chatSlice";
import themeReducer from "./slices/themeSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ["chat/addMessage"],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

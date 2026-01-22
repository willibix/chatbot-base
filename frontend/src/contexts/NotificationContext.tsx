import { createContext, useCallback, useContext, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import type { AlertColor } from "@mui/material/Alert";
import type { ReactNode } from "react";

interface Notification {
    id: string;
    message: string;
    severity: AlertColor;
}

interface NotificationContextType {
    notify: (message: string, severity?: AlertColor) => void;
    notifyError: (message: string) => void;
    notifySuccess: (message: string) => void;
    notifyWarning: (message: string) => void;
    notifyInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const notify = useCallback((message: string, severity: AlertColor = "info") => {
        const id = crypto.randomUUID();
        setNotifications((prev) => [...prev, { id, message, severity }]);
    }, []);

    const notifyError = useCallback((message: string) => notify(message, "error"), [notify]);
    const notifySuccess = useCallback((message: string) => notify(message, "success"), [notify]);
    const notifyWarning = useCallback((message: string) => notify(message, "warning"), [notify]);
    const notifyInfo = useCallback((message: string) => notify(message, "info"), [notify]);

    const value = useMemo(
        () => ({ notify, notifyError, notifySuccess, notifyWarning, notifyInfo }),
        [notify, notifyError, notifySuccess, notifyWarning, notifyInfo],
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
            {notifications.map((notification) => (
                <Snackbar
                    key={notification.id}
                    open
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    autoHideDuration={6000}
                    onClose={() => removeNotification(notification.id)}
                >
                    <Alert
                        onClose={() => removeNotification(notification.id)}
                        severity={notification.severity}
                        sx={{ width: "100%" }}
                        variant="filled"
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            ))}
        </NotificationContext.Provider>
    );
};

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}

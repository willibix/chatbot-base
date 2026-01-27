import { useCallback, useEffect, useRef, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DeleteIcon from "@mui/icons-material/Delete";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import SendIcon from "@mui/icons-material/Send";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useNavigate, useParams } from "react-router-dom";

import { useNotification } from "../components/NotificationContext";
import OverflowTooltip from "../components/OverflowTooltip";
import { useAppDispatch, useAppSelector } from "../hooks/useStore";
import {
    createChatSession,
    deleteChatSession,
    getChatSession,
    getChatSessions,
    sendMessage as apiSendMessage,
    SessionExpiredError,
} from "../services/api";
import { logout } from "../store/slices/authSlice";
import {
    addMessage,
    addSession,
    removeSession,
    setCurrentSession,
    setLoading,
    setSending,
    setSessions,
} from "../store/slices/chatSlice";
import { toggleTheme } from "../store/slices/themeSlice";

import type { ChatSession, Message } from "../store/slices/chatSlice";

const drawerWidth = 280;

const ChatPage = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
    const [newChatTitle, setNewChatTitle] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);
    const prevIsSendingRef = useRef(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { sessionId } = useParams<{ sessionId: string }>();
    const { notifyError } = useNotification();

    const { sessions, currentSession, messages, isLoading, isSending, sendingSessionId } = useAppSelector(
        (state) => state.chat,
    );
    const themeMode = useAppSelector((state) => state.theme.mode);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Focus message input when sending transitions from true to false
    useEffect(() => {
        if (prevIsSendingRef.current && !isSending && currentSession) {
            messageInputRef.current?.focus();
        }
        prevIsSendingRef.current = isSending;
    }, [isSending, currentSession]);

    // Focus message input when session changes and input is enabled
    useEffect(() => {
        if (currentSession && !isSending) {
            messageInputRef.current?.focus();
        }
    }, [currentSession?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Load sessions on mount
    useEffect(() => {
        const loadSessions = async () => {
            dispatch(setLoading(true));
            try {
                const sessionsData = await getChatSessions();
                dispatch(
                    setSessions(
                        sessionsData.map((s) => ({
                            id: s.id,
                            userId: s.user_id,
                            title: s.title,
                            createdAt: s.created_at,
                            updatedAt: s.updated_at,
                        })),
                    ),
                );
            } catch (err) {
                // Don't show error for session expiration - the app will redirect
                if (!(err instanceof SessionExpiredError)) {
                    notifyError("Failed to load sessions");
                }
            } finally {
                dispatch(setLoading(false));
            }
        };

        void loadSessions();
    }, [dispatch, notifyError]);

    // Load session when sessionId changes
    useEffect(() => {
        const loadSession = async () => {
            if (!sessionId) {
                dispatch(setCurrentSession(null));
                return;
            }

            dispatch(setLoading(true));
            try {
                const sessionData = await getChatSession(sessionId);
                dispatch(
                    setCurrentSession({
                        id: sessionData.id,
                        userId: sessionData.user_id,
                        title: sessionData.title,
                        createdAt: sessionData.created_at,
                        updatedAt: sessionData.updated_at,
                        messages: sessionData.messages.map((m) => ({
                            id: m.id,
                            chatSessionId: m.chat_session_id,
                            content: m.content,
                            role: m.role,
                            createdAt: m.created_at,
                        })),
                    }),
                );
            } catch (err) {
                // Don't show error for session expiration - the app will redirect
                if (!(err instanceof SessionExpiredError)) {
                    notifyError("Failed to load session");
                }
            } finally {
                dispatch(setLoading(false));
            }
        };

        void loadSession();
    }, [sessionId, dispatch, notifyError]);

    const handleOpenNewChatDialog = () => {
        setNewChatTitle("");
        setNewChatDialogOpen(true);
    };

    const handleCloseNewChatDialog = () => {
        setNewChatDialogOpen(false);
        setNewChatTitle("");
    };

    const handleCreateNewChat = async () => {
        const title = newChatTitle.trim() || "New Chat";
        handleCloseNewChatDialog();
        setMobileOpen(false); // Close drawer on mobile
        try {
            const session = await createChatSession(title);
            const newSession: ChatSession = {
                id: session.id,
                userId: session.user_id,
                title: session.title,
                createdAt: session.created_at,
                updatedAt: session.updated_at,
            };
            dispatch(addSession(newSession));
            navigate(`/chat/${session.id}`);
        } catch (err) {
            if (!(err instanceof SessionExpiredError)) {
                notifyError("Failed to create session");
            }
        }
    };

    const handleDeleteSession = async (id: string, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await deleteChatSession(id);
            dispatch(removeSession(id));
            if (sessionId === id) {
                navigate("/chat");
            }
        } catch (err) {
            if (!(err instanceof SessionExpiredError)) {
                notifyError("Failed to delete session");
            }
        }
    };

    const handleSelectSession = (id: string) => {
        setMobileOpen(false); // Close drawer on mobile
        navigate(`/chat/${id}`);
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !currentSession || isSending) return;

        const content = messageInput.trim();
        setMessageInput("");

        // Add user message optimistically
        const userMessage: Message = {
            id: crypto.randomUUID(),
            chatSessionId: currentSession.id,
            content,
            role: "user",
            createdAt: new Date().toISOString(),
        };
        dispatch(addMessage(userMessage));

        dispatch(setSending({ sending: true, sessionId: currentSession.id }));
        try {
            const response = await apiSendMessage(currentSession.id, content);
            dispatch(
                addMessage({
                    id: response.id,
                    chatSessionId: response.chat_session_id,
                    content: response.content,
                    role: response.role,
                    createdAt: response.created_at,
                }),
            );
        } catch (err) {
            // Don't show error for session expiration - the app will redirect
            if (!(err instanceof SessionExpiredError)) {
                notifyError("Failed to send message");
                // Add error message
                dispatch(
                    addMessage({
                        id: crypto.randomUUID(),
                        chatSessionId: currentSession.id,
                        content: "Failed to send message. Please try again.",
                        role: "assistant",
                        createdAt: new Date().toISOString(),
                    }),
                );
            }
        } finally {
            dispatch(setSending({ sending: false }));
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const drawer = (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Toolbar>
                <Typography noWrap component="div" variant="h6">
                    Chatbot
                </Typography>
            </Toolbar>
            <Divider />
            <Box sx={{ p: 1 }}>
                <ListItemButton
                    onClick={handleOpenNewChatDialog}
                    sx={{
                        borderRadius: 1,
                        border: "1px dashed",
                        borderColor: "divider",
                    }}
                >
                    <AddIcon sx={{ mr: 1 }} />
                    <ListItemText primary="New Chat" />
                </ListItemButton>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, overflow: "auto" }}>
                {sessions.map((session) => (
                    <ListItem
                        key={session.id}
                        disablePadding
                        secondaryAction={
                            <IconButton
                                aria-label="delete"
                                edge="end"
                                onClick={async (e) => handleDeleteSession(session.id, e)}
                                size="small"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        }
                    >
                        <ListItemButton
                            onClick={() => handleSelectSession(session.id)}
                            selected={sessionId === session.id}
                            sx={{ pr: sendingSessionId === session.id ? 7 : 5 }}
                        >
                            <OverflowTooltip title={session.title ?? "New Chat"}>
                                <ListItemText
                                    primary={session.title ?? "New Chat"}
                                    primaryTypographyProps={{
                                        noWrap: true,
                                    }}
                                />
                            </OverflowTooltip>
                            {sendingSessionId === session.id ? (
                                <CircularProgress size={16} sx={{ ml: 1, flexShrink: 0 }} />
                            ) : null}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <Box sx={{ flexShrink: 0, marginY: 1 }}>
                <ListItemButton onClick={() => dispatch(toggleTheme())}>
                    {themeMode === "dark" ? <LightModeIcon sx={{ mr: 1 }} /> : <DarkModeIcon sx={{ mr: 1 }} />}
                    <ListItemText primary={themeMode === "dark" ? "Light Mode" : "Dark Mode"} />
                </ListItemButton>
                <ListItemButton onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    <ListItemText primary="Logout" />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", height: "100vh", paddingTop: "var(--safe-area-inset-top)" }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    top: "var(--safe-area-inset-top)",
                }}
            >
                <Toolbar>
                    <IconButton
                        aria-label="open drawer"
                        color="inherit"
                        edge="start"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        sx={{ mr: 2, display: { sm: "none" } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <OverflowTooltip title={currentSession?.title ?? ""}>
                        <Typography
                            noWrap
                            component="div"
                            sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
                            variant="h6"
                        >
                            {currentSession?.title ?? "Select or start a chat"}
                        </Typography>
                    </OverflowTooltip>
                </Toolbar>
            </AppBar>
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer
                    ModalProps={{ keepMounted: true }}
                    onClose={() => setMobileOpen(false)}
                    open={mobileOpen}
                    variant="temporary"
                    sx={{
                        display: { xs: "block", sm: "none" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                            // Position drawer below the safe area (status bar)
                            top: "var(--safe-area-inset-top)",
                            height: "calc(100% - var(--safe-area-inset-top))",
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    open
                    variant="permanent"
                    sx={{
                        display: { xs: "none", sm: "block" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                            top: "var(--safe-area-inset-top)",
                            height: "calc(100% - var(--safe-area-inset-top))",
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    height: "100vh",
                }}
            >
                <Toolbar />
                {/* Messages area */}
                <Box
                    sx={{
                        flexGrow: 1,
                        overflow: "auto",
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    {isLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : !currentSession ? (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                color: "text.secondary",
                            }}
                        >
                            <Typography gutterBottom variant="h5">
                                Welcome to Chatbot
                            </Typography>
                            <Typography>Start a new chat or select an existing conversation</Typography>
                        </Box>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <Box
                                    key={message.id}
                                    sx={{
                                        display: "flex",
                                        justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                                        gap: 1,
                                    }}
                                >
                                    {message.role !== "user" && (
                                        <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>AI</Avatar>
                                    )}
                                    <Paper
                                        sx={{
                                            p: 2,
                                            maxWidth: "70%",
                                            bgcolor:
                                                message.role === "user"
                                                    ? themeMode === "dark"
                                                        ? "primary.dark"
                                                        : "primary.light"
                                                    : "background.paper",
                                        }}
                                    >
                                        <Typography sx={{ whiteSpace: "pre-wrap" }}>{message.content}</Typography>
                                    </Paper>
                                </Box>
                            ))}
                            {isSending && sendingSessionId === currentSession.id ? (
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>AI</Avatar>
                                    <Paper sx={{ p: 2 }}>
                                        <CircularProgress size={20} />
                                    </Paper>
                                </Box>
                            ) : null}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </Box>
                {/* Message input */}
                {currentSession ? (
                    <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                autoFocus
                                fullWidth
                                multiline
                                disabled={isSending}
                                inputRef={messageInputRef}
                                maxRows={4}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type your message..."
                                value={messageInput}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        void handleSendMessage();
                                    }
                                }}
                            />
                            {isSending ? (
                                <IconButton disabled color="primary">
                                    <CircularProgress size={24} />
                                </IconButton>
                            ) : (
                                <IconButton color="primary" disabled={!messageInput.trim()} onClick={handleSendMessage}>
                                    <SendIcon />
                                </IconButton>
                            )}
                        </Box>
                    </Box>
                ) : null}
            </Box>
            <Dialog
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                onClose={handleCloseNewChatDialog}
                open={newChatDialogOpen}
            >
                <DialogTitle>New Chat</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Chat Name"
                        margin="dense"
                        onChange={(e) => setNewChatTitle(e.target.value)}
                        placeholder="New Chat"
                        slotProps={{ htmlInput: { maxLength: 255 } }}
                        value={newChatTitle}
                        variant="outlined"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                void handleCreateNewChat();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseNewChatDialog}>Cancel</Button>
                    <Button onClick={handleCreateNewChat} variant="contained">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ChatPage;

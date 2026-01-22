import { useCallback, useEffect, useRef, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import SendIcon from "@mui/icons-material/Send";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
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

import { useAppDispatch, useAppSelector } from "../hooks/useStore";
import { useNotification } from "../contexts/NotificationContext";
import {
    createChatSession,
    deleteChatSession,
    getChatSession,
    getChatSessions,
    sendMessage as apiSendMessage,
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

import type { ChatSession, Message } from "../store/slices/chatSlice";

const drawerWidth = 280;

const ChatPage = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { sessionId } = useParams<{ sessionId: string }>();
    const { notifyError } = useNotification();

    const { sessions, currentSession, messages, isLoading, isSending } = useAppSelector((state) => state.chat);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

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
            } catch {
                notifyError("Failed to load sessions");
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
            } catch {
                notifyError("Failed to load session");
            } finally {
                dispatch(setLoading(false));
            }
        };

        void loadSession();
    }, [sessionId, dispatch, notifyError]);

    const handleNewChat = async () => {
        try {
            const session = await createChatSession();
            const newSession: ChatSession = {
                id: session.id,
                userId: session.user_id,
                title: session.title,
                createdAt: session.created_at,
                updatedAt: session.updated_at,
            };
            dispatch(addSession(newSession));
            navigate(`/chat/${session.id}`);
        } catch {
            notifyError("Failed to create session");
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
        } catch {
            notifyError("Failed to delete session");
        }
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

        dispatch(setSending(true));
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
        } catch {
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
        } finally {
            dispatch(setSending(false));
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
                    onClick={handleNewChat}
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
                            onClick={async () => navigate(`/chat/${session.id}`)}
                            selected={sessionId === session.id}
                        >
                            <ListItemText
                                primary={session.title ?? "New Chat"}
                                primaryTypographyProps={{
                                    noWrap: true,
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <ListItemButton onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                <ListItemText primary="Logout" />
            </ListItemButton>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", height: "100vh" }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
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
                    <Typography noWrap component="div" variant="h6">
                        {currentSession?.title ?? "Select or start a chat"}
                    </Typography>
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
                        "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    open
                    variant="permanent"
                    sx={{
                        display: { xs: "none", sm: "block" },
                        "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
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
                                            bgcolor: message.role === "user" ? "primary.dark" : "background.paper",
                                        }}
                                    >
                                        <Typography sx={{ whiteSpace: "pre-wrap" }}>{message.content}</Typography>
                                    </Paper>
                                </Box>
                            ))}
                            {isSending ? (
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
                                fullWidth
                                multiline
                                disabled={isSending}
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
                            <IconButton
                                color="primary"
                                disabled={!messageInput.trim() || isSending}
                                onClick={handleSendMessage}
                            >
                                <SendIcon />
                            </IconButton>
                        </Box>
                    </Box>
                ) : null}
            </Box>
        </Box>
    );
};

export default ChatPage;

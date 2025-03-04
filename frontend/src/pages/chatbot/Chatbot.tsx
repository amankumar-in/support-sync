import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  List,
  ListItem,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  PersonOutline as UserIcon,
} from "@mui/icons-material";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";

// Define the theme to match other pages
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976D2", // Deep blue
      light: "#4791db",
      dark: "#115293",
    },
    secondary: {
      main: "#DC004E", // Vibrant pink
      light: "#ff4081",
      dark: "#9a0036",
    },
    background: {
      default: "#f4f6f9",
      paper: "#ffffff",
    },
    text: {
      primary: "#333",
      secondary: "#666",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
});

// Styled components
const MessageBubble = styled(Paper)<{ sender: string }>(
  ({ theme, sender }) => ({
    padding: theme.spacing(1.5),
    backgroundColor: sender === "user" ? theme.palette.primary.main : "#E3F2FD",
    color: sender === "user" ? "white" : theme.palette.text.primary,
    borderRadius: theme.shape.borderRadius,
    maxWidth: "70%",
    boxShadow: theme.shadows[1],
    marginBottom: theme.spacing(0.5),
    wordBreak: "break-word",
  }),
);

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: "white",
}));

// Define the message type
interface ChatMessage {
  sender: string;
  text: string;
}

const Chatbot = () => {
  // Properly type the state variables
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock organization name (Replace with real organization name from context or API)
  const organizationName = "Foster Care Agency";

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add welcome message on component mount
  useEffect(() => {
    setMessages([
      {
        sender: "chatbot",
        text: `Hello! I'm your AI assistant for ${organizationName}. How can I help you today?`,
      },
    ]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const userMessage: ChatMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Show "Typing..." animation
      setMessages((prev) => [
        ...prev,
        { sender: "chatbot", text: "Typing..." },
      ]);

      const organizationId = localStorage.getItem("organizationId");

      const response = await fetch("http://localhost:5010/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          userId: localStorage.getItem("userId"),
          text: input,
        }),
      });

      const data = await response.json();

      // Remove "Typing..." message
      setMessages((prev) => prev.slice(0, -1));

      // Add real AI response
      const botMessage: ChatMessage = {
        sender: "chatbot",
        text: data.response,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => prev.slice(0, -1)); // Remove "Typing..." if API fails

      // Show error message to user
      setMessages((prev) => [
        ...prev,
        {
          sender: "chatbot",
          text: "I apologize, but I encountered an error. Please try again later.",
        },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Chat Title */}
      <Box
        sx={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          width: "100%",
          pb: 2,
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            display: "flex",
            alignItems: "center",
            color: theme.palette.primary.dark,
          }}
        >
          <BotIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
          AI Assistant
        </Typography>
      </Box>

      {/* Messages Container */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          pb: 10, // Space for input box
        }}
      >
        {/* Messages */}
        <List sx={{ width: "100%", maxWidth: "800px", mx: "auto", mb: 2 }}>
          {messages.map((msg, index) => (
            <ListItem
              key={index}
              sx={{
                display: "flex",
                justifyContent:
                  msg.sender === "user" ? "flex-end" : "flex-start",
                px: 2,
                py: 1,
                alignItems: "flex-start",
              }}
            >
              {msg.sender !== "user" && (
                <StyledAvatar sx={{ mr: 1 }}>
                  <BotIcon fontSize="small" />
                </StyledAvatar>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  position: "relative",
                  maxWidth: "70%",
                  "&:hover .copy-icon": { opacity: 1 },
                }}
              >
                <MessageBubble sender={msg.sender}>
                  <Typography variant="body1">{msg.text}</Typography>
                </MessageBubble>

                {/* For AI messages only - show organization and copy button */}
                {msg.sender === "chatbot" && (
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {organizationName} AI
                    </Typography>

                    <Tooltip title="Copy message">
                      <IconButton
                        className="copy-icon"
                        size="small"
                        onClick={() => copyToClipboard(msg.text)}
                        sx={{
                          ml: 1,
                          opacity: 0,
                          transition: "opacity 0.2s",
                          padding: 0.5,
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {msg.sender === "user" && (
                <StyledAvatar
                  sx={{ ml: 1, bgcolor: theme.palette.secondary.main }}
                >
                  <UserIcon fontSize="small" />
                </StyledAvatar>
              )}
            </ListItem>
          ))}

          {/* Loading indicator */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          <Box ref={messagesEndRef} />
        </List>
      </Box>

      {/* Input Box - Fixed at bottom */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          p: 2,
          borderTop: "1px solid rgba(0, 0, 0, 0.1)",
          bgcolor: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            maxWidth: "800px",
            mx: "auto",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            placeholder="Type your message..."
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: theme.shape.borderRadius,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            endIcon={<SendIcon />}
            sx={{
              borderRadius: theme.shape.borderRadius,
              px: 3,
              minWidth: "100px",
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Chatbot;

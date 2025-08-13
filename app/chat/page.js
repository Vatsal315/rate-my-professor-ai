"use client";
import { TextField, Box, Stack, Button, IconButton, Typography, AppBar, Toolbar, Link } from "@mui/material";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../providers';
import HomeIcon from '@mui/icons-material/Home'; // Importing home icon
import DeleteIcon from '@mui/icons-material/Delete'; // Importing delete icon
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Chat() {
  const router = useRouter();
  const { mode, toggle } = useThemeMode();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I am the Rate My Professor support assistant. How can I help you today?",
    },
  ]);

  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    if (message.trim() === "") return; // Avoid sending empty messages

    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    setMessage("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1] = {
          role: "assistant",
          content: data.content,
        };
        return updatedMessages;
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const goToWelcome = () => {
    router.push("/");
  };

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="static" color="inherit" sx={{ backgroundColor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e9e9ef' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={goToWelcome} aria-label="back to welcome page">
            <HomeIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 800 }}>Rate My Professor AI</Typography>
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}
          <IconButton onClick={toggle} aria-label="toggle theme" color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexGrow: 1, gap: 4 }}> {/* Centering Box with spacing */}
            <Link
              href="/allreviews"
              underline="none"
              sx={{
                color: '#0f172a',
                fontSize: '1.05rem',
                transition: 'color 0.2s, transform 0.2s',
                '&:hover': {
                  color: '#0ea5e9',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              See all reviews
            </Link>
            <Link
              href="/howitworks"
              underline="none"
              sx={{
                color: '#0f172a',
                fontSize: '1.05rem',
                transition: 'color 0.2s, transform 0.2s',
                '&:hover': {
                  color: '#0ea5e9',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              How it works
            </Link>
          </Box>
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box width="100vw" height="93vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" className="gradient-surface">
        <Stack direction="column" width="min(720px, 92vw)" height="70vh" borderRadius={3} className="elevated-card" p={3} spacing={3} bgcolor="white">
          <Typography variant="h6" color="textSecondary" align="center" mb={1} sx={{ fontWeight: 700, color: '#0f172a' }}>
            Ask anything about professors
          </Typography>
          <Typography variant="body2" align="center" sx={{ color: '#475569' }}>
            Enhanced with AI predictions! Try: &quot;Who teaches Algorithms well?&quot; or &quot;Tell me about Ali Sharifian&quot;
          </Typography>
          <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" maxHeight="100%" sx={{ padding: '10px', borderRadius: 2, bgcolor: "#f8fafc" }}>
            {messages.map((message, index) => (
              <Box key={index} display="flex" justifyContent={message.role === "assistant" ? "flex-start" : "flex-end"}>
                <Box bgcolor={message.role === "assistant" ? "#e0f2fe" : "#ede9fe"} color="#0f172a" borderRadius={2} p={1.5} maxWidth="75%" className="hover-lift">
                  {message.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      h1: (props) => <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }} {...props} />,
                      h2: (props) => <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }} {...props} />,
                      p: (props) => <Typography variant="body2" sx={{ mb: 1 }} {...props} />,
                      ul: (props) => <Box component="ul" sx={{ pl: 3, mb: 1 }} {...props} />,
                      ol: (props) => <Box component="ol" sx={{ pl: 3, mb: 1 }} {...props} />,
                      li: (props) => <Box component="li" sx={{ mb: 0.5 }} {...props} />, 
                    }}>
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Type a message..."
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  '& fieldset': {
                    borderColor: '#d1d5db',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9ca3af',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#0ea5e9',
                  },
                },
              }}
            />
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={() => setMessages([])}
              startIcon={<DeleteIcon />}
              sx={{
                color: '#0f172a',
                borderColor: '#0f172a',
                '&:hover': {
                  backgroundColor: 'rgba(15, 23, 42, 0.04)',
                  borderColor: '#0f172a',
                },
              }}
            >
              Clear Chat
            </Button>
            <Button
              variant="outlined"
              onClick={() => setMessage("")}
              startIcon={<DeleteIcon />}
              sx={{
                color: '#0f172a',
                borderColor: '#0f172a',
                '&:hover': {
                  backgroundColor: 'rgba(15, 23, 42, 0.04)',
                  borderColor: '#0f172a',
                },
              }}
            >
              Clear Input
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
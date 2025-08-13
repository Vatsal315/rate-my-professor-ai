"use client"; // This is a client component

import { useRouter } from "next/navigation";
import { Button, Box, Typography, IconButton } from "@mui/material";
import GitHubIcon from '@mui/icons-material/GitHub';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../providers';
import "./welcome.css"; // Import custom CSS for additional styles
import { Analytics } from "@vercel/analytics/react"

export default function GetStarted() {
  const router = useRouter();
  const { mode, toggle } = useThemeMode();

  const goToUpload = () => {
    router.push("/upload");
  };

  const goToChat = () => {
    router.push("./chat");
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        backgroundColor: "#fef5e7", // Light cream background color
        padding: 3,
      }}
    >
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <IconButton onClick={toggle} aria-label="toggle theme" color="inherit">
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
      <Typography
        variant="h2"
        component="h1"
        className="large-header"
        sx={{ fontWeight: 800, mb: 2, textAlign: 'center' }}
      >
        Rate My Professor AI
      </Typography>
      <Typography variant="h6" component="h2" sx={{ color: "#334155", textAlign: 'center' }}>
        Find standout instructors fast. Upload reviews or just ask.
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748b", textAlign: 'center', mt: 1, fontStyle: 'italic' }}>
        Now powered by AI predictions and insights
      </Typography>
      <Box mt={5} display="flex" flexDirection="row" gap={3} flexWrap="wrap" justifyContent="center">
        <Button
          variant="contained"
          onClick={goToUpload}
          sx={{ px: 3, py: 1.6, fontSize: '1.05rem', borderRadius: 2 }}
        >
          Add Reviews
        </Button>
        <Button
          variant="outlined"
          onClick={goToChat}
          sx={{ px: 3, py: 1.6, fontSize: '1.05rem', borderRadius: 2 }}
        >
          Ask the Assistant
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => router.push('/train')}
          sx={{ px: 3, py: 1.6, fontSize: '1.05rem', borderRadius: 2 }}
        >
          Train AI Model
        </Button>
      </Box>
      {/* GitHub Icon */}
      <Box mt={6} position="absolute" bottom={20} display="flex" justifyContent="center" alignItems="center">
        <IconButton
          component="a"
          href="https://github.com/mbouabid25/ai-rate-my-prof.git" 
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "#333",
            '&:hover': {
              color: "#9c27b0", // Bright purple on hover
            },
          }}
        >
          <GitHubIcon fontSize="large" />
        </IconButton>
      </Box>
    </Box>
  );
}
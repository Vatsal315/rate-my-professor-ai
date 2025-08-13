// app/how-it-works/page.js
"use client";
import { Box, Typography, Grid, Paper, Container, IconButton, AppBar, Toolbar, Link } from "@mui/material";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../providers';
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HomeIcon from "@mui/icons-material/Home";
import GitHubIcon from '@mui/icons-material/GitHub'; // Import GitHub Icon
import { useRouter } from "next/navigation";

export default function HowItWorks() {
  const router = useRouter();
  const { mode, toggle } = useThemeMode();

  const goToWelcome = () => {
    router.push("/");
  };

  return (
    <Box
      sx={{
        fontFamily: "'Roboto', sans-serif", // Set the Roboto font family
        backgroundColor: "#fef5e7", // Use the light cream background color for consistency
        minHeight: "100vh",
        paddingTop: 0, // Ensure no extra space above the navbar
        paddingBottom: 8,
      }}
    >
      {/* Navigation Bar */}
      <AppBar position="static" color="inherit" sx={{ backgroundColor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e9e9ef' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={goToWelcome}
            aria-label="back to welcome page"
          >
            <HomeIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 800 }}>Rate My Professor AI</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={toggle} aria-label="toggle theme" color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexGrow: 1,
              gap: 4,
            }}
          >
            <Link href="/allreviews" underline="none" sx={{ color: '#0f172a', fontSize: '1.05rem', transition: 'color 0.2s, transform 0.2s', '&:hover': { color: '#0ea5e9', transform: 'translateY(-2px)' } }}>
              See all reviews
            </Link>
            <Link href="/howitworks" underline="none" sx={{ color: '#0f172a', fontSize: '1.05rem', transition: 'color 0.2s, transform 0.2s', '&:hover': { color: '#0ea5e9', transform: 'translateY(-2px)' } }}>
              How it works
            </Link>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container sx={{ paddingY: 8 }}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ fontWeight: 800, color: "#0f172a", mb: 4 }}
        >
          How it works
        </Typography>

        <Grid
          container
          direction="column"
          alignItems="center"
          spacing={2} // Control spacing between steps
        >
          {/* Step 1 */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={4}
              sx={{
                padding: 4,
                textAlign: "center",
                borderRadius: 2,
                backgroundColor: "#ffffff",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
                height: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                fontFamily: "'Roboto', sans-serif", // Ensure consistency
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                Step 1: Ask a question
              </Typography>
              <Typography color="textSecondary">
                Type what you’re looking for: class, subject, or professor.
              </Typography>
            </Paper>
          </Grid>

          {/* Arrow Down */}
          <Grid item>
            <ArrowDownwardIcon
              sx={{ fontSize: 40, color: "#1976d2" }} // Adjust size and color for aesthetic
            />
          </Grid>

          {/* Step 2 */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={4}
              sx={{
                padding: 4,
                textAlign: "center",
                borderRadius: 2,
                backgroundColor: "#ffffff",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
                height: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                fontFamily: "'Roboto', sans-serif", // Ensure consistency
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                Step 2: Semantic search
              </Typography>
              <Typography color="textSecondary">
                We compare your query to our review embeddings for relevant matches.
              </Typography>
            </Paper>
          </Grid>

          {/* Arrow Down */}
          <Grid item>
            <ArrowDownwardIcon
              sx={{ fontSize: 40, color: "#1976d2" }} // Adjust size and color for aesthetic
            />
          </Grid>

          {/* Step 3 */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={4}
              sx={{
                padding: 4,
                textAlign: "center",
                borderRadius: 2,
                backgroundColor: "#ffffff",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
                height: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                fontFamily: "'Roboto', sans-serif", // Ensure consistency
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                Step 3: AI analysis
              </Typography>
              <Typography color="textSecondary">
                The model summarizes pros and cons across the most relevant reviews.
              </Typography>
            </Paper>
          </Grid>

          {/* Arrow Down */}
          <Grid item>
            <ArrowDownwardIcon
              sx={{ fontSize: 40, color: "#1976d2" }} // Adjust size and color for aesthetic
            />
          </Grid>

          {/* Step 4 */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={4}
              sx={{
                padding: 4,
                textAlign: "center",
                borderRadius: 2,
                backgroundColor: "#ffffff",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
                height: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                fontFamily: "'Roboto', sans-serif", // Ensure consistency
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                Step 4: Clear results
              </Typography>
              <Typography color="textSecondary">
                You get an actionable answer with links to see all reviews.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* GitHub Icon */}
      <Box mt={0} position="relative" bottom={20} width="100%" display="flex" justifyContent="center" alignItems="center">
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
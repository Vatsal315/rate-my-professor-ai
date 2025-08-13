"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import reviewsData from "../../../data/reviews.json";
import { Box, Typography, AppBar, Toolbar, IconButton, Chip, Stack, Card, CardContent, Divider, Button, LinearProgress, Grid, Link } from "@mui/material";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../../providers';
import HomeIcon from "@mui/icons-material/Home";
import StarIcon from "@mui/icons-material/Star";

export default function ProfessorDetail({ params }) {
  const router = useRouter();
  const { mode, toggle } = useThemeMode();
  const name = decodeURIComponent(params.name || "");
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const { reviews, avg, subjects, dist, wouldTakeAgainPct, difficulty, tags, similar } = useMemo(() => {
    const filtered = reviewsData.reviews.filter(r => (r.professor || "").toLowerCase() === name.toLowerCase());
    const starsArray = filtered.map(r => typeof r.stars === 'string' ? parseInt(r.stars, 10) : r.stars).filter(n => !Number.isNaN(n));
    const avgVal = starsArray.length ? (starsArray.reduce((a, b) => a + b, 0) / starsArray.length) : 0;
    const subjSet = Array.from(new Set(filtered.map(r => r.subject).filter(Boolean)));
    // Rating distribution 1..5
    const distInit = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const n of starsArray) {
      if (n >= 1 && n <= 5) distInit[n] += 1;
    }
    const total = starsArray.length || 1;
    // Would take again: heuristic (stars >= 4)
    const wouldAgain = Math.round((starsArray.filter(n => n >= 4).length / total) * 100);
    // Difficulty (heuristic): inverse of rating, clamped [1,5]
    const diff = Math.max(1, Math.min(5, Number((5.2 - avgVal).toFixed(1))));
    // Tags from review text
    const tagDefs = [
      { key: 'CLEAR GRADING CRITERIA', patterns: ['clear grading', 'rubric', 'criteria'] },
      { key: 'TOUGH GRADER', patterns: ['tough grader', 'harsh', 'strict', 'hard grader'] },
      { key: 'LECTURE HEAVY', patterns: ['lecture heavy', 'lectures', 'talks a lot'] },
      { key: 'AMAZING LECTURES', patterns: ['engaging', 'amazing', 'great lectures', 'best'] },
      { key: 'LOTS OF HOMEWORK', patterns: ['homework', 'assignments'] },
      { key: 'PARTICIPATION MATTERS', patterns: ['participation', 'class participation'] },
    ];
    const text = filtered.map(r => (r.review || '').toLowerCase()).join(' ');
    const tagSet = new Set();
    for (const t of tagDefs) {
      if (t.patterns.some(p => text.includes(p))) tagSet.add(t.key);
    }
    // Similar professors by subject and rating proximity
    const others = reviewsData.reviews
      .filter(r => (r.professor || '').toLowerCase() !== name.toLowerCase())
      .map(r => ({
        professor: r.professor,
        subject: r.subject,
        stars: typeof r.stars === 'string' ? parseInt(r.stars, 10) : r.stars,
      }));
    const primarySubject = subjSet[0] || '';
    const scored = others.map(o => {
      const subjectScore = o.subject && primarySubject && o.subject.toLowerCase().includes(primarySubject.toLowerCase()) ? 1 : 0;
      const ratingScore = 1 - Math.min(1, Math.abs((o.stars || 0) - avgVal) / 5);
      return { ...o, score: subjectScore * 0.7 + ratingScore * 0.3 };
    });
    scored.sort((a, b) => b.score - a.score);
    const similarList = [];
    const seen = new Set();
    for (const s of scored) {
      if (s.professor && !seen.has(s.professor)) {
        similarList.push(s);
        seen.add(s.professor);
      }
      if (similarList.length >= 4) break;
    }
    return {
      reviews: filtered,
      avg: avgVal,
      subjects: subjSet,
      dist: distInit,
      wouldTakeAgainPct: wouldAgain,
      difficulty: diff,
      tags: Array.from(tagSet),
      similar: similarList,
    };
  }, [name]);

  // Fetch AI predictions
  useEffect(() => {
    if (reviews.length > 0) {
      setLoadingPrediction(true);
      fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professorName: name,
          subject: subjects[0] || 'General',
          reviews: reviews.map(r => r.review)
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAiPrediction(data.prediction);
        }
      })
      .catch(err => console.error('AI prediction failed:', err))
      .finally(() => setLoadingPrediction(false));
    }
  }, [name, reviews, subjects]);

  const goHome = () => router.push("/");

  return (
    <Box>
      <AppBar position="static" color="inherit" sx={{ backgroundColor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e9e9ef' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={goHome} aria-label="back to welcome page">
            <HomeIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 800 }}>Rate My Professor AI</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={toggle} aria-label="toggle theme" color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box className="gradient-surface" sx={{ minHeight: '100vh', p: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 'min(900px, 95vw)' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>{name}</Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarIcon sx={{ color: '#f59e0b' }} />
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{avg.toFixed(1)}</Typography>
                </Box>
                <Typography color="text.secondary">/ 5</Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ mb: 1 }}>Overall quality based on {reviews.length} rating{reviews.length === 1 ? '' : 's'}</Typography>
              <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{wouldTakeAgainPct}%</Typography>
                  <Typography color="text.secondary">Would take again</Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{difficulty}</Typography>
                  <Typography color="text.secondary">Level of Difficulty</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {subjects.map((s, i) => (
                  <Chip key={i} label={s} />
                ))}
                {tags.map((t, i) => (
                  <Chip key={`tag-${i}`} label={t} variant="outlined" />
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>Rating Distribution</Typography>
              {[5,4,3,2,1].map(n => (
                <Stack direction="row" alignItems="center" spacing={1} key={n} sx={{ mb: 1 }}>
                  <Box sx={{ width: 60 }}>
                    <Typography sx={{ width: 60 }}>{n === 5 ? 'Awesome 5' : n === 4 ? 'Great 4' : n === 3 ? 'Good 3' : n === 2 ? 'OK 2' : 'Awful 1'}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.round((dist[n] / Math.max(1, reviews.length)) * 100)} sx={{ flexGrow: 1, height: 10, borderRadius: 6 }} />
                  <Box sx={{ width: 26, textAlign: 'right' }}>
                    <Typography>{dist[n]}</Typography>
                  </Box>
                </Stack>
              ))}
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Similar Professors</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }}>
            {similar.map((sp, i) => (
              <Card key={i} sx={{ minWidth: 180 }} className="elevated-card hover-lift">
                <CardContent>
                  <Link href={`/professors/${encodeURIComponent(sp.professor)}`} underline="none">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{sp.professor}</Typography>
                  </Link>
                  <Typography color="text.secondary" sx={{ mb: 0.5 }}>{sp.subject}</Typography>
                  <Box>
                    {[...Array(sp.stars || 0)].map((_, idx) => (
                      <StarIcon key={idx} sx={{ color: '#f59e0b' }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))}
            {similar.length === 0 && (
              <Typography color="text.secondary">No similar professors found.</Typography>
            )}
          </Stack>

          {/* AI Predictions Section */}
          {(aiPrediction || loadingPrediction) && (
            <>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>AI Analysis</Typography>
              {loadingPrediction ? (
                <Card className="elevated-card" sx={{ mb: 3 }}>
                  <CardContent>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography>Generating AI insights...</Typography>
                  </CardContent>
                </Card>
              ) : aiPrediction && (
                <Card className="elevated-card" sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {aiPrediction.avg_rating.toFixed(1)}/5
                        </Typography>
                        <Typography color="text.secondary">AI Predicted Rating</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {aiPrediction.avg_difficulty.toFixed(1)}/5
                        </Typography>
                        <Typography color="text.secondary">AI Predicted Difficulty</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {(aiPrediction.confidence * 100).toFixed(0)}%
                        </Typography>
                        <Typography color="text.secondary">Confidence</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {aiPrediction.rating_consistency.toFixed(1)}
                        </Typography>
                        <Typography color="text.secondary">Consistency Score</Typography>
                      </Grid>
                    </Grid>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Key Insights:</Typography>
                    <Stack spacing={0.5}>
                      {aiPrediction.insights.map((insight, i) => (
                        <Typography key={i} variant="body2" sx={{ color: 'text.secondary' }}>
                          • {insight}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Student Reviews</Typography>
          <Stack spacing={2}>
            {reviews.map((r, i) => (
              <Card key={i} className="elevated-card hover-lift">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{r.subject}</Typography>
                    <Box>
                      {[...Array(typeof r.stars === 'string' ? parseInt(r.stars, 10) : r.stars)].map((_, idx) => (
                        <StarIcon key={idx} sx={{ color: '#f59e0b' }} />
                      ))}
                    </Box>
                  </Stack>
                  <Typography color="text.secondary">{r.review}</Typography>
                </CardContent>
              </Card>
            ))}
            {reviews.length === 0 && (
              <Typography color="text.secondary">No reviews yet for this professor.</Typography>
            )}
          </Stack>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => router.push('/allreviews')}>Back to all reviews</Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}



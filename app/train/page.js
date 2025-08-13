"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  LinearProgress, 
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Stack
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../providers';

export default function TrainModel() {
  const router = useRouter();
  const { mode, toggle } = useThemeMode();
  const [isTraining, setIsTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [predictionData, setPredictionData] = useState({
    professorName: '',
    subject: '',
    reviews: ['']
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainResult(null);
    
    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      setTrainResult(result);
    } catch (error) {
      setTrainResult({ 
        success: false, 
        error: 'Failed to start training',
        details: error.message
      });
    }
    
    setIsTraining(false);
  };

  const handlePredict = async () => {
    if (!predictionData.professorName || !predictionData.subject || 
        predictionData.reviews.filter(r => r.trim()).length === 0) {
      setPredictionResult({
        success: false,
        error: 'Please fill in all fields'
      });
      return;
    }

    setIsPredicting(true);
    setPredictionResult(null);
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professorName: predictionData.professorName,
          subject: predictionData.subject,
          reviews: predictionData.reviews.filter(r => r.trim())
        })
      });
      
      const result = await response.json();
      setPredictionResult(result);
    } catch (error) {
      setPredictionResult({ 
        success: false, 
        error: 'Failed to get prediction',
        details: error.message
      });
    }
    
    setIsPredicting(false);
  };

  const addReview = () => {
    setPredictionData({
      ...predictionData,
      reviews: [...predictionData.reviews, '']
    });
  };

  const updateReview = (index, value) => {
    const newReviews = [...predictionData.reviews];
    newReviews[index] = value;
    setPredictionData({
      ...predictionData,
      reviews: newReviews
    });
  };

  const removeReview = (index) => {
    const newReviews = predictionData.reviews.filter((_, i) => i !== index);
    setPredictionData({
      ...predictionData,
      reviews: newReviews.length ? newReviews : ['']
    });
  };

  return (
    <Box>
      <AppBar position="static" color="inherit" sx={{ backgroundColor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e9e9ef' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/')} aria-label="back to welcome page">
            <HomeIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 800 }}>Rate My Professor AI - Model Training</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={toggle} aria-label="toggle theme" color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box className="gradient-surface" sx={{ minHeight: '100vh', p: 4 }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, textAlign: 'center' }}>
            AI Model Training & Testing
          </Typography>

          {/* Training Section */}
          <Card className="elevated-card" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Train Custom Model
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Train a machine learning model on your professor review data to generate better predictions and insights.
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={handleTrain}
                disabled={isTraining}
                sx={{ mb: 2 }}
              >
                {isTraining ? 'Training Model...' : 'Start Training'}
              </Button>
              
              {isTraining && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Training in progress... This may take a few minutes.
                  </Typography>
                </Box>
              )}
              
              {trainResult && (
                <Alert severity={trainResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                  {trainResult.success ? (
                    <div>
                      <strong>Training completed successfully!</strong>
                      <pre style={{ fontSize: '12px', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                        {trainResult.output}
                      </pre>
                    </div>
                  ) : (
                    <div>
                      <strong>Training failed:</strong> {trainResult.error}
                      {trainResult.details && (
                        <pre style={{ fontSize: '12px', marginTop: '8px' }}>
                          {trainResult.details}
                        </pre>
                      )}
                    </div>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Prediction Testing Section */}
          <Card className="elevated-card">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Test Model Predictions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Test the trained model by providing professor information and sample reviews.
              </Typography>
              
              <Stack spacing={3} sx={{ mb: 3 }}>
                <TextField
                  label="Professor Name"
                  value={predictionData.professorName}
                  onChange={(e) => setPredictionData({...predictionData, professorName: e.target.value})}
                  fullWidth
                />
                
                <TextField
                  label="Subject/Department"
                  value={predictionData.subject}
                  onChange={(e) => setPredictionData({...predictionData, subject: e.target.value})}
                  fullWidth
                />
                
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Sample Reviews:
                </Typography>
                
                {predictionData.reviews.map((review, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <TextField
                      label={`Review ${index + 1}`}
                      value={review}
                      onChange={(e) => updateReview(index, e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                    />
                    {predictionData.reviews.length > 1 && (
                      <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={() => removeReview(index)}
                        sx={{ mt: 1 }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                ))}
                
                <Button variant="outlined" onClick={addReview}>
                  Add Another Review
                </Button>
              </Stack>
              
              <Button 
                variant="contained" 
                onClick={handlePredict}
                disabled={isPredicting}
                sx={{ mb: 2 }}
              >
                {isPredicting ? 'Predicting...' : 'Get Prediction'}
              </Button>
              
              {isPredicting && <LinearProgress sx={{ mb: 2 }} />}
              
              {predictionResult && (
                <Alert severity={predictionResult.success ? 'success' : 'error'}>
                  {predictionResult.success ? (
                    <div>
                      <strong>Prediction Results:</strong>
                      <Box sx={{ mt: 2 }}>
                        <Typography><strong>Predicted Rating:</strong> {predictionResult.prediction.avg_rating.toFixed(2)}/5</Typography>
                        <Typography><strong>Predicted Difficulty:</strong> {predictionResult.prediction.avg_difficulty.toFixed(2)}/5</Typography>
                        <Typography><strong>Confidence:</strong> {(predictionResult.prediction.confidence * 100).toFixed(1)}%</Typography>
                        <Typography sx={{ mt: 1 }}><strong>Insights:</strong></Typography>
                        <ul>
                          {predictionResult.prediction.insights.map((insight, i) => (
                            <li key={i}>{insight}</li>
                          ))}
                        </ul>
                      </Box>
                    </div>
                  ) : (
                    <div>
                      <strong>Prediction failed:</strong> {predictionResult.error}
                    </div>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

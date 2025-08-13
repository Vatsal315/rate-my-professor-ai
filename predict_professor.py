#!/usr/bin/env python3
"""
Professor Prediction Script
Uses trained model to predict professor metrics from review data.
"""

import json
import sys
import numpy as np
import pandas as pd
from train_model import ProfessorRecommendationModel
import warnings
warnings.filterwarnings('ignore')

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Initialize model
        model = ProfessorRecommendationModel()
        
        # Try to load pre-trained models
        if not model.load_models():
            # If models don't exist, create a simple prediction
            result = {
                'avg_rating': 4.0,
                'avg_difficulty': 3.0,
                'rating_consistency': 0.5,
                'insights': [
                    "Model not trained yet. Using default predictions.",
                    "Train the model first using /api/train endpoint."
                ],
                'confidence': 0.1
            }
        else:
            try:
                # Use trained model for prediction
                predictions = model.predict_professor_metrics(
                    input_data['professor'],
                    input_data['subject'],
                    input_data['reviews']
                )
                
                insights = model.generate_professor_insights(predictions)
                
                result = {
                    'avg_rating': float(predictions['avg_rating']),
                    'avg_difficulty': float(predictions['avg_difficulty']),
                    'rating_consistency': float(predictions['rating_consistency']),
                    'insights': insights,
                    'confidence': 0.8,
                    'individual_predictions': [float(x) for x in predictions['individual_predictions']]
                }
            except Exception as pred_error:
                # Fallback if prediction fails
                result = {
                    'avg_rating': 3.5,
                    'avg_difficulty': 3.0,
                    'rating_consistency': 1.0,
                    'insights': [
                        f"Prediction error: {str(pred_error)[:100]}...",
                        "Using fallback predictions. Consider retraining the model."
                    ],
                    'confidence': 0.2
                }
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'avg_rating': 3.5,
            'avg_difficulty': 3.0,
            'rating_consistency': 1.0,
            'insights': ['Error in prediction, using fallback values'],
            'confidence': 0.0
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()

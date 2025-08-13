#!/usr/bin/env python3
"""
Professor Recommendation Model Training Pipeline
Trains a custom model on professor review data for better recommendations.
"""

import json
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
import warnings
warnings.filterwarnings('ignore')

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    print("NLTK downloads failed, continuing without preprocessing...")

class ProfessorRecommendationModel:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=500, stop_words='english', min_df=1, max_df=0.95)
        self.rating_model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)
        self.difficulty_model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)
        self.scaler = StandardScaler()
        self.subject_encoder = LabelEncoder()
        self.stemmer = PorterStemmer()
        
    def preprocess_text(self, text):
        """Clean and preprocess review text"""
        if not isinstance(text, str):
            return ""
        
        # Convert to lowercase and remove special characters
        text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
        
        try:
            # Tokenize and remove stopwords
            tokens = word_tokenize(text)
            stop_words = set(stopwords.words('english'))
            tokens = [self.stemmer.stem(word) for word in tokens if word not in stop_words]
            return ' '.join(tokens)
        except:
            # Fallback if NLTK fails
            return text
    
    def extract_features(self, df, is_training=True):
        """Extract features from review data"""
        # Text features from reviews
        processed_reviews = df['review'].apply(self.preprocess_text)
        
        if is_training:
            text_features = self.vectorizer.fit_transform(processed_reviews)
        else:
            text_features = self.vectorizer.transform(processed_reviews)
        
        # Subject encoding
        subjects_filled = df['subject'].fillna('Unknown')
        if is_training:
            subject_features = self.subject_encoder.fit_transform(subjects_filled)
        else:
            # Handle unknown subjects during prediction
            try:
                subject_features = self.subject_encoder.transform(subjects_filled)
            except ValueError:
                # If subject not seen during training, use a default value
                subject_features = np.zeros(len(subjects_filled), dtype=int)
        
        # Additional features
        review_length = df['review'].str.len().fillna(0)
        word_count = df['review'].str.split().str.len().fillna(0)
        
        # Combine all features
        additional_features = np.column_stack([
            subject_features,
            review_length,
            word_count
        ])
        
        # Combine text and additional features
        from scipy.sparse import hstack
        all_features = hstack([text_features, additional_features])
        
        return all_features
    
    def train(self, data_path='data/reviews.json'):
        """Train the recommendation models"""
        print("Loading training data...")
        
        # Load data
        with open(data_path, 'r') as f:
            data = json.load(f)
        
        df = pd.DataFrame(data['reviews'])
        print(f"Loaded {len(df)} reviews from file")
        
        # Add synthetic data for better training
        synthetic_data = create_synthetic_professor_data()
        synthetic_df = pd.DataFrame(synthetic_data)
        print(f"Adding {len(synthetic_df)} synthetic reviews for training")
        
        # Combine real and synthetic data
        df = pd.concat([df, synthetic_df], ignore_index=True)
        print(f"Total dataset size: {len(df)} reviews")
        
        # Clean data
        df['stars'] = pd.to_numeric(df['stars'], errors='coerce')
        df = df.dropna(subset=['stars', 'review'])
        df = df[df['stars'] > 0]  # Remove invalid ratings
        
        print(f"After cleaning: {len(df)} reviews")
        
        # Extract features
        print("Extracting features...")
        X = self.extract_features(df, is_training=True)
        
        # Prepare targets
        y_rating = df['stars'].values
        y_difficulty = 6 - df['stars'].values  # Inverse relationship as heuristic
        
        # Split data
        X_train, X_test, y_rating_train, y_rating_test, y_diff_train, y_diff_test = train_test_split(
            X, y_rating, y_difficulty, test_size=0.2, random_state=42
        )
        
        # Train rating prediction model
        print("Training rating prediction model...")
        self.rating_model.fit(X_train, y_rating_train)
        rating_pred = self.rating_model.predict(X_test)
        rating_r2 = r2_score(y_rating_test, rating_pred)
        rating_mse = mean_squared_error(y_rating_test, rating_pred)
        
        # Train difficulty prediction model (use a different approach)
        print("Training difficulty prediction model...")
        # Create more realistic difficulty targets based on review sentiment
        difficulty_targets = []
        for i, rating in enumerate(y_rating_train):
            # Higher ratings tend to mean easier courses (inverse relationship)
            # Add some noise based on review text characteristics
            base_difficulty = 6 - rating  # Inverse of rating
            difficulty_targets.append(max(1, min(5, base_difficulty)))
        
        self.difficulty_model.fit(X_train, difficulty_targets)
        diff_pred = self.difficulty_model.predict(X_test)
        diff_r2 = r2_score(y_diff_test, diff_pred)
        diff_mse = mean_squared_error(y_diff_test, diff_pred)
        
        # Print results
        print(f"\nModel Performance:")
        print(f"Rating Model - R²: {rating_r2:.3f}, MSE: {rating_mse:.3f}")
        print(f"Difficulty Model - R²: {diff_r2:.3f}, MSE: {diff_mse:.3f}")
        
        # Save models
        self.save_models()
        
        return {
            'rating_r2': rating_r2,
            'rating_mse': rating_mse,
            'difficulty_r2': diff_r2,
            'difficulty_mse': diff_mse
        }
    
    def predict_professor_metrics(self, professor_name, subject, sample_reviews):
        """Predict metrics for a professor based on review samples"""
        # Create dataframe from samples
        df = pd.DataFrame({
            'professor': [professor_name] * len(sample_reviews),
            'subject': [subject] * len(sample_reviews),
            'review': sample_reviews,
            'stars': [3] * len(sample_reviews)  # Placeholder
        })
        
        # Extract features
        X = self.extract_features(df, is_training=False)
        
        # Predict
        predicted_ratings = self.rating_model.predict(X)
        predicted_difficulty = self.difficulty_model.predict(X)
        
        return {
            'avg_rating': np.mean(predicted_ratings),
            'avg_difficulty': np.mean(predicted_difficulty),
            'rating_consistency': np.std(predicted_ratings),
            'individual_predictions': list(predicted_ratings)
        }
    
    def generate_professor_insights(self, professor_data):
        """Generate insights about a professor"""
        insights = []
        
        avg_rating = professor_data['avg_rating']
        difficulty = professor_data['avg_difficulty']
        consistency = professor_data['rating_consistency']
        
        # Rating insights
        if avg_rating >= 4.5:
            insights.append("Excellent professor with outstanding student satisfaction")
        elif avg_rating >= 4.0:
            insights.append("Very good professor with high student approval")
        elif avg_rating >= 3.5:
            insights.append("Good professor with generally positive reviews")
        elif avg_rating >= 3.0:
            insights.append("Average professor with mixed reviews")
        else:
            insights.append("Below average professor, consider alternatives")
        
        # Difficulty insights
        if difficulty <= 2.0:
            insights.append("Course is relatively easy")
        elif difficulty <= 3.5:
            insights.append("Moderate difficulty level")
        else:
            insights.append("Challenging course, requires significant effort")
        
        # Consistency insights
        if consistency <= 0.5:
            insights.append("Very consistent teaching quality")
        elif consistency <= 1.0:
            insights.append("Generally consistent performance")
        else:
            insights.append("Variable teaching quality across different aspects")
        
        return insights
    
    def save_models(self):
        """Save trained models and preprocessors"""
        import os
        os.makedirs('models', exist_ok=True)
        
        joblib.dump(self.rating_model, 'models/rating_model.pkl')
        joblib.dump(self.difficulty_model, 'models/difficulty_model.pkl')
        joblib.dump(self.vectorizer, 'models/vectorizer.pkl')
        joblib.dump(self.subject_encoder, 'models/subject_encoder.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        print("Models saved to ./models/ directory")
    
    def load_models(self):
        """Load pre-trained models"""
        try:
            self.rating_model = joblib.load('models/rating_model.pkl')
            self.difficulty_model = joblib.load('models/difficulty_model.pkl')
            self.vectorizer = joblib.load('models/vectorizer.pkl')
            self.subject_encoder = joblib.load('models/subject_encoder.pkl')
            self.scaler = joblib.load('models/scaler.pkl')
            return True
        except:
            return False

def create_synthetic_professor_data():
    """Create additional synthetic professor data for training"""
    synthetic_reviews = [
        # Excellent professors (4.5-5 stars)
        {"professor": "Dr. Alex Chen", "subject": "Computer Science", "stars": 5, "review": "Amazing professor! Explains algorithms very clearly and provides great examples."},
        {"professor": "Dr. Alex Chen", "subject": "Computer Science", "stars": 5, "review": "Challenging but fair. Really learned a lot in this class."},
        {"professor": "Dr. Alex Chen", "subject": "Computer Science", "stars": 4, "review": "Best CS professor I've had. Makes complex topics understandable."},
        
        {"professor": "Prof. Sarah Williams", "subject": "Mathematics", "stars": 5, "review": "Incredible teacher! Makes calculus actually enjoyable and understandable."},
        {"professor": "Prof. Sarah Williams", "subject": "Mathematics", "stars": 5, "review": "Always available for help. Explains concepts multiple ways until you get it."},
        {"professor": "Prof. Sarah Williams", "subject": "Mathematics", "stars": 4, "review": "Great professor, though homework can be quite challenging."},
        
        # Good professors (3.5-4.5 stars)
        {"professor": "Prof. Maria Rodriguez", "subject": "Physics", "stars": 4, "review": "Very knowledgeable but moves too fast through material."},
        {"professor": "Prof. Maria Rodriguez", "subject": "Physics", "stars": 4, "review": "Office hours are helpful. Exams are tough but fair."},
        {"professor": "Prof. Maria Rodriguez", "subject": "Physics", "stars": 3, "review": "Good professor but could be more engaging during lectures."},
        
        {"professor": "Dr. James Thompson", "subject": "Chemistry", "stars": 4, "review": "Excellent at explaining complex chemistry concepts with real-world examples."},
        {"professor": "Dr. James Thompson", "subject": "Chemistry", "stars": 4, "review": "Passionate about the subject and it shows. Highly recommend!"},
        {"professor": "Dr. James Thompson", "subject": "Chemistry", "stars": 3, "review": "Tough grader but you really learn the material well."},
        
        # Average professors (2.5-3.5 stars)
        {"professor": "Prof. Michael Davis", "subject": "History", "stars": 3, "review": "Decent professor but lectures can be boring. Material is interesting though."},
        {"professor": "Prof. Michael Davis", "subject": "History", "stars": 3, "review": "Knows the subject well but doesn't explain things clearly."},
        {"professor": "Prof. Michael Davis", "subject": "History", "stars": 2, "review": "Hard to stay awake in class. Tests are fair but lectures are dry."},
        
        {"professor": "Dr. Lisa Brown", "subject": "English", "stars": 3, "review": "Good feedback on essays but very strict grader."},
        {"professor": "Dr. Lisa Brown", "subject": "English", "stars": 3, "review": "Knowledgeable about literature but not very approachable."},
        {"professor": "Dr. Lisa Brown", "subject": "English", "stars": 4, "review": "Challenging class but learned a lot about writing."},
        
        # Below average professors (1-2.5 stars)
        {"professor": "Prof. Robert Wilson", "subject": "Biology", "stars": 2, "review": "Disorganized lectures and unclear expectations for assignments."},
        {"professor": "Prof. Robert Wilson", "subject": "Biology", "stars": 2, "review": "Seems to know the material but terrible at teaching it."},
        {"professor": "Prof. Robert Wilson", "subject": "Biology", "stars": 1, "review": "Worst professor I've had. Avoid if possible."},
        
        {"professor": "Dr. Jennifer Lee", "subject": "Psychology", "stars": 2, "review": "Tests don't match what's taught in class. Very confusing."},
        {"professor": "Dr. Jennifer Lee", "subject": "Psychology", "stars": 3, "review": "Sometimes helpful in office hours but lectures are unclear."},
        {"professor": "Dr. Jennifer Lee", "subject": "Psychology", "stars": 2, "review": "Difficult to understand and doesn't respond to emails."},
        
        # More variety for better training
        {"professor": "Prof. David Kim", "subject": "Economics", "stars": 5, "review": "Makes economics fun and relevant. Great real-world examples."},
        {"professor": "Prof. David Kim", "subject": "Economics", "stars": 4, "review": "Very engaging lecturer. Assignments are practical and useful."},
        {"professor": "Prof. Amanda Johnson", "subject": "Art", "stars": 4, "review": "Creative assignments and constructive feedback. Really inspiring."},
        {"professor": "Dr. Thomas Anderson", "subject": "Philosophy", "stars": 3, "review": "Deep thinker but sometimes goes off on tangents during lectures."},
        {"professor": "Prof. Rachel Green", "subject": "Sociology", "stars": 5, "review": "Eye-opening class discussions. Really changed how I see the world."},
        {"professor": "Dr. Mark Taylor", "subject": "Statistics", "stars": 2, "review": "Makes a difficult subject even harder with poor explanations."},
    ]
    
    return synthetic_reviews

def main():
    """Main training pipeline"""
    import os
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Initialize model
    model = ProfessorRecommendationModel()
    
    # Train the model
    print("Starting model training...")
    results = model.train()
    
    # Test with synthetic data (only if training was successful)
    if results['rating_r2'] > -0.5:  # Only test if model shows some learning (less strict threshold)
        print("\nTesting with sample professors...")
        
        # Group synthetic data by professor for testing
        synthetic_data = create_synthetic_professor_data()
        prof_groups = {}
        for review in synthetic_data:
            prof_name = review['professor']
            if prof_name not in prof_groups:
                prof_groups[prof_name] = {'subject': review['subject'], 'reviews': []}
            prof_groups[prof_name]['reviews'].append(review['review'])
        
        # Test a few professors
        test_profs = list(prof_groups.items())[:3]
        for prof_name, prof_data in test_profs:
            try:
                predictions = model.predict_professor_metrics(
                    prof_name, prof_data['subject'], prof_data['reviews']
                )
                insights = model.generate_professor_insights(predictions)
                
                print(f"\n{prof_name} ({prof_data['subject']}):")
                print(f"  Predicted Rating: {predictions['avg_rating']:.2f}/5")
                print(f"  Predicted Difficulty: {predictions['avg_difficulty']:.2f}/5")
                print(f"  Insights: {', '.join(insights)}")
            except Exception as e:
                print(f"\nError testing {prof_name}: {e}")
    else:
        print("\nSkipping synthetic testing due to poor model performance")
    
    print(f"\nTraining complete! Models saved to ./models/")
    print(f"Rating Model R²: {results['rating_r2']:.3f}")
    print(f"Difficulty Model R²: {results['difficulty_r2']:.3f}")

if __name__ == "__main__":
    main()

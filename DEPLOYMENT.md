# 🚀 Rate My Professor AI - Deployment Guide

## Quick Deploy to Vercel

### 1. Prerequisites
- GitHub account
- Vercel account (free at vercel.com)
- Your API keys ready

### 2. Deploy Steps

#### Option A: One-Click Deploy
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project" 
4. Select your GitHub repository
5. Vercel will auto-detect Next.js and deploy!

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# Follow the prompts:
# - Link to existing project? N
# - What's your project name? rate-my-professor-ai
# - In which directory is your code located? ./
# - Want to override settings? N
```

### 3. Environment Variables Setup

After deployment, add these environment variables in Vercel Dashboard:

**Required for AI Features:**
- `GEMINI_API_KEY` = `your_gemini_api_key`
- `PINECONE_API_KEY` = `your_pinecone_api_key` 
- `HUGGINGFACE_API_TOKEN` = `your_huggingface_token`

**How to add in Vercel:**
1. Go to your project dashboard
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add each variable for Production, Preview, and Development

### 4. Post-Deployment Setup

Once deployed:

1. **Create Pinecone Index:**
   - Go to pinecone.io console
   - Create index named `professors-index`
   - Set dimension to `1024`
   - Use `cosine` metric

2. **Initialize Data:**
   - Visit `your-app.vercel.app/api/reindex`
   - This will populate your vector database

3. **Train AI Model:**
   - Visit `your-app.vercel.app/train`
   - Click "Start Training"

### 5. Domain Setup (Optional)

- Go to Vercel Dashboard → Domains
- Add your custom domain
- Update DNS records as instructed

## 📁 Configuration Files Created

### `vercel.json`
```json
{
  "functions": {
    "app/api/train/route.js": {
      "maxDuration": 300
    },
    "app/api/predict/route.js": {
      "maxDuration": 60
    }
  },
  "build": {
    "env": {
      "PYTHON_VERSION": "3.9"
    }
  }
}
```

### `.vercelignore`
- Excludes ML models and Python cache files
- Keeps deployment size minimal
- Models are generated at runtime

## 🔧 Troubleshooting

### Common Issues:

1. **Python Dependencies**: 
   - Vercel automatically installs from `requirements.txt`
   - Python 3.9 runtime is configured

2. **Function Timeouts**:
   - Training: 5 minutes max
   - Predictions: 1 minute max
   - Hobby plan has 10s limit for other functions

3. **Missing Environment Variables**:
   - App runs without them but with limited features
   - Check Vercel Dashboard → Settings → Environment Variables

4. **Cold Starts**:
   - First ML prediction may be slow
   - Subsequent calls are faster

## 🎯 Features After Deployment

✅ **Full AI-Powered Chat**
✅ **Professor Recommendations** 
✅ **ML Model Training**
✅ **Vector Search**
✅ **Dark Mode**
✅ **Responsive Design**
✅ **Real-time Predictions**

## 📊 Performance Optimization

The app is optimized for Vercel:
- Static pages cached at edge
- API routes optimized for serverless
- ML models load on-demand
- Efficient vector operations

---

**Ready to deploy? Run `vercel` in your terminal!** 🚀

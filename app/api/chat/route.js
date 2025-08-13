import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from '@pinecone-database/pinecone';
import { spawn } from 'child_process';
import fetch from "node-fetch";
import reviewsData from '../../../data/reviews.json'; // Load review data

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL = "intfloat/multilingual-e5-large";
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

// Pinecone is currently not used. Avoid initializing to prevent runtime errors when env keys are missing.

async function fetchEmbeddingsWithRetry(text, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response body:", data);
        if (response.status === 503) {
          console.warn(`Model is loading, retrying (${attempt}/${retries})...`);
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Increased delay
        } else {
          throw new Error(`Failed to fetch embeddings: ${response.statusText}`);
        }
      } else {
        return data[0].embedding; // Assuming this returns the correct embedding
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
    }
  }
}

function findRelevantReviews(query) {
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(" ");

  const matchedReviews = reviewsData.reviews.filter(review => {
    const reviewText = `${review.professor} ${review.subject} ${review.review}`.toLowerCase();
    return keywords.some(keyword => reviewText.includes(keyword));
  });

  console.log("Query:", query);
  console.log("Matched Reviews:", matchedReviews);

  return matchedReviews.slice(0, 5); // Increased to 5 for better AI analysis
}

// Get AI predictions for a professor
async function getProfessorPredictions(professorName, subject, reviews) {
  return new Promise((resolve) => {
    const inputData = JSON.stringify({
      professor: professorName,
      subject: subject || 'General',
      reviews: reviews || ['No specific reviews available']
    });

    const pythonProcess = spawn('python3', ['predict_professor.py'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';

    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      pythonProcess.kill();
      resolve(null);
    }, 10000);
  });
}

// Extract professor names from query
function extractProfessorNames(query, reviews) {
  const queryLower = query.toLowerCase();
  const professorNames = new Set();
  
  // Look for professor names in the reviews
  reviews.forEach(review => {
    if (review.professor) {
      const profName = review.professor.toLowerCase();
      // Check if professor name appears in query
      if (queryLower.includes(profName) || 
          profName.split(' ').some(part => queryLower.includes(part.toLowerCase()))) {
        professorNames.add(review.professor);
      }
    }
  });
  
  return Array.from(professorNames);
}

export async function POST(req) {
  try {
    const messages = await req.json();
    const userMessage = messages[messages.length - 1];
    const userQuery = userMessage.content;

    let relevantReviews = [];

    // If Pinecone and HF are available, use vector search
    if (PINECONE_API_KEY && HUGGINGFACE_API_TOKEN) {
      try {
        const vector = await fetchEmbeddingsWithRetry(userQuery);
        const client = new Pinecone({ apiKey: PINECONE_API_KEY });
        const index = client.index('professors-index').namespace('ns1');
        const results = await index.query({ topK: 5, vector, includeMetadata: true });
        relevantReviews = (results.matches || []).map(m => ({
          professor: m.metadata?.professor || '',
          subject: m.metadata?.subject || '',
          stars: m.metadata?.stars ?? 0,
          review: m.metadata?.review || '',
        }));
      } catch (e) {
        console.warn('Vector search failed, falling back to keyword search', e);
        relevantReviews = findRelevantReviews(userQuery);
      }
    } else {
      // Fallback to keyword search from local JSON
      relevantReviews = findRelevantReviews(userQuery);
    }

    if (relevantReviews.length === 0) {
      return NextResponse.json({ content: "Sorry, I couldn't find any relevant reviews." });
    }

    // Get AI predictions for mentioned professors
    const professorNames = extractProfessorNames(userQuery, relevantReviews);
    const aiPredictions = {};
    
    for (const profName of professorNames) {
      const profReviews = relevantReviews.filter(r => r.professor === profName);
      const profSubject = profReviews[0]?.subject || 'General';
      const reviewTexts = profReviews.map(r => r.review);
      
      const prediction = await getProfessorPredictions(profName, profSubject, reviewTexts);
      if (prediction) {
        aiPredictions[profName] = prediction;
      }
    }

    // Build enhanced context with AI predictions
    let context = relevantReviews.map((review, index) => {
      return `${index + 1}. **Professor Name:** ${review.professor}\n` +
             `    - **Department:** ${review.subject}\n` +
             `    - **Rating:** ${review.stars}\n` +
             `    - **Review:** ${review.review}`;
    }).join("\n\n");

    // Add AI predictions if available
    if (Object.keys(aiPredictions).length > 0) {
      context += "\n\n**AI-Generated Insights:**\n";
      for (const [profName, prediction] of Object.entries(aiPredictions)) {
        context += `\n**${profName} - AI Analysis:**\n`;
        context += `- Predicted Rating: ${prediction.avg_rating.toFixed(1)}/5\n`;
        context += `- Predicted Difficulty: ${prediction.avg_difficulty.toFixed(1)}/5\n`;
        context += `- Confidence: ${(prediction.confidence * 100).toFixed(0)}%\n`;
        context += `- Key Insights: ${prediction.insights.join('; ')}\n`;
      }
    }

    const prompt = `You are Rate My Professor AI, an assistant that recommends professors based on real student reviews and AI-powered analysis.\n\nQuery: ${userQuery}\n\nYou have access to both student reviews and AI-generated insights (when available). Use both sources to provide comprehensive recommendations.\n\nPlease return well-formatted Markdown using the following structure:\n\n# Recommendation\n- **Top pick(s)**: Name(s) – one sentence justification combining review sentiment and AI analysis.\n\n## Analysis\n- Key strengths from reviews\n- AI insights (if available) about predicted performance\n- Any caveats or considerations\n\n## Additional Info\n- Difficulty expectations\n- Subject alternatives if relevant\n- Confidence level in recommendations\n\nUse the following data as evidence:\n${context}`;

    // Fallback when GEMINI_API_KEY is not set: return a simple formatted response
    if (!apiKey) {
      const fallback = `Based on your query: "${userQuery}", here are some relevant professors:\n\n${context}\n\n(Note: Running without GEMINI. Set GEMINI_API_KEY to enable AI-generated summaries.)`;
      return NextResponse.json({ content: fallback });
    }

    async function generateWithRetry(p, retries = 3) {
      let delayMs = 1200;
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await genAI
            .getGenerativeModel({ model: "gemini-1.5-flash" })
            .generateContent([p]);
          return response.response.text();
        } catch (err) {
          const message = String(err?.message || err);
          const isRetryable = message.includes('503') || message.toLowerCase().includes('unavailable') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('timeout');
          if (attempt === retries || !isRetryable) {
            throw err;
          }
          await new Promise(res => setTimeout(res, delayMs));
          delayMs *= 1.8;
        }
      }
    }

    try {
      const text = await generateWithRetry(prompt, 4);
      return NextResponse.json({ content: text });
    } catch (e) {
      console.warn('Gemini failed after retries, returning fallback', e);
      const fallback = `Based on your query: "${userQuery}", here are some relevant professors:\n\n${context}\n\n(Note: Temporary AI service issue. Returning results directly from reviews.)`;
      return NextResponse.json({ content: fallback });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
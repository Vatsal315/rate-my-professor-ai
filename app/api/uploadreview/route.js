import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import fetch from 'node-fetch';

export async function POST(req) {
  try {
    const reviewsFilePath = path.join(process.cwd(), 'data', 'reviews.json');

    // Read the existing reviews from the file
    const existingReviewsData = fs.existsSync(reviewsFilePath)
      ? fs.readFileSync(reviewsFilePath, 'utf8')
      : JSON.stringify({ reviews: [] });
    const existingReviews = JSON.parse(existingReviewsData).reviews;

    // Read new reviews from the request
    const rawData = await req.text();
    const newReviews = JSON.parse(rawData).reviews;

    // Append the new reviews to the existing reviews
    const updatedReviews = [...existingReviews, ...newReviews];

    // Write the combined reviews back to the file
    fs.writeFileSync(reviewsFilePath, JSON.stringify({ reviews: updatedReviews }, null, 2));

    // Optional: Upsert new reviews into Pinecone if creds exist
    const pineconeKey = process.env.PINECONE_API_KEY;
    const hfKey = process.env.HUGGINGFACE_API_TOKEN;
    if (pineconeKey && hfKey) {
      const MODEL = 'intfloat/multilingual-e5-large';

      async function embed(text) {
        const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}` ,{
          method: 'POST',
          headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: text }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(`Embedding failed: ${response.status}`);
        return data[0].embedding;
      }

      const client = new Pinecone({ apiKey: pineconeKey });
      try {
        const existing = await client.listIndexes();
        const hasIndex = existing.indexes?.some(i => i.name === 'professors-index');
        if (!hasIndex) {
          await client.createIndex({ name: 'professors-index', dimension: 1024, metric: 'cosine' });
        }
      } catch (e) {
        console.warn('Could not verify/create Pinecone index. Proceeding if it exists...', e);
      }
      const index = client.index('professors-index').namespace('ns1');

      const vectors = [];
      for (let i = 0; i < newReviews.length; i++) {
        const r = newReviews[i];
        const text = `${r.professor} ${r.subject} ${r.review}`;
        try {
          const vector = await embed(text);
          vectors.push({
            id: `rev_${Date.now()}_${i}`,
            values: vector,
            metadata: {
              professor: r.professor || '',
              subject: r.subject || '',
              stars: typeof r.stars === 'string' ? parseInt(r.stars, 10) : (r.stars || 0),
              review: r.review || '',
            },
          });
        } catch (e) {
          console.warn('Skipping vector due to embedding error', e);
        }
      }

      if (vectors.length > 0) {
        try {
          await index.upsert(vectors);
        } catch (e) {
          console.warn('Pinecone upsert failed', e);
        }
      }
    }

    return NextResponse.json({ message: "Reviews uploaded successfully." });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
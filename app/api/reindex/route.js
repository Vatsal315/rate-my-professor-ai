import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import fetch from 'node-fetch';
import reviewsData from '../../../data/reviews.json';

export async function POST() {
  try {
    const pineconeKey = process.env.PINECONE_API_KEY;
    const hfKey = process.env.HUGGINGFACE_API_TOKEN;
    if (!pineconeKey || !hfKey) {
      return NextResponse.json({ message: 'PINECONE_API_KEY and HUGGINGFACE_API_TOKEN required' }, { status: 400 });
    }

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
    // Ensure index exists; if not, try to create it with expected dimensions.
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
    for (let i = 0; i < reviewsData.reviews.length; i++) {
      const r = reviewsData.reviews[i];
      const text = `${r.professor} ${r.subject} ${r.review}`;
      try {
        const vector = await embed(text);
        vectors.push({
          id: `seed_${i}`,
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
      await index.upsert(vectors);
    }

    return NextResponse.json({ message: 'Reindex complete', upserted: vectors.length });
  } catch (error) {
    console.error('Error reindexing:', error);
    return NextResponse.json({ error: 'Failed to reindex' }, { status: 500 });
  }
}



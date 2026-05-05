// app/api/predict/route.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MODEL_URL = process.env.DRISHTI_MODEL_URL || 'https://29deepanshutyagi-drishti-api.hf.space/predict';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 8000;
const TIMEOUT_MS = 90000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(url, options, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally { clearTimeout(t); }
}

async function callModelWithRetry(file) {
  let lastError;
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetchWithTimeout(MODEL_URL, { method: 'POST', body: form }, TIMEOUT_MS);
      if (!res.ok) throw new Error(`Model API returned ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Model returned success: false');
      return data;
    } catch (err) {
      lastError = err;
      const retry = err.cause?.code === 'ECONNRESET' || err.name === 'AbortError';
      if (i < MAX_RETRIES) await sleep(retry ? RETRY_DELAY_MS : 2000);
    }
  }
  throw lastError;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const patientName = formData.get('patientName') || null;
    const patientAge = formData.get('patientAge') || null;
    const patientId = formData.get('patientId') || null;

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

    const data = await callModelWithRetry(file);
    const { prediction, remedy } = data;
    const ORDER = ['No DR', 'Mild DR', 'Moderate DR', 'Severe DR', 'Proliferative DR'];
    const probabilities = ORDER.map(k => (prediction.all_probabilities[k] ?? 0) / 100);

    const result = {
      grade: prediction.class,
      gradeName: prediction.class_name,
      confidence: prediction.confidence,
      probabilities,
      remedy,
      patientName,
      patientAge,
      patientId,
    };

    // Save to DB if user is logged in (non-blocking)
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/scans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
          body: JSON.stringify(result),
        });
      }
    } catch (e) {
      console.warn('Could not save scan to DB:', e.message);
    }

    return Response.json(result);
  } catch (err) {
    console.error('Prediction error:', err);
    const isConnReset = err.cause?.code === 'ECONNRESET' || err.message?.includes('ECONNRESET');
    return Response.json({
      error: isConnReset
        ? 'The model server is waking up. Please wait 30 seconds and try again.'
        : err.message,
    }, { status: 500 });
  }
}

export const maxDuration = 120;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { analyzeHandler } from './routes/analyze.js';
import { synthesizeHandler } from './routes/synthesize.js';
import { reviewsHandler } from './routes/reviews.js';
import { partnerSubmitHandler, partnerListHandler } from './routes/partner.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MAX_BODY_MB = Number(process.env.MAX_BODY_MB) || 8;

// CORS — allow dev origins. Comma-separated list in env, or "*".
const corsOrigin = (process.env.CORS_ORIGIN || '*').trim();
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
}));

app.use(express.json({ limit: `${MAX_BODY_MB}mb` }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    has_openai_key: Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('PUT-YOUR-KEY')),
    has_google_key: Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY.trim()),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  });
});

app.post('/api/analyze', analyzeHandler);
app.post('/api/synthesize', synthesizeHandler);
app.get('/api/reviews/:slug', reviewsHandler);
app.post('/api/partner', partnerSubmitHandler);
app.get('/api/partner/admin', partnerListHandler);

app.use((err, _req, res, _next) => {
  console.error('[server] uncaught', err);
  res.status(500).json({ error: 'internal' });
});

app.listen(PORT, () => {
  console.log(`✦ Glow Up Seoul v2 server · http://localhost:${PORT}`);
  console.log(`  /api/health  /api/analyze  /api/synthesize  /api/reviews/:slug  /api/partner  /api/partner/admin`);
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log('  ⚠  GOOGLE_PLACES_API_KEY not set — /api/reviews returns mock data.');
  }
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('PUT-YOUR-KEY')) {
    console.log('  ⚠  OPENAI_API_KEY not set — /api/analyze returns mock responses.');
  }
});

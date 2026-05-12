import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { analyzeHandler } from './routes/analyze.js';
import { synthesizeHandler } from './routes/synthesize.js';
import { reviewsHandler } from './routes/reviews.js';
import { partnerSubmitHandler, partnerListHandler } from './routes/partner.js';
import {
  categoriesHandler,
  concernsHandler,
  proceduresHandler,
  procedureDetailHandler,
  hospitalsHandler,
  hospitalDetailHandler,
  feedRecentHandler,
} from './routes/catalog.js';
import {
  requireAdmin,
  adminList, adminGet, adminCreate, adminUpdate, adminDelete,
  adminPresignUpload, adminStats,
} from './routes/admin.js';
import {
  listSubmissions, getSubmission, approveSubmission, rejectSubmission,
} from './routes/partner-admin.js';
import { createMatchRequestHandler, getMatchRequestHandler } from './routes/match.js';
import { sitemapHandler, robotsHandler } from './routes/sitemap.js';
import { checkDbHealth } from './db/health.js';
import { hasDbConfig, closeSequelize } from './db/sequelize.js';
import { hasS3Config } from './s3.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MAX_BODY_MB = Number(process.env.MAX_BODY_MB) || 8;

const corsOrigin = (process.env.CORS_ORIGIN || '*').trim();
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
}));
app.use(express.json({ limit: `${MAX_BODY_MB}mb` }));

app.get('/api/health', async (_req, res) => {
  const db = await checkDbHealth();
  res.json({
    ok: true,
    has_openai_key: Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('PUT-YOUR-KEY')),
    has_google_key: Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY.trim()),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    db,
  });
});

// AI + concierge
app.post('/api/analyze', analyzeHandler);
app.post('/api/synthesize', synthesizeHandler);
app.get('/api/reviews/:slug', reviewsHandler);
app.post('/api/partner', partnerSubmitHandler);
app.get('/api/partner/admin', partnerListHandler);

// Catalog (RDS-backed reads)
app.get('/api/catalog/categories',           categoriesHandler);
app.get('/api/catalog/concerns',             concernsHandler);
app.get('/api/catalog/procedures',           proceduresHandler);
app.get('/api/catalog/procedures/:slug',     procedureDetailHandler);
app.get('/api/catalog/hospitals',            hospitalsHandler);
app.get('/api/catalog/hospitals/:slug',      hospitalDetailHandler);
app.get('/api/feed/recent',                  feedRecentHandler);

// Match-request persistence (public, no auth — session_token is the only key)
app.post('/api/match-requests',            createMatchRequestHandler);
app.get ('/api/match-requests/:id',        getMatchRequestHandler);

// SEO
app.get('/sitemap.xml', sitemapHandler);
app.get('/robots.txt',  robotsHandler);

// Admin (X-Admin-Key gated)
app.get   ('/api/admin/stats',                                  requireAdmin, adminStats);
app.post  ('/api/admin/upload/presign',                         requireAdmin, adminPresignUpload);
// Partner submissions (must come BEFORE the generic /:kind catch-all)
app.get   ('/api/admin/partner-submissions',                    requireAdmin, listSubmissions);
app.get   ('/api/admin/partner-submissions/:file',              requireAdmin, getSubmission);
app.post  ('/api/admin/partner-submissions/:file/approve',      requireAdmin, approveSubmission);
app.post  ('/api/admin/partner-submissions/:file/reject',       requireAdmin, rejectSubmission);
// Generic CRUD
app.get   ('/api/admin/:kind',                 requireAdmin, adminList);
app.post  ('/api/admin/:kind',                 requireAdmin, adminCreate);
app.get   ('/api/admin/:kind/:id',             requireAdmin, adminGet);
app.patch ('/api/admin/:kind/:id',             requireAdmin, adminUpdate);
app.delete('/api/admin/:kind/:id',             requireAdmin, adminDelete);

app.use((err, _req, res, _next) => {
  console.error('[server] uncaught', err);
  res.status(500).json({ error: 'internal' });
});

app.listen(PORT, () => {
  console.log(`✦ Glow Up Seoul v2 server · http://localhost:${PORT}`);
  console.log('  /api/health  /api/analyze  /api/synthesize  /api/reviews/:slug');
  console.log('  /api/partner  /api/partner/admin');
  console.log('  /api/catalog/{categories,concerns,procedures,procedures/:slug,hospitals,hospitals/:slug}');
  console.log('  /api/feed/recent');
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log('  ⚠ GOOGLE_PLACES_API_KEY not set — /api/reviews returns mock data.');
  }
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('PUT-YOUR-KEY')) {
    console.log('  ⚠ OPENAI_API_KEY not set — /api/analyze returns mock responses.');
  }
  if (!hasDbConfig()) {
    console.log('  ⚠ DB_HOST / DB_PASSWORD not set — /api/catalog/* and /api/feed/recent return 503.');
  }
  if (!hasS3Config()) {
    console.log('  ⚠ S3 not configured — admin uploads disabled (set AWS_*, S3_BUCKET).');
  }
});

process.on('SIGTERM', async () => { await closeSequelize(); process.exit(0); });
process.on('SIGINT',  async () => { await closeSequelize(); process.exit(0); });

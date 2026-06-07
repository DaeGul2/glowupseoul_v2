import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { analyzeHandler } from './routes/analyze.js';
import { synthesizeHandler } from './routes/synthesize.js';
import { rateLimitAnalyzeIp } from './utils/scanTracking.js';
import { reviewsHandler } from './routes/reviews.js';
import { partnerSubmitHandler, partnerListHandler } from './routes/partner.js';
import {
  categoriesHandler,
  concernsHandler,
  proceduresHandler,
  procedureDetailHandler,
  devicesHandler,
  deviceDetailHandler,
  hospitalsHandler,
  hospitalDetailHandler,
  bootstrapHandler,
  feedRecentHandler,
} from './routes/catalog.js';
import {
  requireAdmin,
  adminList, adminGet, adminCreate, adminUpdate, adminDelete,
  adminPresignUpload, adminStats, adminScanStats,
} from './routes/admin.js';
import {
  listSubmissions, getSubmission, approveSubmission, rejectSubmission,
} from './routes/partner-admin.js';
import { createMatchRequestHandler, getMatchRequestHandler } from './routes/match.js';
import { v3List, v3Get, v3Create, v3Update, v3Delete, v3Stats, v3TagList, v3TagCreate, v3PublicCatalog, v3PublicDetail } from './routes/adminV3.js';
import { sitemapHandler, robotsHandler } from './routes/sitemap.js';
import { checkDbHealth } from './db/health.js';
import { hasDbConfig, closeSequelize } from './db/sequelize.js';
import { hasS3Config } from './s3.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MAX_BODY_MB = Number(process.env.MAX_BODY_MB) || 8;

// Behind nginx — req.ip 가 진짜 client IP 로 잡히게.
// 1 = nginx 한 단만 신뢰 (안전). 여러 hop 이면 숫자 늘리기.
app.set('trust proxy', 1);

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

// AI + concierge — analyze 는 IP 당 5분 1회 제한 (SCAN_COOLDOWN_SEC 으로 조절).
app.post('/api/analyze', rateLimitAnalyzeIp, analyzeHandler);
app.post('/api/synthesize', synthesizeHandler);
app.get('/api/reviews/:slug', reviewsHandler);
app.post('/api/partner', partnerSubmitHandler);
app.get('/api/partner/admin', partnerListHandler);

// Catalog (RDS-backed reads)
app.get('/api/catalog/bootstrap',            bootstrapHandler);
app.get('/api/catalog/categories',           categoriesHandler);
app.get('/api/catalog/concerns',             concernsHandler);
app.get('/api/catalog/procedures',           proceduresHandler);
app.get('/api/catalog/procedures/:slug',     procedureDetailHandler);
app.get('/api/catalog/devices',              devicesHandler);
app.get('/api/catalog/devices/:slug',        deviceDetailHandler);
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
app.get   ('/api/admin/scan-stats',                             requireAdmin, adminScanStats);
app.post  ('/api/admin/upload/presign',                         requireAdmin, adminPresignUpload);
// Partner submissions (must come BEFORE the generic /:kind catch-all)
app.get   ('/api/admin/partner-submissions',                    requireAdmin, listSubmissions);
app.get   ('/api/admin/partner-submissions/:file',              requireAdmin, getSubmission);
app.post  ('/api/admin/partner-submissions/:file/approve',      requireAdmin, approveSubmission);
app.post  ('/api/admin/partner-submissions/:file/reject',       requireAdmin, rejectSubmission);
// v3 admin CRUD — treatments(시술) + surgeries(수술). Separate from the legacy
// generic /api/admin/:kind catch-all below. Same X-Admin-Key gate.
// Public v3 catalog — powers the DB-driven customer chatbot + detail pages.
app.get   ('/api/v3/catalog',          v3PublicCatalog);
app.get   ('/api/v3/catalog/:kind/:slug', v3PublicDetail);
app.get   ('/api/v3/admin/_stats',     requireAdmin, v3Stats);
app.get   ('/api/v3/admin/_tags',      requireAdmin, v3TagList);
app.post  ('/api/v3/admin/_tags',      requireAdmin, v3TagCreate);
app.get   ('/api/v3/admin/:kind',      requireAdmin, v3List);
app.post  ('/api/v3/admin/:kind',      requireAdmin, v3Create);
app.get   ('/api/v3/admin/:kind/:id',  requireAdmin, v3Get);
app.patch ('/api/v3/admin/:kind/:id',  requireAdmin, v3Update);
app.delete('/api/v3/admin/:kind/:id',  requireAdmin, v3Delete);

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
  console.log('  /api/catalog/{categories,concerns,procedures,procedures/:slug,devices,devices/:slug,hospitals,hospitals/:slug}');
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

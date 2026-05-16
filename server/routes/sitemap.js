// Dynamic sitemap.xml — built from RDS so every category / treatment / clinic
// slug is automatically discoverable to search engines.
import { Procedure, Hospital, ProcedureCategory } from '../db/models.js';
import { hasDbConfig } from '../db/sequelize.js';

const ORIGIN = process.env.SITE_ORIGIN || 'https://glowupseoul.com';

const STATIC = [
  { path: '/',              priority: '1.0', changefreq: 'weekly' },
  { path: '/about',         priority: '0.8', changefreq: 'monthly' },
  { path: '/how-it-works',  priority: '0.8', changefreq: 'monthly' },
  { path: '/services',      priority: '0.8', changefreq: 'weekly' },
  { path: '/faq',           priority: '0.7', changefreq: 'monthly' },
  { path: '/partner',       priority: '0.5', changefreq: 'monthly' },
];

function urlEl(path, { priority = '0.7', changefreq = 'weekly', lastmod } = {}) {
  return [
    '  <url>',
    `    <loc>${ORIGIN}${path}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

export async function sitemapHandler(_req, res) {
  res.set('Content-Type', 'application/xml; charset=utf-8');
  // Cache 1h at edges (only matters once we have a CDN in front).
  res.set('Cache-Control', 'public, max-age=3600');

  const parts = ['<?xml version="1.0" encoding="UTF-8"?>',
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];

  for (const s of STATIC) parts.push(urlEl(s.path, s));

  if (hasDbConfig()) {
    try {
      const [cats, procs, hospitals] = await Promise.all([
        ProcedureCategory.findAll({ where: { is_active: true }, attributes: ['slug', 'updated_at'] }),
        Procedure.findAll({         where: { is_active: true, deleted_at: null }, attributes: ['slug', 'updated_at'] }),
        Hospital.findAll({          where: { is_active: true, deleted_at: null, contract_status: 'active' }, attributes: ['slug', 'updated_at'] }),
      ]);
      cats.forEach((c) => parts.push(urlEl(`/category/${encodeURIComponent(c.slug)}`,  { priority: '0.9', changefreq: 'weekly', lastmod: c.updated_at })));
      procs.forEach((p) => parts.push(urlEl(`/treatment/${encodeURIComponent(p.slug)}`, { priority: '0.85', changefreq: 'weekly', lastmod: p.updated_at })));
      hospitals.forEach((h) => parts.push(urlEl(`/clinic/${encodeURIComponent(h.slug)}`,{ priority: '0.8', changefreq: 'weekly', lastmod: h.updated_at })));
    } catch (e) {
      console.warn('[sitemap] dynamic fetch failed; serving static only', e?.message);
    }
  }

  parts.push('</urlset>');
  res.send(parts.join('\n'));
}

export function robotsHandler(_req, res) {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /results',
    '',
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    '',
  ].join('\n'));
}

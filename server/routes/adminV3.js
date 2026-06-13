// v3 admin CRUD — treatments(비수술) + surgeries(수술).
// Mounted under /api/v3/admin/* (separate from the legacy /api/admin/:kind
// catch-all). Gated by the same X-Admin-Key middleware (requireAdmin).

import { Treatment, Surgery, Tag, ConcernArea, Concern, TreatmentConcern, SurgeryConcern, Op } from '../db/modelsV3.js';
import { hasDbConfig } from '../db/sequelize.js';

const CATALOG_COLS = [
  'slug', 'name', 'summary', 'description',
  'price_krw', 'price_note', 'duration',
  'pain_level', 'recovery_level', 'recovery_note',
  'benefits', 'cautions', 'linked_note', 'thumbnail_url',
  'display_order', 'is_active',
];

// kind → spec. tags: has tag M:N. through/fk: concern-mapping join model.
// soft: has deleted_at (soft delete). areaInc: include parent area on read.
const MODELS = {
  treatments:    { M: Treatment,   label: '시술', cols: CATALOG_COLS, tags: true, through: TreatmentConcern, fk: 'treatment_id', soft: true },
  surgeries:     { M: Surgery,     label: '수술', cols: CATALOG_COLS, tags: true, through: SurgeryConcern,   fk: 'surgery_id',   soft: true },
  concern_areas: { M: ConcernArea, label: '부위', cols: ['slug', 'name', 'track', 'display_order', 'is_active'], soft: false },
  concerns:      { M: Concern,     label: '고민', cols: ['slug', 'name', 'area_id', 'display_order', 'is_active'], soft: false, areaInc: true },
};

function resolve(kind) { return MODELS[kind] || null; }

function pickWritable(cols, body) {
  const out = {};
  for (const c of cols) {
    if (!(c in body)) continue;
    let v = body[c];
    if (v === '') v = null;
    out[c] = v;
  }
  return out;
}

function includesFor(spec) {
  const inc = [];
  if (spec.tags) inc.push({ model: Tag, as: 'tags', through: { attributes: [] } });
  if (spec.through) inc.push({ model: Concern, as: 'concerns', through: { attributes: ['relevance', 'reason'] } });
  if (spec.areaInc) inc.push({ model: ConcernArea, as: 'area', attributes: ['id', 'slug', 'name', 'track'] });
  return inc;
}

// Row → JSON, normalizing the concern mapping into a flat concern_links[].
function shapeRow(spec, row) {
  const j = row.toJSON();
  if (spec.through && Array.isArray(j.concerns)) {
    const tn = spec.through.name; // 'TreatmentConcern' | 'SurgeryConcern'
    j.concern_links = j.concerns.map((c) => ({
      concern_id: c.id, name: c.name,
      relevance: c[tn]?.relevance || 'primary',
      reason: c[tn]?.reason || '',
    }));
  }
  return j;
}

async function reload(spec, id) {
  const row = await spec.M.findByPk(id, { include: includesFor(spec) });
  return row ? shapeRow(spec, row) : null;
}

function readTagIds(body) {
  if (!('tag_ids' in body)) return null;
  const raw = Array.isArray(body.tag_ids) ? body.tag_ids : [];
  return [...new Set(raw.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0))];
}

function readConcernLinks(body) {
  return ('concern_links' in body) ? (Array.isArray(body.concern_links) ? body.concern_links : []) : null;
}

// Rewrite a procedure's concern mapping (with per-pair reason + relevance).
async function setConcernLinks(spec, ownerId, links) {
  await spec.through.destroy({ where: { [spec.fk]: ownerId } });
  const seen = new Set();
  const rows = (links || [])
    .filter((l) => l && l.concern_id && !seen.has(Number(l.concern_id)) && seen.add(Number(l.concern_id)))
    .map((l) => ({
      [spec.fk]: ownerId,
      concern_id: Number(l.concern_id),
      relevance: l.relevance === 'secondary' ? 'secondary' : 'primary',
      reason: (l.reason && String(l.reason).trim()) || null,
    }));
  if (rows.length) await spec.through.bulkCreate(rows);
}

// GET /api/v3/admin/:kind  → list (newest-friendly: display_order then id)
export async function v3List(req, res) {
  const spec = resolve(req.params.kind);
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  try {
    const where = {};
    if (spec.soft) where.deleted_at = { [Op.is]: null };
    const q = (req.query.q || '').trim();
    if (q) where[Op.or] = [{ name: { [Op.like]: `%${q}%` } }, { slug: { [Op.like]: `%${q}%` } }];
    const rows = await spec.M.findAll({
      where,
      include: includesFor(spec),
      order: [['display_order', 'ASC'], ['id', 'ASC']],
      limit: Math.min(Number(req.query.limit) || 300, 500),
      subQuery: false,
    });
    res.json({ rows: rows.map((r) => shapeRow(spec, r)) });
  } catch (e) {
    res.status(500).json({ error: 'list failed', detail: e.message });
  }
}

// GET /api/v3/admin/:kind/:id
export async function v3Get(req, res) {
  const spec = resolve(req.params.kind);
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  try {
    const row = await spec.M.findByPk(req.params.id, { include: includesFor(spec) });
    if (!row || (spec.soft && row.deleted_at)) return res.status(404).json({ error: 'not found' });
    res.json({ row: shapeRow(spec, row) });
  } catch (e) {
    res.status(500).json({ error: 'get failed', detail: e.message });
  }
}

// POST /api/v3/admin/:kind
export async function v3Create(req, res) {
  const spec = resolve(req.params.kind);
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  try {
    const data = pickWritable(spec.cols, req.body || {});
    if (!data.name) return res.status(400).json({ error: 'Name is required.' });
    if (!data.slug) data.slug = await autoSlug(spec.M, data.name);
    const row = await spec.M.create(data);
    if (spec.tags) { const t = readTagIds(req.body || {}); if (t) await row.setTags(t); }
    if (spec.through) { const l = readConcernLinks(req.body || {}); if (l) await setConcernLinks(spec, row.id, l); }
    res.status(201).json({ row: await reload(spec, row.id) });
  } catch (e) {
    if (e?.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'That slug already exists.' });
    res.status(500).json({ error: 'create failed', detail: e.message });
  }
}

// PATCH /api/v3/admin/:kind/:id
export async function v3Update(req, res) {
  const spec = resolve(req.params.kind);
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  try {
    const row = await spec.M.findByPk(req.params.id);
    if (!row || (spec.soft && row.deleted_at)) return res.status(404).json({ error: 'not found' });
    await row.update(pickWritable(spec.cols, req.body || {}));
    if (spec.tags) { const t = readTagIds(req.body || {}); if (t) await row.setTags(t); }
    if (spec.through) { const l = readConcernLinks(req.body || {}); if (l) await setConcernLinks(spec, row.id, l); }
    res.json({ row: await reload(spec, row.id) });
  } catch (e) {
    if (e?.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'That slug already exists.' });
    res.status(500).json({ error: 'update failed', detail: e.message });
  }
}

// DELETE /api/v3/admin/:kind/:id  → soft delete where supported, else hard.
export async function v3Delete(req, res) {
  const spec = resolve(req.params.kind);
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  try {
    const row = await spec.M.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'not found' });
    if (spec.soft) await row.update({ deleted_at: new Date(), is_active: false });
    else await row.destroy();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'delete failed', detail: e.message });
  }
}

// GET /api/v3/admin/_stats → counts (also used to verify the admin key)
export async function v3Stats(_req, res) {
  try {
    const [treatments, surgeries, areas, concerns] = await Promise.all([
      Treatment.count({ where: { deleted_at: { [Op.is]: null } } }),
      Surgery.count({ where: { deleted_at: { [Op.is]: null } } }),
      ConcernArea.count(),
      Concern.count(),
    ]);
    res.json({ counts: { treatments, surgeries, concern_areas: areas, concerns } });
  } catch (e) {
    res.status(500).json({ error: 'stats failed', detail: e.message });
  }
}

// ---------------------------------------------------------------- Public catalog
// GET /api/v3/catalog — drives the customer chatbot (DB only, no hardcoding):
// concern areas + concerns (the questionnaire) + treatments/surgeries with their
// concern mappings (for matching). Public, read-only, active rows only.
const CONCERN_INCLUDE = [
  { model: Concern, as: 'concerns', through: { attributes: ['reason', 'relevance'] }, attributes: ['id'] },
  { model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['name'] },
];
function shapeProc(r, kind, throughName) {
  const concerns = r.concerns || [];
  return {
    kind, id: r.id, slug: r.slug, name: r.name, summary: r.summary, thumbnail_url: r.thumbnail_url,
    duration: r.duration, pain_level: r.pain_level, recovery_level: r.recovery_level,
    price_krw: r.price_krw, price_note: r.price_note,
    concern_ids: concerns.map((c) => c.id),
    // { concern_id: "why this treatment helps that concern" } — drives the chat rationale.
    concern_reasons: Object.fromEntries(
      concerns.map((c) => [c.id, (c[throughName] && c[throughName].reason) || null])
    ),
    tags: (r.tags || []).map((t) => t.name),
  };
}
export async function v3PublicCatalog(_req, res) {
  if (!hasDbConfig()) return res.status(503).json({ error: 'db not configured' });
  try {
    const live = { deleted_at: { [Op.is]: null }, is_active: true };
    const [areas, concerns, treatments, surgeries] = await Promise.all([
      ConcernArea.findAll({ where: { is_active: true }, order: [['display_order', 'ASC'], ['id', 'ASC']] }),
      Concern.findAll({ where: { is_active: true }, order: [['display_order', 'ASC'], ['id', 'ASC']] }),
      Treatment.findAll({ where: live, include: CONCERN_INCLUDE, order: [['display_order', 'ASC'], ['id', 'ASC']] }),
      Surgery.findAll({ where: live, include: CONCERN_INCLUDE, order: [['display_order', 'ASC'], ['id', 'ASC']] }),
    ]);
    res.json({
      areas: areas.map((a) => ({ id: a.id, slug: a.slug, name: a.name, track: a.track })),
      concerns: concerns.map((c) => ({ id: c.id, slug: c.slug, name: c.name, area_id: c.area_id })),
      treatments: treatments.map((t) => shapeProc(t, 'treatment', 'TreatmentConcern')),
      surgeries: surgeries.map((s) => shapeProc(s, 'surgery', 'SurgeryConcern')),
    });
  } catch (e) {
    res.status(500).json({ error: 'catalog failed', detail: e.message });
  }
}

// GET /api/v3/catalog/:kind/:slug — full procedure for the detail page.
export async function v3PublicDetail(req, res) {
  if (!hasDbConfig()) return res.status(503).json({ error: 'db not configured' });
  const spec = resolve(req.params.kind);
  if (!spec || !spec.through) return res.status(404).json({ error: 'unknown kind' });
  try {
    const row = await spec.M.findOne({
      where: { slug: req.params.slug, is_active: true, deleted_at: { [Op.is]: null } },
      include: includesFor(spec),
    });
    if (!row) return res.status(404).json({ error: 'not found' });
    const j = shapeRow(spec, row);
    res.json({
      row: {
        ...j,
        kind: req.params.kind === 'surgeries' ? 'surgery' : 'treatment',
        tags: (j.tags || []).map((t) => t.name),
        benefits: Array.isArray(j.benefits) ? j.benefits : [],
        cautions: Array.isArray(j.cautions) ? j.cautions : [],
      },
    });
  } catch (e) {
    res.status(500).json({ error: 'detail failed', detail: e.message });
  }
}

// ---------------------------------------------------------------- Tags master
// GET /api/v3/admin/_tags  → all tags (for the chip picker autocomplete)
export async function v3TagList(_req, res) {
  try {
    const rows = await Tag.findAll({ order: [['display_order', 'ASC'], ['name', 'ASC']] });
    res.json({ rows });
  } catch (e) {
    res.status(500).json({ error: 'tag list failed', detail: e.message });
  }
}

// POST /api/v3/admin/_tags  { name }  → find-or-create (no dup by name).
export async function v3TagCreate(req, res) {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Tag name is required.' });

    // Avoid duplicates: same name → return the existing tag.
    const existing = await Tag.findOne({ where: { name } });
    if (existing) return res.json({ row: existing, existed: true });

    const slug = await autoSlug(Tag, name);
    const row = await Tag.create({ slug, name });
    res.status(201).json({ row, existed: false });
  } catch (e) {
    if (e?.name === 'SequelizeUniqueConstraintError') {
      const row = await Tag.findOne({ where: { name: String(req.body?.name || '').trim() } });
      if (row) return res.json({ row, existed: true });
    }
    res.status(500).json({ error: 'tag create failed', detail: e.message });
  }
}

// Build a unique slug from a name when the operator didn't supply one.
async function autoSlug(M, base) {
  // Keep ASCII word chars + Korean syllables (codebase allows Korean slugs, §20).
  const root = String(base || 'item')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w가-힣-]/g, '')
    .slice(0, 60) || 'item';
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await M.findOne({ where: { slug } })) {
    n += 1;
    slug = `${root}_${n}`;
  }
  return slug;
}

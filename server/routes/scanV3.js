// POST /api/v3/scan — light selfie "quick look" for the v3 concierge chat.
// NOT a diagnosis. It only suggests which of OUR concern categories to start from.
//
// Hard rule (user requirement): the concern allow-list sent to the model and the
// validation of its reply are BOTH built from live DB rows (concerns table) — never
// hardcoded. Admin adds/removes a concern → the scan adapts automatically.
import OpenAI from 'openai';
import { Op } from 'sequelize';
import { Concern, ConcernArea } from '../db/modelsV3.js';
import { hasDbConfig } from '../db/sequelize.js';
import { logScan } from '../utils/scanTracking.js';

let _client = null;
function client() {
  if (_client) return _client;
  const k = process.env.OPENAI_API_KEY;
  if (!k || k.includes('PUT-YOUR-KEY')) return null;
  _client = new OpenAI({ apiKey: k });
  return _client;
}

function buildSystem(allowList) {
  return `You are Romie, a warm Seoul beauty concierge giving a LIGHT first impression from a selfie.
You are NOT a doctor. You DO NOT diagnose, grade, score, or evaluate medical conditions.
You only suggest which COSMETIC PREFERENCE CATEGORIES a client might start exploring — framed gently.

This is a legally regulated context (Korean medical law, GDPR). Write as if a regulator will read it.

Return STRICT JSON only:
{
  "concerns":   string[],  // 1-4 slugs, ONLY from the allow-list below. Most relevant first.
  "narrative":  string,    // ONE warm sentence, <= 140 chars. A gentle starting point, NOT a finding.
  "confidence": "low" | "medium" | "high"
}

ALLOW-LIST (slug — label). Use ONLY these slugs, nothing else:
${allowList}

Rules (hard):
- NEVER say "you have X" / "we detect X" / "this is a sign of X". No words: diagnose, condition, disease, symptom, abnormal, severity.
- YES tone: "a gentle starting point might be...", "you might explore...".
- If the image is dark/blurry/no clear face: concerns = [], narrative explains gently, confidence = "low".
- Output nothing outside the JSON.`;
}

// Deterministic mock (no API key) — picks a couple of in-scope concerns by snapshot length.
function mockResult(scoped, snapshotLen) {
  const seed = snapshotLen || 9999;
  const picks = scoped.filter((_, i) => ((seed + i * 7) % 3) === 0).slice(0, 3);
  const chosen = picks.length ? picks : scoped.slice(0, 2);
  return {
    concern_ids: chosen.map((c) => c.id),
    concern_slugs: chosen.map((c) => c.slug),
    narrative: 'A gentle starting point — a little texture care and a touch more glow.',
    confidence: 'medium',
    _mock: true,
  };
}

export async function v3ScanHandler(req, res) {
  const startedAt = Date.now();
  const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!hasDbConfig()) return res.status(503).json({ error: 'db not configured' });

  try {
    const { snapshot, area_ids } = req.body || {};
    if (!snapshot || typeof snapshot !== 'string' || !snapshot.startsWith('data:image/')) {
      return res.status(400).json({ error: 'snapshot (data URL) required' });
    }
    if (snapshot.length > 6_000_000) return res.status(413).json({ error: 'snapshot too large' });

    // ---- live DB enum (optionally scoped to the area(s) the patient picked) ----
    const where = { is_active: true };
    const ids = Array.isArray(area_ids) ? area_ids.map(Number).filter(Number.isInteger) : [];
    if (ids.length) where.area_id = { [Op.in]: ids };
    let scoped = await Concern.findAll({
      where,
      include: [{ model: ConcernArea, as: 'area', attributes: ['name'] }],
      order: [['display_order', 'ASC'], ['id', 'ASC']],
    });
    // If scoping returned nothing (e.g., patient skipped area), fall back to all active.
    if (!scoped.length) scoped = await Concern.findAll({ where: { is_active: true }, order: [['display_order', 'ASC'], ['id', 'ASC']] });

    const bySlug = new Map(scoped.map((c) => [c.slug, c]));
    const allowList = scoped
      .map((c) => `${c.slug} — ${c.name}${c.area?.name ? ` (${c.area.name})` : ''}`)
      .join('\n');

    const oai = client();
    if (!oai) {
      const mock = mockResult(scoped, snapshot.length);
      logScan({ eventType: 'v3scan', req, model: 'mock', usage: {}, durationMs: Date.now() - startedAt, statusCode: 200 });
      return res.json(mock);
    }

    const completion = await oai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystem(allowList) },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Take a quick look at this selfie (720p front camera) and return the JSON.' },
            { type: 'image_url', image_url: { url: snapshot, detail: 'low' } },
          ],
        },
      ],
    });

    let parsed = {};
    try { parsed = JSON.parse(completion.choices[0]?.message?.content || '{}'); } catch { parsed = {}; }

    // ---- validate reply against the SAME live DB set — drop anything off-list ----
    const slugs = Array.isArray(parsed.concerns) ? parsed.concerns : [];
    const valid = [];
    for (const s of slugs) {
      const c = bySlug.get(s);
      if (c && !valid.find((v) => v.id === c.id)) valid.push(c);
      if (valid.length >= 4) break;
    }
    const confidence = ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'low';
    const narrative = typeof parsed.narrative === 'string' ? parsed.narrative.slice(0, 200) : '';

    logScan({ eventType: 'v3scan', req, model: MODEL, usage: completion.usage || {}, durationMs: Date.now() - startedAt, statusCode: 200 });
    return res.json({
      concern_ids: valid.map((c) => c.id),
      concern_slugs: valid.map((c) => c.slug),
      narrative,
      confidence,
    });
  } catch (e) {
    console.error('[v3scan] error', e?.message || e);
    logScan({ eventType: 'v3scan', req, model: MODEL, usage: {}, durationMs: Date.now() - startedAt, statusCode: 500, error: e?.message });
    return res.status(500).json({ error: 'scan failed', detail: e?.message });
  }
}

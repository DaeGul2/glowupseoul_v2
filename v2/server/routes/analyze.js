import OpenAI from 'openai';
import { CONCERN_SLUGS, CONCERN_SET } from '../concerns.js';

let _client = null;
function client() {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('PUT-YOUR-KEY')) {
    return null;
  }
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

const SYSTEM = `You are a cosmetic concierge assistant analyzing a selfie for non-medical aesthetic concerns.
You are NOT a doctor. You do NOT diagnose medical conditions. You only categorize visible aesthetic features
that a beauty concierge would discuss (lighting/photo permitting).

Return STRICT JSON only matching this schema:
{
  "concerns":    string[]   // 2-5 slugs from the allow-list
  "narrative":   string     // one sentence, no diagnosis, soft language ("we notice", "you might explore")
  "metrics": {              // visual observations rendered as 0-100 scores. estimate liberally.
    "skin_clarity":      number,
    "tone_evenness":     number,
    "under_eye_darkness":number,
    "jawline_definition":number,
    "symmetry":          number,
    "youthful_volume":   number
  },
  "regions": [              // 2-4 highlighted regions to surface in the HUD
    { "label": "FOREHEAD"|"CHEEKS"|"UNDER_EYE"|"JAWLINE"|"NOSE"|"LIPS"|"NECK", "note": string }
  ],
  "confidence": "low"|"medium"|"high"
}

ALLOW-LIST for "concerns": ${CONCERN_SLUGS.join(', ')}.

Rules:
- Never output anything outside the JSON.
- If the image is too dark/blurry/no face: concerns = [], narrative explains gently, confidence = "low".
- Use soft, brand-appropriate language. No "you have X". Yes "we notice X".`;

const USER_TEXT = `Analyze the attached selfie and return the JSON. The image was captured from a 720p front camera.`;

function clamp01_100(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sanitize(json) {
  const out = {
    concerns: [],
    narrative: '',
    metrics: { skin_clarity: 0, tone_evenness: 0, under_eye_darkness: 0, jawline_definition: 0, symmetry: 0, youthful_volume: 0 },
    regions: [],
    confidence: 'low',
  };
  if (!json || typeof json !== 'object') return out;
  if (Array.isArray(json.concerns)) {
    out.concerns = json.concerns.filter((s) => CONCERN_SET.has(s)).slice(0, 5);
  }
  if (typeof json.narrative === 'string') out.narrative = json.narrative.slice(0, 320);
  if (json.metrics && typeof json.metrics === 'object') {
    for (const k of Object.keys(out.metrics)) {
      out.metrics[k] = clamp01_100(json.metrics[k]);
    }
  }
  if (Array.isArray(json.regions)) {
    const allowed = new Set(['FOREHEAD','CHEEKS','UNDER_EYE','JAWLINE','NOSE','LIPS','NECK']);
    out.regions = json.regions
      .filter((r) => r && allowed.has(r.label) && typeof r.note === 'string')
      .slice(0, 4)
      .map((r) => ({ label: r.label, note: r.note.slice(0, 100) }));
  }
  if (['low','medium','high'].includes(json.confidence)) out.confidence = json.confidence;
  return out;
}

// Deterministic-ish mock for dev without a real API key — derived from snapshot
// byte length so two different scans return different numbers.
function mockResponse(snapshotLen) {
  const rng = (seed, i) => ((seed * 9301 + i * 49297 + 233280) % 233280) / 233280;
  const s = snapshotLen || 12345;
  const candidate = ['pores','dark_circles','sagging','wrinkles','skin_tone','pigmentation','aging_overall','jawline','volume_loss'];
  const concerns = [];
  for (let i = 0; i < candidate.length && concerns.length < 4; i++) {
    if (rng(s, i) > 0.55) concerns.push(candidate[i]);
  }
  if (concerns.length === 0) concerns.push('pores','skin_tone');
  return {
    concerns,
    narrative: 'We notice subtle texture along the cheek and forehead, and a soft loss of contour near the jawline.',
    metrics: {
      skin_clarity:        Math.round(40 + rng(s, 10) * 40),
      tone_evenness:       Math.round(45 + rng(s, 11) * 40),
      under_eye_darkness:  Math.round(20 + rng(s, 12) * 50),
      jawline_definition:  Math.round(40 + rng(s, 13) * 40),
      symmetry:            Math.round(70 + rng(s, 14) * 25),
      youthful_volume:     Math.round(55 + rng(s, 15) * 30),
    },
    regions: [
      { label: 'UNDER_EYE', note: 'mild shadow · consider brightening + structure' },
      { label: 'JAWLINE',   note: 'soft contour · lifting candidates apply' },
      { label: 'CHEEKS',    note: 'texture variance · pore-focused care' },
    ],
    confidence: 'medium',
  };
}

export async function analyzeHandler(req, res) {
  try {
    const { snapshot } = req.body || {};
    if (!snapshot || typeof snapshot !== 'string' || !snapshot.startsWith('data:image/')) {
      return res.status(400).json({ error: 'snapshot (data URL) required' });
    }
    if (snapshot.length > 6_000_000) {
      return res.status(413).json({ error: 'snapshot too large' });
    }

    const oai = client();
    if (!oai) {
      // No real key — return mock so the UX is fully testable end-to-end.
      const mock = mockResponse(snapshot.length);
      mock._mock = true;
      return res.json(mock);
    }

    const completion = await oai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: USER_TEXT },
            { type: 'image_url', image_url: { url: snapshot, detail: 'low' } },
          ],
        },
      ],
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch {
      parsed = {};
    }
    return res.json(sanitize(parsed));
  } catch (e) {
    console.error('[analyze] error', e?.message || e);
    return res.status(500).json({ error: 'analysis failed', detail: e?.message });
  }
}

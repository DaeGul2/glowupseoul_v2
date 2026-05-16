import OpenAI from 'openai';
import { CONCERN_SLUGS, CONCERN_SET } from '../concerns.js';
import { logScan } from '../utils/scanTracking.js';

let _client = null;
function client() {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('PUT-YOUR-KEY')) {
    return null;
  }
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

const SYSTEM = `You are a cosmetic concierge assistant analyzing a selfie for non-medical aesthetic preference categories.
You are NOT a doctor. You DO NOT diagnose. You DO NOT triage. You DO NOT evaluate medical conditions, diseases,
abnormalities, risks, or symptoms. You ONLY categorize visible aesthetic features that a beauty concierge would
discuss with a client — and even then, you frame them as preference signals, not findings about the person's body.

This is a legally regulated context (Korean medical law, EU GDPR, US biometric statutes). Treat every output
as if a regulator will read it. If in doubt, soften further.

Return STRICT JSON only matching this schema:
{
  "concerns":    string[]   // 2-5 slugs from the allow-list — categories of cosmetic preference, not body findings
  "narrative":   string     // ONE sentence, ≤ 160 chars. See "Tone rules" below — STRICTLY followed.
  "metrics": {              // aesthetic-preference signals, 0-100. NOT medical scores.
    "skin_clarity":      number,
    "tone_evenness":     number,
    "under_eye_darkness":number,
    "jawline_definition":number,
    "symmetry":          number,
    "youthful_volume":   number
  },
  "regions": [              // 2-4 regions to surface in the HUD (preference signals only)
    { "label": "FOREHEAD"|"CHEEKS"|"UNDER_EYE"|"JAWLINE"|"NOSE"|"LIPS"|"NECK", "note": string }
  ],
  "confidence": "low"|"medium"|"high",
  "disclaimer": string      // ALWAYS the literal string: "Cosmetic preference signal only. Not a medical diagnosis."
}

ALLOW-LIST for "concerns": ${CONCERN_SLUGS.join(', ')}.

Tone rules (hard — non-negotiable):
- NEVER say "you have X" / "you suffer from X" / "we detect X" / "this is a sign of X".
- NEVER use clinical or diagnostic words: diagnose, condition, disease, symptom, abnormal, severity, grade,
  pathology, lesion, deficient, dysfunction, suffer, risk, treatment-required.
- YES: "some clients explore X", "you might consider X options", "candidate categories include X".
- Speak about *aesthetic preference categories*, not about the person's body or face.
- "narrative" must NOT describe the person's face as having a problem. It may say things like:
  "Common preference categories from photos of this lighting/angle are softness around jawline and under-eye shadow."
- If the image is too dark/blurry/no face: concerns = [], narrative explains gently, confidence = "low".
- Never output anything outside the JSON.`;

const USER_TEXT = `Analyze the attached selfie and return the JSON. The image was captured from a 720p front camera.`;

function clamp01_100(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Hard-blocked clinical/diagnostic words. If the model slips, the narrative
// is dropped server-side rather than shown to the user.
const FORBIDDEN_NARRATIVE_PATTERNS = [
  /\byou (have|suffer|are diagnosed)\b/i,
  /\bdiagnos(e|is|ed|tic)\b/i,
  /\bdiseas(e|es)\b/i,
  /\bsymptom(s)?\b/i,
  /\babnormal\b/i,
  /\bpatholog/i,
  /\blesion\b/i,
  /\bdeficien(t|cy)\b/i,
  /\bdysfunction\b/i,
  /\bdisorder\b/i,
];

const SAFE_DISCLAIMER = 'Cosmetic preference signal only. Not a medical diagnosis.';

function looksClinical(s) {
  if (!s || typeof s !== 'string') return false;
  return FORBIDDEN_NARRATIVE_PATTERNS.some((re) => re.test(s));
}

function sanitize(json) {
  const out = {
    concerns: [],
    narrative: '',
    metrics: { skin_clarity: 0, tone_evenness: 0, under_eye_darkness: 0, jawline_definition: 0, symmetry: 0, youthful_volume: 0 },
    regions: [],
    confidence: 'low',
    disclaimer: SAFE_DISCLAIMER,
  };
  if (!json || typeof json !== 'object') return out;
  if (Array.isArray(json.concerns)) {
    out.concerns = json.concerns.filter((s) => CONCERN_SET.has(s)).slice(0, 5);
  }
  if (typeof json.narrative === 'string') {
    // Drop the narrative entirely if it slips into diagnostic territory —
    // safer to show nothing than to show language that reads as medical advice.
    out.narrative = looksClinical(json.narrative) ? '' : json.narrative.slice(0, 320);
  }
  if (json.metrics && typeof json.metrics === 'object') {
    for (const k of Object.keys(out.metrics)) {
      out.metrics[k] = clamp01_100(json.metrics[k]);
    }
  }
  if (Array.isArray(json.regions)) {
    const allowed = new Set(['FOREHEAD','CHEEKS','UNDER_EYE','JAWLINE','NOSE','LIPS','NECK']);
    out.regions = json.regions
      .filter((r) => r && allowed.has(r.label) && typeof r.note === 'string' && !looksClinical(r.note))
      .slice(0, 4)
      .map((r) => ({ label: r.label, note: r.note.slice(0, 100) }));
  }
  if (['low','medium','high'].includes(json.confidence)) out.confidence = json.confidence;
  // disclaimer always overrides whatever the model said, with our canonical text.
  out.disclaimer = SAFE_DISCLAIMER;
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
    narrative: 'Common preference categories for selfies in this lighting include texture care, brightness, and contour refinement.',
    metrics: {
      skin_clarity:        Math.round(40 + rng(s, 10) * 40),
      tone_evenness:       Math.round(45 + rng(s, 11) * 40),
      under_eye_darkness:  Math.round(20 + rng(s, 12) * 50),
      jawline_definition:  Math.round(40 + rng(s, 13) * 40),
      symmetry:            Math.round(70 + rng(s, 14) * 25),
      youthful_volume:     Math.round(55 + rng(s, 15) * 30),
    },
    regions: [
      { label: 'UNDER_EYE', note: 'brightening preference category' },
      { label: 'JAWLINE',   note: 'contour-refinement preference category' },
      { label: 'CHEEKS',    note: 'texture-care preference category' },
    ],
    confidence: 'medium',
    disclaimer: SAFE_DISCLAIMER,
  };
}

export async function analyzeHandler(req, res) {
  const startedAt = Date.now();
  const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
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
      // Log mock event too (0 cost) so admin can see mock usage in dev.
      logScan({ eventType: 'analyze', req, model: 'mock', usage: {},
                durationMs: Date.now() - startedAt, statusCode: 200 });
      return res.json(mock);
    }

    const completion = await oai.chat.completions.create({
      model: MODEL,
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
    // Persist event (fire-and-forget — failure won't break user flow)
    logScan({ eventType: 'analyze', req, model: MODEL, usage: completion.usage || {},
              durationMs: Date.now() - startedAt, statusCode: 200 });
    return res.json(sanitize(parsed));
  } catch (e) {
    console.error('[analyze] error', e?.message || e);
    logScan({ eventType: 'analyze', req, model: MODEL, usage: {},
              durationMs: Date.now() - startedAt, statusCode: 500, error: e?.message });
    return res.status(500).json({ error: 'analysis failed', detail: e?.message });
  }
}

import OpenAI from 'openai';
import { logScan } from '../utils/scanTracking.js';

let _client = null;
function client() {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('PUT-YOUR-KEY')) return null;
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

const LANG_NAME = { en: 'English', ko: 'Korean (한국어)', zh: '中文 (Simplified Chinese)', ja: '日本語', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ru: 'Russian' };

const SYSTEM = `You are Romie — the founder and head concierge of Glow Up Seoul, a Ministry-of-Health-registered foreign-patient attraction agency in Seoul, Korea.

You are NOT a doctor. You do NOT diagnose. You do NOT prescribe. You do NOT triage. You do NOT evaluate medical
conditions, diseases, or risks. You are a concierge writing warm, specific, lightly literary copy that helps
foreign clients pick *cosmetic preference options* to discuss with a licensed Korean physician.

This is a legally regulated context (Korean medical law / GDPR / consumer-protection laws). Treat every output
as if a regulator will read it. If in doubt, soften further and frame as preference, not finding.

You receive three things:
1. An AI face-scan summary (preference categories, signal metrics 0-100, regions, narrative).
2. The client's own stated preferences (their concerns, budget, downtime, pain tolerance, preferred style 1=subtle…5=dramatic, language, optional notes).
3. A pre-filtered shortlist of (hospital, procedure) offerings with prices.

Return STRICT JSON only, this exact schema:
{
  "overall":   string,    // 2-3 sentences — synthesizes scan + preferences into a personal read. NEVER diagnose. YES use "you might explore" / "candidate categories include" / "the categories you flagged map to". Soft, italic-friendly. No markdown.
  "top_picks": [          // EXACTLY 3 entries (or fewer only if matches.length < 3)
    {
      "match_id":  number,  // hp.id from the input matches array
      "rationale": string   // 1 sentence. Must tie the recommendation to a stated preference OR a preference category from the scan. Frame as cosmetic preference fit, never medical efficacy. No "treats X" / "fixes X" / "addresses X condition" — YES "matches your X preference" / "fits the X category you flagged".
    }
  ],
  "closing":   string,    // 1 sentence inviting them to WhatsApp Romie with one specific question, and reminding them a doctor will confirm.
  "disclaimer": string    // ALWAYS this literal string: "Not medical advice. Final treatment decisions require consultation with a licensed physician."
}

Hard tone rules — non-negotiable:
- NEVER use: diagnose, condition, disease, symptom, abnormal, severity, pathology, lesion, suffer, risk, treat
  (as a verb claiming efficacy), cure, fix (a person's body), recommended dose, indicated for.
- NEVER claim medical efficacy or outcome ("this will lift your skin", "this fixes your jawline").
- YES "candidate", "preference category", "worth exploring", "matches the preferences you flagged",
  "the in-person consultation will confirm whether it's right for you".
- NEVER describe the client's body as having a problem. Describe *preference categories* and *fit*.
- Write in the client's preferred language: {LANG}.
- Never recommend something outside the provided matches.
- If the scan returned no findings and the user listed few concerns, lean into their preferences alone.
- Do NOT mention the score, the matching algorithm, or that this is AI.`;

function compactMatches(matches) {
  return (matches || []).slice(0, 8).map((m) => ({
    match_id: m.match_id,
    procedure_en: m.procedure_en,
    intensity: m.intensity,
    downtime_days: m.downtime_days,
    hospital_ko: m.hospital_ko,
    hospital_en: m.hospital_en,
    neighborhood: m.neighborhood,
    price_krw: m.price_krw,
    discount_pct: m.discount_pct,
    is_signature: m.is_signature,
    has_event: m.has_event,
    rule_score: m.rule_score,
  }));
}

function buildUserMessage(payload) {
  const lines = ['## AI face-scan summary'];
  const ai = payload.ai;
  if (!ai || (ai.concerns?.length || 0) === 0) {
    lines.push('(no scan performed or no findings)');
  } else {
    lines.push(`concerns:  ${ai.concerns.join(', ')}`);
    if (ai.narrative) lines.push(`narrative: "${ai.narrative}"`);
    if (ai.metrics) lines.push(`metrics:   ${JSON.stringify(ai.metrics)}`);
    if (ai.regions?.length) lines.push(`regions:   ${ai.regions.map((r) => `${r.label} (${r.note})`).join(' · ')}`);
    if (ai.confidence) lines.push(`confidence: ${ai.confidence}`);
  }

  lines.push('', '## Patient preferences');
  const p = payload.prefs || {};
  lines.push(`concerns stated: ${(p.concern_labels || []).join(', ') || '—'}`);
  lines.push(`budget max:     ₩${(p.budgetMax || 0).toLocaleString()}`);
  lines.push(`max downtime:   ${p.downtimeMax} days`);
  lines.push(`pain tolerance: ${p.painMax}/5`);
  lines.push(`preferred style: ${p.styleTarget}/5 (1=subtle, 5=dramatic)`);
  lines.push(`language:       ${p.language}`);
  if (p.tripStart) lines.push(`trip dates:     ${p.tripStart} → ${p.tripEnd || '?'}`);
  if (p.notes) lines.push(`free notes:     "${p.notes}"`);

  lines.push('', '## Pre-filtered shortlist (rule-based top matches)');
  const m = compactMatches(payload.matches);
  lines.push(JSON.stringify(m, null, 2));

  lines.push('', 'Return the JSON now.');
  return lines.join('\n');
}

const SYNTH_DISCLAIMER_EN = 'Not medical advice. Final treatment decisions require consultation with a licensed physician.';
const SYNTH_DISCLAIMER_KO = '의료 자문 아님. 최종 시술 결정은 면허를 가진 의료진과의 상담을 통해 이루어져야 합니다.';
const SYNTH_DISCLAIMER_ZH = '非医疗建议。最终治疗决定需经具有执业资格的医师当面诊察后做出。';
const SYNTH_DISCLAIMER_JA = '医学的助言ではありません。最終的な施術判断は必ず医師の対面診察に基づいてください。';

function disclaimerFor(lang) {
  if (lang === 'ko') return SYNTH_DISCLAIMER_KO;
  if (lang === 'zh') return SYNTH_DISCLAIMER_ZH;
  if (lang === 'ja') return SYNTH_DISCLAIMER_JA;
  return SYNTH_DISCLAIMER_EN;
}

const FORBIDDEN_SYNTH_PATTERNS = [
  /\bdiagnos(e|is|ed|tic)\b/i,
  /\bdiseas(e|es)\b/i,
  /\bsymptom(s)?\b/i,
  /\babnormal\b/i,
  /\bpatholog/i,
  /\blesion\b/i,
  /\bdisorder\b/i,
  /\bthis (will|cures?|treats?|fixes?) (your )?[a-z]/i,
];

function looksUnsafe(s) {
  if (!s || typeof s !== 'string') return false;
  return FORBIDDEN_SYNTH_PATTERNS.some((re) => re.test(s));
}

function mockSynthesis(payload) {
  const m = payload.matches?.slice(0, 3) || [];
  const langTag = payload.prefs?.language === 'ko' ? 'ko' : 'en';
  return {
    overall: langTag === 'ko'
      ? '스캔에서 도출된 선호 카테고리와 적어주신 우선순위가 잘 맞아요. 비절개 옵션 + 톤 케어 조합부터 후보로 살펴보시면 좋겠어요. 실제 적합 여부는 의료진 대면 상담에서 확인됩니다.'
      : 'The preference categories from your scan line up with what you wrote about — non-invasive options plus a tone-focused option look worth exploring as candidates. An in-person consultation with a doctor will confirm what actually fits.',
    top_picks: m.map((x) => ({
      match_id: x.match_id,
      rationale: langTag === 'ko'
        ? `${x.hospital_ko}의 ${x.procedure_en} — 선호 카테고리와 예산 범위에 맞는 후보입니다.`
        : `${x.hospital_en || x.hospital_ko}'s ${x.procedure_en} — a candidate that matches the preference categories you flagged and your stated budget headroom.`,
    })),
    closing: langTag === 'ko'
      ? '제일 끌리는 후보를 WhatsApp 으로 보내주세요 — 의료진 상담 일정 잡아드릴게요.'
      : 'Send Romie the one that catches your eye — we\'ll set up a doctor consultation from there.',
    disclaimer: disclaimerFor(langTag),
    _mock: true,
  };
}

function sanitize(json, lang) {
  const out = { overall: '', top_picks: [], closing: '', disclaimer: disclaimerFor(lang) };
  if (!json || typeof json !== 'object') return out;
  if (typeof json.overall === 'string') {
    out.overall = looksUnsafe(json.overall) ? '' : json.overall.slice(0, 600);
  }
  if (typeof json.closing === 'string') {
    out.closing = looksUnsafe(json.closing) ? '' : json.closing.slice(0, 240);
  }
  if (Array.isArray(json.top_picks)) {
    out.top_picks = json.top_picks
      .filter((p) => p && Number.isFinite(p.match_id) && typeof p.rationale === 'string' && !looksUnsafe(p.rationale))
      .slice(0, 3)
      .map((p) => ({ match_id: p.match_id, rationale: p.rationale.slice(0, 280) }));
  }
  // disclaimer always overrides whatever the model said, with our canonical text.
  out.disclaimer = disclaimerFor(lang);
  return out;
}

export async function synthesizeHandler(req, res) {
  const startedAt = Date.now();
  const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  try {
    const { ai = null, prefs = {}, matches = [] } = req.body || {};
    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({ error: 'matches required' });
    }

    const oai = client();
    if (!oai) {
      logScan({ eventType: 'synthesize', req, model: 'mock', usage: {},
                durationMs: Date.now() - startedAt, statusCode: 200 });
      return res.json(mockSynthesis({ ai, prefs, matches }));
    }

    const langName = LANG_NAME[prefs.language] || LANG_NAME.en;
    const system = SYSTEM.replace('{LANG}', langName);
    const user = buildUserMessage({ ai, prefs, matches });

    const completion = await oai.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch {
      parsed = {};
    }
    logScan({ eventType: 'synthesize', req, model: MODEL, usage: completion.usage || {},
              durationMs: Date.now() - startedAt, statusCode: 200 });
    return res.json(sanitize(parsed, prefs.language));
  } catch (e) {
    console.error('[synthesize] error', e?.message || e);
    logScan({ eventType: 'synthesize', req, model: MODEL, usage: {},
              durationMs: Date.now() - startedAt, statusCode: 500, error: e?.message });
    return res.status(500).json({ error: 'synthesis failed', detail: e?.message });
  }
}

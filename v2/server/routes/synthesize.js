import OpenAI from 'openai';

let _client = null;
function client() {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('PUT-YOUR-KEY')) return null;
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

const LANG_NAME = { en: 'English', ko: 'Korean (한국어)', zh: '中文 (Simplified Chinese)', ja: '日本語', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ru: 'Russian' };

const SYSTEM = `You are Romie — the founder and head concierge of Glow Up Seoul, a Ministry-of-Health-registered medical beauty concierge in Seoul, Korea.

You are NOT a doctor. You do NOT diagnose. You write warm, specific, lightly literary copy — never clinical, never selling.

You receive three things:
1. An AI face-scan summary (concerns, metrics 0-100, regions, narrative).
2. The patient's own stated preferences (their concerns, budget, downtime, pain tolerance, preferred style 1=subtle…5=dramatic, language, optional notes).
3. A pre-filtered shortlist of (hospital, procedure) offerings with prices.

Return STRICT JSON only, this exact schema:
{
  "overall":   string,    // 2-3 sentence "총평" — synthesizes scan + preferences into a personal read. Open with what we noticed, end with what's worth exploring. Soft, italic-friendly. NEVER 'you have', YES 'we notice / you might explore'.
  "top_picks": [          // EXACTLY 3 entries (or fewer only if matches.length < 3)
    {
      "match_id":  number,  // hp.id from the input matches array
      "rationale": string   // 1 sentence. Must explicitly tie the recommendation to either a scan finding OR a stated preference. Cite the actual signal ("given your budget headroom" / "your scan flagged jawline softening" etc.). No generic phrases.
    }
  ],
  "closing":   string     // 1 sentence inviting them to WhatsApp Romie with one specific question to start
}

Style rules:
- Write in the patient's preferred language: {LANG}.
- Tone: warm concierge, never salesperson. Brand voice mirrors "Your Skin. Your *Story.* Seoul." — soft italic flourishes allowed but no markdown.
- Never recommend something outside the provided matches.
- Never claim medical efficacy; use language like "candidates", "worth exploring".
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

function mockSynthesis(payload) {
  const m = payload.matches?.slice(0, 3) || [];
  const langTag = payload.prefs?.language === 'ko' ? 'ko' : 'en';
  return {
    overall: langTag === 'ko'
      ? '스캔에서는 광대·턱선의 부드러운 처짐과 눈밑 음영이 보이고, 적어주신 우선순위와도 잘 맞아요. 비절개 리프팅 + 톤 케어 조합부터 살펴보면 적당할 것 같아요.'
      : 'Your scan reads as a soft contour along the jaw with mild under-eye shadowing — which lines up with what you wrote about. We\'d start with non-invasive lifting plus a tone-focused care, and decide depth from there.',
    top_picks: m.map((x) => ({
      match_id: x.match_id,
      rationale: langTag === 'ko'
        ? `${x.hospital_ko}의 ${x.procedure_en} — 스캔에서 잡힌 부위와 예산 범위 모두 맞아요.`
        : `${x.hospital_en || x.hospital_ko}'s ${x.procedure_en} — fits both the region your scan flagged and your stated budget headroom.`,
    })),
    closing: langTag === 'ko'
      ? '제일 끌리는 한 가지 골라서 WhatsApp 으로 보내주세요. 거기서부터 일정 잡아드릴게요.'
      : 'Send Romie the one that catches your eye — we\'ll plan dates from there.',
    _mock: true,
  };
}

function sanitize(json) {
  const out = { overall: '', top_picks: [], closing: '' };
  if (!json || typeof json !== 'object') return out;
  if (typeof json.overall === 'string') out.overall = json.overall.slice(0, 600);
  if (typeof json.closing === 'string') out.closing = json.closing.slice(0, 240);
  if (Array.isArray(json.top_picks)) {
    out.top_picks = json.top_picks
      .filter((p) => p && Number.isFinite(p.match_id) && typeof p.rationale === 'string')
      .slice(0, 3)
      .map((p) => ({ match_id: p.match_id, rationale: p.rationale.slice(0, 280) }));
  }
  return out;
}

export async function synthesizeHandler(req, res) {
  try {
    const { ai = null, prefs = {}, matches = [] } = req.body || {};
    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({ error: 'matches required' });
    }

    const oai = client();
    if (!oai) {
      return res.json(mockSynthesis({ ai, prefs, matches }));
    }

    const langName = LANG_NAME[prefs.language] || LANG_NAME.en;
    const system = SYSTEM.replace('{LANG}', langName);
    const user = buildUserMessage({ ai, prefs, matches });

    const completion = await oai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
    return res.json(sanitize(parsed));
  } catch (e) {
    console.error('[synthesize] error', e?.message || e);
    return res.status(500).json({ error: 'synthesis failed', detail: e?.message });
  }
}

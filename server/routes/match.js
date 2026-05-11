import { Router } from 'express';
import OpenAI from 'openai';
import { getAllTreatments } from '../data/clinics.js';

const router = Router();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// 1. 하드 필터: 예산/다운타임/통증 한계 안 맞는 시술 컷
function prefilter(treatments, prefs) {
  const { budgetMax, downtimeMax, painMax } = prefs;
  return treatments.filter(t => {
    if (budgetMax && t.eventPrice > budgetMax) return false;
    if (downtimeMax != null && t.downtimeDays > downtimeMax) return false;
    if (painMax != null && t.painLevel > painMax) return false;
    return true;
  });
}

// 2. 폴백 룰베이스 스코어 — API 키 없을 때
function ruleScore(treatment, prefs) {
  let score = 0;
  const concerns = (prefs.concerns || []).map(c => c.toLowerCase());
  const matchedConcerns = treatment.concerns.filter(tc =>
    concerns.some(uc => tc.includes(uc) || uc.includes(tc))
  );
  score += matchedConcerns.length * 30;

  if (prefs.styleTarget != null) {
    const styleDiff = Math.abs(treatment.style - prefs.styleTarget);
    score += (4 - styleDiff) * 10;
  }

  if (prefs.budgetMax) {
    const headroom = (prefs.budgetMax - treatment.eventPrice) / prefs.budgetMax;
    score += headroom * 20;
  }

  const discount = (treatment.originalPrice - treatment.eventPrice) / treatment.originalPrice;
  score += discount * 15;
  score += (treatment.clinicRating - 4) * 10;

  return Math.round(score);
}

router.post('/', async (req, res) => {
  try {
    const prefs = req.body || {};
    // prefs: { concerns: string[], budgetMax: number, downtimeMax: number,
    //         painMax: number, styleTarget: number(1-5), notes: string }

    const all = getAllTreatments();
    const candidates = prefilter(all, prefs);

    if (candidates.length === 0) {
      return res.json({
        matches: [],
        message: '입력하신 조건에 맞는 시술이 없습니다. 예산이나 다운타임 범위를 조정해보세요.'
      });
    }

    // GPT 매칭
    if (openai) {
      const sysPrompt = `당신은 한국 강남권 뷰티 시술 큐레이터입니다.
사용자의 고민, 예산, 다운타임, 통증 허용도, 선호 스타일(자연 1 ~ 드라마틱 5)을 고려해
주어진 시술 후보 중 가장 적합한 상위 5개를 골라 JSON으로 반환하세요.
- 각 시술마다 "왜 이 사용자에게 맞는지" 1-2문장 한국어 이유 작성
- 가격 대비 가치, 스타일 매칭, 고민 해결력을 종합 판단
- 정확한 JSON 형식 준수: {"matches":[{"treatmentId":"...","score":85,"reason":"..."}]}`;

      const userPrompt = `사용자 프로필:
- 고민: ${(prefs.concerns || []).join(', ') || '미지정'}
- 예산 한도: ${prefs.budgetMax ? prefs.budgetMax.toLocaleString() + '원' : '제한 없음'}
- 다운타임 허용: ${prefs.downtimeMax != null ? prefs.downtimeMax + '일' : '제한 없음'}
- 통증 허용도(1-5): ${prefs.painMax != null ? prefs.painMax : '제한 없음'}
- 선호 스타일(1=자연, 5=드라마틱): ${prefs.styleTarget ?? '미지정'}
- 추가 메모: ${prefs.notes || '없음'}

후보 시술 (${candidates.length}개):
${JSON.stringify(
  candidates.map(t => ({
    treatmentId: t.id,
    name: t.name,
    clinic: t.clinicName,
    area: t.clinicArea,
    rating: t.clinicRating,
    concerns: t.concerns,
    originalPrice: t.originalPrice,
    eventPrice: t.eventPrice,
    downtimeDays: t.downtimeDays,
    painLevel: t.painLevel,
    style: t.style,
    description: t.description
  })),
  null,
  2
)}`;

      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      const ranked = (parsed.matches || [])
        .map(m => {
          const t = candidates.find(c => c.id === m.treatmentId);
          if (!t) return null;
          return {
            ...t,
            score: m.score,
            reason: m.reason,
            discount: Math.round(((t.originalPrice - t.eventPrice) / t.originalPrice) * 100)
          };
        })
        .filter(Boolean);

      return res.json({ matches: ranked, source: 'gpt' });
    }

    // 폴백 룰베이스
    const ranked = candidates
      .map(t => ({
        ...t,
        score: ruleScore(t, prefs),
        reason: `매칭 점수 기반 추천 (고민 ${t.concerns.join('/')} / 스타일 ${t.style}/5)`,
        discount: Math.round(((t.originalPrice - t.eventPrice) / t.originalPrice) * 100)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json({ matches: ranked, source: 'rule-based' });
  } catch (err) {
    console.error('match error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

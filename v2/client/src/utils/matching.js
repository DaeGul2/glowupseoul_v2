// Rule-based matcher against hospital_procedures (no server / no LLM).
//
// Steps:
//  1. HARD filters:
//       - contract_status === 'active'
//       - price within budget (if disclosed)
//       - downtime <= max
//       - pain <= max
//       - PROCEDURE MUST MATCH AT LEAST ONE OF USER'S CONCERNS  ← critical
//         (otherwise we end up recommending shoulder filler when user asked about pores)
//  2. Score surviving offerings:
//       - concern hit: primary 50 / secondary 28 / adjunct 12  (concern is the *primary* signal)
//       - style fit (4 - |styleTarget - intensityRank|) × 6     (smaller weight — secondary)
//       - budget headroom × 12                                  (smaller weight)
//       - discount % × 25                                       (was ×80 — way too dominant)
//       - signature × 10
//       - language coverage × 8
//       - intl coordinator / airport pickup × 3 each            (tiny)
//  3. Dedupe: best offering per procedure (variety, not 7 HIFU rows)
//
// Tunable so the *concern axis* always dominates ranking.

import db from '../data/db.js';

const INTENSITY_RANK = { subtle: 1, moderate: 3, dramatic: 5 };

function safeRank(intensity) {
  return INTENSITY_RANK[intensity] ?? 3;
}

export function matchOfferings(prefs) {
  const { concernIds = [], budgetMax, downtimeMax, painMax, styleTarget = 3, language = 'en' } = prefs;
  const concernIdSet = new Set(concernIds);

  // Pre-compute procedure scores from concerns (concern × procedure relevance)
  // Higher weights make the concern axis dominate ranking — fixes "shoulder filler for pores" bug.
  const procedureConcernScore = new Map();
  for (const cp of db.concernProcedures) {
    if (!concernIdSet.has(cp.concern_id)) continue;
    const w = cp.relevance === 'primary' ? 50 : cp.relevance === 'secondary' ? 28 : 12;
    procedureConcernScore.set(cp.procedure_id, (procedureConcernScore.get(cp.procedure_id) || 0) + w);
  }

  const scored = [];
  for (const hp of db.hospitalProcedures) {
    if (!hp.offered) continue;
    const procedure = db.procedureById[hp.procedure_id];
    const hospital = db.hospitalById[hp.hospital_id];
    if (!procedure || !hospital) continue;

    // Skip non-active contracts (don't recommend clinics we can't book through)
    if (hospital.contract_status !== 'active') continue;

    // ---- HARD FILTERS ----
    if (hp.price_disclosed && hp.starting_price_krw != null && budgetMax != null && hp.starting_price_krw > budgetMax) continue;
    if (downtimeMax != null && procedure.downtime_days != null && procedure.downtime_days > downtimeMax) continue;
    if (painMax != null && procedure.pain_level != null && procedure.pain_level > painMax) continue;

    // CRITICAL HARD FILTER: must match at least one of the user's concerns.
    // Without this, discount-heavy unrelated procedures can outscore relevant ones.
    const concernScore = procedureConcernScore.get(procedure.id) || 0;
    if (concernScore === 0) continue;

    // ---- SCORE (concern is the dominant axis) ----
    let score = concernScore;
    const reasons = [];

    // Tag concern match strength
    if (concernScore >= 50)      reasons.push('primary match for your concern');
    else if (concernScore >= 28) reasons.push('secondary match for your concern');
    else                         reasons.push('adjacent treatment for your concern');

    const styleDiff = Math.abs(styleTarget - safeRank(procedure.intensity));
    const styleScore = Math.max(0, 4 - styleDiff) * 6;
    score += styleScore;
    if (styleDiff <= 1) reasons.push('matches your preferred style');

    if (hp.price_disclosed && hp.starting_price_krw && budgetMax) {
      const headroom = Math.max(0, (budgetMax - hp.starting_price_krw) / budgetMax);
      score += headroom * 12;
      if (headroom > 0.3) reasons.push('comfortably within your budget');
    }

    if (hp.original_price_krw && hp.starting_price_krw) {
      const pct = Math.max(0, 1 - hp.starting_price_krw / hp.original_price_krw);
      score += pct * 25; // was ×80 — too dominant
      if (pct >= 0.2) reasons.push(`${Math.round(pct * 100)}% below typical pricing`);
    }

    if (hp.is_signature) {
      score += 10;
      reasons.push('clinic signature procedure');
    }
    if (hp.has_active_event) {
      score += 6;
      reasons.push('active promotion');
    }

    if (hospital.languages_supported?.includes(language)) {
      score += 8;
      reasons.push(`speaks ${language.toUpperCase()}`);
    }

    if (hospital.english_doctor && language === 'en') score += 3;
    if (hospital.airport_pickup) score += 3;
    if (hospital.has_intl_coordinator) score += 3;

    scored.push({
      offering: { hp, procedure, hospital, brand: db.brandById[hospital.brand_id], discount_pct: hp.original_price_krw && hp.starting_price_krw ? Math.round((1 - hp.starting_price_krw / hp.original_price_krw) * 100) : 0 },
      score: Math.round(score),
      reasons: [...new Set(reasons)],
      concernScore,
    });
  }

  // Dedupe — best offering per procedure (so user sees treatment variety, not 7 HIFU rows)
  const bestByProcedure = new Map();
  for (const row of scored) {
    const pid = row.offering.procedure.id;
    const existing = bestByProcedure.get(pid);
    if (!existing || row.score > existing.score) bestByProcedure.set(pid, row);
  }

  const ranked = [...bestByProcedure.values()].sort((a, b) => b.score - a.score);
  return ranked.slice(0, 8);
}

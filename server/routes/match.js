// Persist scan/match flow + optional public-feed entry.
// Anonymous OK — no auth required. session_token (client-generated) is the
// only handle a client needs to retrieve its own result later.
import {
  MatchRequest, PublicFeedEntry, Procedure, Concern, Hospital,
} from '../db/models.js';
import { hasDbConfig } from '../db/sequelize.js';

function send(res, status, body) {
  return res.status(status).json(body);
}

function safeArr(v) { return Array.isArray(v) ? v : []; }
function cap(s, n) { return typeof s === 'string' ? s.slice(0, n) : s; }
function num(v) { return Number.isFinite(+v) ? +v : null; }

// POST /api/match-requests
// body = { session_token, prefs, ai_scan, synth, top_match, feed_consent }
//   prefs:    { concern_slugs[], budget_tier, budget_max_krw, pain_max, intensity_pref, downtime_max, language, notes, trip_start, trip_end }
//   ai_scan:  { narrative, confidence, concerns[], metrics, regions }     (optional)
//   synth:    { overall, rationale, closing, top_picks[] }                (optional)
//   top_match: { procedure_slug, hospital_slug, brand_name, price_krw, ... }
//   feed_consent: boolean
export async function createMatchRequestHandler(req, res) {
  if (!hasDbConfig()) return send(res, 503, { error: 'db not configured' });

  try {
    const body = req.body || {};
    const prefs = body.prefs || {};

    // Resolve concern slugs → ids (best-effort; non-blocking)
    const concernSlugs = safeArr(prefs.concern_slugs).slice(0, 12);
    let concernIds = [];
    if (concernSlugs.length) {
      const rows = await Concern.findAll({
        where: { slug: concernSlugs },
        attributes: ['id', 'slug'],
      });
      concernIds = rows.map((r) => r.id);
    }

    const mr = await MatchRequest.create({
      session_token: cap(body.session_token, 120),
      concern_ids: concernIds,
      budget_tier: prefs.budget_tier || null,
      budget_min_krw: num(prefs.budget_min_krw),
      budget_max_krw: num(prefs.budget_max_krw),
      pain_tolerance: prefs.pain_tolerance || null,
      intensity_pref: prefs.intensity_pref || null,
      max_downtime_days: num(prefs.downtime_max),
      preferred_languages: prefs.language ? [prefs.language] : null,
      district_pref: cap(prefs.district_pref, 64),
      city_pref: cap(prefs.city_pref, 64),
      trip_start: prefs.trip_start || null,
      trip_end: prefs.trip_end || null,
      notes: cap(prefs.notes, 2000),
      matched_at: new Date(),
      match_result: {
        ai_scan: body.ai_scan || null,
        synth: body.synth || null,
        top_match: body.top_match || null,
        // store top 5 (or however many came in)
        candidates: safeArr(body.candidates).slice(0, 10),
      },
      public_feed_consent: Boolean(body.feed_consent),
    });

    // Optionally append to public feed (only if consented)
    let feed_entry_id = null;
    if (body.feed_consent && body.top_match) {
      const top = body.top_match;
      let procedure_id = null;
      let concern_id = concernIds[0] || null;
      if (top.procedure_slug) {
        const p = await Procedure.findOne({ where: { slug: top.procedure_slug }, attributes: ['id'] });
        procedure_id = p?.id || null;
      }
      const fe = await PublicFeedEntry.create({
        source_type: 'match_request',
        source_id: mr.id,
        display_initial: cap(body.display_initial, 4) || 'A.',
        country_code: cap(body.country_code, 8),
        country_label_en: cap(body.country_label_en, 80),
        country_label_zh: cap(body.country_label_zh, 80),
        procedure_id,
        concern_id,
        treatment_label_en: cap(top.procedure_name_en || top.procedure_slug, 160),
        outcome: 'matched',
        outcome_note_en: cap(body.outcome_note_en, 255) || 'matched with candidates',
        is_visible: true,
        is_seed: false,
        priority: 0,
        displayed_at: new Date(),
      });
      feed_entry_id = fe.id;
    }

    return send(res, 201, { match_request_id: mr.id, feed_entry_id });
  } catch (e) {
    console.error('[match-requests] create error', e?.message || e);
    return send(res, 500, { error: 'create failed', detail: e?.message });
  }
}

// GET /api/match-requests/:id — owner via session_token query (no auth)
export async function getMatchRequestHandler(req, res) {
  if (!hasDbConfig()) return send(res, 503, { error: 'db not configured' });
  const session = req.query.session_token;
  try {
    const mr = await MatchRequest.findByPk(req.params.id);
    if (!mr) return send(res, 404, { error: 'not found' });
    if (mr.session_token && mr.session_token !== session) {
      return send(res, 403, { error: 'forbidden' });
    }
    return send(res, 200, { match_request: mr });
  } catch (e) {
    return send(res, 500, { error: 'lookup failed', detail: e?.message });
  }
}

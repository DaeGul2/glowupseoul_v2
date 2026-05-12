// Admin CRUD + S3 upload. Protected by X-Admin-Key header (== process.env.ADMIN_KEY).
import {
  Brand, Hospital, HospitalProcedure,
  Procedure, ProcedureCategory, Concern, ConcernProcedure,
  Doctor, BAPhoto, PublicFeedEntry,
} from '../db/models.js';
import { hasDbConfig } from '../db/sequelize.js';
import { presignPut, hasS3Config } from '../s3.js';

// ----------------------------------------------------------
// Middleware
// ----------------------------------------------------------
export function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return res.status(503).json({ error: 'admin disabled', detail: 'ADMIN_KEY not set on server' });
  }
  const supplied = req.headers['x-admin-key'] || req.query.key;
  if (supplied !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!hasDbConfig()) {
    return res.status(503).json({ error: 'db not configured' });
  }
  next();
}

// Map kind → Sequelize model + writable column allow-list.
const MODELS = {
  brands: {
    M: Brand,
    cols: ['slug','name_ko','name_en','name_zh','name_ja','founding_doctor',
           'specialization_depth','is_chain','website_url','logo_url','brand_hero_url',
           'description_ko','description_en','description_zh','description_ja','is_active'],
    order: [['id', 'ASC']],
  },
  hospitals: {
    M: Hospital,
    cols: ['slug','brand_id','branch_name','name_ko','name_en','name_zh','name_ja',
           'country','city','district','neighborhood','full_address_ko','full_address_en','lat','lng',
           'phone','email','kakao_id','wechat_id','whatsapp','line_id','website_url',
           'languages_supported','has_intl_coordinator','has_interpreter','interpreter_languages',
           'english_doctor','female_doctor_available','accepts_foreign_card','airport_pickup',
           'recovery_lodging_partner','halal_friendly','private_room_available','anesthesiologist_onsite',
           'ba_gallery_url','ba_photo_count','doctor_profile_url','safety_claim',
           'foreign_case_volume_monthly','established_year','external_review_links',
           'thumbnail_url','hero_image_url','gallery_urls','thumbnail_alt_ko','thumbnail_alt_en',
           'contract_status','commission_pct','notes','is_active'],
    order: [['id', 'ASC']],
    include: [{ model: Brand, as: 'brand', attributes: ['id','slug','name_ko'] }],
  },
  procedures: {
    M: Procedure,
    cols: ['slug','category_id','name_ko','name_en','name_zh','name_ja',
           'description_ko','description_en','description_zh','description_ja',
           'mechanism','domain','body_area',
           'pain_level','intensity','downtime_days','result_onset','result_duration','typical_sessions',
           'is_surgical','anesthesia_typical','op_duration_hours',
           'hospitalization_days','stitch_removal_days','swelling_peak_days','final_result_weeks','revision_eligible',
           'market_price_min','market_price_max','price_unit','unit_type','common_units',
           'device_examples','thumbnail_url','hero_image_url','gallery_urls','illustration_url','tags','is_active'],
    order: [['id', 'ASC']],
    include: [{ model: ProcedureCategory, as: 'category', attributes: ['id','slug','name_ko'] }],
  },
  procedure_categories: {
    M: ProcedureCategory,
    cols: ['slug','name_ko','name_en','name_zh','name_ja','domain','parent_id',
           'display_order','thumbnail_url','hero_image_url','is_active'],
    order: [['display_order','ASC'], ['id','ASC']],
  },
  concerns: {
    M: Concern,
    cols: ['slug','name_ko','name_en','name_zh','name_ja',
           'description_ko','description_en','description_zh','description_ja',
           'body_area','display_order','is_active'],
    order: [['display_order','ASC'], ['id','ASC']],
  },
  hospital_procedures: {
    M: HospitalProcedure,
    cols: ['hospital_id','procedure_id','offered',
           'local_name_ko','local_name_en','local_name_zh','local_name_ja',
           'price_tier','price_disclosed','starting_price_krw','pricing_notes','available_units',
           'has_active_event','event_notes','event_until','package_notes',
           'device_brands','doctor_specialty','years_offering','is_signature',
           'thumbnail_url','hero_image_url','source_url','notes'],
    order: [['id', 'ASC']],
    include: [
      { model: Hospital,  as: 'hospital',  attributes: ['id','slug','name_ko'] },
      { model: Procedure, as: 'procedure', attributes: ['id','slug','name_ko'] },
    ],
  },
  doctors: {
    M: Doctor,
    cols: ['slug','hospital_id','brand_id','name_ko','name_en','name_zh','name_ja',
           'title_ko','title_en','title_zh','title_ja',
           'portrait_url','hero_image_url','gallery_urls',
           'years_experience','specialties','education','certifications','memberships',
           'languages_spoken','bio_ko','bio_en','bio_zh','bio_ja',
           'display_order','is_featured','is_active'],
    order: [['hospital_id','ASC'], ['display_order','ASC'], ['id','ASC']],
    include: [{ model: Hospital, as: 'hospital', attributes: ['id','slug','name_ko'] }],
  },
  ba_photos: {
    M: BAPhoto,
    cols: ['hospital_id','procedure_id','doctor_id',
           'before_url','after_url','followup_urls',
           'case_title_ko','case_title_en','case_title_zh','case_title_ja',
           'patient_age_range','patient_gender','patient_country','weeks_after',
           'device_brands','notes_ko','notes_en',
           'consent_signed','consent_date','is_anonymized','visibility',
           'display_order','is_active'],
    order: [['hospital_id','ASC'], ['display_order','ASC'], ['id','ASC']],
    include: [
      { model: Hospital,  as: 'hospital',  attributes: ['id','slug','name_ko'] },
      { model: Procedure, as: 'procedure', attributes: ['id','slug','name_ko'] },
      { model: Doctor,    as: 'doctor',    attributes: ['id','slug','name_ko'] },
    ],
  },
  public_feed_entries: {
    M: PublicFeedEntry,
    cols: ['source_type','display_initial','country_code',
           'country_label_en','country_label_zh','country_label_ja','country_label_ko',
           'procedure_id','concern_id',
           'treatment_label_en','treatment_label_zh','treatment_label_ja','treatment_label_ko',
           'outcome','outcome_note_en','outcome_note_zh','outcome_note_ja','outcome_note_ko',
           'is_visible','is_seed','priority','displayed_at','expires_at'],
    order: [['priority','DESC'], ['displayed_at','DESC']],
  },
  concern_procedures: {
    M: ConcernProcedure,
    cols: ['concern_id','procedure_id','relevance',
           'rationale_ko','rationale_en','rationale_zh','rationale_ja'],
    order: [['concern_id','ASC'], ['procedure_id','ASC']],
  },
};

function pickCols(body, cols) {
  const out = {};
  for (const c of cols) if (c in body) out[c] = body[c];
  return out;
}

function wrap(fn) {
  return (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
    console.error('[admin]', e?.message || e);
    res.status(500).json({ error: 'admin op failed', detail: e?.message });
  });
}

// ----------------------------------------------------------
// Generic CRUD: /api/admin/:kind  /api/admin/:kind/:id
// ----------------------------------------------------------
export const adminList = wrap(async (req, res) => {
  const spec = MODELS[req.params.kind];
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  const limit  = Math.min(Number(req.query.limit)  || 200, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const rows = await spec.M.findAll({
    include: spec.include,
    order:   spec.order,
    limit, offset,
  });
  const total = await spec.M.count();
  res.json({ rows, total, limit, offset });
});

export const adminGet = wrap(async (req, res) => {
  const spec = MODELS[req.params.kind];
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  const row = await spec.M.findByPk(req.params.id, { include: spec.include });
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json({ row });
});

export const adminCreate = wrap(async (req, res) => {
  const spec = MODELS[req.params.kind];
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  const payload = pickCols(req.body || {}, spec.cols);
  const row = await spec.M.create(payload);
  res.status(201).json({ row });
});

export const adminUpdate = wrap(async (req, res) => {
  const spec = MODELS[req.params.kind];
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  const row = await spec.M.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const payload = pickCols(req.body || {}, spec.cols);
  await row.update(payload);
  res.json({ row });
});

export const adminDelete = wrap(async (req, res) => {
  const spec = MODELS[req.params.kind];
  if (!spec) return res.status(404).json({ error: 'unknown kind' });
  const row = await spec.M.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });

  // Prefer soft delete when a deleted_at column exists.
  if (row.deleted_at === null || row.deleted_at !== undefined && 'deleted_at' in row.dataValues) {
    if ('deleted_at' in row.rawAttributes) {
      await row.update({ deleted_at: new Date(), is_active: false });
      return res.json({ ok: true, soft_deleted: true });
    }
  }
  await row.destroy();
  res.json({ ok: true });
});

// ----------------------------------------------------------
// S3 presigned upload
// POST /api/admin/upload/presign  { kind, owner, slot, mime, size }
// ----------------------------------------------------------
export const adminPresignUpload = wrap(async (req, res) => {
  if (!hasS3Config()) return res.status(503).json({ error: 's3 not configured' });
  const { kind, owner, slot, mime, size } = req.body || {};
  if (!kind || !slot || !mime) {
    return res.status(400).json({ error: 'kind, slot, mime required' });
  }
  try {
    const out = await presignPut({ kind, owner, slot, mime, size });
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ----------------------------------------------------------
// Stats — dashboard landing card
// ----------------------------------------------------------
export const adminStats = wrap(async (_req, res) => {
  const [brands, hospitals, procedures, doctors, ba, hp, feed] = await Promise.all([
    Brand.count(), Hospital.count(), Procedure.count(),
    Doctor.count(), BAPhoto.count(), HospitalProcedure.count(),
    PublicFeedEntry.count(),
  ]);
  res.json({
    counts: { brands, hospitals, procedures, doctors, ba_photos: ba,
              hospital_procedures: hp, public_feed_entries: feed },
    s3_configured: hasS3Config(),
  });
});

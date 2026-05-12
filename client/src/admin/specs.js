// Per-model field metadata used by the auto-generated edit form.
// Field types:
//   text       — single-line input
//   textarea   — multi-line
//   number     — int/float
//   bool       — checkbox
//   date       — DATE (yyyy-mm-dd)
//   datetime   — ISO datetime
//   select     — fixed enum (options: [...])
//   tags       — array of strings (chip editor → JSON)
//   json       — raw JSON textarea (for objects/complex arrays)
//   image      — single S3 URL (ImageUploader)
//   gallery    — array of S3 URLs (ImageGalleryEditor)
//   fk         — foreign key (renders id input + label hint)
//
// `cols`: rendered in order, grouped by section headings (when group present).

const DOMAIN  = ['face_aesthetic','body_contouring','regenerative','surgical','derm_medical','dental'];
const SPEC    = ['niche','device_led','general'];
const CONTRACT= ['active','pending','negotiating','declined','paused'];
const INTENS  = ['subtle','moderate','dramatic'];
const ONSET   = ['immediate','gradual'];
const DURAT   = ['temporary','months','years','permanent'];
const ANES    = ['topical','local','sedation','general','none'];
const UNIT    = ['shots','cc','sessions','area','flat'];
const PRICE_T = ['$','$$','$$$','$$$$'];
const BUDGET  = ['under_300','300_800','800_2000','2000_5000','over_5000','flexible'];
const RELEV   = ['primary','secondary','adjunct'];
const VIS     = ['public','logged_in','staff_only'];
const FEED_SRC= ['inquiry','match_request','seed'];
const FEED_OUT= ['consulted','matched','quoted','booked','completed'];
const INQ_ST  = ['sent','quoted','declined','booked','expired'];

export const KINDS = [
  { kind: 'brands',                label: 'Brands' },
  { kind: 'hospitals',             label: 'Hospitals' },
  { kind: 'procedures',            label: 'Procedures' },
  { kind: 'procedure_categories',  label: 'Categories' },
  { kind: 'concerns',              label: 'Concerns' },
  { kind: 'hospital_procedures',   label: 'Hospital × Procedure' },
  { kind: 'doctors',               label: 'Doctors' },
  { kind: 'ba_photos',             label: 'B&A Photos' },
  { kind: 'public_feed_entries',   label: 'Public Feed' },
  { kind: 'concern_procedures',    label: 'Concern × Procedure' },
];

export const SPECS = {
  brands: {
    titleField: 'name_ko',
    list: ['id', 'slug', 'name_ko', 'name_en', 'specialization_depth', 'is_chain', 'is_active'],
    cols: [
      { name: 'slug', type: 'text', required: true, group: 'Identity' },
      { name: 'name_ko', type: 'text', required: true },
      { name: 'name_en', type: 'text' },
      { name: 'name_zh', type: 'text' },
      { name: 'name_ja', type: 'text' },
      { name: 'founding_doctor', type: 'text' },
      { name: 'specialization_depth', type: 'select', options: SPEC, default: 'general' },
      { name: 'is_chain', type: 'bool' },
      { name: 'website_url', type: 'text' },
      { name: 'logo_url', type: 'image', upload: { kind: 'brands', slot: 'logo' }, group: 'Photos' },
      { name: 'brand_hero_url', type: 'image', upload: { kind: 'brands', slot: 'hero' } },
      { name: 'description_ko', type: 'textarea', group: 'Description' },
      { name: 'description_en', type: 'textarea' },
      { name: 'description_zh', type: 'textarea' },
      { name: 'description_ja', type: 'textarea' },
      { name: 'is_active', type: 'bool', default: true, group: 'Flags' },
    ],
  },

  hospitals: {
    titleField: 'name_ko',
    list: ['id', 'slug', 'name_ko', 'city', 'district', 'contract_status', 'is_active'],
    cols: [
      { name: 'slug', type: 'text', required: true, group: 'Identity' },
      { name: 'brand_id', type: 'fk', table: 'brands' },
      { name: 'branch_name', type: 'text' },
      { name: 'name_ko', type: 'text', required: true },
      { name: 'name_en', type: 'text' },
      { name: 'name_zh', type: 'text' },
      { name: 'name_ja', type: 'text' },
      { name: 'country', type: 'text', default: 'KR', group: 'Location' },
      { name: 'city', type: 'text', required: true },
      { name: 'district', type: 'text', required: true },
      { name: 'neighborhood', type: 'text' },
      { name: 'full_address_ko', type: 'text' },
      { name: 'full_address_en', type: 'text' },
      { name: 'lat', type: 'number' },
      { name: 'lng', type: 'number' },
      { name: 'phone', type: 'text', group: 'Contact' },
      { name: 'email', type: 'text' },
      { name: 'kakao_id', type: 'text' },
      { name: 'wechat_id', type: 'text' },
      { name: 'whatsapp', type: 'text' },
      { name: 'line_id', type: 'text' },
      { name: 'website_url', type: 'text' },
      { name: 'languages_supported', type: 'tags', default: ['ko'], group: 'Languages & care' },
      { name: 'has_intl_coordinator', type: 'bool' },
      { name: 'has_interpreter', type: 'bool' },
      { name: 'interpreter_languages', type: 'tags' },
      { name: 'english_doctor', type: 'bool' },
      { name: 'female_doctor_available', type: 'bool' },
      { name: 'accepts_foreign_card', type: 'bool' },
      { name: 'airport_pickup', type: 'bool' },
      { name: 'recovery_lodging_partner', type: 'bool' },
      { name: 'halal_friendly', type: 'bool' },
      { name: 'private_room_available', type: 'bool' },
      { name: 'anesthesiologist_onsite', type: 'bool' },
      { name: 'safety_claim', type: 'textarea', group: 'Trust' },
      { name: 'foreign_case_volume_monthly', type: 'number' },
      { name: 'established_year', type: 'number' },
      { name: 'ba_gallery_url', type: 'text' },
      { name: 'ba_photo_count', type: 'number' },
      { name: 'doctor_profile_url', type: 'text' },
      { name: 'external_review_links', type: 'json' },
      { name: 'thumbnail_url',  type: 'image',   upload: { kind: 'hospitals', slot: 'thumbnail' }, group: 'Photos' },
      { name: 'hero_image_url', type: 'image',   upload: { kind: 'hospitals', slot: 'hero' } },
      { name: 'gallery_urls',   type: 'gallery', upload: { kind: 'hospitals', slot: 'gallery' } },
      { name: 'thumbnail_alt_ko', type: 'text' },
      { name: 'thumbnail_alt_en', type: 'text' },
      { name: 'contract_status', type: 'select', options: CONTRACT, default: 'pending', group: 'Ops' },
      { name: 'commission_pct', type: 'number' },
      { name: 'notes', type: 'textarea' },
      { name: 'is_active', type: 'bool', default: true },
    ],
  },

  procedures: {
    titleField: 'name_ko',
    list: ['id', 'slug', 'name_ko', 'domain', 'is_surgical', 'is_active'],
    cols: [
      { name: 'slug', type: 'text', required: true, group: 'Identity' },
      { name: 'category_id', type: 'fk', table: 'procedure_categories' },
      { name: 'name_ko', type: 'text', required: true },
      { name: 'name_en', type: 'text' },
      { name: 'name_zh', type: 'text' },
      { name: 'name_ja', type: 'text' },
      { name: 'description_ko', type: 'textarea', group: 'Description' },
      { name: 'description_en', type: 'textarea' },
      { name: 'description_zh', type: 'textarea' },
      { name: 'description_ja', type: 'textarea' },
      { name: 'mechanism', type: 'tags', required: true, group: 'Classification' },
      { name: 'domain', type: 'select', options: DOMAIN, required: true },
      { name: 'body_area', type: 'tags', required: true },
      { name: 'pain_level', type: 'number', group: 'Medical' },
      { name: 'intensity', type: 'select', options: INTENS },
      { name: 'downtime_days', type: 'number' },
      { name: 'result_onset', type: 'select', options: ONSET },
      { name: 'result_duration', type: 'select', options: DURAT },
      { name: 'typical_sessions', type: 'number' },
      { name: 'is_surgical', type: 'bool', group: 'Surgical (if applicable)' },
      { name: 'anesthesia_typical', type: 'select', options: ANES },
      { name: 'op_duration_hours', type: 'number' },
      { name: 'hospitalization_days', type: 'number' },
      { name: 'stitch_removal_days', type: 'number' },
      { name: 'swelling_peak_days', type: 'number' },
      { name: 'final_result_weeks', type: 'number' },
      { name: 'revision_eligible', type: 'bool' },
      { name: 'market_price_min', type: 'number', group: 'Price (reference)' },
      { name: 'market_price_max', type: 'number' },
      { name: 'price_unit', type: 'text' },
      { name: 'unit_type', type: 'select', options: UNIT },
      { name: 'common_units', type: 'tags' },
      { name: 'device_examples', type: 'tags', group: 'Devices' },
      { name: 'thumbnail_url',    type: 'image',   upload: { kind: 'procedures', slot: 'thumbnail' }, group: 'Photos' },
      { name: 'hero_image_url',   type: 'image',   upload: { kind: 'procedures', slot: 'hero' } },
      { name: 'gallery_urls',     type: 'gallery', upload: { kind: 'procedures', slot: 'gallery' } },
      { name: 'illustration_url', type: 'image',   upload: { kind: 'procedures', slot: 'illustration' } },
      { name: 'tags', type: 'tags' },
      { name: 'is_active', type: 'bool', default: true, group: 'Flags' },
    ],
  },

  procedure_categories: {
    titleField: 'name_ko',
    list: ['id', 'slug', 'name_ko', 'domain', 'display_order', 'is_active'],
    cols: [
      { name: 'slug', type: 'text', required: true, group: 'Identity' },
      { name: 'name_ko', type: 'text', required: true },
      { name: 'name_en', type: 'text', required: true },
      { name: 'name_zh', type: 'text' },
      { name: 'name_ja', type: 'text' },
      { name: 'domain', type: 'select', options: DOMAIN, required: true },
      { name: 'parent_id', type: 'fk', table: 'procedure_categories' },
      { name: 'display_order', type: 'number', default: 0 },
      { name: 'thumbnail_url', type: 'image', upload: { kind: 'categories', slot: 'thumbnail' }, group: 'Photos' },
      { name: 'hero_image_url', type: 'image', upload: { kind: 'categories', slot: 'hero' } },
      { name: 'is_active', type: 'bool', default: true },
    ],
  },

  concerns: {
    titleField: 'name_ko',
    list: ['id', 'slug', 'name_ko', 'name_en', 'body_area', 'is_active'],
    cols: [
      { name: 'slug', type: 'text', required: true, group: 'Identity' },
      { name: 'name_ko', type: 'text', required: true },
      { name: 'name_en', type: 'text', required: true },
      { name: 'name_zh', type: 'text' },
      { name: 'name_ja', type: 'text' },
      { name: 'description_ko', type: 'textarea' },
      { name: 'description_en', type: 'textarea' },
      { name: 'body_area', type: 'text', required: true },
      { name: 'display_order', type: 'number', default: 0 },
      { name: 'is_active', type: 'bool', default: true },
    ],
  },

  hospital_procedures: {
    titleField: 'id',
    list: ['id', 'hospital_id', 'procedure_id', 'starting_price_krw', 'price_tier', 'is_signature'],
    cols: [
      { name: 'hospital_id',  type: 'fk', table: 'hospitals',  required: true, group: 'Link' },
      { name: 'procedure_id', type: 'fk', table: 'procedures', required: true },
      { name: 'offered', type: 'bool', default: true },
      { name: 'local_name_ko', type: 'text', group: 'Local name' },
      { name: 'local_name_en', type: 'text' },
      { name: 'price_tier', type: 'select', options: PRICE_T, group: 'Price' },
      { name: 'price_disclosed', type: 'bool' },
      { name: 'starting_price_krw', type: 'number' },
      { name: 'pricing_notes', type: 'textarea' },
      { name: 'available_units', type: 'tags' },
      { name: 'has_active_event', type: 'bool', group: 'Event' },
      { name: 'event_notes', type: 'textarea' },
      { name: 'event_until', type: 'date' },
      { name: 'package_notes', type: 'textarea', group: 'Package' },
      { name: 'device_brands', type: 'tags', group: 'Device' },
      { name: 'doctor_specialty', type: 'text' },
      { name: 'years_offering', type: 'number' },
      { name: 'is_signature', type: 'bool' },
      { name: 'thumbnail_url',  type: 'image', upload: { kind: 'hospital_procedures', slot: 'thumbnail' }, group: 'Photos (override)' },
      { name: 'hero_image_url', type: 'image', upload: { kind: 'hospital_procedures', slot: 'hero' } },
      { name: 'source_url', type: 'text', group: 'Meta' },
      { name: 'notes', type: 'textarea' },
    ],
  },

  doctors: {
    titleField: 'name_ko',
    list: ['id', 'slug', 'name_ko', 'hospital_id', 'is_featured', 'is_active'],
    cols: [
      { name: 'slug', type: 'text', required: true, group: 'Identity' },
      { name: 'hospital_id', type: 'fk', table: 'hospitals', required: true },
      { name: 'brand_id', type: 'fk', table: 'brands' },
      { name: 'name_ko', type: 'text', required: true },
      { name: 'name_en', type: 'text' },
      { name: 'name_zh', type: 'text' },
      { name: 'name_ja', type: 'text' },
      { name: 'title_ko', type: 'text', group: 'Title' },
      { name: 'title_en', type: 'text' },
      { name: 'title_zh', type: 'text' },
      { name: 'title_ja', type: 'text' },
      { name: 'portrait_url',   type: 'image',   upload: { kind: 'doctors', slot: 'portrait' }, group: 'Photos' },
      { name: 'hero_image_url', type: 'image',   upload: { kind: 'doctors', slot: 'hero' } },
      { name: 'gallery_urls',   type: 'gallery', upload: { kind: 'doctors', slot: 'gallery' } },
      { name: 'years_experience', type: 'number', group: 'Credentials' },
      { name: 'specialties', type: 'tags' },
      { name: 'education', type: 'json' },
      { name: 'certifications', type: 'json' },
      { name: 'memberships', type: 'json' },
      { name: 'languages_spoken', type: 'tags' },
      { name: 'bio_ko', type: 'textarea', group: 'Bio' },
      { name: 'bio_en', type: 'textarea' },
      { name: 'bio_zh', type: 'textarea' },
      { name: 'bio_ja', type: 'textarea' },
      { name: 'display_order', type: 'number', default: 0, group: 'Flags' },
      { name: 'is_featured', type: 'bool' },
      { name: 'is_active', type: 'bool', default: true },
    ],
  },

  ba_photos: {
    titleField: 'case_title_ko',
    list: ['id', 'hospital_id', 'procedure_id', 'doctor_id', 'visibility', 'is_active'],
    cols: [
      { name: 'hospital_id',  type: 'fk', table: 'hospitals',  required: true, group: 'Link' },
      { name: 'procedure_id', type: 'fk', table: 'procedures' },
      { name: 'doctor_id',    type: 'fk', table: 'doctors' },
      { name: 'before_url', type: 'image', required: true, upload: { kind: 'ba', slot: 'before' }, group: 'Photos' },
      { name: 'after_url',  type: 'image', required: true, upload: { kind: 'ba', slot: 'after' } },
      { name: 'followup_urls', type: 'json' },
      { name: 'case_title_ko', type: 'text', group: 'Case' },
      { name: 'case_title_en', type: 'text' },
      { name: 'patient_age_range', type: 'text' },
      { name: 'patient_gender', type: 'text' },
      { name: 'patient_country', type: 'text' },
      { name: 'weeks_after', type: 'number' },
      { name: 'device_brands', type: 'tags' },
      { name: 'notes_ko', type: 'textarea' },
      { name: 'notes_en', type: 'textarea' },
      { name: 'consent_signed', type: 'bool', group: 'Consent & visibility' },
      { name: 'consent_date', type: 'date' },
      { name: 'is_anonymized', type: 'bool', default: true },
      { name: 'visibility', type: 'select', options: VIS, default: 'logged_in' },
      { name: 'display_order', type: 'number', default: 0 },
      { name: 'is_active', type: 'bool', default: true },
    ],
  },

  public_feed_entries: {
    titleField: 'display_initial',
    list: ['id', 'display_initial', 'country_code', 'treatment_label_en', 'outcome', 'is_visible', 'is_seed'],
    cols: [
      { name: 'source_type', type: 'select', options: FEED_SRC, default: 'seed', required: true, group: 'Source' },
      { name: 'display_initial', type: 'text', required: true, group: 'Display' },
      { name: 'country_code', type: 'text' },
      { name: 'country_label_en', type: 'text' },
      { name: 'country_label_zh', type: 'text' },
      { name: 'procedure_id', type: 'fk', table: 'procedures' },
      { name: 'concern_id', type: 'fk', table: 'concerns' },
      { name: 'treatment_label_en', type: 'text' },
      { name: 'treatment_label_zh', type: 'text' },
      { name: 'outcome', type: 'select', options: FEED_OUT },
      { name: 'outcome_note_en', type: 'text' },
      { name: 'outcome_note_zh', type: 'text' },
      { name: 'is_visible', type: 'bool', default: true, group: 'Flags' },
      { name: 'is_seed', type: 'bool', default: true },
      { name: 'priority', type: 'number', default: 0 },
      { name: 'displayed_at', type: 'datetime' },
      { name: 'expires_at', type: 'datetime' },
    ],
  },

  concern_procedures: {
    titleField: 'concern_id',
    list: ['concern_id', 'procedure_id', 'relevance'],
    pkFields: ['concern_id', 'procedure_id'],   // composite
    cols: [
      { name: 'concern_id', type: 'fk', table: 'concerns', required: true },
      { name: 'procedure_id', type: 'fk', table: 'procedures', required: true },
      { name: 'relevance', type: 'select', options: RELEV, required: true, default: 'primary' },
      { name: 'rationale_ko', type: 'textarea' },
      { name: 'rationale_en', type: 'textarea' },
    ],
  },
};

export function getSpec(kind) {
  return SPECS[kind] || null;
}

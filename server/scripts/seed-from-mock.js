// Import client/src/data/*.js (in-memory mock) → RDS via Sequelize bulkCreate.
//
//   node scripts/seed-from-mock.js
//   node scripts/seed-from-mock.js --dry           # log counts, no writes
//   node scripts/seed-from-mock.js --only=brands,hospitals
//
// Idempotent on slug (Sequelize bulkCreate with updateOnDuplicate).
// Mock data uses numeric ids (1..N) that we DO NOT preserve — DB issues its own
// auto-increment ids. We map mock-id → db-id by slug after each parent insert.

import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Brand, Hospital, HospitalProcedure,
  Procedure, ProcedureCategory, Concern, ConcernProcedure,
  PublicFeedEntry,
} from '../db/models.js';
import { hasDbConfig, closeSequelize } from '../db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const CLIENT_DATA = resolvePath(dirname(__filename), '..', '..', 'client', 'src', 'data');

const argMap = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const DRY = Boolean(argMap.dry);
const ONLY = argMap.only ? new Set(String(argMap.only).split(',').map((s) => s.trim())) : null;
const should = (name) => !ONLY || ONLY.has(name);

async function load(rel) {
  return import(pathToFileURL(resolvePath(CLIENT_DATA, rel)).href);
}

// mock-id → db-id (populated as parents are inserted)
const dbIdBy = {
  brandBySlug:     new Map(),
  hospitalBySlug:  new Map(),
  procedureBySlug: new Map(),
  concernBySlug:   new Map(),
  categoryBySlug:  new Map(),

  hospitalMockId:  new Map(),
  procedureMockId: new Map(),
  concernMockId:   new Map(),
};

function bulkOpts(updateCols) {
  return { updateOnDuplicate: updateCols, validate: false };
}

async function importBrands() {
  const { brands } = await load('brands.js');
  console.log(`brands: ${brands.length}`);
  if (DRY) return;

  const rows = brands.map((b) => ({
    slug: b.slug, name_ko: b.name_ko, name_en: b.name_en,
    name_zh: b.name_zh, name_ja: b.name_ja,
    founding_doctor: b.founding_doctor,
    specialization_depth: b.specialization_depth,
    is_chain: Boolean(b.is_chain), website_url: b.website_url,
    logo_url: b.logo_url, brand_hero_url: b.brand_hero_url,
    description_ko: b.description_ko, description_en: b.description_en,
    description_zh: b.description_zh, description_ja: b.description_ja,
    is_active: b.is_active !== false,
  }));
  await Brand.bulkCreate(rows, bulkOpts([
    'name_ko','name_en','name_zh','name_ja','founding_doctor','specialization_depth',
    'is_chain','website_url','logo_url','brand_hero_url',
    'description_ko','description_en','description_zh','description_ja','is_active',
  ]));

  const inserted = await Brand.findAll({ attributes: ['id', 'slug'] });
  inserted.forEach((b) => dbIdBy.brandBySlug.set(b.slug, b.id));
}

async function importHospitals() {
  const { hospitals } = await load('hospitals.js');
  console.log(`hospitals: ${hospitals.length}`);
  if (DRY) return;

  const rows = hospitals.map((h) => ({
    slug: h.slug,
    brand_id: dbIdBy.brandBySlug.get(h.brand_slug) || null,
    branch_name: h.branch_name,
    name_ko: h.name_ko, name_en: h.name_en, name_zh: h.name_zh, name_ja: h.name_ja,
    country: h.country || 'KR', city: h.city, district: h.district, neighborhood: h.neighborhood,
    full_address_ko: h.full_address_ko, full_address_en: h.full_address_en,
    lat: h.lat, lng: h.lng,
    phone: h.phone, email: h.email,
    kakao_id: h.kakao_id, wechat_id: h.wechat_id, whatsapp: h.whatsapp, line_id: h.line_id,
    website_url: h.website_url,
    languages_supported: h.languages_supported || ['ko'],
    has_intl_coordinator: Boolean(h.has_intl_coordinator),
    has_interpreter:      Boolean(h.has_interpreter),
    interpreter_languages: h.interpreter_languages || null,
    english_doctor:           Boolean(h.english_doctor),
    female_doctor_available:  Boolean(h.female_doctor_available),
    accepts_foreign_card:     Boolean(h.accepts_foreign_card),
    airport_pickup:           Boolean(h.airport_pickup),
    recovery_lodging_partner: Boolean(h.recovery_lodging_partner),
    halal_friendly:           Boolean(h.halal_friendly),
    private_room_available:   Boolean(h.private_room_available),
    anesthesiologist_onsite:  Boolean(h.anesthesiologist_onsite),
    ba_gallery_url: h.ba_gallery_url, ba_photo_count: h.ba_photo_count,
    doctor_profile_url: h.doctor_profile_url, safety_claim: h.safety_claim,
    foreign_case_volume_monthly: h.foreign_case_volume_monthly,
    established_year: h.established_year,
    external_review_links: h.external_review_links || null,
    thumbnail_url: h.thumbnail_url, hero_image_url: h.hero_image_url,
    gallery_urls: h.gallery_urls || null,
    thumbnail_alt_ko: h.thumbnail_alt_ko, thumbnail_alt_en: h.thumbnail_alt_en,
    contract_status: h.contract_status || 'pending',
    commission_pct: h.commission_pct,
    notes: h.notes,
    is_active: h.is_active !== false,
  }));
  await Hospital.bulkCreate(rows, bulkOpts([
    'brand_id','branch_name','name_ko','name_en','name_zh','name_ja',
    'country','city','district','neighborhood','full_address_ko','full_address_en','lat','lng',
    'phone','email','kakao_id','wechat_id','whatsapp','line_id','website_url',
    'languages_supported','has_intl_coordinator','has_interpreter','interpreter_languages',
    'english_doctor','female_doctor_available','accepts_foreign_card','airport_pickup',
    'recovery_lodging_partner','halal_friendly','private_room_available','anesthesiologist_onsite',
    'ba_gallery_url','ba_photo_count','doctor_profile_url','safety_claim',
    'foreign_case_volume_monthly','established_year','external_review_links',
    'thumbnail_url','hero_image_url','gallery_urls','thumbnail_alt_ko','thumbnail_alt_en',
    'contract_status','commission_pct','notes','is_active',
  ]));

  const inserted = await Hospital.findAll({ attributes: ['id', 'slug'] });
  inserted.forEach((h) => dbIdBy.hospitalBySlug.set(h.slug, h.id));
  // mock-id → slug → db-id
  hospitals.forEach((h) => dbIdBy.hospitalMockId.set(h.id, dbIdBy.hospitalBySlug.get(h.slug)));
}

async function importProcedures() {
  const { procedures } = await load('procedures.js');
  console.log(`procedures: ${procedures.length}`);
  if (DRY) return;

  // Resolve category by slug
  const cats = await ProcedureCategory.findAll({ attributes: ['id', 'slug'] });
  cats.forEach((c) => dbIdBy.categoryBySlug.set(c.slug, c.id));

  const rows = procedures.map((p) => ({
    slug: p.slug,
    category_id: dbIdBy.categoryBySlug.get(p.category_slug) || null,
    name_ko: p.name_ko, name_en: p.name_en, name_zh: p.name_zh, name_ja: p.name_ja,
    description_ko: p.description_ko, description_en: p.description_en,
    description_zh: p.description_zh, description_ja: p.description_ja,
    mechanism: p.mechanism || [],
    domain: p.domain,
    body_area: p.body_area || [],
    pain_level: p.pain_level, intensity: p.intensity,
    downtime_days: p.downtime_days, result_onset: p.result_onset,
    result_duration: p.result_duration, typical_sessions: p.typical_sessions,
    is_surgical: Boolean(p.is_surgical),
    anesthesia_typical: p.anesthesia_typical, op_duration_hours: p.op_duration_hours,
    hospitalization_days: p.hospitalization_days,
    stitch_removal_days: p.stitch_removal_days,
    swelling_peak_days: p.swelling_peak_days,
    final_result_weeks: p.final_result_weeks,
    revision_eligible: p.revision_eligible == null ? null : Boolean(p.revision_eligible),
    market_price_min: p.market_price_min, market_price_max: p.market_price_max,
    price_unit: p.price_unit, unit_type: p.unit_type,
    common_units: p.common_units || null,
    device_examples: p.device_examples || null,
    thumbnail_url: p.thumbnail_url, hero_image_url: p.hero_image_url,
    illustration_url: p.illustration_url,
    tags: p.tags || null,
    is_active: p.is_active !== false,
  }));
  await Procedure.bulkCreate(rows, bulkOpts([
    'category_id','name_ko','name_en','name_zh','name_ja',
    'description_ko','description_en','description_zh','description_ja',
    'mechanism','domain','body_area',
    'pain_level','intensity','downtime_days','result_onset','result_duration','typical_sessions',
    'is_surgical','anesthesia_typical','op_duration_hours',
    'hospitalization_days','stitch_removal_days','swelling_peak_days','final_result_weeks','revision_eligible',
    'market_price_min','market_price_max','price_unit','unit_type','common_units',
    'device_examples','thumbnail_url','hero_image_url','illustration_url','tags','is_active',
  ]));

  const inserted = await Procedure.findAll({ attributes: ['id', 'slug'] });
  inserted.forEach((p) => dbIdBy.procedureBySlug.set(p.slug, p.id));
  procedures.forEach((p) => dbIdBy.procedureMockId.set(p.id, dbIdBy.procedureBySlug.get(p.slug)));
}

async function importConcerns() {
  const { concerns } = await load('concerns.js');
  console.log(`concerns: ${concerns.length}`);
  if (DRY) return;

  const rows = concerns.map((c) => ({
    slug: c.slug, name_ko: c.name_ko, name_en: c.name_en,
    name_zh: c.name_zh, name_ja: c.name_ja,
    description_en: c.description_en,
    body_area: c.body_area, display_order: c.display_order || 0,
    is_active: c.is_active !== false,
  }));
  await Concern.bulkCreate(rows, bulkOpts([
    'name_ko','name_en','name_zh','name_ja','description_en','body_area','display_order','is_active',
  ]));

  const inserted = await Concern.findAll({ attributes: ['id', 'slug'] });
  inserted.forEach((c) => dbIdBy.concernBySlug.set(c.slug, c.id));
  concerns.forEach((c) => dbIdBy.concernMockId.set(c.id, dbIdBy.concernBySlug.get(c.slug)));
}

async function importHospitalProcedures() {
  const { hospitalProcedures } = await load('hospitalProcedures.js');
  console.log(`hospital_procedures: ${hospitalProcedures.length}`);
  if (DRY) return;

  const rows = [];
  for (const hp of hospitalProcedures) {
    const hid = dbIdBy.hospitalMockId.get(hp.hospital_id);
    const pid = dbIdBy.procedureMockId.get(hp.procedure_id);
    if (!hid || !pid) {
      console.warn(`  ⚠ skip hp: hospital_id=${hp.hospital_id} procedure_id=${hp.procedure_id}`);
      continue;
    }
    rows.push({
      hospital_id: hid, procedure_id: pid,
      offered: hp.offered !== false,
      local_name_ko: hp.local_name_ko, local_name_en: hp.local_name_en,
      local_name_zh: hp.local_name_zh, local_name_ja: hp.local_name_ja,
      price_tier: hp.price_tier, price_disclosed: Boolean(hp.price_disclosed),
      starting_price_krw: hp.starting_price_krw, pricing_notes: hp.pricing_notes,
      available_units: hp.available_units || null,
      has_active_event: Boolean(hp.has_active_event),
      event_notes: hp.event_notes, event_until: hp.event_until || null,
      package_notes: hp.package_notes,
      device_brands: hp.device_brands || null,
      doctor_specialty: hp.doctor_specialty, years_offering: hp.years_offering,
      is_signature: Boolean(hp.is_signature),
      thumbnail_url: hp.thumbnail_url, hero_image_url: hp.hero_image_url,
      source_url: hp.source_url, notes: hp.notes,
    });
  }
  await HospitalProcedure.bulkCreate(rows, bulkOpts([
    'offered','local_name_ko','local_name_en','local_name_zh','local_name_ja',
    'price_tier','price_disclosed','starting_price_krw','pricing_notes','available_units',
    'has_active_event','event_notes','event_until','package_notes',
    'device_brands','doctor_specialty','years_offering','is_signature',
    'thumbnail_url','hero_image_url','source_url','notes',
  ]));
}

async function importConcernProcedures() {
  const { concernProcedures } = await load('concernProcedures.js');
  console.log(`concern_procedures: ${concernProcedures.length}`);
  if (DRY) return;

  const rows = [];
  for (const cp of concernProcedures) {
    const cid = dbIdBy.concernMockId.get(cp.concern_id);
    const pid = dbIdBy.procedureMockId.get(cp.procedure_id);
    if (!cid || !pid) {
      console.warn(`  ⚠ skip cp: concern_id=${cp.concern_id} procedure_id=${cp.procedure_id}`);
      continue;
    }
    rows.push({
      concern_id: cid, procedure_id: pid, relevance: cp.relevance,
      rationale_ko: cp.rationale_ko, rationale_en: cp.rationale_en,
      rationale_zh: cp.rationale_zh, rationale_ja: cp.rationale_ja,
    });
  }
  await ConcernProcedure.bulkCreate(rows, bulkOpts([
    'relevance','rationale_ko','rationale_en','rationale_zh','rationale_ja',
  ]));
}

async function importPublicFeed() {
  const mod = await load('publicFeed.js');
  const seed = mod.publicFeedEntries || [];
  console.log(`public_feed_entries: ${seed.length}`);
  if (DRY) return;

  const rows = seed.map((f) => ({
    source_type: f.source_type || 'seed', source_id: null,
    display_initial: f.display_initial,
    country_code: f.country_code,
    country_label_en: f.country_label_en, country_label_zh: f.country_label_zh,
    country_label_ja: f.country_label_ja, country_label_ko: f.country_label_ko,
    procedure_id: f.treatment_slug ? dbIdBy.procedureBySlug.get(f.treatment_slug) : null,
    concern_id: f.concern_slugs?.[0] ? dbIdBy.concernBySlug.get(f.concern_slugs[0]) : null,
    treatment_label_en: f.treatment_label_en, treatment_label_zh: f.treatment_label_zh,
    treatment_label_ja: f.treatment_label_ja, treatment_label_ko: f.treatment_label_ko,
    outcome: f.outcome,
    outcome_note_en: f.outcome_note_en, outcome_note_zh: f.outcome_note_zh,
    outcome_note_ja: f.outcome_note_ja, outcome_note_ko: f.outcome_note_ko,
    is_visible: f.is_visible !== false,
    is_seed: f.is_seed !== false,
    priority: f.priority || 0,
    displayed_at: f.displayed_at ? new Date(f.displayed_at) : new Date(),
  }));
  await PublicFeedEntry.bulkCreate(rows, { validate: false });
}

async function main() {
  if (!hasDbConfig()) {
    console.error('✗ DB_HOST / DB_PASSWORD not set');
    process.exit(1);
  }
  try {
    if (should('brands'))              await importBrands();
    if (should('hospitals'))           await importHospitals();
    if (should('procedures'))          await importProcedures();
    if (should('concerns'))            await importConcerns();
    if (should('hospital_procedures')) await importHospitalProcedures();
    if (should('concern_procedures'))  await importConcernProcedures();
    if (should('public_feed'))         await importPublicFeed();
    console.log(DRY ? '\n✓ dry-run (no writes)' : '\n✓ seed-from-mock complete');
  } catch (e) {
    console.error('\n✗ seed aborted:', e.message);
    if (e.errors) e.errors.forEach((er) => console.error('  -', er.message));
    console.error(e.stack);
    process.exitCode = 1;
  } finally {
    await closeSequelize();
  }
}

main();

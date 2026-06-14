// Seed a tiny, basic set of v3 rows (English only). Tags are normalized:
// each row lists `_tags` (names) → find-or-create in the tags master → attach
// via the M:N join. Idempotent via slug upsert.
//
//   node scripts/seed-v3.js

import 'dotenv/config';
import { Treatment, Surgery, Tag, ConcernArea, Concern } from '../db/modelsV3.js';

const TREATMENTS = [
  {
    slug: 'ulthera', name: 'Ulthera',
    summary: 'Non-invasive HIFU lifting that targets the SMAS layer.',
    description: `## What is Ulthera?

Ulthera uses **focused ultrasound (HIFU)** to reach the deep **SMAS layer** — the same layer a surgeon tightens in a facelift — with no incision.

### Good for
- Early sagging along the jawline and cheeks
- A subtle, natural lift with **no downtime**

> Most people return to their day right away. Some warmth or redness can appear right after and settles within hours.`,
    _tags: ['Lifting', 'Non-invasive', 'HIFU'],
    price_krw: 700000, price_note: 'from 300 shots (reference)',
    duration: 'year_1_2',
    pain_level: 'mild', recovery_level: 'immediate',
    recovery_note: 'Back to daily life right away. Note: some redness/flushing may appear right after.',
    benefits: ['Tighten and lift without any incision', 'Good for a subtle, natural result'],
    cautions: ['Mild swelling or a tingling sensation can occur afterward'],
    display_order: 1, is_active: true,
  },
  {
    slug: 'thermage', name: 'Thermage',
    summary: 'Monopolar RF that heats the dermis to restore firmness.',
    _tags: ['Firming', 'RF', 'Non-invasive'],
    price_krw: 1200000, price_note: 'from 600 shots (reference)',
    duration: 'year_1_2',
    pain_level: 'mild', recovery_level: 'immediate',
    recovery_note: 'Back to daily life right away.',
    benefits: ['Overall skin firmness', 'Pore improvement'],
    cautions: ['A sharp warm sensation may be felt during treatment'],
    display_order: 2, is_active: true,
  },
  {
    slug: 'rejuran', name: 'Rejuran',
    summary: 'Salmon-PN skin-regeneration injection.',
    _tags: ['Skinbooster', 'Regeneration', 'Pores'],
    price_krw: 250000, price_note: 'per session (reference)',
    duration: 'months_3_6',
    pain_level: 'mild', recovery_level: '1_2_days',
    recovery_note: 'Small red marks at injection sites may last a day or two.',
    benefits: ['Improves skin texture, pores and fine lines', 'Natural-looking glow'],
    cautions: ['Works best over several repeated sessions'],
    display_order: 3, is_active: true,
  },
  {
    slug: 'shurink', name: 'Shurink Universe', summary: 'Korea\'s favourite HIFU lift — comfortable and quick.',
    _tags: ['Lifting', 'Non-invasive', 'HIFU'], price_krw: 450000, price_note: 'from 300 lines (reference)',
    duration: 'year_1_2', pain_level: 'mild', recovery_level: 'immediate',
    recovery_note: 'No downtime; mild warmth or redness settles within hours.',
    benefits: ['Lift and tighten with little discomfort', 'A great first HIFU if you\'re cautious'],
    cautions: ['Results build gradually over 1–3 months'], display_order: 4, is_active: true,
  },
  {
    slug: 'inmode', name: 'InMode (FX + Forma)', summary: 'RF micro-needling + skin tightening for the lower face.',
    _tags: ['RF', 'Tightening', 'Contour'], price_krw: 350000, price_note: 'per session (reference)',
    duration: 'months_6_12', pain_level: 'mild', recovery_level: '1_2_days',
    recovery_note: 'Slight redness for a day or two.',
    benefits: ['Sharpens a soft jawline and double chin', 'Good for mild sagging + texture together'],
    cautions: ['Usually a course of 3–4 sessions'], display_order: 5, is_active: true,
  },
  {
    slug: 'botox', name: 'Botox', summary: 'Relaxes muscles for a slimmer jaw or smoother lines.',
    _tags: ['Injectable', 'Slimming', 'Wrinkles'], price_krw: 90000, price_note: 'per area (reference)',
    duration: 'months_3_6', pain_level: 'soft', recovery_level: 'immediate',
    recovery_note: 'Back to daily life immediately; tiny marks fade within hours.',
    benefits: ['Slim a square jaw or soften forehead/eye lines', 'Quick, no downtime'],
    cautions: ['Effect is temporary — top-ups every 3–6 months'], display_order: 6, is_active: true,
  },
  {
    slug: 'filler', name: 'Filler', summary: 'Hyaluronic-acid filler to restore volume and contour.',
    _tags: ['Injectable', 'Volume'], price_krw: 350000, price_note: 'per syringe (reference)',
    duration: 'year_1_2', pain_level: 'mild', recovery_level: '1_2_days',
    recovery_note: 'Possible minor swelling or bruising for a day or two.',
    benefits: ['Restores cheeks, chin, lips, under-eye volume', 'Reversible if needed'],
    cautions: ['Choose an experienced injector for natural results'], display_order: 7, is_active: true,
  },
  {
    slug: 'juvelook', name: 'Juvelook', summary: 'PDLA collagen booster for firmness and fine texture.',
    _tags: ['Skinbooster', 'Collagen', 'Regeneration'], price_krw: 400000, price_note: 'per session (reference)',
    duration: 'year_1_2', pain_level: 'mild', recovery_level: '1_2_days',
    recovery_note: 'Tiny injection marks for a day or two.',
    benefits: ['Builds your own collagen for lasting glow', 'Improves fine lines and pores'],
    cautions: ['Best over 2–3 sessions, spaced a month apart'], display_order: 8, is_active: true,
  },
  {
    slug: 'pico_laser', name: 'Pico Laser', summary: 'Picosecond laser for pigment, pores and tone.',
    _tags: ['Laser', 'Pigmentation', 'Tone'], price_krw: 150000, price_note: 'per session (reference)',
    duration: 'months_6_12', pain_level: 'mild', recovery_level: 'immediate',
    recovery_note: 'Mild redness that settles the same day.',
    benefits: ['Fades spots, freckles and dullness', 'Refines pores and overall tone'],
    cautions: ['Strict sun protection needed afterward'], display_order: 9, is_active: true,
  },
  {
    slug: 'co2_laser', name: 'CO2 Fractional Laser', summary: 'Resurfacing for acne scars and rough texture.',
    _tags: ['Laser', 'Resurfacing', 'Scars'], price_krw: 200000, price_note: 'per session (reference)',
    duration: 'years_2_plus', pain_level: 'hard', recovery_level: '1_week_plus',
    recovery_note: 'Redness and light peeling for about a week.',
    benefits: ['Smooths acne scars and texture', 'Long-lasting resurfacing'],
    cautions: ['Real downtime — plan around your trip'], display_order: 10, is_active: true,
  },
  {
    slug: 'aqua_peel', name: 'Aqua Peel', summary: 'Gentle deep-cleanse and hydration facial.',
    _tags: ['Facial', 'Pores', 'Hydration'], price_krw: 80000, price_note: 'per session (reference)',
    duration: 'temporary', pain_level: 'soft', recovery_level: 'immediate',
    recovery_note: 'None — skin looks fresh right away.',
    benefits: ['Clears pores and dead skin', 'Perfect quick glow before an event'],
    cautions: ['Effect is short-lived; pair with other treatments'], display_order: 11, is_active: true,
  },
  {
    slug: 'thread_lift', name: 'Thread Lift', summary: 'Dissolvable threads for an immediate lift.',
    _tags: ['Lifting', 'Threads'], price_krw: 900000, price_note: 'from 10 threads (reference)',
    duration: 'year_1_2', pain_level: 'mild', recovery_level: '1_2_days',
    recovery_note: 'Some tightness, swelling or bruising for a few days.',
    benefits: ['Immediate lift for mild–moderate sagging', 'Stimulates collagen as threads dissolve'],
    cautions: ['Done under local anesthesia'], display_order: 12, is_active: true,
  },
  {
    slug: 'iv_glow', name: 'Glow IV Drip', summary: 'Glutathione + vitamin IV for brightness and recovery.',
    _tags: ['IV', 'Brightening', 'Wellness'], price_krw: 120000, price_note: 'per drip (reference)',
    duration: 'temporary', pain_level: 'soft', recovery_level: 'immediate',
    recovery_note: 'None.',
    benefits: ['Brightening boost and an energy reset', 'A relaxing add-on to any visit'],
    cautions: ['Best as a series for a visible effect'], display_order: 13, is_active: true,
  },
  {
    slug: 'tear_trough', name: 'Tear-trough Filler', summary: 'Under-eye filler to soften hollows and shadows.',
    _tags: ['Injectable', 'Under-eye'], price_krw: 450000, price_note: 'per session (reference)',
    duration: 'year_1_2', pain_level: 'mild', recovery_level: '1_2_days',
    recovery_note: 'Possible mild swelling/bruising for a day or two.',
    benefits: ['Softens dark circles caused by hollows', 'Brightens a tired-looking under-eye'],
    cautions: ['Very technique-sensitive — pick a specialist'], display_order: 14, is_active: true,
  },
];

const SURGERIES = [
  {
    slug: 'rhinoplasty', name: 'Rhinoplasty',
    summary: 'Surgical reshaping of the nose.',
    _tags: ['Nose', 'Contour'],
    price_krw: 4000000, price_note: 'basic rhinoplasty (reference)',
    duration: 'semi_permanent',
    pain_level: 'hard', recovery_level: '1_week_plus',
    recovery_note: 'Swelling and bruising for about 1–2 weeks; back to daily life after the splint is removed.',
    benefits: ['Defines the height and line of the nose', 'Long-lasting result'],
    cautions: ['Involves general/sedation anesthesia', 'Needs recovery time'],
    display_order: 1, is_active: true,
  },
  {
    slug: 'cleft_lip', name: 'Cleft Lip / Palate',
    summary: 'Cleft lip and palate correction.',
    _tags: ['Reconstructive', 'Special'],
    price_krw: null, price_note: 'consultation per case',
    duration: 'permanent',
    pain_level: 'hard', recovery_level: '1_week_plus',
    recovery_note: 'Recovery varies depending on the scope of surgery.',
    benefits: ['Reconstruction for cleft lip / palate patients'],
    cautions: ['Requires a detailed consultation with a specialist'],
    linked_note: 'Cleft lip / palate cases are referred to a specially partnered hospital.',
    display_order: 2, is_active: true,
  },
  {
    slug: 'double_eyelid', name: 'Double Eyelid Surgery', summary: 'Creates a natural double-eyelid crease.',
    _tags: ['Eyes', 'Signature'], price_krw: 1500000, price_note: 'non-incisional ~ incisional (reference)',
    duration: 'permanent', pain_level: 'mild', recovery_level: '1_week_plus',
    recovery_note: 'Swelling for 1–2 weeks; stitches out around day 5–7 (incisional).',
    benefits: ['Brighter, larger-looking eyes', 'Natural crease tailored to your face'],
    cautions: ['Final result settles over a few months'], display_order: 3, is_active: true,
  },
  {
    slug: 'ptosis_correction', name: 'Ptosis Correction', summary: 'Tightens the muscle that lifts a droopy eyelid.',
    _tags: ['Eyes', 'Functional'], price_krw: 2000000, price_note: 'reference',
    duration: 'permanent', pain_level: 'mild', recovery_level: '1_week_plus',
    recovery_note: 'Swelling and bruising for about 2 weeks.',
    benefits: ['Opens up sleepy, heavy eyes', 'Often combined with double-eyelid'],
    cautions: ['Fine-tuning the height takes skill'], display_order: 4, is_active: true,
  },
  {
    slug: 'liposuction', name: 'Liposuction', summary: 'Removes stubborn localized fat for a smoother line.',
    _tags: ['Body', 'Contour'], price_krw: 3000000, price_note: 'per area (reference)',
    duration: 'permanent', pain_level: 'hard', recovery_level: '1_week_plus',
    recovery_note: 'Compression garment + swelling for several weeks.',
    benefits: ['Targets diet-resistant fat (abdomen, thighs, arms)', 'Permanent fat-cell removal'],
    cautions: ['General/sedation anesthesia; commit to recovery'], display_order: 5, is_active: true,
  },
  {
    slug: 'facelift', name: 'Facelift', summary: 'Surgically lifts deeper sagging for lasting rejuvenation.',
    _tags: ['Lifting', 'Signature'], price_krw: 12000000, price_note: 'SMAS lift (reference)',
    duration: 'years_2_plus', pain_level: 'hard', recovery_level: '1_week_plus',
    recovery_note: 'Swelling/bruising for 2–3 weeks; full settle over months.',
    benefits: ['The strongest answer to advanced sagging', 'Years of natural, lasting lift'],
    cautions: ['Major surgery — full consultation required'], display_order: 6, is_active: true,
  },
];

// ---- Concern questionnaire (DB-driven) ----
const AREAS = [
  // non-surgical
  { slug: 'skin',        name: 'Skin',            track: 'non_surgical', display_order: 1 },
  { slug: 'eye_area',    name: 'Eye area',        track: 'non_surgical', display_order: 2 },
  { slug: 'neck',        name: 'Neck',            track: 'non_surgical', display_order: 3 },
  { slug: 'contour_ns',  name: 'Face & contour',  track: 'non_surgical', display_order: 4 },
  // surgical
  { slug: 'eyes',        name: 'Eyes',            track: 'surgical',     display_order: 5 },
  { slug: 'nose',        name: 'Nose',            track: 'surgical',     display_order: 6 },
  { slug: 'facelift',    name: 'Face lift',       track: 'surgical',     display_order: 7 },
  { slug: 'body',        name: 'Body & liposuction', track: 'surgical',  display_order: 8 },
  { slug: 'cleft',       name: 'Cleft lip / palate', track: 'surgical',  display_order: 9 },
];
const CONCERNS = [
  { slug: 'pores',         name: 'Pores',             area: 'skin',       display_order: 1 },
  { slug: 'texture',       name: 'Rough texture',     area: 'skin',       display_order: 2 },
  { slug: 'pigmentation',  name: 'Pigmentation',      area: 'skin',       display_order: 3 },
  { slug: 'redness',       name: 'Redness',           area: 'skin',       display_order: 4 },
  { slug: 'acne',          name: 'Acne',              area: 'skin',       display_order: 5 },
  { slug: 'fine_lines',    name: 'Fine lines',        area: 'skin',       display_order: 6 },
  { slug: 'dark_circles',  name: 'Dark circles',      area: 'eye_area',   display_order: 7 },
  { slug: 'under_eye',     name: 'Under-eye hollows', area: 'eye_area',   display_order: 8 },
  { slug: 'neck_wrinkles', name: 'Neck wrinkles',     area: 'neck',       display_order: 9 },
  { slug: 'sagging',       name: 'Sagging & firmness',area: 'contour_ns', display_order: 10 },
  { slug: 'volume',        name: 'Volume loss',       area: 'contour_ns', display_order: 11 },
  { slug: 'slimming',      name: 'Face slimming',     area: 'contour_ns', display_order: 12 },
  { slug: 'double_eyelid', name: 'Double eyelid',     area: 'eyes',       display_order: 13 },
  { slug: 'ptosis',        name: 'Droopy eyelid',     area: 'eyes',       display_order: 14 },
  { slug: 'nose_shape',    name: 'Nose shape',        area: 'nose',       display_order: 15 },
  { slug: 'deep_sagging',  name: 'Deep facial sagging', area: 'facelift', display_order: 16 },
  { slug: 'localized_fat', name: 'Localized fat',     area: 'body',       display_order: 17 },
  { slug: 'cleft',         name: 'Cleft lip / palate',area: 'cleft',      display_order: 18 },
];
// procedure slug → concern slugs (matching map)
const T_CONCERNS = {
  ulthera:     ['sagging', 'neck_wrinkles', 'fine_lines'],
  thermage:    ['sagging', 'pores', 'fine_lines'],
  rejuran:     ['pores', 'texture', 'fine_lines'],
  shurink:     ['sagging', 'neck_wrinkles', 'fine_lines'],
  inmode:      ['sagging', 'slimming', 'fine_lines'],
  botox:       ['fine_lines', 'slimming'],
  filler:      ['volume'],
  juvelook:    ['fine_lines', 'texture', 'pores'],
  pico_laser:  ['pigmentation', 'pores', 'texture'],
  co2_laser:   ['texture', 'acne'],
  aqua_peel:   ['pores', 'texture'],
  thread_lift: ['sagging'],
  iv_glow:     ['pigmentation'],
  tear_trough: ['under_eye', 'dark_circles'],
};
const S_CONCERNS = {
  rhinoplasty:       ['nose_shape'],
  cleft_lip:         ['cleft'],
  double_eyelid:     ['double_eyelid'],
  ptosis_correction: ['ptosis'],
  liposuction:       ['localized_fat'],
  facelift:          ['deep_sagging'],
};

function slugify(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w가-힣-]/g, '').slice(0, 60) || 'tag';
}

// Find-or-create a tag by name; returns its id.
const tagCache = new Map();
async function tagId(name) {
  if (tagCache.has(name)) return tagCache.get(name);
  let row = await Tag.findOne({ where: { name } });
  if (!row) row = await Tag.create({ slug: slugify(name), name });
  tagCache.set(name, row.id);
  return row.id;
}

async function upsert(M, rows) {
  for (const r of rows) {
    const { _tags = [], ...cols } = r;
    const [row, created] = await M.findOrCreate({ where: { slug: cols.slug }, defaults: cols });
    if (!created) await row.update(cols);
    const ids = [];
    for (const t of _tags) ids.push(await tagId(t));
    await row.setTags(ids);
    console.log(`   ${created ? '+' : '~'} ${cols.name} (${cols.slug})  tags: ${_tags.join(', ') || '-'}`);
  }
}

async function seedConcerns() {
  console.log('-> seeding concern areas + concerns…');
  const areaIdBySlug = {};
  for (const a of AREAS) {
    const [row, created] = await ConcernArea.findOrCreate({ where: { slug: a.slug }, defaults: a });
    if (!created) await row.update(a);
    areaIdBySlug[a.slug] = row.id;
  }
  const concernIdBySlug = {};
  for (const c of CONCERNS) {
    const data = { slug: c.slug, name: c.name, area_id: areaIdBySlug[c.area], display_order: c.display_order };
    const [row, created] = await Concern.findOrCreate({ where: { slug: c.slug }, defaults: data });
    if (!created) await row.update(data);
    concernIdBySlug[c.slug] = row.id;
  }
  console.log(`   areas: ${AREAS.length} · concerns: ${CONCERNS.length}`);
  return concernIdBySlug;
}

async function mapConcerns(M, map, concernIdBySlug) {
  for (const [slug, concernSlugs] of Object.entries(map)) {
    const row = await M.findOne({ where: { slug } });
    if (!row) continue;
    const ids = concernSlugs.map((s) => concernIdBySlug[s]).filter(Boolean);
    await row.setConcerns(ids);
    console.log(`   ${slug} → ${concernSlugs.join(', ')}`);
  }
}

async function main() {
  const concernIdBySlug = await seedConcerns();
  console.log('-> seeding treatments…');
  await upsert(Treatment, TREATMENTS);
  console.log('-> seeding surgeries…');
  await upsert(Surgery, SURGERIES);
  console.log('-> mapping concerns → procedures…');
  await mapConcerns(Treatment, T_CONCERNS, concernIdBySlug);
  await mapConcerns(Surgery, S_CONCERNS, concernIdBySlug);
  console.log('\n done.');
  process.exit(0);
}

main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });

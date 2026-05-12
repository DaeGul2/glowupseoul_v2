// Partner application admin: list / get / approve / reject.
// `approve` reads the JSON submission and inserts Brand + Hospital + HospitalProcedures
// rows via Sequelize. The file is renamed `_approved` so the inbox stays clean.
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Brand, Hospital, HospitalProcedure, Procedure } from '../db/models.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMISSIONS_DIR = join(__dirname, '..', 'submissions');
const APPROVED_DIR    = join(__dirname, '..', 'submissions', '_approved');
const REJECTED_DIR    = join(__dirname, '..', 'submissions', '_rejected');

async function readSub(file) {
  const raw = await fs.readFile(join(SUBMISSIONS_DIR, file), 'utf8');
  return JSON.parse(raw);
}

function summarize(j, file) {
  return {
    id: j._id, file, submitted_at: j._submitted_at,
    brand_ko: j.brand?.name_ko, brand_en: j.brand?.name_en,
    applicant: j.applicant?.name, email: j.applicant?.email, phone: j.applicant?.phone,
    city: j.hospital?.city, district: j.hospital?.district,
    procedure_count: j.procedures?.length || 0,
  };
}

function safeSlug(s) {
  return (s || 'partner').toString()
    .replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
    .toLowerCase()
    .slice(0, 80);
}

// GET /api/admin/partner-submissions
export async function listSubmissions(_req, res) {
  try {
    await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
    const files = (await fs.readdir(SUBMISSIONS_DIR))
      .filter((f) => f.endsWith('.json'))
      .sort()
      .reverse();
    const rows = await Promise.all(
      files.slice(0, 200).map(async (f) => {
        try { return summarize(await readSub(f), f); }
        catch { return { file: f, error: 'parse failed' }; }
      })
    );
    res.json({ count: files.length, rows });
  } catch (e) {
    res.status(500).json({ error: 'list failed', detail: e?.message });
  }
}

// GET /api/admin/partner-submissions/:file
export async function getSubmission(req, res) {
  try {
    const j = await readSub(req.params.file);
    res.json({ submission: j });
  } catch (e) {
    res.status(404).json({ error: 'not found', detail: e?.message });
  }
}

// POST /api/admin/partner-submissions/:file/approve
// Inserts Brand + Hospital + HospitalProcedures into RDS, then moves the file.
export async function approveSubmission(req, res) {
  try {
    const j = await readSub(req.params.file);
    const result = { brand: null, hospital: null, hospital_procedures: 0, warnings: [] };

    // 1. Brand (upsert by slug)
    const brandSlug = safeSlug(j.brand?.name_en || j.brand?.name_ko);
    const [brand] = await Brand.upsert({
      slug: brandSlug,
      name_ko: j.brand?.name_ko,
      name_en: j.brand?.name_en,
      founding_doctor: j.brand?.founding_doctor,
      specialization_depth: j.brand?.specialization_depth || 'general',
      is_chain: Boolean(j.brand?.is_chain),
      website_url: j.brand?.website_url,
      description_ko: j.brand?.description_ko,
      description_en: j.brand?.description_ko,
      is_active: true,
    });
    result.brand = { id: brand.id, slug: brand.slug };

    // 2. Hospital (one branch — append _branch if duplicate)
    let hospitalSlug = `${brandSlug}${j.hospital?.branch_name ? `_${safeSlug(j.hospital.branch_name)}` : ''}`;
    let dup = await Hospital.findOne({ where: { slug: hospitalSlug } });
    if (dup) {
      // brand_branch_2 / _3 ...
      let i = 2;
      while (await Hospital.findOne({ where: { slug: `${hospitalSlug}_${i}` } })) i++;
      hospitalSlug = `${hospitalSlug}_${i}`;
      result.warnings.push(`slug collision — used '${hospitalSlug}'`);
    }
    const caps = j.hospital?.capabilities || {};
    const hospital = await Hospital.create({
      slug: hospitalSlug,
      brand_id: brand.id,
      branch_name: j.hospital?.branch_name,
      name_ko: j.brand?.name_ko, name_en: j.brand?.name_en,
      country: 'KR',
      city: j.hospital?.city, district: j.hospital?.district,
      neighborhood: j.hospital?.neighborhood,
      full_address_ko: j.hospital?.full_address_ko,
      phone: j.hospital?.phone,
      kakao_id: j.hospital?.kakao_id, wechat_id: j.hospital?.wechat_id,
      whatsapp: j.hospital?.whatsapp,
      website_url: j.brand?.website_url,
      languages_supported: j.hospital?.languages_supported || ['ko'],
      has_intl_coordinator: caps.has_intl_coordinator,
      has_interpreter: caps.has_interpreter,
      english_doctor: caps.english_doctor,
      female_doctor_available: caps.female_doctor_available,
      accepts_foreign_card: caps.accepts_foreign_card,
      airport_pickup: caps.airport_pickup,
      recovery_lodging_partner: caps.recovery_lodging_partner,
      halal_friendly: caps.halal_friendly,
      private_room_available: caps.private_room_available,
      anesthesiologist_onsite: caps.anesthesiologist_onsite,
      ba_gallery_url: j.trust?.ba_gallery_url,
      ba_photo_count: j.trust?.ba_photo_count,
      doctor_profile_url: j.trust?.doctor_profile_url,
      safety_claim: j.trust?.safety_claim,
      foreign_case_volume_monthly: j.trust?.foreign_case_volume_monthly,
      established_year: j.trust?.established_year || j.hospital?.established_year,
      external_review_links: j.trust?.external_review_links || null,
      contract_status: 'pending',                    // operator flips to 'active' later
      commission_pct: j.commercial?.commission_pct,
      notes: j.commercial?.notes,
      is_active: true,
    });
    result.hospital = { id: hospital.id, slug: hospital.slug };

    // 3. Hospital procedures (resolve procedure slugs; skip unknown w/ warning)
    for (const r of j.procedures || []) {
      const p = await Procedure.findOne({ where: { slug: r.procedure_slug }, attributes: ['id', 'name_ko'] });
      if (!p) {
        result.warnings.push(`unknown procedure_slug '${r.procedure_slug}'`);
        continue;
      }
      try {
        await HospitalProcedure.create({
          hospital_id: hospital.id,
          procedure_id: p.id,
          offered: true,
          local_name_ko: r.local_name_ko || r.custom_name_ko || p.name_ko,
          starting_price_krw: r.starting_price_krw || null,
          price_disclosed: Boolean(r.starting_price_krw),
          pricing_notes: r.pricing_notes,
          device_brands: r.device_brands || null,
          has_active_event: Boolean(r.has_active_event),
          event_notes: r.event_notes,
          package_notes: r.package_notes,
          years_offering: r.years_offering,
          is_signature: Boolean(r.is_signature),
        });
        result.hospital_procedures += 1;
      } catch (e) {
        result.warnings.push(`hp create failed for '${r.procedure_slug}': ${e.message}`);
      }
    }

    // 4. Archive the file
    await fs.mkdir(APPROVED_DIR, { recursive: true });
    await fs.rename(
      join(SUBMISSIONS_DIR, req.params.file),
      join(APPROVED_DIR, req.params.file),
    );

    res.json({ ok: true, result });
  } catch (e) {
    console.error('[partner-admin] approve error', e?.stack || e);
    res.status(500).json({ error: 'approve failed', detail: e?.message });
  }
}

// POST /api/admin/partner-submissions/:file/reject
export async function rejectSubmission(req, res) {
  try {
    await fs.mkdir(REJECTED_DIR, { recursive: true });
    await fs.rename(
      join(SUBMISSIONS_DIR, req.params.file),
      join(REJECTED_DIR, req.params.file),
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'reject failed', detail: e?.message });
  }
}

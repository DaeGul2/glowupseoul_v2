import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMISSIONS_DIR = join(__dirname, '..', 'submissions');

// Required fields — minimal viable submission. Anything beyond is optional.
const REQUIRED = {
  applicant: ['name', 'role', 'email'],
  brand:     ['name_ko'],
  hospital:  ['city', 'district'],
};

function shallowOk(obj, keys) {
  return keys.every((k) => obj?.[k] && String(obj[k]).trim().length > 0);
}

function safeSlug(s) {
  return (s || 'partner').toString().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
}

function cap(str, n) {
  return typeof str === 'string' ? str.slice(0, n) : str;
}

function sanitize(payload) {
  const p = payload || {};
  return {
    applicant: {
      name:  cap(p.applicant?.name,  120),
      role:  cap(p.applicant?.role,  120),
      email: cap(p.applicant?.email, 200),
      phone: cap(p.applicant?.phone, 60),
      preferred_channel: cap(p.applicant?.preferred_channel, 24),
      channel_id:        cap(p.applicant?.channel_id, 120),
    },
    brand: {
      name_ko:      cap(p.brand?.name_ko, 200),
      name_en:      cap(p.brand?.name_en, 200),
      founding_doctor: cap(p.brand?.founding_doctor, 100),
      website_url:  cap(p.brand?.website_url, 400),
      specialization_depth: ['niche','device_led','general'].includes(p.brand?.specialization_depth) ? p.brand.specialization_depth : 'general',
      is_chain:     Boolean(p.brand?.is_chain),
      description_ko: cap(p.brand?.description_ko, 800),
    },
    hospital: {
      branch_name:      cap(p.hospital?.branch_name, 80),
      city:             cap(p.hospital?.city, 60),
      district:         cap(p.hospital?.district, 80),
      neighborhood:     cap(p.hospital?.neighborhood, 80),
      full_address_ko:  cap(p.hospital?.full_address_ko, 300),
      established_year: Number.isFinite(+p.hospital?.established_year) ? +p.hospital.established_year : null,
      phone:            cap(p.hospital?.phone, 60),
      kakao_id:         cap(p.hospital?.kakao_id, 80),
      wechat_id:        cap(p.hospital?.wechat_id, 80),
      whatsapp:         cap(p.hospital?.whatsapp, 60),
      languages_supported: Array.isArray(p.hospital?.languages_supported) ? p.hospital.languages_supported.slice(0, 12).map((l) => cap(l, 5)) : ['ko'],
      capabilities: {
        has_intl_coordinator:     Boolean(p.hospital?.capabilities?.has_intl_coordinator),
        has_interpreter:          Boolean(p.hospital?.capabilities?.has_interpreter),
        english_doctor:           Boolean(p.hospital?.capabilities?.english_doctor),
        female_doctor_available:  Boolean(p.hospital?.capabilities?.female_doctor_available),
        accepts_foreign_card:     Boolean(p.hospital?.capabilities?.accepts_foreign_card),
        airport_pickup:           Boolean(p.hospital?.capabilities?.airport_pickup),
        recovery_lodging_partner: Boolean(p.hospital?.capabilities?.recovery_lodging_partner),
        halal_friendly:           Boolean(p.hospital?.capabilities?.halal_friendly),
        private_room_available:   Boolean(p.hospital?.capabilities?.private_room_available),
        anesthesiologist_onsite:  Boolean(p.hospital?.capabilities?.anesthesiologist_onsite),
      },
    },
    trust: {
      established_year: Number.isFinite(+p.trust?.established_year) ? +p.trust.established_year : null,
      ba_photo_count:   Number.isFinite(+p.trust?.ba_photo_count) ? +p.trust.ba_photo_count : null,
      foreign_case_volume_monthly: Number.isFinite(+p.trust?.foreign_case_volume_monthly) ? +p.trust.foreign_case_volume_monthly : null,
      safety_claim:     cap(p.trust?.safety_claim, 300),
      ba_gallery_url:   cap(p.trust?.ba_gallery_url, 400),
      doctor_profile_url: cap(p.trust?.doctor_profile_url, 400),
      external_review_links: typeof p.trust?.external_review_links === 'object' && p.trust.external_review_links
        ? Object.fromEntries(Object.entries(p.trust.external_review_links).slice(0, 8).map(([k, v]) => [cap(k, 30), cap(v, 400)]))
        : {},
    },
    procedures: Array.isArray(p.procedures)
      ? p.procedures.slice(0, 60).map((r) => ({
          procedure_slug:    cap(r.procedure_slug, 80),
          custom_name_ko:    cap(r.custom_name_ko, 100),
          local_name_ko:     cap(r.local_name_ko, 100),
          starting_price_krw: Number.isFinite(+r.starting_price_krw) ? +r.starting_price_krw : null,
          device_brands:     Array.isArray(r.device_brands) ? r.device_brands.slice(0, 8).map((b) => cap(b, 60)) : [],
          pricing_notes:     cap(r.pricing_notes, 200),
          is_signature:      Boolean(r.is_signature),
          has_active_event:  Boolean(r.has_active_event),
          event_notes:       cap(r.event_notes, 200),
          package_notes:     cap(r.package_notes, 200),
          years_offering:    Number.isFinite(+r.years_offering) ? +r.years_offering : null,
        }))
      : [],
    commercial: {
      commission_pct:   Number.isFinite(+p.commercial?.commission_pct) ? +p.commercial.commission_pct : null,
      preferred_payout: cap(p.commercial?.preferred_payout, 40),
      notes:            cap(p.commercial?.notes, 800),
    },
    consent: {
      terms:     Boolean(p.consent?.terms),
      data_use:  Boolean(p.consent?.data_use),
      marketing: Boolean(p.consent?.marketing),
    },
  };
}

function adminWhatsAppLink(record) {
  const PHONE = '821064871060';
  const lines = [
    '[Glow Up Seoul · NEW PARTNER APPLICATION]',
    '',
    `▸ Brand: ${record.brand.name_ko}${record.brand.name_en ? ` (${record.brand.name_en})` : ''}`,
    `▸ Branch: ${record.hospital.branch_name || '—'} · ${record.hospital.city} · ${record.hospital.district}`,
    `▸ Applicant: ${record.applicant.name} · ${record.applicant.role}`,
    `▸ Contact: ${record.applicant.email}${record.applicant.phone ? ` · ${record.applicant.phone}` : ''}`,
    `▸ Procedures listed: ${record.procedures.length}`,
    record.commercial.commission_pct ? `▸ Commission asked: ${record.commercial.commission_pct}%` : null,
    '',
    `Submission ID: ${record._id}`,
    `Stored at: server/submissions/${record._file}`,
  ].filter(Boolean);
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export async function partnerSubmitHandler(req, res) {
  try {
    const raw = req.body || {};

    // Required guards
    if (!shallowOk(raw.applicant, REQUIRED.applicant)) return res.status(400).json({ error: 'applicant.name, role, email required' });
    if (!shallowOk(raw.brand,     REQUIRED.brand))     return res.status(400).json({ error: 'brand.name_ko required' });
    if (!shallowOk(raw.hospital,  REQUIRED.hospital))  return res.status(400).json({ error: 'hospital.city, district required' });
    if (!raw.consent?.terms || !raw.consent?.data_use) return res.status(400).json({ error: 'consent.terms and consent.data_use required' });

    const clean = sanitize(raw);
    await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });

    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, '-').replace('Z', '');
    const slug = safeSlug(clean.brand.name_en || clean.brand.name_ko);
    const file = `partner_${stamp}_${slug}.json`;
    const id = `PA-${now.getTime().toString(36).toUpperCase()}`;

    const record = {
      _id: id,
      _file: file,
      _submitted_at: now.toISOString(),
      _ip: req.ip || req.headers['x-forwarded-for'] || null,
      _ua: req.headers['user-agent'] || null,
      ...clean,
    };

    await fs.writeFile(join(SUBMISSIONS_DIR, file), JSON.stringify(record, null, 2), 'utf8');
    console.log(`[partner] new submission ${id} · ${clean.brand.name_ko} · ${file}`);

    return res.json({
      ok: true,
      id,
      file,
      admin_handoff_url: adminWhatsAppLink(record),
      message: 'Submitted. Romie will reach out within 48h.',
    });
  } catch (e) {
    console.error('[partner] submit error', e?.message || e);
    return res.status(500).json({ error: 'submission failed', detail: e?.message });
  }
}

export async function partnerListHandler(req, res) {
  // Trivial admin guard — set ADMIN_KEY in .env, pass ?key=...
  const expected = process.env.ADMIN_KEY;
  if (!expected || req.query.key !== expected) {
    return res.status(401).json({ error: 'admin key required (?key=...)' });
  }
  try {
    await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
    const files = (await fs.readdir(SUBMISSIONS_DIR)).filter((f) => f.endsWith('.json')).sort().reverse();
    const detailed = await Promise.all(files.slice(0, 100).map(async (f) => {
      try {
        const raw = await fs.readFile(join(SUBMISSIONS_DIR, f), 'utf8');
        const j = JSON.parse(raw);
        return {
          id: j._id, file: f, submitted_at: j._submitted_at,
          brand_ko: j.brand?.name_ko, brand_en: j.brand?.name_en,
          applicant: j.applicant?.name, email: j.applicant?.email,
          city: j.hospital?.city, district: j.hospital?.district,
          procedure_count: j.procedures?.length || 0,
        };
      } catch { return { file: f, error: 'parse failed' }; }
    }));
    return res.json({ count: files.length, recent: detailed });
  } catch (e) {
    return res.status(500).json({ error: 'list failed', detail: e?.message });
  }
}

import { useMemo, useState } from 'react';
import db from '../data/db.js';
import { navigate } from '../App.jsx';
import { submitPartner } from '../utils/api.js';
import WhatsAppCTA from '../components/WhatsAppCTA.jsx';

// ---------- Step config ----------
const STEPS = [
  { id: 'brand',      title: 'Your brand',              hint: 'Names, doctor, website.' },
  { id: 'location',   title: 'Branch & location',       hint: 'Where patients walk in.' },
  { id: 'capability', title: 'Foreign-patient setup',   hint: 'Languages and on-site capabilities.' },
  { id: 'menu',       title: 'Procedures you offer',    hint: 'Pick from our catalogue + pricing.' },
  { id: 'trust',      title: 'Trust signals & terms',   hint: 'B&A volume, commission, notes.' },
  { id: 'review',     title: 'Review & submit',         hint: 'One last look.' },
];

const LANG_OPTIONS = [
  { code: 'ko', label: 'Korean 한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'ru', label: 'Russian' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'id', label: 'Indonesian' },
  { code: 'th', label: 'Thai' },
  { code: 'ar', label: 'Arabic' },
];

const CAPABILITIES = [
  { key: 'has_intl_coordinator',     label: 'International coordinator' },
  { key: 'has_interpreter',          label: 'Interpreter on-site' },
  { key: 'english_doctor',           label: 'English-speaking doctor' },
  { key: 'female_doctor_available',  label: 'Female doctor available' },
  { key: 'accepts_foreign_card',     label: 'Foreign credit card accepted' },
  { key: 'airport_pickup',           label: 'Airport pickup' },
  { key: 'recovery_lodging_partner', label: 'Recovery-lodging partner' },
  { key: 'halal_friendly',           label: 'Halal-friendly' },
  { key: 'private_room_available',   label: 'Private recovery room' },
  { key: 'anesthesiologist_onsite',  label: 'Anesthesiologist on-site' },
];

const SPECIALIZATION = [
  { key: 'general',    label: 'General — mixed practice' },
  { key: 'niche',      label: 'Niche — specialist (cleft, derma, single area)' },
  { key: 'device_led', label: 'Device-led — flagship machines' },
];

const EMPTY_PROC_ROW = () => ({
  procedure_slug: '',
  custom_name_ko: '',
  local_name_ko: '',
  starting_price_krw: '',
  device_brands_str: '',
  pricing_notes: '',
  is_signature: false,
  has_active_event: false,
  event_notes: '',
  package_notes: '',
  years_offering: '',
});

const DEFAULT_FORM = () => ({
  applicant: { name: '', role: '', email: '', phone: '', preferred_channel: 'whatsapp', channel_id: '' },
  brand: { name_ko: '', name_en: '', founding_doctor: '', website_url: '', specialization_depth: 'general', is_chain: false, description_ko: '' },
  hospital: { branch_name: '', city: 'Seoul', district: '', neighborhood: '', full_address_ko: '', established_year: '', phone: '', kakao_id: '', wechat_id: '', whatsapp: '' },
  languages_supported: ['ko'],
  capabilities: Object.fromEntries(CAPABILITIES.map((c) => [c.key, false])),
  procedures: [EMPTY_PROC_ROW()],
  trust: { ba_photo_count: '', foreign_case_volume_monthly: '', safety_claim: '', ba_gallery_url: '', doctor_profile_url: '', external_review_links: { naver: '', instagram: '' } },
  commercial: { commission_pct: '15', preferred_payout: 'monthly', notes: '' },
  consent: { terms: false, data_use: false, marketing: false },
});

// ---------- Helpers ----------
function Input({ label, hint, error, ...props }) {
  return (
    <label className="gs-pa-field">
      {label && <span className="gs-pa-label">{label}</span>}
      <input className="gs-input" {...props} />
      {hint && <span className="gs-pa-hint">{hint}</span>}
      {error && <span className="gs-pa-err">{error}</span>}
    </label>
  );
}
function TextArea({ label, hint, error, ...props }) {
  return (
    <label className="gs-pa-field">
      {label && <span className="gs-pa-label">{label}</span>}
      <textarea className="gs-textarea" {...props} />
      {hint && <span className="gs-pa-hint">{hint}</span>}
      {error && <span className="gs-pa-err">{error}</span>}
    </label>
  );
}
function Select({ label, options, hint, ...props }) {
  return (
    <label className="gs-pa-field">
      {label && <span className="gs-pa-label">{label}</span>}
      <select className="gs-select" {...props}>
        {options.map((o) => <option key={o.key || o.value || o} value={o.key || o.value || o}>{o.label || o}</option>)}
      </select>
      {hint && <span className="gs-pa-hint">{hint}</span>}
    </label>
  );
}

// ---------- Page ----------
export default function PartnerApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const procs = db.procedures;
  const procBySlug = useMemo(() => Object.fromEntries(procs.map((p) => [p.slug, p])), [procs]);

  // ---------- mutators ----------
  function setApplicant(k, v) { setForm((f) => ({ ...f, applicant: { ...f.applicant, [k]: v } })); }
  function setBrand(k, v)     { setForm((f) => ({ ...f, brand: { ...f.brand, [k]: v } })); }
  function setHospital(k, v)  { setForm((f) => ({ ...f, hospital: { ...f.hospital, [k]: v } })); }
  function setTrust(k, v)     { setForm((f) => ({ ...f, trust: { ...f.trust, [k]: v } })); }
  function setCommercial(k, v){ setForm((f) => ({ ...f, commercial: { ...f.commercial, [k]: v } })); }
  function toggleLang(code) {
    setForm((f) => {
      const has = f.languages_supported.includes(code);
      return { ...f, languages_supported: has ? f.languages_supported.filter((l) => l !== code) : [...f.languages_supported, code] };
    });
  }
  function toggleCap(key) { setForm((f) => ({ ...f, capabilities: { ...f.capabilities, [key]: !f.capabilities[key] } })); }
  function setProcRow(idx, k, v) {
    setForm((f) => {
      const next = [...f.procedures];
      next[idx] = { ...next[idx], [k]: v };
      return { ...f, procedures: next };
    });
  }
  function addProc()    { setForm((f) => ({ ...f, procedures: [...f.procedures, EMPTY_PROC_ROW()] })); }
  function removeProc(i){ setForm((f) => ({ ...f, procedures: f.procedures.filter((_, j) => j !== i) })); }
  function setConsent(k, v) { setForm((f) => ({ ...f, consent: { ...f.consent, [k]: v } })); }
  function setReviewLink(k, v) { setForm((f) => ({ ...f, trust: { ...f.trust, external_review_links: { ...f.trust.external_review_links, [k]: v } } })); }

  // ---------- step validation ----------
  function canAdvance(s) {
    const f = form;
    if (s === 0) return f.applicant.name && f.applicant.role && f.applicant.email && f.brand.name_ko;
    if (s === 1) return f.hospital.city && f.hospital.district;
    if (s === 2) return f.languages_supported.length > 0;
    if (s === 3) return f.procedures.length > 0 && f.procedures.every((r) => r.procedure_slug || r.custom_name_ko);
    if (s === 4) return true;
    if (s === 5) return f.consent.terms && f.consent.data_use;
    return false;
  }

  // ---------- submit ----------
  async function onSubmit() {
    if (!canAdvance(5)) {
      setError('Please tick the required consents to submit.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const payload = {
      applicant: form.applicant,
      brand: form.brand,
      hospital: { ...form.hospital, languages_supported: form.languages_supported, capabilities: form.capabilities },
      trust: form.trust,
      procedures: form.procedures
        .filter((r) => r.procedure_slug || r.custom_name_ko)
        .map((r) => ({
          procedure_slug: r.procedure_slug || null,
          custom_name_ko: r.custom_name_ko || null,
          local_name_ko: r.local_name_ko || null,
          starting_price_krw: r.starting_price_krw === '' ? null : Number(r.starting_price_krw),
          device_brands: r.device_brands_str.split(',').map((s) => s.trim()).filter(Boolean),
          pricing_notes: r.pricing_notes || null,
          is_signature: r.is_signature,
          has_active_event: r.has_active_event,
          event_notes: r.event_notes || null,
          package_notes: r.package_notes || null,
          years_offering: r.years_offering === '' ? null : Number(r.years_offering),
        })),
      commercial: { ...form.commercial, commission_pct: form.commercial.commission_pct === '' ? null : Number(form.commercial.commission_pct) },
      consent: form.consent,
    };
    try {
      const json = await submitPartner(payload);
      setResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- success screen ----------
  if (result) {
    return (
      <section className="gs-pa-success">
        <div className="gs-eyebrow">✦  Application received</div>
        <h1>Thank you. <em>Romie has it.</em></h1>
        <p>
          Submission ID <strong>{result.id}</strong> — we read every application by hand.
          You'll hear back within 48 hours at <strong>{form.applicant.email}</strong>.
        </p>
        <div className="gs-pa-success-meta">
          <div><span>Saved as</span><strong>{result.file}</strong></div>
          <div><span>Stored at</span><strong>server/submissions/</strong></div>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="gs-cta" onClick={() => navigate('/')}>Back to home →</button>
          <WhatsAppCTA label="Or DM Romie directly" />
        </div>
      </section>
    );
  }

  // ---------- main render ----------
  const current = STEPS[step];

  return (
    <section className="gs-pa">
      <div className="gs-pa-shell">

        {/* === LEFT — sticky progress rail === */}
        <aside className="gs-pa-rail">
          <div className="gs-eyebrow">◈  Partner application</div>
          <h2 className="gs-pa-rail-title">List your clinic in <em>Glow Up Seoul.</em></h2>
          <p className="gs-pa-rail-lede">
            Ministry of Health-registered foreign-patient agency since 2022. 22 partner clinics. ~500+ international patients served.
            Listings are <em>hand-reviewed</em> — no auto-approval.
          </p>

          <ol className="gs-pa-rail-steps">
            {STEPS.map((s, i) => (
              <li key={s.id} className={`gs-pa-rail-step ${i === step ? 'current' : i < step ? 'done' : ''}`}>
                <button onClick={() => i < step && setStep(i)} disabled={i > step}>
                  <span className="gs-pa-rail-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="gs-pa-rail-text">
                    <span className="gs-pa-rail-name">{s.title}</span>
                    <span className="gs-pa-rail-hint">{s.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="gs-pa-rail-foot">
            <span className="gs-eyebrow">Questions?</span>
            <WhatsAppCTA label="Reach Romie" />
          </div>
        </aside>

        {/* === RIGHT — current step body === */}
        <div className="gs-pa-body">
          <div className="gs-pa-step-head">
            <span className="gs-eyebrow">Step {step + 1} of {STEPS.length}</span>
            <h1>{current.title}</h1>
            <p>{current.hint}</p>
          </div>

          {/* ----- 0. brand + applicant ----- */}
          {step === 0 && (
            <div className="gs-pa-grid gs-pa-grid--2">
              <Input label="Your name *"          value={form.applicant.name}  onChange={(e) => setApplicant('name', e.target.value)} placeholder="e.g., Park So-Yeon" />
              <Input label="Your role *"          value={form.applicant.role}  onChange={(e) => setApplicant('role', e.target.value)} placeholder="e.g., Marketing Director" />
              <Input label="Email *"              type="email" value={form.applicant.email} onChange={(e) => setApplicant('email', e.target.value)} placeholder="ops@yourclinic.com" />
              <Input label="Phone"                value={form.applicant.phone} onChange={(e) => setApplicant('phone', e.target.value)} placeholder="+82 10..." />
              <Select label="Preferred channel"   value={form.applicant.preferred_channel} onChange={(e) => setApplicant('preferred_channel', e.target.value)}
                options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'Email' }, { value: 'kakao', label: 'KakaoTalk' }, { value: 'wechat', label: 'WeChat' }]} />
              <Input label="Channel ID (handle)"  value={form.applicant.channel_id} onChange={(e) => setApplicant('channel_id', e.target.value)} placeholder="+82 ... or kakao id" />

              <hr className="gs-pa-rule" />

              <Input label="Brand name (KR) *"    value={form.brand.name_ko} onChange={(e) => setBrand('name_ko', e.target.value)} placeholder="강남○○의원" />
              <Input label="Brand name (EN)"      value={form.brand.name_en} onChange={(e) => setBrand('name_en', e.target.value)} placeholder="Gangnam ○○ Clinic" />
              <Input label="Founding doctor"      value={form.brand.founding_doctor} onChange={(e) => setBrand('founding_doctor', e.target.value)} placeholder="e.g., Dr. 최우식" />
              <Input label="Website URL"          value={form.brand.website_url} onChange={(e) => setBrand('website_url', e.target.value)} placeholder="https://..." />
              <Select label="Specialization"      value={form.brand.specialization_depth} onChange={(e) => setBrand('specialization_depth', e.target.value)} options={SPECIALIZATION} />
              <label className="gs-pa-field gs-pa-toggle">
                <input type="checkbox" checked={form.brand.is_chain} onChange={(e) => setBrand('is_chain', e.target.checked)} />
                <span>Chain (multiple branches)</span>
              </label>
              <TextArea label="Brand description"  rows={3}    value={form.brand.description_ko} onChange={(e) => setBrand('description_ko', e.target.value)}
                placeholder="One paragraph — what makes the brand distinct. KO or EN, either is fine." />
            </div>
          )}

          {/* ----- 1. branch + location ----- */}
          {step === 1 && (
            <div className="gs-pa-grid gs-pa-grid--2">
              <Input label="Branch name"          value={form.hospital.branch_name} onChange={(e) => setHospital('branch_name', e.target.value)} placeholder="e.g., 청담점 · Cheongdam" />
              <Input label="Established year"     value={form.hospital.established_year} onChange={(e) => setHospital('established_year', e.target.value)} placeholder="e.g., 2018" />
              <Input label="City *"               value={form.hospital.city} onChange={(e) => setHospital('city', e.target.value)} placeholder="Seoul / Busan / ..." />
              <Input label="District *"           value={form.hospital.district} onChange={(e) => setHospital('district', e.target.value)} placeholder="Gangnam-gu" />
              <Input label="Neighborhood"         value={form.hospital.neighborhood} onChange={(e) => setHospital('neighborhood', e.target.value)} placeholder="Cheongdam / Sinsa / ..." />
              <Input label="Reception phone"      value={form.hospital.phone} onChange={(e) => setHospital('phone', e.target.value)} placeholder="02-..." />
              <TextArea label="Full address (KR)" rows={2} value={form.hospital.full_address_ko} onChange={(e) => setHospital('full_address_ko', e.target.value)} placeholder="서울 강남구 ..." />
              <Input label="KakaoTalk ID"         value={form.hospital.kakao_id}   onChange={(e) => setHospital('kakao_id', e.target.value)} placeholder="@yourclinic" />
              <Input label="WeChat ID"            value={form.hospital.wechat_id}  onChange={(e) => setHospital('wechat_id', e.target.value)} placeholder="weixin_id" />
              <Input label="WhatsApp"             value={form.hospital.whatsapp}   onChange={(e) => setHospital('whatsapp', e.target.value)} placeholder="+82 10..." />
            </div>
          )}

          {/* ----- 2. languages + capabilities ----- */}
          {step === 2 && (
            <>
              <div className="gs-pa-section-h">Languages spoken at the clinic *</div>
              <div className="gs-pa-chip-row">
                {LANG_OPTIONS.map((l) => (
                  <button key={l.code} type="button" onClick={() => toggleLang(l.code)}
                    className={`gs-chip ${form.languages_supported.includes(l.code) ? 'active' : ''}`}>
                    {l.label}
                  </button>
                ))}
              </div>

              <div className="gs-pa-section-h" style={{ marginTop: 36 }}>On-site capabilities</div>
              <div className="gs-pa-cap-grid">
                {CAPABILITIES.map((c) => (
                  <button key={c.key} type="button" onClick={() => toggleCap(c.key)}
                    className={`gs-pa-cap ${form.capabilities[c.key] ? 'on' : ''}`}>
                    <span className="gs-pa-cap-tick">{form.capabilities[c.key] ? '✓' : '○'}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ----- 3. procedures ----- */}
          {step === 3 && (
            <>
              <p className="gs-pa-step-note">
                Pick a procedure from our catalogue (matching matrix benefits) or type a custom name.
                Add one row per offering — different price tiers / packages can be separate rows.
              </p>
              <div className="gs-pa-procs">
                {form.procedures.map((r, i) => {
                  const p = procBySlug[r.procedure_slug];
                  return (
                    <div key={i} className="gs-pa-proc">
                      <div className="gs-pa-proc-head">
                        <span className="gs-pa-proc-idx">{String(i + 1).padStart(2, '0')}</span>
                        {form.procedures.length > 1 && (
                          <button type="button" className="gs-pa-proc-remove" onClick={() => removeProc(i)}>Remove</button>
                        )}
                      </div>
                      <div className="gs-pa-grid gs-pa-grid--2">
                        <Select label="Procedure (from our catalogue)"
                          value={r.procedure_slug}
                          onChange={(e) => setProcRow(i, 'procedure_slug', e.target.value)}
                          options={[{ value: '', label: '— select or use custom below —' }, ...procs.map((p) => ({ value: p.slug, label: `${p.name_ko} · ${p.name_en}` }))]} />
                        <Input label="Custom name (if not in list)"
                          value={r.custom_name_ko}
                          onChange={(e) => setProcRow(i, 'custom_name_ko', e.target.value)}
                          placeholder="e.g., 우리만의 시그너처 시술" />
                        <Input label="Your local name (optional)"
                          value={r.local_name_ko}
                          onChange={(e) => setProcRow(i, 'local_name_ko', e.target.value)}
                          placeholder="e.g., 리엔셀 슈링크 600샷" />
                        <Input label="Starting price (KRW)"
                          type="number"
                          value={r.starting_price_krw}
                          onChange={(e) => setProcRow(i, 'starting_price_krw', e.target.value)}
                          placeholder="e.g., 390000" />
                        <Input label="Device brands (comma sep)"
                          value={r.device_brands_str}
                          onChange={(e) => setProcRow(i, 'device_brands_str', e.target.value)}
                          placeholder="Shurink, Ulthera SPT" />
                        <Input label="Years offering"
                          type="number" value={r.years_offering}
                          onChange={(e) => setProcRow(i, 'years_offering', e.target.value)}
                          placeholder="e.g., 5" />
                        <Input label="Pricing notes"
                          value={r.pricing_notes}
                          onChange={(e) => setProcRow(i, 'pricing_notes', e.target.value)}
                          placeholder="300/600/900 샷 옵션 등" />
                        <Input label="Package notes"
                          value={r.package_notes}
                          onChange={(e) => setProcRow(i, 'package_notes', e.target.value)}
                          placeholder="e.g., 글로우 패키지 90만원" />
                      </div>
                      <div className="gs-pa-proc-flags">
                        <label className="gs-pa-toggle">
                          <input type="checkbox" checked={r.is_signature} onChange={(e) => setProcRow(i, 'is_signature', e.target.checked)} />
                          <span>Clinic signature</span>
                        </label>
                        <label className="gs-pa-toggle">
                          <input type="checkbox" checked={r.has_active_event} onChange={(e) => setProcRow(i, 'has_active_event', e.target.checked)} />
                          <span>Active promotion</span>
                        </label>
                        {r.has_active_event && (
                          <Input value={r.event_notes} onChange={(e) => setProcRow(i, 'event_notes', e.target.value)} placeholder="Event notes — e.g., 5월 한정 -20%" />
                        )}
                      </div>
                      {p && (
                        <div className="gs-pa-proc-meta">
                          ◇ Market range from our catalogue: ₩{p.market_price_min?.toLocaleString()} – ₩{p.market_price_max?.toLocaleString()} · pain {p.pain_level}/5 · downtime {p.downtime_days}d
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button" className="gs-pa-add-proc" onClick={addProc}>+ Add another procedure</button>
              </div>
            </>
          )}

          {/* ----- 4. trust + commercial ----- */}
          {step === 4 && (
            <div className="gs-pa-grid gs-pa-grid--2">
              <Input label="B&A photos available" type="number" value={form.trust.ba_photo_count} onChange={(e) => setTrust('ba_photo_count', e.target.value)} placeholder="e.g., 1200" />
              <Input label="Foreign cases / month" type="number" value={form.trust.foreign_case_volume_monthly} onChange={(e) => setTrust('foreign_case_volume_monthly', e.target.value)} placeholder="e.g., 60" />
              <Input label="B&A gallery URL"  value={form.trust.ba_gallery_url} onChange={(e) => setTrust('ba_gallery_url', e.target.value)} placeholder="https://..." />
              <Input label="Doctor profile URL" value={form.trust.doctor_profile_url} onChange={(e) => setTrust('doctor_profile_url', e.target.value)} placeholder="https://..." />
              <TextArea label="Safety claim (self-stated)" rows={2} value={form.trust.safety_claim} onChange={(e) => setTrust('safety_claim', e.target.value)} placeholder='e.g., "50개국 4만명 무사고"' />
              <Input label="Naver Place URL"   value={form.trust.external_review_links.naver}     onChange={(e) => setReviewLink('naver', e.target.value)} placeholder="https://map.naver.com/..." />
              <Input label="Instagram URL"     value={form.trust.external_review_links.instagram} onChange={(e) => setReviewLink('instagram', e.target.value)} placeholder="https://instagram.com/..." />

              <hr className="gs-pa-rule" />

              <Input label="Commission you offer (%)" type="number" value={form.commercial.commission_pct} onChange={(e) => setCommercial('commission_pct', e.target.value)} placeholder="e.g., 15" />
              <Select label="Preferred payout" value={form.commercial.preferred_payout} onChange={(e) => setCommercial('preferred_payout', e.target.value)}
                options={[{ value: 'monthly', label: 'Monthly' }, { value: 'per_booking', label: 'Per booking' }, { value: 'quarterly', label: 'Quarterly' }]} />
              <TextArea label="Anything we should know" rows={3} value={form.commercial.notes} onChange={(e) => setCommercial('notes', e.target.value)}
                placeholder="Existing partnerships, specialties, exclusions, etc." />
            </div>
          )}

          {/* ----- 5. review + submit ----- */}
          {step === 5 && (
            <>
              <div className="gs-pa-review">
                <ReviewRow label="Applicant"   value={`${form.applicant.name} · ${form.applicant.role} · ${form.applicant.email}`} />
                <ReviewRow label="Brand"       value={`${form.brand.name_ko}${form.brand.name_en ? ` · ${form.brand.name_en}` : ''} · ${form.brand.specialization_depth}${form.brand.is_chain ? ' · chain' : ''}`} />
                <ReviewRow label="Branch"      value={`${form.hospital.branch_name || '(no branch)'} · ${form.hospital.city} · ${form.hospital.district}${form.hospital.neighborhood ? ` · ${form.hospital.neighborhood}` : ''}`} />
                <ReviewRow label="Languages"   value={form.languages_supported.join(' · ')} />
                <ReviewRow label="Capabilities" value={CAPABILITIES.filter((c) => form.capabilities[c.key]).map((c) => c.label).join(' · ') || '(none)'} />
                <ReviewRow label="Procedures"  value={`${form.procedures.filter((r) => r.procedure_slug || r.custom_name_ko).length} listed`} />
                <ReviewRow label="B&A photos"  value={form.trust.ba_photo_count || '—'} />
                <ReviewRow label="Foreign cases/mo" value={form.trust.foreign_case_volume_monthly || '—'} />
                <ReviewRow label="Commission"  value={form.commercial.commission_pct ? `${form.commercial.commission_pct}%` : '—'} />
              </div>

              <div className="gs-pa-consents">
                <label className="gs-pa-toggle">
                  <input type="checkbox" checked={form.consent.terms} onChange={(e) => setConsent('terms', e.target.checked)} />
                  <span><strong>I agree to the partner terms *</strong> — Glow Up Seoul reviews applications by hand. Listing is at our discretion. No automatic approval.</span>
                </label>
                <label className="gs-pa-toggle">
                  <input type="checkbox" checked={form.consent.data_use} onChange={(e) => setConsent('data_use', e.target.checked)} />
                  <span><strong>I authorize use of this data *</strong> — for matching, display on category/treatment pages, and concierge handoff. Subject to Korean PIPA + GDPR.</span>
                </label>
                <label className="gs-pa-toggle">
                  <input type="checkbox" checked={form.consent.marketing} onChange={(e) => setConsent('marketing', e.target.checked)} />
                  <span>I'm OK receiving operational updates and case opportunities (optional).</span>
                </label>
              </div>

              {error && <div className="gs-pa-err-box">{error}</div>}
            </>
          )}

          {/* ===== nav ===== */}
          <div className="gs-pa-nav">
            {step > 0 && <button className="gs-cta gs-cta--outline" onClick={() => setStep(step - 1)}>← Back</button>}
            <div style={{ flex: 1 }} />
            {step < STEPS.length - 1 && (
              <button className="gs-cta" disabled={!canAdvance(step)} onClick={() => setStep(step + 1)}>
                Continue →
              </button>
            )}
            {step === STEPS.length - 1 && (
              <button className="gs-cta" disabled={!canAdvance(5) || submitting} onClick={onSubmit}>
                {submitting ? 'Submitting…' : 'Submit application →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="gs-pa-review-row">
      <span className="gs-pa-review-label">{label}</span>
      <span className="gs-pa-review-val">{value || '—'}</span>
    </div>
  );
}

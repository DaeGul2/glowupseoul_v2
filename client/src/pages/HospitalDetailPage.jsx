import db from '../data/db.js';
import { navigate } from '../App.jsx';
import WhatsAppCTA from '../components/WhatsAppCTA.jsx';
import ClinicReviews from '../components/ClinicReviews.jsx';
import { useSeo, breadcrumbLd, medicalBusinessLd } from '../utils/seo.js';

const FLAGS = { ko:'🇰🇷', en:'🇬🇧', zh:'🇨🇳', ja:'🇯🇵', ru:'🇷🇺', vi:'🇻🇳', id:'🇮🇩', th:'🇹🇭', ar:'🇸🇦' };

function fmtKRW(n) {
  if (n == null) return '—';
  return `₩${n.toLocaleString()}`;
}

const FEATURE_LIST = [
  ['has_intl_coordinator',    'International coordinator'],
  ['has_interpreter',         'Interpreter on-site'],
  ['english_doctor',          'English-speaking doctor'],
  ['female_doctor_available', 'Female doctor available'],
  ['accepts_foreign_card',    'Foreign card accepted'],
  ['airport_pickup',          'Airport pickup'],
  ['recovery_lodging_partner','Recovery-lodging partner'],
  ['halal_friendly',          'Halal-friendly'],
  ['private_room_available',  'Private recovery room'],
  ['anesthesiologist_onsite', 'Anesthesiologist on-site'],
];

export default function HospitalDetailPage({ slug }) {
  const h = db.hospitalBySlug[slug];
  const brand = h ? db.brandById[h.brand_id] : null;
  const offerings = h ? db.offeringsForHospital(h.id) : [];

  useSeo(h ? {
    title: `${h.name_en || h.name_ko} · ${h.neighborhood} — clinic profile`,
    description: `${h.safety_claim || `${h.name_en || h.name_ko} clinic in ${h.city} ${h.district}`}. Languages: ${(h.languages_supported || []).join(', ')}. ${offerings.length} treatments offered.`,
    keywords: [h.name_en, h.name_ko, h.name_zh, h.city, h.district, h.neighborhood, brand?.name_en].filter(Boolean).join(', '),
    canonical: `/clinic/${slug}`,
    ogType: 'article',
    ogImage: h.hero_image_url || h.thumbnail_url,
    jsonLd: [
      medicalBusinessLd({ ...h, brand }),
      breadcrumbLd([
        { name: 'Home', url: '/' },
        { name: 'Clinics', url: '/services' },
        { name: h.name_en || h.name_ko, url: `/clinic/${slug}` },
      ]),
    ],
  } : { title: 'Clinic', noindex: true });

  if (!h) return <div className="gs-section"><p>Unknown clinic.</p></div>;

  return (
    <>
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px 0' }}>
        <button className="gs-back" onClick={() => window.history.back()}>← Back</button>
      </section>

      <section className="gs-clinic-hero" style={{ backgroundImage: `url(${h.hero_image_url})` }}>
        <div className="inner">
          <div className="area">{h.city} · {h.district} · {h.neighborhood}</div>
          <h1>{brand.name_ko} <em>{h.branch_name}</em></h1>
          <p className="claim">{h.safety_claim}</p>
        </div>
      </section>

      <section className="gs-clinic-meta">
        <div><span className="label">Established</span><span className="value">{h.established_year}</span></div>
        <div><span className="label">Foreign cases / mo</span><span className="value">{h.foreign_case_volume_monthly}</span></div>
        <div><span className="label">B/A photos</span><span className="value">{h.ba_photo_count?.toLocaleString()}</span></div>
        <div><span className="label">Contract</span><span className="value" style={{ color: h.contract_status === 'active' ? 'var(--accent)' : 'var(--rose)' }}>{h.contract_status}</span></div>
      </section>

      <section className="gs-clinic-features">
        <h3>Foreign-patient capabilities</h3>
        <ul>
          {FEATURE_LIST.map(([key, label]) => (
            <li key={key} className={h[key] ? '' : 'off'}>{label}</li>
          ))}
        </ul>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Languages</span>
          {h.languages_supported.map((l) => <span key={l} style={{ fontSize: 18 }}>{FLAGS[l] || l}</span>)}
          <span style={{ marginLeft: 24, fontSize: 13, color: 'var(--text-soft)' }}>
            {h.phone && `☎ ${h.phone}`}
            {h.kakao_id && ` · Kakao: ${h.kakao_id}`}
            {h.wechat_id && ` · WeChat: ${h.wechat_id}`}
            {h.whatsapp && ` · WhatsApp: ${h.whatsapp}`}
          </span>
        </div>
      </section>

      <section className="gs-section" style={{ paddingTop: 32 }}>
        <div className="gs-section-head" style={{ textAlign: 'left', marginBottom: 16 }}>
          <div className="gs-eyebrow">◈  Treatments at {brand.name_ko}</div>
          <h2>Their <em>menu.</em></h2>
        </div>

        <div className="gs-offering-table">
          <div className="gs-offering-row head">
            <span>Treatment</span>
            <span>Device</span>
            <span>Price (from)</span>
            <span>Years</span>
            <span>Signals</span>
          </div>
          {offerings.map(({ hp, procedure, discount_pct }) => (
            <div className="gs-offering-row" key={hp.id}>
              <div className="name-cell">
                <button onClick={() => navigate(`/treatment/${procedure.slug}`)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                  <span className="ko">{hp.local_name_ko}</span>
                  <div className="en">{procedure.name_en}</div>
                </button>
              </div>
              <div className="device">{hp.device_brands.join(', ') || '—'}</div>
              <div className="price">
                {hp.price_disclosed ? (
                  <>
                    {fmtKRW(hp.starting_price_krw)}
                    {discount_pct > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>-{discount_pct}% from {fmtKRW(hp.original_price_krw)}</div>}
                  </>
                ) : (
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>상담</span>
                )}
              </div>
              <div className="device">{hp.years_offering ? `${hp.years_offering}y` : '—'}</div>
              <div className="badges">
                {hp.is_signature && <span className="badge signature">시그너처</span>}
                {hp.has_active_event && <span className="badge event">Event</span>}
                {hp.package_notes && <span className="badge" style={{ background: '#e6e9f0', color: '#2a3554' }}>Package</span>}
              </div>
            </div>
          ))}
        </div>
        {offerings.length === 0 && <div className="gs-empty">No offerings registered yet for this clinic.</div>}
      </section>

      <ClinicReviews slug={h.slug} hospitalNameEn={brand.name_en} />

      <section className="gs-cta-strip">
        <h2>Inquire about <em>{brand.name_ko}</em></h2>
        <p>Romie will route your question and translate the clinic's reply.</p>
        <WhatsAppCTA label={`Ask about ${brand.name_en}`} payload={{ hospitalName: brand.name_ko }} />
      </section>
    </>
  );
}

import db from '../data/db.js';
import { navigate } from '../App.jsx';
import WhatsAppCTA from '../components/WhatsAppCTA.jsx';
import { useSeo, breadcrumbLd, medicalProcedureLd } from '../utils/seo.js';

function fmtKRW(n) {
  if (n == null) return '—';
  return `₩${n.toLocaleString()}`;
}

const FLAGS = { ko:'🇰🇷', en:'🇬🇧', zh:'🇨🇳', ja:'🇯🇵', ru:'🇷🇺', vi:'🇻🇳', id:'🇮🇩', th:'🇹🇭', ar:'🇸🇦' };

export default function TreatmentDetailPage({ slug }) {
  const p = db.procedureBySlug[slug];
  const offerings = p ? db.offeringsForProcedure(p.id) : [];
  const cat = p ? db.categoryById[p.category_id] : null;

  useSeo(p ? {
    title: `${p.name_en || p.name_ko} — clinics, price, downtime`,
    description: (p.description_en || p.description_ko || `${p.name_en} in Seoul.`) + ` Compare ${offerings.length} clinic offer${offerings.length === 1 ? '' : 's'} with device, price, downtime, doctor.`,
    keywords: [p.name_en, p.name_ko, p.name_zh, ...(p.tags || []), 'Korea', 'Seoul'].filter(Boolean).join(', '),
    canonical: `/treatment/${slug}`,
    ogType: 'article',
    ogImage: p.hero_image_url || p.thumbnail_url,
    jsonLd: [
      medicalProcedureLd(p),
      breadcrumbLd([
        { name: 'Home', url: '/' },
        { name: cat?.name_en || 'Services', url: cat ? `/category/${cat.slug}` : '/services' },
        { name: p.name_en || p.name_ko, url: `/treatment/${slug}` },
      ]),
    ],
  } : { title: 'Treatment', noindex: true });

  if (!p) return <div className="gs-section"><p>Unknown treatment.</p></div>;

  return (
    <>
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px 0' }}>
        <button className="gs-back" onClick={() => navigate(`/category/${cat?.slug || 'face'}`)}>← {cat?.name_ko} 카테고리</button>
      </section>

      <section className="gs-detail-hero">
        <img src={p.hero_image_url} alt={p.name_ko} />
        <div>
          <div className="gs-eyebrow">{cat?.name_en} · {p.mechanism.join(', ')}</div>
          <h1>{p.name_ko} <em>· {p.name_en}</em></h1>
          <p className="lede">{p.description_ko}</p>
          <div className="meta-row">
            <div><span>Pain</span><span>{p.pain_level}/5</span></div>
            <div><span>Downtime</span><span>{p.downtime_days} days</span></div>
            <div><span>Intensity</span><span>{p.intensity}</span></div>
            <div><span>Result</span><span>{p.result_duration}</span></div>
            {p.typical_sessions > 1 && <div><span>Sessions</span><span>{p.typical_sessions}회</span></div>}
            {p.is_surgical && <div><span>Anesthesia</span><span>{p.anesthesia_typical}</span></div>}
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <WhatsAppCTA label="Get a Quote" payload={{ procedureName: p.name_ko }} />
            <a className="gs-cta gs-cta--outline" href="#compare">Compare {offerings.length} Clinics ↓</a>
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
            Market range: {fmtKRW(p.market_price_min)} – {fmtKRW(p.market_price_max)} per {p.price_unit || 'session'} · Reference devices: {p.device_examples.join(', ') || '—'}
          </div>
        </div>
      </section>

      <section id="compare" className="gs-compare-section">
        <div className="gs-compare-inner">
          <div className="gs-section-head" style={{ textAlign: 'left', marginBottom: 32 }}>
            <div className="gs-eyebrow">◇  Offered at {offerings.length} clinics</div>
            <h2>Compare <em>by your priorities.</em></h2>
            <p style={{ marginTop: 8 }}>Same procedure, different price · device · doctor experience.</p>
          </div>

          <div className="gs-compare-table">
            <div className="gs-compare-row head">
              <span>Clinic</span>
              <span>Local Name</span>
              <span>Price (KRW)</span>
              <span>Device</span>
              <span>Signals</span>
              <span>Languages</span>
            </div>
            {offerings.map(({ hp, hospital, brand, discount_pct }) => (
              <div className="gs-compare-row" key={hp.id}>
                <div className="clinic-cell">
                  <img src={hospital.thumbnail_url} alt={hospital.name_ko} />
                  <div>
                    <button className="name" onClick={() => navigate(`/clinic/${hospital.slug}`)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
                      {brand.name_ko}
                    </button>
                    <div className="area">{hospital.neighborhood}, {hospital.district} · {hospital.branch_name}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13 }}>
                  {hp.local_name_ko}
                  {hp.pricing_notes && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hp.pricing_notes}</div>}
                </div>
                <div className="price-cell">
                  {hp.price_disclosed ? (
                    <>
                      {fmtKRW(hp.starting_price_krw)}
                      {discount_pct > 0 && <span className="original">{fmtKRW(hp.original_price_krw)} · -{discount_pct}%</span>}
                    </>
                  ) : (
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>상담 문의</span>
                  )}
                </div>
                <div className="device">
                  {hp.device_brands.length ? hp.device_brands.join(', ') : '—'}
                  {hp.years_offering && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hp.years_offering}년 운영</div>}
                </div>
                <div className="badges">
                  {hp.is_signature && <span className="badge signature">시그너처</span>}
                  {hp.has_active_event && <span className="badge event">{hp.event_notes || 'Event'}</span>}
                  {hospital.airport_pickup && <span className="badge" style={{ background: '#e6f0ea', color: '#1f5034' }}>Pickup</span>}
                </div>
                <div className="lang-chips">
                  {hospital.languages_supported.map((l) => <span key={l}>{FLAGS[l] || l}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gs-cta-strip">
        <h2>Romie will compare <em>for you.</em></h2>
        <p>Tell us your budget and trip dates — we'll narrow these {offerings.length} clinics to the 2-3 best for your case.</p>
        <WhatsAppCTA label="Get personal recommendation" payload={{ procedureName: p.name_ko }} />
      </section>
    </>
  );
}

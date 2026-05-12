import db from '../data/db.js';
import { navigate } from '../App.jsx';
import WhatsAppCTA from '../components/WhatsAppCTA.jsx';
import { useSeo, breadcrumbLd } from '../utils/seo.js';

function fmtKRW(n) {
  if (n == null) return '—';
  return `₩${n.toLocaleString()}`;
}

const FLAGS = { ko:'🇰🇷', en:'🇬🇧', zh:'🇨🇳', ja:'🇯🇵', ru:'🇷🇺', vi:'🇻🇳', id:'🇮🇩', th:'🇹🇭', ar:'🇸🇦' };

export default function DeviceDetailPage({ slug }) {
  const d = db.deviceBySlug[slug];
  useSeo(d ? {
    title: `${d.name} — Korean clinics offering this device`,
    description: `${d.description || d.name + ' device in Seoul'} Compare partner clinics offering ${d.name} with price, doctor, downtime.`,
    keywords: [d.name, slug, 'Korea', 'Seoul', 'device'].join(', '),
    canonical: `/device/${slug}`,
    jsonLd: breadcrumbLd([
      { name: 'Home', url: '/' },
      { name: 'Devices', url: '/' },
      { name: d.name, url: `/device/${slug}` },
    ]),
  } : { title: 'Device', noindex: true });
  if (!d) {
    return <section className="gs-section"><p>Unknown device.</p></section>;
  }

  const offerings = db.offeringsForDevice(slug)
    .sort((a, b) => {
      if (a.hp.has_active_event !== b.hp.has_active_event) return a.hp.has_active_event ? -1 : 1;
      if (a.hp.is_signature !== b.hp.is_signature) return a.hp.is_signature ? -1 : 1;
      return (a.hp.starting_price_krw || Infinity) - (b.hp.starting_price_krw || Infinity);
    });

  const prices = offerings
    .filter((o) => o.hp.price_disclosed && o.hp.starting_price_krw)
    .map((o) => o.hp.starting_price_krw);
  const priceMin = prices.length ? Math.min(...prices) : null;
  const priceMax = prices.length ? Math.max(...prices) : null;
  const clinicCount = new Set(offerings.map((o) => o.hospital.id)).size;

  return (
    <>
      <section style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 48px 0' }}>
        <button className="gs-back" onClick={() => navigate('/')}>← Home</button>
      </section>

      {/* Hero */}
      <section className="gs-device-hero">
        <div className="gs-device-hero-bg" style={{ backgroundImage: `url(${d.image})` }} />
        <div className="gs-device-hero-tint" />
        <div className="gs-device-hero-inner">
          <div className="gs-eyebrow" style={{ color: 'var(--gold-light)' }}>⬡  Device · {d.mechanism_label_en}</div>
          <h1 className="gs-device-hero-title">
            {d.name_en}
            <span className="gs-device-hero-ko">{d.name_ko}</span>
          </h1>
          <p className="gs-device-hero-blurb">{d.blurb}</p>
          <div className="gs-device-hero-stats">
            <div><strong>{clinicCount}</strong><span>partner clinics</span></div>
            <div><strong>{priceMin != null ? fmtKRW(priceMin) : '상담'}</strong><span>from</span></div>
            <div><strong>{offerings.length}</strong><span>active offerings</span></div>
            {d.badge && <div><strong style={{ textTransform: 'uppercase', fontSize: 18 }}>{d.badge}</strong><span>positioning</span></div>}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
            <WhatsAppCTA label={`Ask Romie about ${d.name_en}`} payload={{ procedureName: `${d.name_en} (${d.name_ko})` }} />
            <a className="gs-cta gs-cta--outline" href="#compare" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>Compare {offerings.length} offerings ↓</a>
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            Recognized brand variants: {d.brands.join(' · ')}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="gs-compare-section">
        <div className="gs-compare-inner">
          <div className="gs-section-head" style={{ textAlign: 'left', marginBottom: 32 }}>
            <div className="gs-eyebrow">◇  {clinicCount} clinics · only those using {d.name_en}</div>
            <h2>Compare <em>{d.name_en}</em> across partners.</h2>
            <p style={{ marginTop: 8 }}>Same device — different price · doctor experience · language coverage.</p>
          </div>

          {offerings.length === 0 ? (
            <div className="gs-empty">No partner clinic currently offers {d.name_en}.</div>
          ) : (
            <div className="gs-compare-table">
              <div className="gs-compare-row head">
                <span>Clinic</span>
                <span>Used for</span>
                <span>Price (KRW)</span>
                <span>Device variant</span>
                <span>Signals</span>
                <span>Languages</span>
              </div>
              {offerings.map(({ hp, procedure, hospital, brand, discount_pct }) => (
                <div className="gs-compare-row" key={hp.id}>
                  <div className="clinic-cell">
                    <img src={hospital.thumbnail_url} alt={brand.name_ko} referrerPolicy="no-referrer" />
                    <div>
                      <button className="name" onClick={() => navigate(`/clinic/${hospital.slug}`)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
                        {brand.name_ko}
                      </button>
                      <div className="area">{hospital.neighborhood}, {hospital.district} · {hospital.branch_name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <button onClick={() => navigate(`/treatment/${procedure.slug}`)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text)', padding: 0, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17 }}>
                      {procedure.name_ko}
                    </button>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{hp.local_name_ko}</div>
                  </div>
                  <div className="price-cell">
                    {hp.price_disclosed ? (
                      <>
                        {fmtKRW(hp.starting_price_krw)}
                        {discount_pct > 0 && <span className="original">{fmtKRW(hp.original_price_krw)} · -{discount_pct}%</span>}
                      </>
                    ) : (
                      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>상담</span>
                    )}
                  </div>
                  <div className="device">
                    {hp.device_brands.filter((b) => d.brands.includes(b)).join(', ') || d.name_en}
                    {hp.years_offering && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hp.years_offering}y operating</div>}
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
          )}
        </div>
      </section>

      <section className="gs-cta-strip">
        <h2>Not sure if <em>{d.name_en}</em> is right for you?</h2>
        <p>Send Romie your concerns — we'll tell you whether {d.name_en} is the right call, or suggest the closer alternative.</p>
        <WhatsAppCTA label="Ask your Concierge" payload={{ procedureName: d.name_en }} />
      </section>
    </>
  );
}

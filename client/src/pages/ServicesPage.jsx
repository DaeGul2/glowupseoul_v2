import db from '../data/db.js';
import { navigate } from '../App.jsx';
import WhatsAppCTA from '../components/WhatsAppCTA.jsx';
import { useSeo, breadcrumbLd } from '../utils/seo.js';

const CARE_CATEGORIES = [
  { slug: 'skin',     title: 'Laser & Skin Resurfacing',   blurb: 'PicoSure, CO2 fractional, IPL.' },
  { slug: 'skin',     title: 'Injectables & Skin Boosters', blurb: 'Botox, fillers, Rejuran, Juvelook.' },
  { slug: 'skin',     title: 'Medical-Grade Facials',       blurb: 'Aquapeel / hydrafacial, chemical peels.' },
  { slug: 'skin',     title: 'Acne & Scar Treatment',       blurb: 'CO2 fractional + Rejuran combo therapy.' },
  { slug: 'body',     title: 'Body Contouring (non-surgical)', blurb: 'CoolSculpting, EMSCULPT, RF body.' },
  { slug: 'hair',     title: 'Hair & Scalp Restoration',    blurb: 'PRP, scalp boosters, supplements.' },
];

const PREMIUM_CATEGORIES = [
  { slug: 'face',     title: 'Facial Contouring Surgery',   blurb: 'Zygoma reduction, genioplasty.' },
  { slug: 'eyes',     title: 'Eyelid Surgery',              blurb: 'Double eyelid (incision / non-incision), ptosis.' },
  { slug: 'nose',     title: 'Rhinoplasty',                 blurb: 'Bridge, tip, revision rhinoplasty.' },
  { slug: 'body',     title: 'Body Surgery',                blurb: 'LAMS liposuction, abdominoplasty.' },
  { slug: 'hair',     title: 'Hair Transplant',             blurb: 'FUE non-incisional hair transplant.' },
  { slug: 'dental',   title: 'Dental Implants & Ortho',     blurb: 'Implants, Invisalign, whitening.' },
];

export default function ServicesPage() {
  useSeo({
    title: 'Services — Care & Premium Care',
    description: 'Two tiers of curated Korean medical aesthetic services: HIFU lifting, rhinoplasty, double eyelid, skin boosters, dental implants and more. Eight body-area categories.',
    keywords: 'Korean services, HIFU, rhinoplasty, double eyelid, skin booster, dental implant, body contouring',
    canonical: '/services',
    jsonLd: breadcrumbLd([{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }]),
  });
  return (
    <>
      <section className="gs-hero" style={{ padding: '80px 28px 40px' }}>
        <div className="gs-eyebrow">◈ Services</div>
        <h1>From a 30-minute peel<br />to a <em>full surgical journey.</em></h1>
        <p>All matched through one coordinator. All for free to you — clinics pay us only when you book.</p>
      </section>

      <section className="gs-section" id="care">
        <div className="gs-section-head">
          <div className="gs-eyebrow">✦ Care · skin · non-surgical</div>
          <h2>Care.</h2>
          <p>Lasers, injectables, facials, body contouring (non-surgical), hair restoration.<br />Typical journey: 1–3 day trip.</p>
        </div>
        <div className="gs-services-grid">
          {CARE_CATEGORIES.map((c) => (
            <article key={c.title} className="gs-service-card" onClick={() => navigate(`/category/${c.slug}`)}>
              <div className="gs-eyebrow">Care</div>
              <h3>{c.title}</h3>
              <p>{c.blurb}</p>
              <span className="gs-service-link">Explore {db.categoryBySlug[c.slug]?.name_en} →</span>
            </article>
          ))}
        </div>
      </section>

      <section className="gs-section" style={{ background: 'var(--bg-soft)' }} id="premium">
        <div className="gs-section-head">
          <div className="gs-eyebrow">◈ Premium Care · surgical · ₩10M+</div>
          <h2>Premium <em>Care.</em></h2>
          <p>Includes everything in Care plus airport pickup, recovery lodging, medication logistics, and D+7 / D+30 post-op check-ins.<br />Typical journey: 7–14 day trip.</p>
        </div>
        <div className="gs-services-grid">
          {PREMIUM_CATEGORIES.map((c) => (
            <article key={c.title} className="gs-service-card gs-service-card--premium" onClick={() => navigate(`/category/${c.slug}`)}>
              <div className="gs-eyebrow">Premium</div>
              <h3>{c.title}</h3>
              <p>{c.blurb}</p>
              <span className="gs-service-link">Explore {db.categoryBySlug[c.slug]?.name_en} →</span>
            </article>
          ))}
        </div>
      </section>

      <section className="gs-section">
        <div className="gs-section-head">
          <div className="gs-eyebrow">◇ What's never on the menu</div>
          <h2>Three things you'll <em>never see</em> here.</h2>
        </div>
        <div className="gs-tier-grid">
          <div className="gs-pillar">
            <h3>✕ Booking calendars.</h3>
            <p>No instant-book buttons. Every booking goes through your coordinator so we can confirm doctor availability, prep instructions, and trip dates.</p>
          </div>
          <div className="gs-pillar">
            <h3>✕ Anonymous reviews.</h3>
            <p>We don't crowdsource stars. Every clinic was visited by our team, vetted on safety record, doctor credentials, and English-speaking capability.</p>
          </div>
          <div className="gs-pillar">
            <h3>✕ Up-selling.</h3>
            <p>We're paid the same regardless of how many add-ons a clinic suggests. If a coordinator ever pushes a procedure, that's a fireable offense — message Romie directly.</p>
          </div>
        </div>
      </section>

      <section className="gs-cta-strip">
        <h2>Not sure which tier <em>fits?</em></h2>
        <p>Send us your concern — we'll tell you in one reply.</p>
        <WhatsAppCTA label="Ask your Concierge" />
      </section>
    </>
  );
}

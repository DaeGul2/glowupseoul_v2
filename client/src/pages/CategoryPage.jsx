import { useMemo, useState } from 'react';
import db from '../data/db.js';
import { navigate } from '../App.jsx';
import TreatmentCard from '../components/TreatmentCard.jsx';
import { useSeo, breadcrumbLd } from '../utils/seo.js';

const INTENSITY = [
  { key: 'all',       label: 'All' },
  { key: 'subtle',    label: 'Subtle' },
  { key: 'moderate',  label: 'Moderate' },
  { key: 'dramatic',  label: 'Dramatic' },
];
const PRICE_TIERS = ['all','$','$$','$$$','$$$$'];

export default function CategoryPage({ slug }) {
  const cat = db.categoryBySlug[slug];
  useSeo({
    title: cat ? `${cat.name_en} — Korean clinic services` : 'Category',
    description: cat
      ? `Curated Korean ${cat.name_en?.toLowerCase()} treatments in Seoul. Compare HIFU, thread lifting, filler, surgical and skin-tier procedures. Concierge handled end to end.`
      : undefined,
    canonical: `/category/${slug}`,
    ogType: 'website',
    jsonLd: cat ? [
      breadcrumbLd([
        { name: 'Home', url: '/' },
        { name: 'Services', url: '/services' },
        { name: cat.name_en, url: `/category/${slug}` },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${cat.name_en} treatments in Seoul`,
        url: `https://glowupseoul.com/category/${slug}`,
        about: cat.name_en,
      },
    ] : null,
  });
  const [intensity, setIntensity] = useState('all');
  const [tier, setTier] = useState('all');
  const [activeConcern, setActiveConcern] = useState(null);

  const concerns = db.concernsForCategory(slug);

  const rows = useMemo(() => {
    let list = db.topOfferingsByCategory(slug);
    if (intensity !== 'all') list = list.filter((r) => r.procedure.intensity === intensity);
    if (tier !== 'all') list = list.filter((r) => r.offerings.some((o) => o.hp.price_tier === tier));
    if (activeConcern) {
      const ids = new Set(db.proceduresForConcern(activeConcern).map((cp) => cp.procedure_id));
      list = list.filter((r) => ids.has(r.procedure.id));
    }
    return list;
  }, [slug, intensity, tier, activeConcern]);

  if (!cat) return <div className="gs-section"><p>Unknown category.</p></div>;

  return (
    <>
      <section className="gs-section">
        <button className="gs-back" onClick={() => navigate('/')}>← Back</button>
        <div className="gs-section-head" style={{ textAlign: 'left', marginBottom: 24 }}>
          <div className="gs-eyebrow">{cat.name_en} · {cat.domain.replace(/_/g, ' ')}</div>
          <h2 style={{ fontSize: 56 }}>{cat.name_ko} — <em>{cat.name_en}</em></h2>
          <p style={{ margin: '16px 0 0' }}>{rows.length} treatments · curated for foreign patients with intl coordinator support.</p>
        </div>

        <div className="gs-filter-bar">
          <div className="gs-filter-group">
            <label>Intensity</label>
            {INTENSITY.map((i) => (
              <span key={i.key} className={`gs-chip ${intensity === i.key ? 'active' : ''}`} onClick={() => setIntensity(i.key)}>{i.label}</span>
            ))}
          </div>
          <div className="gs-filter-group">
            <label>Price</label>
            {PRICE_TIERS.map((t) => (
              <span key={t} className={`gs-chip ${tier === t ? 'active' : ''}`} onClick={() => setTier(t)}>{t === 'all' ? 'All' : t}</span>
            ))}
          </div>
          {concerns.length > 0 && (
            <div className="gs-filter-group">
              <label>Concern</label>
              <span className={`gs-chip ${activeConcern == null ? 'active' : ''}`} onClick={() => setActiveConcern(null)}>Any</span>
              {concerns.map((c) => (
                <span key={c.id} className={`gs-chip ${activeConcern === c.id ? 'active' : ''}`} onClick={() => setActiveConcern(c.id)}>{c.name_ko}</span>
              ))}
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="gs-empty">No treatments match these filters. Try widening intensity or price.</div>
        ) : (
          <div className="gs-treatment-grid">
            {rows.map((r) => (
              <TreatmentCard key={r.procedure.id} {...r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

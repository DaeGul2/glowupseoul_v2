// Treatment-name grid for the homepage.
// Parallel pattern to DeviceCategories — patients also search by *procedure*
// name (e.g. "HIFU lifting", "thread lift", "acne scars treatment"), not just
// device brand. Shows procedures that at least one partner currently offers.
//
// Uses .gs-procard-* CSS (procedure-card). Distinct from legacy .gs-treatment-*
// used by TreatmentCard / MagazineTreatments — different visual treatment.
import db from '../data/db.js';
import { navigate } from '../App.jsx';

function fmtRange(min, max) {
  if (min == null) return '상담';
  const toMan = (n) => `${(n / 10000).toFixed(0)}만`;
  return min === max ? `₩${toMan(min)}` : `₩${toMan(min)} – ${toMan(max)}`;
}

export default function TreatmentCategories({ limit = 12, variant = 'grid' }) {
  const items = db.procedures
    .map((p) => {
      const offerings = db.offeringsForProcedure(p.id);
      if (offerings.length === 0) return null;
      const sigCount   = offerings.filter((o) => o.hp.is_signature).length;
      const eventCount = offerings.filter((o) => o.hp.has_active_event).length;
      const score = offerings.length * 10 + sigCount * 6 + eventCount * 3;
      const priceRange = db.priceRangeForProcedure(p.id);
      const category = p.category_id ? db.categoryById[p.category_id] : null;
      return { procedure: p, offerings, sigCount, eventCount, priceRange, category, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (items.length === 0) return null;
  const containerClass = variant === 'scroll' ? 'gs-hscroll' : 'gs-procard-grid';

  return (
    <div className={containerClass}>
      {items.map((it, i) => {
        const p = it.procedure;
        const clinicCount = it.offerings.length;
        const img = p.hero_image_url || p.thumbnail_url || '';
        return (
          <button
            key={p.slug}
            className="gs-procard"
            onClick={() => navigate(`/treatment/${p.slug}`)}
          >
            <div className="gs-procard-bg" style={{ backgroundImage: `url(${img})` }} />
            <div className="gs-procard-tint" />
            <div className="gs-procard-body">
              <div className="gs-procard-top">
                <span className="gs-procard-idx">{String(i + 1).padStart(2, '0')}</span>
                {it.sigCount > 0 && <span className="gs-procard-badge gs-procard-badge--signature">⭐ signature</span>}
                {it.eventCount > 0 && <span className="gs-procard-badge gs-procard-badge--event">event</span>}
              </div>
              <div className="gs-procard-name-wrap">
                <span className="gs-procard-name-en">{p.name_en || p.name_ko}</span>
                <span className="gs-procard-name-ko">{p.name_ko}</span>
              </div>
              <div className="gs-procard-meta">
                {it.category && <span className="gs-procard-cat">{it.category.name_en || it.category.name_ko}</span>}
                <span className="gs-procard-stats">
                  <strong>{clinicCount}</strong> {clinicCount === 1 ? 'clinic' : 'clinics'} · from <strong>{fmtRange(it.priceRange?.min, it.priceRange?.max)}</strong>
                </span>
              </div>
            </div>
            <span className="gs-procard-arrow">→</span>
          </button>
        );
      })}
    </div>
  );
}

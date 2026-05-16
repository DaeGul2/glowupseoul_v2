import db from '../data/db.js';
import { navigate } from '../App.jsx';

function fmtRange(min, max) {
  if (min == null) return '상담';
  const toMan = (n) => `${(n / 10000).toFixed(0)}만`;
  return min === max ? `₩${toMan(min)}` : `₩${toMan(min)} – ${toMan(max)}`;
}

export default function DeviceCategories({ variant = 'grid' }) {
  const stats = db.devicesWithStats().filter((s) => s.match_count > 0);
  const containerClass = variant === 'scroll' ? 'gs-hscroll' : 'gs-device-grid';

  return (
    <div className={containerClass}>
      {stats.map((s, i) => {
        const d = s.device;
        return (
          <button
            key={d.slug}
            className="gs-device-card"
            onClick={() => navigate(`/device/${d.slug}`)}
          >
            <div className="gs-device-bg" style={{ backgroundImage: `url(${d.image})` }} />
            <div className="gs-device-tint" />
            <div className="gs-device-body">
              <div className="gs-device-top">
                <span className="gs-device-idx">{String(i + 1).padStart(2, '0')}</span>
                {d.badge && <span className={`gs-device-badge gs-device-badge--${d.badge}`}>{d.badge}</span>}
              </div>
              <div className="gs-device-name-wrap">
                <span className="gs-device-name-en">{d.name_en}</span>
                <span className="gs-device-name-ko">{d.name_ko}</span>
              </div>
              <div className="gs-device-meta">
                <span className="gs-device-mech">{d.mechanism_label_en}</span>
                <span className="gs-device-stats">
                  <strong>{s.clinic_count}</strong> {s.clinic_count === 1 ? 'clinic' : 'clinics'} · from <strong>{fmtRange(s.price_min, s.price_max)}</strong>
                </span>
              </div>
            </div>
            <span className="gs-device-arrow">→</span>
          </button>
        );
      })}
    </div>
  );
}

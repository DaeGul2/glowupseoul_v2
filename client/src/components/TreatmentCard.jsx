import { navigate } from '../App.jsx';

function fmtKRW(n) {
  if (n == null) return '—';
  if (n >= 10000) return `₩${(n/10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}만`;
  return `₩${n.toLocaleString()}`;
}

export default function TreatmentCard({ procedure, hospital_count, price_range, dark }) {
  const dt = procedure.downtime_days;
  const dtLabel = dt === 0 ? '다운타임 0일' : dt <= 3 ? `다운타임 ${dt}일` : dt <= 7 ? `${dt}일` : `${dt}일 +`;
  const intensity = procedure.intensity === 'subtle' ? '자연' : procedure.intensity === 'dramatic' ? '드라마틱' : '모더레이트';

  return (
    <article className={`gs-treatment-card ${dark ? 'gs-treatment-card--dark' : ''}`} onClick={() => navigate(`/treatment/${procedure.slug}`)}>
      <div className="thumb" style={{ backgroundImage: `url(${procedure.thumbnail_url})` }} />
      <div className="body">
        <h3>{procedure.name_ko} <em>· {procedure.name_en}</em></h3>
        <div className="meta">
          <span>{intensity}</span>
          <span>{dtLabel}</span>
          <span>Pain {procedure.pain_level}/5</span>
        </div>
        <div className="price">
          <div>
            <div className="from">From</div>
            <div className="amt">{price_range ? fmtKRW(price_range.min) : '상담'}</div>
          </div>
          <div className="hospital-count">{hospital_count} clinics →</div>
        </div>
      </div>
    </article>
  );
}

import { useState } from 'react';
import ClinicDetailModal from './ClinicDetailModal.jsx';

export default function MatchResults({ matches, loading, snapshot, onRestart }) {
  const [selected, setSelected] = useState(null);

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-pulse" />
        <div className="loader-text">당신에게 어울리는 시술을 찾고 있어요…</div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="empty">
        <span className="symbol">◎</span>
        조건에 맞는 시술을 찾지 못했어요.<br />
        예산이나 다운타임 범위를 조정해보세요.
        <button className="secondary" style={{ marginTop: 28 }} onClick={onRestart}>
          다시 입력
        </button>
      </div>
    );
  }

  return (
    <div>
      {snapshot && (
        <div className="results-portrait">
          <img src={snapshot} alt="Your face scan" />
          <div className="portrait-meta">
            <div className="portrait-label">YOUR SCAN</div>
            <div className="portrait-sub">
              윤곽 분석 완료<br />
              <em>맞춤 추천이 준비됐어요</em>
            </div>
          </div>
        </div>
      )}

      <div className="results-header">
        <span className="results-count">{matches.length}</span>
        <span className="eyebrow" style={{ margin: 0 }}>matches</span>
      </div>
      <p className="subtitle" style={{ marginBottom: 24 }}>
        AI가 분석한 <em>당신만을 위한</em> 시술
      </p>

      {matches.map((m, i) => (
        <div key={m.id} className="match-card">
          <div className="match-rank">No.{String(i + 1).padStart(2, '0')}</div>
          <div className="match-clinic">
            {m.clinicName} · {m.clinicArea} · <span className="star">★</span> {m.clinicRating}
          </div>
          <div className="match-name">{m.name}</div>

          <div className="match-prices">
            <span className="event-price">{m.eventPrice.toLocaleString()}원</span>
            <span className="original-price">{m.originalPrice.toLocaleString()}원</span>
            {m.discount > 0 && <span className="discount-badge">{m.discount}% OFF</span>}
          </div>

          <div className="match-meta">
            <span className="meta-tag">
              다운타임 {m.downtimeDays === 0 ? '없음' : `${m.downtimeDays}일`}
            </span>
            <span className="meta-tag">통증 {m.painLevel}/5</span>
            <span className="meta-tag">스타일 {m.style}/5</span>
            {m.concerns.slice(0, 2).map(c => (
              <span key={c} className="meta-tag">#{c}</span>
            ))}
          </div>

          <div className="match-reason">"{m.reason}"</div>

          <div className="match-actions">
            <button className="detail-btn" onClick={() => setSelected(m)}>
              자세히 보기 →
            </button>
          </div>
        </div>
      ))}

      <button className="secondary" onClick={onRestart} style={{ marginTop: 28 }}>
        다시 매칭하기
      </button>

      {selected && (
        <ClinicDetailModal match={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

import { useEffect } from 'react';

const WHATSAPP_NUMBER = '821073863249'; // 국가코드 + 번호, 하이픈 없이

function buildWhatsAppMessage(match) {
  const lines = [
    '[Glow Up Seoul 시술 상담 문의]',
    '',
    `▸ 병원: ${match.clinicName} (${match.clinicArea})`,
    `▸ 시술: ${match.name}`,
    `▸ 가격: ${match.eventPrice.toLocaleString()}원 (정가 ${match.originalPrice.toLocaleString()}원)`,
    `▸ 다운타임: ${match.downtimeDays === 0 ? '없음' : `${match.downtimeDays}일`}`,
    `▸ 통증: ${match.painLevel}/5`,
    '',
    '문의드립니다 :)'
  ];
  return lines.join('\n');
}

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// 기기연결(QR) 페이지로 안 빠지게:
// - 모바일: whatsapp:// 스킴 → 네이티브 앱 즉시 실행
// - 데스크탑: WhatsApp Desktop 설치돼있으면 whatsapp:// 가 동작, 미설치면 web.whatsapp.com 으로 폴백
function openWhatsApp(match) {
  const text = encodeURIComponent(buildWhatsAppMessage(match));
  const phone = WHATSAPP_NUMBER;
  const native = `whatsapp://send?phone=${phone}&text=${text}`;
  const web = `https://web.whatsapp.com/send?phone=${phone}&text=${text}`;

  if (isMobile()) {
    // 모바일은 네이티브 스킴이 항상 통함
    window.location.href = native;
    return;
  }

  // 데스크탑: 네이티브 시도 → 실패 시(2초 내 blur 없음) 웹으로 폴백
  let opened = false;
  const onBlur = () => {
    opened = true;
  };
  window.addEventListener('blur', onBlur, { once: true });

  window.location.href = native;

  setTimeout(() => {
    window.removeEventListener('blur', onBlur);
    if (!opened) {
      window.open(web, '_blank', 'noopener,noreferrer');
    }
  }, 1500);
}

export default function ClinicDetailModal({ match, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!match) return null;

  const downtimeLabel = match.downtimeDays === 0 ? '없음' : `${match.downtimeDays}일`;
  const painLabel = ['', '아주 약함', '약함', '보통', '강함', '매우 강함'][match.painLevel];
  const styleLabel = ['', '자연', '약간', '중간', '뚜렷', '드라마틱'][match.style];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        {match.clinicHeroImage && (
          <img
            className="modal-hero"
            src={match.clinicHeroImage}
            alt={match.clinicName}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}

        <div className="modal-body">
          <div className="modal-tag">✦ {match.clinicArea}</div>
          <h2 className="modal-name">{match.clinicName}</h2>
          <div className="modal-meta">
            <span className="star">★</span>
            <span>{match.clinicRating}</span>
            <span>·</span>
            <span>{match.clinicAddress || ''}</span>
          </div>
          {match.clinicDescription && (
            <p className="modal-desc">"{match.clinicDescription}"</p>
          )}

          {match.clinicHighlights && match.clinicHighlights.length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">
                <span className="symbol">◈</span>병원 특징
              </div>
              <ul className="highlight-list">
                {match.clinicHighlights.map((h, i) => (
                  <li key={i}>
                    <span className="symbol">◇</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-section">
            <div className="modal-section-title">
              <span className="symbol">⬡</span>시술 상세
            </div>
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22,
                  fontWeight: 500,
                  marginBottom: 6
                }}
              >
                {match.name}
              </div>
              {match.description && (
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-2)',
                    lineHeight: 1.65,
                    marginBottom: 12
                  }}
                >
                  {match.description}
                </div>
              )}
            </div>
            <div className="treatment-summary">
              <div className="summary-row">
                <span className="label">이벤트가</span>
                <span className="value price">{match.eventPrice.toLocaleString()}원</span>
              </div>
              <div className="summary-row">
                <span className="label">정가</span>
                <span
                  className="value"
                  style={{ textDecoration: 'line-through', color: 'var(--text-dim)' }}
                >
                  {match.originalPrice.toLocaleString()}원
                </span>
              </div>
              {match.discount > 0 && (
                <div className="summary-row">
                  <span className="label">할인율</span>
                  <span className="value" style={{ color: 'var(--accent-deep)' }}>
                    {match.discount}% OFF
                  </span>
                </div>
              )}
              <div className="summary-row">
                <span className="label">다운타임</span>
                <span className="value">{downtimeLabel}</span>
              </div>
              <div className="summary-row">
                <span className="label">통증</span>
                <span className="value">
                  {painLabel} ({match.painLevel}/5)
                </span>
              </div>
              <div className="summary-row">
                <span className="label">스타일</span>
                <span className="value">
                  {styleLabel} ({match.style}/5)
                </span>
              </div>
              <div className="summary-row">
                <span className="label">고민 카테고리</span>
                <span className="value">{match.concerns.join(', ')}</span>
              </div>
            </div>
          </div>

          {match.reason && (
            <div className="modal-section">
              <div className="modal-section-title">
                <span className="symbol">☽</span>AI 추천 이유
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: 'var(--text-2)',
                  lineHeight: 1.7,
                  margin: 0
                }}
              >
                "{match.reason}"
              </p>
            </div>
          )}

          <div className="cta-fixed">
            <button
              type="button"
              className="whatsapp-btn"
              onClick={() => openWhatsApp(match)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp 으로 상담하기
            </button>
            <div className="cta-note">상담은 무료이며, 영업 메시지가 아닙니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

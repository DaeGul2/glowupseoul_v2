import { useEffect, useState } from 'react';
import { navigate } from '../App.jsx';

// 우측 하단 floating CTA — 한국 클리닉 운영자 타겟.
// 외국 환자용 메인 흐름은 영문 톤 그대로 가고, 이거는 한국어로 분리.
// 닫기 누르면 session 동안 안 뜸 (sessionStorage). 새 탭/창에서는 다시 뜸.

const DISMISS_KEY = 'gs_v2_partner_fab_dismissed';

const WHATSAPP_TEXT = encodeURIComponent(
  `[글러업서울 · 파트너 문의]\n\n안녕하세요, ${''}\n저희 병원도 외국 환자 받아보고 싶어서 연락드립니다.\n\n· 병원 이름:\n· 위치:\n· 주요 시술:\n· 외국어 응대 가능 여부:\n\n편한 시간에 전화 부탁드립니다.`
);
const WA_HREF = `https://wa.me/821064871060?text=${WHATSAPP_TEXT}`;

export default function PartnerFloating() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem(DISMISS_KEY)) setDismissed(true); } catch {}
    // 7초 뒤 한 번 hint 살짝 띄움 (살아있다는 신호)
    const t = setTimeout(() => setHint(true), 7000);
    const t2 = setTimeout(() => setHint(false), 12000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  function dismiss() {
    setOpen(false);
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
  }

  if (dismissed) return null;

  return (
    <div className={`gs-pf-wrap ${open ? 'gs-pf-wrap--open' : ''}`}>

      {open && (
        <div className="gs-pf-card" role="dialog" aria-label="파트너 등록 안내">
          <button className="gs-pf-close" onClick={dismiss} aria-label="닫기">×</button>

          <div className="gs-pf-flag">FOR CLINICS · 한국어 안내</div>

          <h3 className="gs-pf-h">
            원장님,<br />
            <em>외국 환자 응대,</em><br />
            저희가 대신합니다.
          </h3>

          <div className="gs-pf-sub">
            보건복지부 정식 등록 · 외국인 환자 유치 에이전시
          </div>

          <p className="gs-pf-p">
            지난 3년 <em>25개국 500명+</em> 외국 환자를 한국 병원에 연결해드렸습니다.
            현재는 강남·청담·부산 <em>22개 병원</em>과 함께하고 있어요.
          </p>

          <p className="gs-pf-p">
            환자 모객부터 다국어 상담, 공항 픽업, 통역, 사후 관리까지 — 외국 환자 응대 전 과정을 저희가 직접 운영합니다.
            원장님은 <em>진료에만 집중</em>하시면 됩니다.
          </p>

          <div className="gs-pf-cta-row">
            <button
              className="gs-pf-cta-primary"
              onClick={() => { setOpen(false); navigate('/partner'); }}
            >
              파트너 신청하기 <span className="arrow">→</span>
            </button>
            <a
              className="gs-pf-cta-secondary"
              href={WA_HREF}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              먼저 통화로 문의 <span className="arrow">→</span>
            </a>
          </div>

          <div className="gs-pf-fineprint">
            ◇ 자동 등록 아님 · 운영팀 직접 심사 · 평균 2일 내 회신
          </div>
        </div>
      )}

      <button
        className={`gs-pf-fab ${hint && !open ? 'gs-pf-fab--hint' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? (
          <>접기</>
        ) : (
          <>
            <span className="gs-pf-fab-sym">✦</span>
            <span className="gs-pf-fab-text">
              <span className="gs-pf-fab-line1">병원이세요?</span>
              <span className="gs-pf-fab-line2">파트너 등록 안내</span>
            </span>
            <span className="gs-pf-fab-plus">+</span>
          </>
        )}
      </button>
    </div>
  );
}

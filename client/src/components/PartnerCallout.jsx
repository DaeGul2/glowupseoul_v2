import { navigate } from '../App.jsx';

// B2B 섹션 — 한국어 전용 (타겟: 강남/부산 클리닉 운영자·마케터)
// 외국 환자용 메인 흐름 안에 끼지만 시각·언어 모두 명확히 구분.

const STATS = [
  { num: '500+',    label: '누적 외국인 환자' },
  { num: '25+',     label: '국가' },
  { num: '22',      label: '현 파트너 클리닉' },
  { num: '10,000+', label: '평가한 클리닉' },
];

const STEPS = [
  { n: '01', t: '신청서 제출',    s: '5분 다단계 폼. 시술 메뉴·가격·언어 지원 등 한 번에.' },
  { n: '02', t: '수기 검토',      s: '운영자 Min 이 직접 검토. 안전 기록·면허·외국인 응대력 확인. 평균 48h.' },
  { n: '03', t: '온/오프 미팅',   s: '커미션·운영 룰·기술 핸드오프 협의. 강남 본사 또는 줌.' },
  { n: '04', t: '등록 + 노출',    s: '카테고리/디바이스/매칭 전 화면에 자동 노출. 외국 환자 컨시어지 시작.' },
];

export default function PartnerCallout() {
  return (
    <section className="gs-partner-callout">
      <div className="gs-partner-bg" />
      <div className="gs-partner-inner">

        <div className="gs-partner-l">
          <div className="gs-partner-flag">FOR CLINICS · 한국어 안내</div>
          <h2 className="gs-partner-h">
            병원이신가요?<br />
            <em>외국 환자 매칭,</em><br />
            저희가 합니다.
          </h2>
          <p className="gs-partner-lede">
            <em>보건복지부 등록</em> 외국인 환자 유치 에이전시.
            500명+ 외국 환자, 25개국 — 우리가 운영하는 풀세트 컨시어지 트래픽을
            <em> 핸드픽 22개 클리닉</em>에만 흘려보냅니다.
          </p>
          <p className="gs-partner-lede">
            AI 얼굴 스캔 → 매칭 → 다국어 상담 → 공항 픽업 → 사후 관리까지
            환자 저니 <em>전체</em>를 저희가 직접 운영합니다.
            병원은 진료에만 집중하시면 됩니다.
          </p>

          <div className="gs-partner-cta-row">
            <button className="gs-cta gs-cta--lg" onClick={() => navigate('/partner')}>
              <span>✦ 파트너 신청하기</span>
              <span className="gs-cta-tail">→</span>
            </button>
            <a className="gs-cta gs-cta--outline" href="https://wa.me/821064871060?text=%5B%EA%B8%80%EB%9F%AC%EC%97%85%EC%84%9C%EC%9A%B8%20%ED%8C%8C%ED%8A%B8%EB%84%88%20%EB%AC%B8%EC%9D%98%5D%20%EC%97%B0%EB%9D%BD%EC%B2%98%20%EB%A8%BC%EC%A0%80%20%EC%A3%BC%EA%B3%A0%20%EC%8B%B6%EC%96%B4%EC%9A%94." target="_blank" rel="noreferrer" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>
              먼저 상담받기 →
            </a>
          </div>

          <div className="gs-partner-fineprint">
            ◇ 수기 검토 · 자동 등록 없음 · 평균 48시간 회신 · 한국어/영어/中文 응대 가능
          </div>
        </div>

        <div className="gs-partner-r">
          <div className="gs-partner-r-head">
            <div className="gs-eyebrow" style={{ color: 'var(--gold-light)' }}>등록 절차</div>
            <h3>네 단계로 끝.</h3>
          </div>
          <ol className="gs-partner-steps">
            {STEPS.map((s) => (
              <li key={s.n} className="gs-partner-step">
                <span className="gs-partner-step-n">{s.n}</span>
                <div>
                  <h4>{s.t}</h4>
                  <p>{s.s}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

      </div>

      {/* 하단 stat bar */}
      <div className="gs-partner-stats">
        {STATS.map((s) => (
          <div key={s.label} className="gs-partner-stat">
            <strong>{s.num}</strong>
            <span>{s.label}</span>
          </div>
        ))}
        <div className="gs-partner-stat gs-partner-stat--cta">
          <span style={{ color: 'var(--gold-light)' }}>커미션 협의 가능 · 월 결제 디폴트</span>
          <button className="gs-partner-stat-link" onClick={() => navigate('/partner')}>자세히 보기 →</button>
        </div>
      </div>
    </section>
  );
}

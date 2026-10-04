// 상담(CS) 업무 화면 — 껍데기(UI)만. 실제 메시지 연동(WhatsApp/WeChat/Instagram)은
// 다음 단계. 지금은 샘플 대화로 흐름만 보여주고, 어떤 것도 서버에 저장하지 않는다.
import { useMemo, useState } from 'react';

const CHANNELS = [
  { k: 'all', label: '전체' },
  { k: 'whatsapp', label: 'WhatsApp' },
  { k: 'wechat', label: 'WeChat' },
  { k: 'instagram', label: 'Instagram' },
  { k: 'email', label: '이메일' },
];
const STAGES = ['신규 문의', '상담 중', '견적 안내', '예약 확정', '사후 관리'];

const SAMPLE = [
  {
    id: 1, name: 'Sarah L.', country: '영국', lang: 'EN', ch: 'whatsapp', stage: 1, unread: 2, at: '10:24',
    interest: ['Ulthera', 'Rejuran'], dates: '10/22 – 10/26', budget: '₩1,000,000 내외', owner: '새롬',
    msgs: [
      ['in', 'Hi! I saw your site — thinking about Ulthera in October.', '10:18'],
      ['in', 'Is there downtime? I fly back on the 26th.', '10:24'],
    ],
  },
  {
    id: 2, name: '王 小姐', country: '중국', lang: '中文', ch: 'wechat', stage: 2, unread: 0, at: '09:51',
    interest: ['Rhinoplasty'], dates: '11월 중순', budget: '상담 후 결정', owner: '새롬',
    msgs: [
      ['in', '你好，我想了解鼻整形的费用。', '09:40'],
      ['out', '您好！这是参考价格，具体以医院面诊为准。', '09:51'],
    ],
  },
  {
    id: 3, name: 'Alysa N.', country: '싱가포르', lang: 'EN', ch: 'instagram', stage: 0, unread: 1, at: '어제',
    interest: ['Pico Laser'], dates: '미정', budget: '-', owner: '-',
    msgs: [['in', 'Do you help with pigmentation? 🙏', '어제 22:10']],
  },
  {
    id: 4, name: 'Michelle K.', country: '호주', lang: 'EN', ch: 'email', stage: 4, unread: 0, at: '월',
    interest: ['Double Eyelid Surgery'], dates: '9/30 – 10/10', budget: '₩1,500,000', owner: '새롬',
    msgs: [
      ['out', 'Day 2 — how are you feeling today?', '월 11:04'],
      ['in', 'Much better, thank you!', '월 11:30'],
    ],
  },
];

const QUICK = [
  { t: '첫 인사', body: "Hi! I'm Romie from Glow Up Seoul. Tell me your concern and travel dates — I'll send a hand-picked shortlist." },
  { t: '가격 안내', body: 'Prices on our site are reference prices — your clinic confirms the final price after consultation.' },
  { t: '일정 확인', body: 'Could you share your arrival and departure dates?' },
  { t: '사후 체크인', body: 'Checking in — how are you feeling today?' },
];

export default function CsAdmin() {
  const [ch, setCh] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(1);
  const [draft, setDraft] = useState('');
  const [stageOver, setStageOver] = useState({});
  const [memo, setMemo] = useState({});

  const list = useMemo(() => SAMPLE.filter((c) => (ch === 'all' || c.ch === ch)
    && (!q.trim() || `${c.name} ${c.country} ${c.interest.join(' ')}`.toLowerCase().includes(q.trim().toLowerCase()))), [ch, q]);
  const cur = SAMPLE.find((c) => c.id === sel) || SAMPLE[0];
  const stage = stageOver[cur.id] ?? cur.stage;

  return (
    <div className="v3a-cs">
      <div className="v3a-cs-note">🧪 샘플 화면입니다 — 실제 메시지 연동(WhatsApp · WeChat · Instagram)은 다음 단계에서 붙입니다. 여기서 입력한 내용은 저장되지 않아요.</div>

      <div className="v3a-cs-kpis">
        <div><span>오늘 신규 문의</span><b>3</b></div>
        <div><span>답장 대기</span><b className="warn">2</b></div>
        <div><span>평균 첫 응답</span><b>2시간 10분</b></div>
        <div><span>이번 주 예약 전환</span><b>4건</b></div>
      </div>

      <div className="v3a-cs-grid">
        {/* inbox */}
        <aside className="v3a-cs-inbox">
          <input className="v3a-cs-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · 국가 · 시술 검색" />
          <div className="v3a-cs-chs">
            {CHANNELS.map((c) => (
              <button key={c.k} className={ch === c.k ? 'on' : ''} onClick={() => setCh(c.k)}>{c.label}</button>
            ))}
          </div>
          <div className="v3a-cs-list">
            {list.map((c) => (
              <button key={c.id} className={`v3a-cs-item ${c.id === cur.id ? 'on' : ''}`} onClick={() => setSel(c.id)}>
                <span className={`av ch-${c.ch}`}>{c.name[0]}</span>
                <span className="mid">
                  <b>{c.name} <em>{c.country}</em></b>
                  <i>{c.msgs[c.msgs.length - 1][1]}</i>
                </span>
                <span className="right">
                  <small>{c.at}</small>
                  {c.unread > 0 && <span className="badge">{c.unread}</span>}
                </span>
              </button>
            ))}
            {list.length === 0 && <div className="v3a-cs-empty">조건에 맞는 대화가 없어요.</div>}
          </div>
        </aside>

        {/* thread */}
        <section className="v3a-cs-thread">
          <div className="v3a-cs-thead">
            <div><b>{cur.name}</b> <span className={`chip ch-${cur.ch}`}>{CHANNELS.find((x) => x.k === cur.ch)?.label}</span></div>
            <span className="stage">{STAGES[stage]}</span>
          </div>
          <div className="v3a-cs-msgs">
            {cur.msgs.map(([dir, txt, at], i) => (
              <div key={i} className={`v3a-cs-msg ${dir}`}><p>{txt}</p><small>{at}</small></div>
            ))}
          </div>
          <div className="v3a-cs-quick">
            {QUICK.map((x) => <button key={x.t} onClick={() => setDraft(x.body)}>{x.t}</button>)}
          </div>
          <div className="v3a-cs-compose">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="답장을 입력하세요 (빠른 답변 버튼을 누르면 자동으로 채워져요)" rows={3} />
            <button disabled title="메시지 연동 후 사용할 수 있어요">보내기</button>
          </div>
        </section>

        {/* customer card */}
        <aside className="v3a-cs-side">
          <div className="v3a-cs-card">
            <div className="h">고객 정보</div>
            <dl>
              <div><dt>국가 · 언어</dt><dd>{cur.country} · {cur.lang}</dd></div>
              <div><dt>관심 시술</dt><dd>{cur.interest.join(', ')}</dd></div>
              <div><dt>희망 일정</dt><dd>{cur.dates}</dd></div>
              <div><dt>예산</dt><dd>{cur.budget}</dd></div>
              <div><dt>담당자</dt><dd>{cur.owner}</dd></div>
            </dl>
          </div>
          <div className="v3a-cs-card">
            <div className="h">진행 단계</div>
            <div className="v3a-cs-stages">
              {STAGES.map((s, i) => (
                <button key={s} className={`${i < stage ? 'done' : ''} ${i === stage ? 'now' : ''}`}
                  onClick={() => setStageOver((m) => ({ ...m, [cur.id]: i }))}>
                  <i>{i < stage ? '✓' : i + 1}</i>{s}
                </button>
              ))}
            </div>
          </div>
          <div className="v3a-cs-card">
            <div className="h">메모</div>
            <textarea value={memo[cur.id] || ''} onChange={(e) => setMemo((m) => ({ ...m, [cur.id]: e.target.value }))}
              placeholder="예: 10/24 오후 상담 선호, 통역 필요" rows={4} />
          </div>
        </aside>
      </div>
    </div>
  );
}

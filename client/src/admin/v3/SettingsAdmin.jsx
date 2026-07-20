// 운영 설정 — 알림 채널(CallMeBot) + 부킹 동작. DB(settings 테이블)에 저장,
// 값이 비면 서버 .env 폴백. 저장 즉시 서버 캐시 무효화 → 재시작 불필요.
import { useEffect, useState } from 'react';
import { api } from './apiV3.js';

// 알림 채널(CallMeBot/이메일)은 당분간 미사용 — 운영자가 admin "부킹" 탭의
// "처리 대기" 섹션을 직접 확인하는 수동 워크플로우. 채널 붙일 때 그룹 복원.
const FIELDS = [
  {
    group: '부킹 동작',
    hint: '저장하면 서버 재시작 없이 바로 적용됩니다.',
    items: [
      { k: 'booking_enabled',        label: '부킹 접수', type: 'toggle', help: '끄면 사이트에서 새 신청을 받지 않습니다 (휴가·과부하 시).' },
      { k: 'booking_min_lead_days',  label: '최소 리드타임 (일)', type: 'number', ph: '3', help: '오늘로부터 며칠 뒤부터 희망일 선택 가능한지.' },
      { k: 'booking_max_ahead_days', label: '최대 예약 범위 (일)', type: 'number', ph: '180', help: '몇 일 앞까지 캘린더를 열어둘지.' },
    ],
  },
];

export default function SettingsAdmin() {
  const [stored, setStored] = useState(null);
  const [effective, setEffective] = useState({});
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function load() {
    setErr(null);
    try {
      const d = await api.settingsGet();
      setStored(d.stored || {});
      setEffective(d.effective || {});
      setDraft(d.stored || {});
    } catch (e) { setErr(e.message); setStored({}); }
  }
  useEffect(() => { load(); }, []);

  const get = (k) => (draft[k] !== undefined ? draft[k] : '');
  const set = (k, v) => { setDraft((d) => ({ ...d, [k]: v })); setMsg(null); };
  const dirty = stored && Object.keys(draft).some((k) => (draft[k] ?? '') !== (stored[k] ?? ''));

  async function save() {
    // 범위 검증 — 잘못된 값이 고객 캘린더를 잠그지 않게 (서버도 같은 범위로 클램프)
    const lead = draft.booking_min_lead_days !== undefined && draft.booking_min_lead_days !== '' ? Number(draft.booking_min_lead_days) : null;
    const ahead = draft.booking_max_ahead_days !== undefined && draft.booking_max_ahead_days !== '' ? Number(draft.booking_max_ahead_days) : null;
    if (lead != null && (!Number.isInteger(lead) || lead < 0 || lead > 60)) { setErr('최소 리드타임은 0~60 사이 정수여야 합니다.'); return; }
    if (ahead != null && (!Number.isInteger(ahead) || ahead < 7 || ahead > 365)) { setErr('최대 예약 범위는 7~365 사이 정수여야 합니다.'); return; }
    if (lead != null && ahead != null && ahead <= lead) { setErr('최대 예약 범위는 최소 리드타임보다 커야 합니다.'); return; }

    setBusy(true); setErr(null);
    try {
      await api.settingsPatch(draft);
      setMsg('저장됨 — 즉시 반영됩니다.');
      await load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (stored == null) return <div className="v3a-empty">불러오는 중…</div>;

  return (
    <div className="v3a-settings">
      <div className="v3a-list-top">
        <div>
          <h2>설정</h2>
          <p className="v3a-sub">알림 채널과 부킹 동작. 저장하면 서버 재시작 없이 바로 적용됩니다.</p>
        </div>
      </div>

      {err && <div className="v3a-error">{err}</div>}
      {msg && <div className="v3a-settings-ok">{msg}</div>}

      {FIELDS.map((g) => (
        <section className="v3a-sec" key={g.group}>
          <h3>{g.group}</h3>
          {g.hint && <p className="v3a-sec-hint">{g.hint}</p>}
          {g.items.map((f) => {
            const effectiveVal = effective[f.k];
            const usingFallback = !(stored[f.k] && String(stored[f.k]).trim());
            if (f.type === 'toggle') {
              const on = (get(f.k) || effectiveVal || '1') !== '0';
              return (
                <div className="v3a-settings-row" key={f.k}>
                  <div className="v3a-settings-lbl">{f.label}{f.help && <span className="v3a-field-help">{f.help}</span>}</div>
                  <button type="button" className={`v3a-settings-toggle ${on ? 'on' : ''}`} onClick={() => set(f.k, on ? '0' : '1')}>
                    <span className="knob" />{on ? '받는 중' : '중지됨'}
                  </button>
                </div>
              );
            }
            return (
              <div className="v3a-settings-row" key={f.k}>
                <div className="v3a-settings-lbl">{f.label}{f.help && <span className="v3a-field-help">{f.help}</span>}</div>
                <div className="v3a-settings-input">
                  <input type={f.type === 'number' ? 'number' : 'text'} value={get(f.k)} placeholder={f.ph}
                    onChange={(e) => set(f.k, e.target.value)} />
                  {usingFallback && effectiveVal && (
                    <span className="v3a-settings-fallback" title="DB에 값이 없어 서버 .env 값을 쓰는 중">서버 기본값 사용 중: {f.k === 'callmebot_apikey' ? '••••' : effectiveVal}</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}

      <div className="v3a-edit-actions">
        <button className="v3a-btn v3a-btn-primary v3a-btn-lg" disabled={busy || !dirty} onClick={save}>
          {busy ? '저장 중…' : '설정 저장'}
        </button>
      </div>
      <p className="v3a-sec-hint" style={{ marginTop: 10 }}>
        새 신청 알림은 현재 사용하지 않습니다 — "부킹" 탭 상단의 "처리 대기" 섹션(탭의 빨간 숫자)에서 직접 확인하세요.
      </p>
    </div>
  );
}

// 부킹 관리 — 달력(확정 기간 시각화) + 신청 목록 + 기간 확정/차단.
// 원칙: requested 는 날짜를 안 막는다. confirmed 기간만 차단.
import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from './apiV3.js';

/* ---------------- date helpers (all 'YYYY-MM-DD' strings) ---------------- */
const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const todayIso = () => { const t = new Date(); return iso(t.getFullYear(), t.getMonth() + 1, t.getDate()); };
const monthKey = (y, m) => `${y}-${pad(m)}`;
function addMonths(y, m, n) { const d = new Date(y, m - 1 + n, 1); return [d.getFullYear(), d.getMonth() + 1]; }
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
function firstWeekday(y, m) { return new Date(y, m - 1, 1).getDay(); } // 0=Sun
function eachDay(start, end, fn) {
  const d = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  for (let i = 0; i < 400 && d <= e; i++) { fn(iso(d.getFullYear(), d.getMonth() + 1, d.getDate())); d.setDate(d.getDate() + 1); }
}

const STATUS_META = {
  requested: { label: '대기',   cls: 'req'  },
  confirmed: { label: '확정',   cls: 'conf' },
  completed: { label: '완료',   cls: 'done' },
  cancelled: { label: '취소',   cls: 'off'  },
  declined:  { label: '거절',   cls: 'off'  },
};
const KIND_LABEL = { treatment: '시술', surgery: '수술', block: '차단' };

/* ---------------- month calendar ----------------
   marks: { 'YYYY-MM-DD': { conf: [booking...], reqN: number } }
   mode 'view' | 'range' (range: onPick(date) — 부모가 start/end 관리)      */
function MonthCal({ y, m, onNav, marks, mode = 'view', range = {}, onPick, onDayClick, selectedDay }) {
  const dim = daysInMonth(y, m);
  const lead = firstWeekday(y, m);
  const today = todayIso();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(iso(y, m, d));

  const inRange = (day) => range.start && range.end && day >= range.start && day <= range.end;

  return (
    <div className="v3a-bk-cal">
      <div className="v3a-bk-cal-head">
        <button type="button" onClick={() => onNav(-1)} aria-label="이전 달">‹</button>
        <div className="v3a-bk-cal-title">{y}년 {m}월</div>
        <button type="button" onClick={() => onNav(1)} aria-label="다음 달">›</button>
      </div>
      <div className="v3a-bk-cal-grid">
        {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
          <div key={w} className={`v3a-bk-cal-dow ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}>{w}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="v3a-bk-cal-cell empty" />;
          const mark = marks[day];
          const conf = mark?.conf?.length ? mark.conf : null;
          const isBlock = conf?.some((b) => b.item_kind === 'block');
          const cls = [
            'v3a-bk-cal-cell',
            day === today ? 'today' : '',
            conf ? (isBlock ? 'blocked-personal' : 'blocked') : '',
            mark?.reqN ? 'has-req' : '',
            mode === 'range' && range.start === day ? 'sel-start' : '',
            mode === 'range' && range.end === day ? 'sel-end' : '',
            mode === 'range' && inRange(day) ? 'sel-in' : '',
            selectedDay === day ? 'day-open' : '',
          ].filter(Boolean).join(' ');
          return (
            <button type="button" key={day} className={cls}
              onClick={() => (mode === 'range' ? onPick?.(day) : onDayClick?.(day))}
              title={conf ? conf.map((b) => `${b.code} ${b.item_name || ''}`).join('\n') : undefined}>
              <span className="n">{Number(day.slice(8))}</span>
              {conf && <span className="bar" />}
              {mark?.reqN > 0 && <span className="dot" title={`희망일 신청 ${mark.reqN}건`} />}
            </button>
          );
        })}
      </div>
      <div className="v3a-bk-cal-legend">
        <span><i className="lg lg-conf" /> 확정 (차단됨)</span>
        <span><i className="lg lg-block" /> 개인 일정 차단</span>
        <span><i className="lg lg-req" /> 희망일 신청 (미확정 — 차단 아님)</span>
      </div>
    </div>
  );
}

/* ---------------- range picker (확정용 미니 달력 + 인풋) ---------------- */
function RangePicker({ marks, excludeId, value, onChange }) {
  const t = new Date();
  const [[y, m], setYm] = useState([t.getFullYear(), t.getMonth() + 1]);
  // 겹침 시각화를 위해 자기 자신의 기존 확정은 marks 에서 제외
  const filtered = useMemo(() => {
    const out = {};
    for (const [day, v] of Object.entries(marks)) {
      const conf = (v.conf || []).filter((b) => b.id !== excludeId);
      if (conf.length || v.reqN) out[day] = { conf: conf.length ? conf : null, reqN: v.reqN };
    }
    return out;
  }, [marks, excludeId]);

  function pick(day) {
    const { start, end } = value;
    if (!start || (start && end)) onChange({ start: day, end: null });
    else onChange(day < start ? { start: day, end: start } : { start, end: day });
  }
  const conflict = useMemo(() => {
    if (!value.start) return false;
    const end = value.end || value.start;
    let hit = false;
    eachDay(value.start, end, (d) => { if (filtered[d]?.conf) hit = true; });
    return hit;
  }, [value, filtered]);

  return (
    <div className="v3a-bk-range">
      <MonthCal y={y} m={m} onNav={(n) => setYm(addMonths(y, m, n))} marks={filtered}
        mode="range" range={{ start: value.start, end: value.end || value.start }} onPick={pick} />
      <div className="v3a-bk-range-io">
        <label>시작일 <input type="date" value={value.start || ''} onChange={(e) => onChange({ ...value, start: e.target.value || null })} /></label>
        <label>종료일 <input type="date" value={value.end || ''} min={value.start || undefined} onChange={(e) => onChange({ ...value, end: e.target.value || null })} /></label>
      </div>
      {conflict && <div className="v3a-bk-conflict">⚠ 선택한 기간이 이미 확정된 일정과 겹칩니다 — 저장 시 거부됩니다.</div>}
      <p className="v3a-bk-range-hint">달력에서 시작일 → 종료일 순서로 클릭하세요. 하루짜리는 같은 날을 두 번.</p>
    </div>
  );
}

/* ---------------- row detail (확정/거절/메모) ---------------- */
function BookingDetail({ row, marks, onSaved, onError }) {
  const [range, setRange] = useState({ start: row.confirmed_start || row.requested_date || null, end: row.confirmed_end || null });
  const [note, setNote] = useState(row.admin_note || '');
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(row.status === 'requested');

  async function act(patch, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try { await api.bookingUpdate(row.id, patch); onSaved(); }
    catch (e) { onError(e.message); }
    finally { setBusy(false); }
  }

  const wa = row.whatsapp && row.whatsapp !== '-'
    ? `https://wa.me/${row.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi ${row.client_name || ''}! This is Romie from Glow Up Seoul — about your booking ${row.code} (${row.item_name}).`)}`
    : null;

  return (
    <div className="v3a-bk-detail">
      <div className="v3a-bk-detail-grid">
        <div className="v3a-bk-kv"><span>고객</span><b>{row.client_name || '—'} {row.country_code ? `(${row.country_code})` : ''}</b></div>
        <div className="v3a-bk-kv"><span>WhatsApp</span><b>{row.whatsapp || '—'}</b></div>
        {row.email && <div className="v3a-bk-kv"><span>이메일</span><b>{row.email}</b></div>}
        <div className="v3a-bk-kv"><span>희망일</span><b>{row.requested_date || '—'}</b></div>
        {row.confirmed_start && <div className="v3a-bk-kv"><span>확정 기간</span><b>{row.confirmed_start} ~ {row.confirmed_end}</b></div>}
        <div className="v3a-bk-kv"><span>접수</span><b>{row.created_at ? new Date(row.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '—'}</b></div>
      </div>
      {row.notes && <div className="v3a-bk-notes">📝 고객 메모: {row.notes}</div>}
      {wa && <a className="v3a-btn v3a-bk-wa" href={wa} target="_blank" rel="noreferrer">💬 고객에게 WhatsApp 보내기</a>}

      {row.item_kind !== 'block' && (
        <div className="v3a-bk-confirmbox">
          <button type="button" className="v3a-bk-confirm-toggle" onClick={() => setShowConfirm((s) => !s)}>
            {showConfirm ? '− 기간 확정 접기' : (row.status === 'confirmed' ? '＋ 확정 기간 변경' : '＋ 기간 확정하기')}
          </button>
          {showConfirm && (
            <>
              <RangePicker marks={marks} excludeId={row.id} value={range} onChange={setRange} />
              <button className="v3a-btn v3a-btn-primary" disabled={busy || !range.start}
                onClick={() => act({ status: 'confirmed', confirmed_start: range.start, confirmed_end: range.end || range.start })}>
                {busy ? '저장 중…' : `이 기간으로 확정 (${range.start || '?'} ~ ${range.end || range.start || '?'})`}
              </button>
            </>
          )}
        </div>
      )}

      <div className="v3a-bk-noterow">
        <textarea rows={2} placeholder="운영 메모 (고객에게 안 보임)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="v3a-btn" disabled={busy || note === (row.admin_note || '')} onClick={() => act({ admin_note: note })}>메모 저장</button>
      </div>

      <div className="v3a-bk-actions">
        {row.status === 'confirmed' && <button className="v3a-btn" disabled={busy} onClick={() => act({ status: 'completed' })}>완료 처리</button>}
        {['requested', 'confirmed'].includes(row.status) && row.item_kind !== 'block' && (
          <>
            <button className="v3a-btn" disabled={busy} onClick={() => act({ status: 'cancelled' }, '취소 처리할까요? 확정이었다면 날짜 차단이 풀립니다.')}>취소</button>
            {row.status === 'requested' && <button className="v3a-btn" disabled={busy} onClick={() => act({ status: 'declined' }, '이 신청을 거절할까요?')}>거절</button>}
          </>
        )}
        <button className="v3a-btn v3a-btn-danger" disabled={busy}
          onClick={async () => {
            if (!window.confirm('이 기록을 완전히 삭제할까요? (되돌릴 수 없음)')) return;
            setBusy(true);
            try { await api.bookingDelete(row.id); onSaved(); } catch (e) { onError(e.message); setBusy(false); }
          }}>삭제</button>
      </div>
    </div>
  );
}

/* ---------------- 신규: 개인 일정 차단 / 수동 부킹 ---------------- */
function NewEntryForm({ mode, marks, items, onSaved, onError, onClose }) {
  const [range, setRange] = useState({ start: null, end: null });
  const [form, setForm] = useState({ item_kind: 'treatment', item_id: '', client_name: '', country_code: '', whatsapp: '', admin_note: '' });
  const [busy, setBusy] = useState(false);
  const isBlock = mode === 'block';
  const list = form.item_kind === 'surgery' ? items.surgeries : items.treatments;

  // 전화는 + 와 숫자만 입력 허용, 값이 있으면 7~15자리 검사 (서버도 동일 검증)
  const waDigits = form.whatsapp.replace(/\D/g, '');
  const waInvalid = form.whatsapp.trim() !== '' && (waDigits.length < 7 || waDigits.length > 15);

  async function save() {
    setBusy(true);
    try {
      const body = isBlock
        ? { item_kind: 'block', confirmed_start: range.start, confirmed_end: range.end || range.start, admin_note: form.admin_note, item_name: form.admin_note || 'Blocked' }
        : {
            item_kind: form.item_kind, item_id: Number(form.item_id) || null,
            client_name: form.client_name, country_code: form.country_code, whatsapp: form.whatsapp,
            confirmed_start: range.start, confirmed_end: range.end || range.start, admin_note: form.admin_note,
          };
      await api.bookingCreate(body);
      onSaved();
    } catch (e) { onError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="v3a-bk-new">
      <div className="v3a-bk-new-head">
        <h3>{isBlock ? '개인 일정 차단' : '수동 부킹 추가'}</h3>
        <button type="button" className="v3a-list-edit-x" onClick={onClose}>×</button>
      </div>
      <p className="v3a-sec-hint">
        {isBlock
          ? '휴가·개인 일정 등으로 예약을 받지 않을 기간. 고객 캘린더에서 선택 불가로 표시됩니다 (사유는 안 보임).'
          : 'WhatsApp 으로 직접 조율한 고객을 캘린더에 올릴 때. 기간을 지정하면 바로 확정(차단)됩니다.'}
      </p>
      {!isBlock && (
        <div className="v3a-bk-new-grid">
          <label>종류
            <select value={form.item_kind} onChange={(e) => setForm({ ...form, item_kind: e.target.value, item_id: '' })}>
              <option value="treatment">시술</option><option value="surgery">수술</option>
            </select>
          </label>
          <label>항목
            <select value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })}>
              <option value="">선택…</option>
              {(list || []).map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
          </label>
          <label>고객 이름 <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="M. Tan" maxLength={120} /></label>
          <label>국가 <input value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase() })} placeholder="SG" maxLength={8} /></label>
          <label>WhatsApp
            <input value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/[^\d+]/g, '').slice(0, 16) })}
              placeholder="+6581234567 (숫자만)" inputMode="tel"
              style={waInvalid ? { borderColor: '#c0392b' } : undefined} />
            {waInvalid && <span style={{ color: '#b03030', fontWeight: 400 }}>국가번호 포함 7~15자리 숫자여야 합니다</span>}
          </label>
        </div>
      )}
      <RangePicker marks={marks} value={range} onChange={setRange} />
      <label className="v3a-bk-new-note">{isBlock ? '사유 (관리용)' : '메모 (관리용)'}
        <input value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} placeholder={isBlock ? '예: 휴가' : '예: WhatsApp 직접 조율 건'} />
      </label>
      <button className="v3a-btn v3a-btn-primary" disabled={busy || !range.start || waInvalid || (!isBlock && !form.item_id && !form.client_name)} onClick={save}>
        {busy ? '저장 중…' : (isBlock ? '이 기간 차단하기' : '확정 부킹으로 추가')}
      </button>
    </div>
  );
}

/* ---------------- main ---------------- */
// 접수 후 경과 표시 — 24시간 넘게 미처리면 경고 톤
function agoLabel(ts) {
  if (!ts) return '';
  const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000);
  if (h < 1) return '방금 접수';
  if (h < 24) return `${h}시간 전 접수`;
  return `${Math.floor(h / 24)}일 전 접수`;
}
const isStale = (ts) => ts && (Date.now() - new Date(ts).getTime()) > 24 * 3600000;

export default function BookingsAdmin() {
  const t = new Date();
  const [[y, m], setYm] = useState([t.getFullYear(), t.getMonth() + 1]);
  const [rows, setRows] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [newMode, setNewMode] = useState(null); // 'block' | 'manual' | null
  const [items, setItems] = useState({ treatments: [], surgeries: [] });
  const [err, setErr] = useState(null);
  const [dayFocus, setDayFocus] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    try { const d = await api.bookingList({}); setRows(d.rows || []); }
    catch (e) { setErr(e.message); setRows([]); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    Promise.all([api.list('treatments'), api.list('surgeries')])
      .then(([a, b]) => setItems({ treatments: a.rows || [], surgeries: b.rows || [] }))
      .catch(() => {});
  }, []);

  // 달력 marks — confirmed 기간 + requested 희망일 점
  const marks = useMemo(() => {
    const out = {};
    for (const r of rows || []) {
      if (r.status === 'confirmed' && r.confirmed_start && r.confirmed_end) {
        eachDay(r.confirmed_start, r.confirmed_end, (d) => { (out[d] ||= {}).conf = [...(out[d].conf || []), r]; });
      }
      if (r.status === 'requested' && r.requested_date) {
        (out[r.requested_date] ||= {}).reqN = (out[r.requested_date].reqN || 0) + 1;
      }
    }
    return out;
  }, [rows]);

  // 섹션 분리 — 수동 처리 워크플로우:
  //   ① 처리 대기 (requested, 오래된 순 — 오래 기다린 신청부터)
  //   ② 확정 일정 (진행중/다가오는 confirmed, 시작일 순)
  //   ③ 지난 기록 (완료·취소·거절 + 끝난 confirmed) — 접힘
  const todayStr = iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
  const base = (rows || []).filter((r) => (dayFocus
    ? (r.requested_date === dayFocus || (r.confirmed_start && r.confirmed_start <= dayFocus && r.confirmed_end >= dayFocus))
    : true));
  const pending = base.filter((r) => r.status === 'requested')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const upcoming = base.filter((r) => r.status === 'confirmed' && r.confirmed_end && r.confirmed_end >= todayStr)
    .sort((a, b) => String(a.confirmed_start).localeCompare(String(b.confirmed_start)));
  const past = base.filter((r) => !pending.includes(r) && !upcoming.includes(r))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const pendingN = (rows || []).filter((r) => r.status === 'requested').length;

  const refresh = () => { setOpenId(null); setNewMode(null); load(); };

  function renderRow(r, { showAgo = false } = {}) {
    const sm = STATUS_META[r.status] || {};
    return (
      <div key={r.id} className={`v3a-bk-row st-${r.item_kind === 'block' ? 'block' : sm.cls} ${openId === r.id ? 'open' : ''}`}>
        <button type="button" className="v3a-bk-row-head" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
          <span className={`v3a-bk-badge ${sm.cls}`}>{sm.label}</span>
          <span className="v3a-bk-code">{r.code}</span>
          <span className="v3a-bk-main">
            {r.item_kind === 'block'
              ? `🚫 ${r.admin_note || r.item_name || '개인 일정'}`
              : <>{r.client_name || '—'} <em>· {r.item_name} ({KIND_LABEL[r.item_kind]})</em></>}
          </span>
          {showAgo && (
            <span className={`v3a-bk-ago ${isStale(r.created_at) ? 'stale' : ''}`}>{agoLabel(r.created_at)}</span>
          )}
          <span className="v3a-bk-date">
            {r.status === 'confirmed' || r.item_kind === 'block'
              ? (r.confirmed_start ? `${r.confirmed_start} ~ ${r.confirmed_end}` : '')
              : (r.requested_date ? `희망 ${r.requested_date}` : '날짜 미정')}
          </span>
          <span className="v3a-card-arrow">{openId === r.id ? '▾' : '›'}</span>
        </button>
        {openId === r.id && (
          <BookingDetail row={r} marks={marks} onSaved={refresh} onError={setErr} />
        )}
      </div>
    );
  }

  return (
    <div className="v3a-bk">
      <div className="v3a-list-top">
        <div>
          <h2>부킹 관리 {pendingN > 0 && <span className="v3a-bk-pending">대기 {pendingN}건</span>}</h2>
          <p className="v3a-sub">신청은 날짜를 막지 않습니다 — 여기서 기간을 확정해야 캘린더가 차단됩니다.</p>
        </div>
        <div className="v3a-bk-topbtns">
          <button className="v3a-btn v3a-tip"
            data-tip="예약을 받지 않을 기간을 직접 막습니다 (휴가·개인 일정·다른 손님 의전 등). 막힌 날짜는 고객 캘린더에서 선택 불가로 표시됩니다 — 사유는 고객에게 안 보입니다."
            onClick={() => { setNewMode(newMode === 'block' ? null : 'block'); setOpenId(null); }}>🚫 일정 차단</button>
          <button className="v3a-btn v3a-btn-primary v3a-tip"
            data-tip="사이트를 거치지 않고 WhatsApp 등으로 직접 조율한 고객을 캘린더에 올립니다. 기간을 지정하면 바로 '확정' 상태로 등록되어 그 날짜가 차단됩니다."
            onClick={() => { setNewMode(newMode === 'manual' ? null : 'manual'); setOpenId(null); }}>✍ 수동 부킹 추가</button>
        </div>
      </div>

      {err && <div className="v3a-error">{err}</div>}

      {newMode && (
        <NewEntryForm mode={newMode} marks={marks} items={items}
          onSaved={refresh} onError={setErr} onClose={() => setNewMode(null)} />
      )}

      <div className="v3a-bk-layout">
        <div className="v3a-bk-calwrap">
          <MonthCal y={y} m={m} onNav={(n) => setYm(addMonths(y, m, n))} marks={marks}
            onDayClick={(d) => setDayFocus(dayFocus === d ? null : d)} selectedDay={dayFocus} />
          {dayFocus && (
            <div className="v3a-bk-dayfocus">
              📅 {dayFocus} 관련 항목만 표시 중 <button type="button" onClick={() => setDayFocus(null)}>해제 ×</button>
            </div>
          )}
        </div>

        <div className="v3a-bk-listwrap">
          {rows == null && <div className="v3a-empty">불러오는 중…</div>}

          {rows && (
            <>
              {/* ① 처리 대기 */}
              <div className="v3a-bk-sechead urgent">
                <h3>🔔 처리 대기 <span className="n">{pending.length}</span></h3>
                <p>새로 들어온 신청 — 아직 날짜를 막지 않습니다. 열어서 기간 확정 또는 거절 처리하세요. (오래된 순)</p>
              </div>
              {pending.length === 0 && <div className="v3a-bk-secempty">처리할 신청이 없습니다 ✓</div>}
              <div className="v3a-bk-rows">
                {pending.map((r) => renderRow(r, { showAgo: true }))}
              </div>

              {/* ② 확정 일정 */}
              <div className="v3a-bk-sechead">
                <h3>📅 확정 일정 <span className="n">{upcoming.length}</span></h3>
                <p>진행 중이거나 다가오는 확정 트립 + 개인 일정 차단. (시작일 순)</p>
              </div>
              {upcoming.length === 0 && <div className="v3a-bk-secempty">다가오는 확정 일정이 없습니다.</div>}
              <div className="v3a-bk-rows">
                {upcoming.map((r) => renderRow(r))}
              </div>

              {/* ③ 지난 기록 */}
              <button type="button" className="v3a-bk-pasttoggle" onClick={() => setShowPast((s) => !s)}>
                {showPast ? '▾' : '›'} 지난 기록 (완료·취소·거절·종료된 일정) — {past.length}건
              </button>
              {showPast && (
                <div className="v3a-bk-rows">
                  {past.length === 0 && <div className="v3a-bk-secempty">지난 기록이 없습니다.</div>}
                  {past.map((r) => renderRow(r))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

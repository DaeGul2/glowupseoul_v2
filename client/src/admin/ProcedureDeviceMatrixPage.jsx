// 시술 ↔ 기기 매트릭스 — 시술별로 그룹핑된 뷰.
// 각 시술 카드 = 헤더(시술명) + 매핑된 기기 리스트 + "+ 기기 추가" 인라인 폼.
// ConcernMatrixPage 와 동일한 패턴.
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './api.js';
import FkPicker from './FkPicker.jsx';
import BackButton from './BackButton.jsx';

const REL_OPTS = [
  { v: 'primary',     label: '대표 장비' },
  { v: 'alternative', label: '대체 가능' },
  { v: 'compatible',  label: '호환만 됨' },
];

const REL_BADGE = {
  primary:     { className: 'is-on',  text: '대표' },
  alternative: { className: '',       text: '대체' },
  compatible:  { className: 'is-off', text: '호환' },
};

export default function ProcedureDeviceMatrixPage() {
  const [procedures, setProcedures] = useState([]);
  const [pairs,      setPairs]      = useState([]);
  const [busy,       setBusy]       = useState(true);
  const [err,        setErr]        = useState(null);
  const [filter,     setFilter]     = useState('');

  async function load() {
    setBusy(true); setErr(null);
    try {
      const [a, b] = await Promise.all([
        adminApi.list('procedures', { limit: 500 }),
        adminApi.list('procedure_devices', { limit: 1000 }),
      ]);
      setProcedures(a.rows || []);
      setPairs(b.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { load(); }, []);

  const pairsByProcedure = useMemo(() => {
    const m = new Map();
    for (const p of pairs) {
      if (!m.has(p.procedure_id)) m.set(p.procedure_id, []);
      m.get(p.procedure_id).push(p);
    }
    const rank = { primary: 0, alternative: 1, compatible: 2 };
    for (const arr of m.values()) {
      arr.sort((x, y) => {
        const r = (rank[x.relevance] ?? 9) - (rank[y.relevance] ?? 9);
        if (r !== 0) return r;
        return (x.display_order ?? 0) - (y.display_order ?? 0);
      });
    }
    return m;
  }, [pairs]);

  const filtered = filter
    ? procedures.filter((p) => {
        const hay = [p.slug, p.name_ko, p.name_en, p.name_zh].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(filter.toLowerCase());
      })
    : procedures;

  async function addPair({ procedure_id, device_id, relevance, notes_ko }) {
    if (!device_id) return alert('기기를 선택하세요.');
    try {
      await adminApi.create('procedure_devices', {
        procedure_id, device_id, relevance,
        notes_ko: notes_ko || null,
      });
      load();
    } catch (e) {
      alert(`추가 실패: ${e.message}`);
    }
  }

  async function removePair(p) {
    if (!confirm(`"${p.device?.name_ko || p.device_id}" 매핑을 제거하시겠습니까?`)) return;
    try {
      const pk = `${p.procedure_id}-${p.device_id}`;
      await adminApi.remove('procedure_devices', pk);
      load();
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  }

  async function changeRelevance(p, newRel) {
    try {
      const pk = `${p.procedure_id}-${p.device_id}`;
      await adminApi.update('procedure_devices', pk, { relevance: newRel });
      load();
    } catch (e) {
      alert(`변경 실패: ${e.message}`);
    }
  }

  return (
    <div className="gs-admin-page">
      <div className="gs-admin-backbar">
        <BackButton fallback="/admin/dashboard" label="대시보드" />
      </div>
      <header className="gs-admin-header">
        <h1>시술 ↔ 기기 매트릭스</h1>
        <div className="gs-admin-header-actions">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="시술 검색 (이름·식별자)…"
            className="gs-admin-filter"
          />
          <button onClick={load}>↻ 새로고침</button>
        </div>
      </header>

      <div className="gs-admin-intro">
        한 시술이 어떤 장비로 가능한지 매핑합니다. 같은 HIFU 얼굴 리프팅도 Ulthera · Shurink · Liftera 셋 다 가능.
        시술 카드 내부에서 기기를 추가/삭제/관계 변경하세요.
      </div>

      {err && <div className="gs-admin-err">{err}</div>}
      {busy && <div className="gs-admin-loading">불러오는 중…</div>}

      {!busy && filtered.map((p) => (
        <ProcedureCard
          key={p.id}
          procedure={p}
          rows={pairsByProcedure.get(p.id) || []}
          onAdd={addPair}
          onRemove={removePair}
          onChangeRelevance={changeRelevance}
        />
      ))}

      {!busy && filtered.length === 0 && (
        <div className="gs-admin-empty">일치하는 시술이 없습니다.</div>
      )}
    </div>
  );
}

// ─── 시술 한 장 ─────────────────────────────────────────────────────
function ProcedureCard({ procedure, rows, onAdd, onRemove, onChangeRelevance }) {
  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState({ device_id: null, relevance: 'alternative', notes_ko: '' });

  async function submit(e) {
    e.preventDefault();
    await onAdd({
      procedure_id: procedure.id,
      device_id: draft.device_id,
      relevance: draft.relevance,
      notes_ko: draft.notes_ko,
    });
    setAdding(false);
    setDraft({ device_id: null, relevance: 'alternative', notes_ko: '' });
  }

  return (
    <section className="gs-cm-card">
      <header className="gs-cm-head">
        <div>
          <h2 className="gs-cm-title">
            {procedure.name_ko}
            <span className="gs-cm-title-en">{procedure.name_en}</span>
          </h2>
          <div className="gs-cm-meta">
            <code>{procedure.slug}</code> · {procedure.domain} · 기기 {rows.length}개
          </div>
        </div>
        {!adding && (
          <button type="button" className="gs-admin-newbtn" onClick={() => setAdding(true)}>
            + 기기 추가
          </button>
        )}
      </header>

      {adding && (
        <form className="gs-admin-inlineform" onSubmit={submit}>
          <div className="gs-admin-inlineform-row" style={{ gridTemplateColumns: '2fr 1fr 2fr auto' }}>
            <div className="gs-admin-field">
              <label>기기 *</label>
              <FkPicker
                value={draft.device_id}
                onChange={(v) => setDraft({ ...draft, device_id: v })}
                table="devices"
                placeholder="기기 검색…"
              />
            </div>
            <div className="gs-admin-field">
              <label>관계</label>
              <select value={draft.relevance} onChange={(e) => setDraft({ ...draft, relevance: e.target.value })}>
                {REL_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </div>
            <div className="gs-admin-field">
              <label>비고 (선택)</label>
              <input
                type="text"
                value={draft.notes_ko}
                onChange={(e) => setDraft({ ...draft, notes_ko: e.target.value })}
                placeholder="특정 부위에만 권장 등"
              />
            </div>
          </div>
          <div className="gs-admin-inlineform-actions">
            <button type="button" className="gs-admin-ghostbtn" onClick={() => setAdding(false)}>취소</button>
            <button type="submit" className="gs-admin-savebtn">추가</button>
          </div>
        </form>
      )}

      {rows.length === 0 && !adding ? (
        <div className="gs-cm-empty">아직 매핑된 기기가 없습니다.</div>
      ) : (
        <ul className="gs-cm-list">
          {rows.map((p) => {
            const badge = REL_BADGE[p.relevance] || { className: '', text: p.relevance };
            return (
              <li key={`${p.procedure_id}-${p.device_id}`} className="gs-cm-row">
                <div className="gs-cm-row-main">
                  <a className="gs-cm-row-name" href={`/admin/devices/${p.device_id}`}>
                    {p.device?.name_ko || `#${p.device_id}`}
                  </a>
                  {p.device?.name_en && <span className="gs-cm-row-en">{p.device.name_en}</span>}
                  {p.notes_ko && <div className="gs-cm-row-rationale">{p.notes_ko}</div>}
                </div>
                <div className="gs-cm-row-actions">
                  <select
                    className="gs-cm-rel-select"
                    value={p.relevance}
                    onChange={(e) => onChangeRelevance(p, e.target.value)}
                  >
                    {REL_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                  </select>
                  <span className={`gs-admin-chip ${badge.className}`}>{badge.text}</span>
                  <a href={`/admin/procedure_devices/${p.procedure_id}-${p.device_id}`} className="gs-cm-edit-link">자세히</a>
                  <button type="button" className="gs-admin-textbtn-danger" onClick={() => onRemove(p)}>삭제</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

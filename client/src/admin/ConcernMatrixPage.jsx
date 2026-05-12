// 고민 ↔ 시술 매트릭스 — 고민별로 그룹핑된 뷰.
// 각 고민 카드 = 헤더(고민명) + 매핑된 시술 리스트 + "+ 시술 추가" 인라인 폼.
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './api.js';
import FkPicker from './FkPicker.jsx';
import BackButton from './BackButton.jsx';

const RELEV_OPTS = [
  { v: 'primary',   label: '핵심 해결책' },
  { v: 'secondary', label: '보조 해결책' },
  { v: 'adjunct',   label: '병행 시 도움' },
];

const RELEV_BADGE = {
  primary: { className: 'is-on',  text: '핵심' },
  secondary: { className: '',     text: '보조' },
  adjunct: { className: 'is-off', text: '병행' },
};

export default function ConcernMatrixPage() {
  const [concerns, setConcerns] = useState([]);
  const [pairs,    setPairs]    = useState([]);
  const [busy,     setBusy]     = useState(true);
  const [err,      setErr]      = useState(null);
  const [filter,   setFilter]   = useState('');

  async function load() {
    setBusy(true); setErr(null);
    try {
      const [a, b] = await Promise.all([
        adminApi.list('concerns', { limit: 500 }),
        adminApi.list('concern_procedures', { limit: 1000 }),
      ]);
      setConcerns(a.rows || []);
      setPairs(b.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { load(); }, []);

  const pairsByConcern = useMemo(() => {
    const m = new Map();
    for (const p of pairs) {
      if (!m.has(p.concern_id)) m.set(p.concern_id, []);
      m.get(p.concern_id).push(p);
    }
    // relevance 순으로 sort: primary → secondary → adjunct
    const rank = { primary: 0, secondary: 1, adjunct: 2 };
    for (const arr of m.values()) {
      arr.sort((x, y) => (rank[x.relevance] ?? 9) - (rank[y.relevance] ?? 9));
    }
    return m;
  }, [pairs]);

  const filtered = filter
    ? concerns.filter((c) => {
        const hay = [c.slug, c.name_ko, c.name_en, c.name_zh].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(filter.toLowerCase());
      })
    : concerns;

  async function addPair({ concern_id, procedure_id, relevance, rationale_ko }) {
    if (!procedure_id) return alert('시술을 선택하세요.');
    try {
      await adminApi.create('concern_procedures', {
        concern_id, procedure_id, relevance,
        rationale_ko: rationale_ko || null,
      });
      load();
    } catch (e) {
      alert(`추가 실패: ${e.message}`);
    }
  }

  async function removePair(p) {
    if (!confirm(`"${p.procedure?.name_ko || p.procedure_id}" 매핑을 제거하시겠습니까?`)) return;
    try {
      const pk = `${p.concern_id}-${p.procedure_id}`;
      await adminApi.remove('concern_procedures', pk);
      load();
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  }

  async function changeRelevance(p, newRel) {
    try {
      const pk = `${p.concern_id}-${p.procedure_id}`;
      await adminApi.update('concern_procedures', pk, { relevance: newRel });
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
        <h1>고민 ↔ 시술 매트릭스</h1>
        <div className="gs-admin-header-actions">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="고민 검색 (이름·식별자)…"
            className="gs-admin-filter"
          />
          <button onClick={load}>↻ 새로고침</button>
        </div>
      </header>

      <div className="gs-admin-intro">
        한 고민(검색 키워드)에 어떤 시술들이 잘 맞는지 매핑합니다. 매칭 결과 품질이 이 매트릭스에 달려있어요.
        고민 카드 내부에서 시술을 추가/삭제/관련도 변경하세요.
      </div>

      {err && <div className="gs-admin-err">{err}</div>}
      {busy && <div className="gs-admin-loading">불러오는 중…</div>}

      {!busy && filtered.map((c) => (
        <ConcernCard
          key={c.id}
          concern={c}
          rows={pairsByConcern.get(c.id) || []}
          onAdd={addPair}
          onRemove={removePair}
          onChangeRelevance={changeRelevance}
        />
      ))}

      {!busy && filtered.length === 0 && (
        <div className="gs-admin-empty">일치하는 고민이 없습니다.</div>
      )}
    </div>
  );
}

// ─── 고민 한 장 ─────────────────────────────────────────────────────
function ConcernCard({ concern, rows, onAdd, onRemove, onChangeRelevance }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft]   = useState({ procedure_id: null, relevance: 'primary', rationale_ko: '' });

  async function submit(e) {
    e.preventDefault();
    await onAdd({
      concern_id: concern.id,
      procedure_id: draft.procedure_id,
      relevance: draft.relevance,
      rationale_ko: draft.rationale_ko,
    });
    setAdding(false);
    setDraft({ procedure_id: null, relevance: 'primary', rationale_ko: '' });
  }

  return (
    <section className="gs-cm-card">
      <header className="gs-cm-head">
        <div>
          <h2 className="gs-cm-title">
            {concern.name_ko}
            <span className="gs-cm-title-en">{concern.name_en}</span>
          </h2>
          <div className="gs-cm-meta">
            <code>{concern.slug}</code> · {concern.body_area} · 매핑 {rows.length}건
          </div>
        </div>
        {!adding && (
          <button type="button" className="gs-admin-newbtn" onClick={() => setAdding(true)}>
            + 시술 추가
          </button>
        )}
      </header>

      {adding && (
        <form className="gs-admin-inlineform" onSubmit={submit}>
          <div className="gs-admin-inlineform-row" style={{ gridTemplateColumns: '2fr 1fr 2fr auto' }}>
            <div className="gs-admin-field">
              <label>시술 *</label>
              <FkPicker
                value={draft.procedure_id}
                onChange={(v) => setDraft({ ...draft, procedure_id: v })}
                table="procedures"
                placeholder="시술 검색…"
              />
            </div>
            <div className="gs-admin-field">
              <label>관련도</label>
              <select value={draft.relevance} onChange={(e) => setDraft({ ...draft, relevance: e.target.value })}>
                {RELEV_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </div>
            <div className="gs-admin-field">
              <label>추천 이유 (선택)</label>
              <input
                type="text"
                value={draft.rationale_ko}
                onChange={(e) => setDraft({ ...draft, rationale_ko: e.target.value })}
                placeholder="왜 이 시술이 이 고민에 맞는지 한 줄"
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
        <div className="gs-cm-empty">아직 매핑된 시술이 없습니다.</div>
      ) : (
        <ul className="gs-cm-list">
          {rows.map((p) => {
            const badge = RELEV_BADGE[p.relevance] || { className: '', text: p.relevance };
            return (
              <li key={`${p.concern_id}-${p.procedure_id}`} className="gs-cm-row">
                <div className="gs-cm-row-main">
                  <a className="gs-cm-row-name" href={`/admin/procedures/${p.procedure_id}`}>
                    {p.procedure?.name_ko || `#${p.procedure_id}`}
                  </a>
                  {p.procedure?.name_en && <span className="gs-cm-row-en">{p.procedure.name_en}</span>}
                  {p.rationale_ko && <div className="gs-cm-row-rationale">{p.rationale_ko}</div>}
                </div>
                <div className="gs-cm-row-actions">
                  <select
                    className="gs-cm-rel-select"
                    value={p.relevance}
                    onChange={(e) => onChangeRelevance(p, e.target.value)}
                  >
                    {RELEV_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                  </select>
                  <span className={`gs-admin-chip ${badge.className}`}>{badge.text}</span>
                  <a href={`/admin/concern_procedures/${p.concern_id}-${p.procedure_id}`} className="gs-cm-edit-link">자세히</a>
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

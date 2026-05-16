// 병원 편집 페이지 내부 패널 — 이 병원이 제공하는 시술 가격표 inline 관리.
// 신규 행 추가는 핵심 5필드만 (시술/가격/장비/시그너처/공개). 자세한 편집은
// 행의 "자세히" 버튼으로 /admin/hospital_procedures/:id 로 이동.
import { useEffect, useState } from 'react';
import { adminApi } from './api.js';
import FkPicker from './FkPicker.jsx';

const fmtKRW = (n) => (n == null ? '—' : `₩${Number(n).toLocaleString()}`);

export default function HospitalOfferingsPanel({ hospitalId }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ procedure_id: null, starting_price_krw: '', device_brands: '', is_signature: false, price_disclosed: true });

  async function load() {
    setBusy(true); setErr(null);
    try {
      const r = await adminApi.list('hospital_procedures', { hospital_id: hospitalId, limit: 200 });
      setRows(r.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { if (hospitalId) load(); }, [hospitalId]);

  async function addRow(e) {
    e.preventDefault();
    if (!draft.procedure_id) return alert('시술을 선택하세요.');
    try {
      await adminApi.create('hospital_procedures', {
        hospital_id: hospitalId,
        procedure_id: draft.procedure_id,
        starting_price_krw: draft.starting_price_krw ? Number(draft.starting_price_krw) : null,
        price_disclosed: Boolean(draft.price_disclosed),
        device_brands: draft.device_brands ? draft.device_brands.split(',').map((s) => s.trim()).filter(Boolean) : [],
        is_signature: Boolean(draft.is_signature),
        offered: true,
      });
      setAdding(false);
      setDraft({ procedure_id: null, starting_price_krw: '', device_brands: '', is_signature: false, price_disclosed: true });
      load();
    } catch (e) {
      alert(`추가 실패: ${e.message}`);
    }
  }

  async function remove(r) {
    if (!confirm(`"${r.procedure?.name_ko || r.procedure_id}" 시술을 이 병원에서 제거하시겠습니까?`)) return;
    try {
      await adminApi.remove('hospital_procedures', r.id);
      load();
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  }

  if (!hospitalId) {
    return (
      <section className="gs-admin-formsec">
        <h2>이 병원이 제공하는 시술 (가격표)</h2>
        <p className="gs-admin-hint">병원을 먼저 저장한 뒤 시술을 추가할 수 있습니다.</p>
      </section>
    );
  }

  return (
    <section className="gs-admin-formsec">
      <header className="gs-admin-panel-header">
        <h2>이 병원이 제공하는 시술 ({rows.length}건)</h2>
        {!adding && (
          <button type="button" className="gs-admin-newbtn" onClick={() => setAdding(true)}>
            + 시술 추가
          </button>
        )}
      </header>

      {err && <div className="gs-admin-err">{err}</div>}
      {busy && <div className="gs-admin-loading">불러오는 중…</div>}

      {adding && (
        <form className="gs-admin-inlineform" onSubmit={addRow}>
          <div className="gs-admin-inlineform-row">
            <div className="gs-admin-field" style={{ flex: 2 }}>
              <label>시술 선택 *</label>
              <FkPicker value={draft.procedure_id} onChange={(v) => setDraft({ ...draft, procedure_id: v })} table="procedures" placeholder="시술 검색…" />
            </div>
            <div className="gs-admin-field">
              <label>시작 가격 (원)</label>
              <input type="number" value={draft.starting_price_krw} onChange={(e) => setDraft({ ...draft, starting_price_krw: e.target.value })} placeholder="예: 390000" />
            </div>
            <div className="gs-admin-field">
              <label>장비 브랜드</label>
              <input type="text" value={draft.device_brands} onChange={(e) => setDraft({ ...draft, device_brands: e.target.value })} placeholder="예: Ulthera, Shurink" />
            </div>
            <div className="gs-admin-field gs-admin-field-bool">
              <label><input type="checkbox" checked={draft.is_signature} onChange={(e) => setDraft({ ...draft, is_signature: e.target.checked })} /> 시그너처</label>
            </div>
            <div className="gs-admin-field gs-admin-field-bool">
              <label><input type="checkbox" checked={draft.price_disclosed} onChange={(e) => setDraft({ ...draft, price_disclosed: e.target.checked })} /> 가격 공개</label>
            </div>
          </div>
          <div className="gs-admin-inlineform-actions">
            <button type="button" className="gs-admin-ghostbtn" onClick={() => setAdding(false)}>취소</button>
            <button type="submit" className="gs-admin-savebtn">추가</button>
          </div>
        </form>
      )}

      {!busy && rows.length === 0 && !adding && (
        <div className="gs-admin-empty">아직 등록된 시술이 없습니다. 위 \"+ 시술 추가\" 를 눌러 시작하세요.</div>
      )}

      {!busy && rows.length > 0 && (
        <div className="gs-admin-table-wrap">
          <table className="gs-admin-table">
            <thead>
              <tr>
                <th>시술</th>
                <th>병원 자체 명칭</th>
                <th>시작 가격</th>
                <th>장비</th>
                <th>플래그</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.procedure?.name_ko || r.procedure_id}</strong></td>
                  <td>{r.local_name_ko || <span className="gs-admin-null">—</span>}</td>
                  <td>{fmtKRW(r.starting_price_krw)}</td>
                  <td>{Array.isArray(r.device_brands) ? r.device_brands.join(', ') : <span className="gs-admin-null">—</span>}</td>
                  <td>
                    {r.is_signature && <span className="gs-admin-chip is-on">시그너처</span>}{' '}
                    {r.has_active_event && <span className="gs-admin-chip is-on">이벤트</span>}{' '}
                    {!r.price_disclosed && <span className="gs-admin-chip is-off">가격 비공개</span>}
                  </td>
                  <td>
                    <a href={`/admin/hospital_procedures/${r.id}`}>자세히</a>
                    {' · '}
                    <button type="button" onClick={() => remove(r)} className="gs-admin-textbtn-danger">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

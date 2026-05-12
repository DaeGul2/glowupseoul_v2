// 병원 편집 페이지 내부 패널 — 이 병원 소속 의사 inline 관리.
import { useEffect, useRef, useState } from 'react';
import { adminApi, uploadToS3 } from './api.js';

export default function HospitalDoctorsPanel({ hospitalId }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr]   = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft]   = useState({ name_ko: '', title_ko: '원장', years_experience: '', is_featured: false });

  async function load() {
    setBusy(true); setErr(null);
    try {
      const r = await adminApi.list('doctors', { hospital_id: hospitalId, limit: 200 });
      setRows(r.rows || []);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  useEffect(() => { if (hospitalId) load(); }, [hospitalId]);

  async function addRow(e) {
    e.preventDefault();
    if (!draft.name_ko) return alert('의사 이름을 입력하세요.');
    const slug = `dr_${hospitalId}_${Date.now().toString(36)}`;
    try {
      await adminApi.create('doctors', {
        slug, hospital_id: hospitalId,
        name_ko: draft.name_ko, title_ko: draft.title_ko || null,
        years_experience: draft.years_experience ? Number(draft.years_experience) : null,
        is_featured: Boolean(draft.is_featured),
        is_active: true,
      });
      setAdding(false);
      setDraft({ name_ko: '', title_ko: '원장', years_experience: '', is_featured: false });
      load();
    } catch (e) { alert(`추가 실패: ${e.message}`); }
  }

  async function remove(r) {
    if (!confirm(`"${r.name_ko}" 의사를 제거하시겠습니까?`)) return;
    try { await adminApi.remove('doctors', r.id); load(); }
    catch (e) { alert(`삭제 실패: ${e.message}`); }
  }

  async function toggleFeatured(r) {
    try { await adminApi.update('doctors', r.id, { is_featured: !r.is_featured }); load(); }
    catch (e) { alert(`변경 실패: ${e.message}`); }
  }

  if (!hospitalId) return null;

  return (
    <section className="gs-admin-formsec">
      <header className="gs-admin-panel-header">
        <h2>이 병원 소속 의사 ({rows.length}명)</h2>
        {!adding && (
          <button type="button" className="gs-admin-newbtn" onClick={() => setAdding(true)}>
            + 의사 추가
          </button>
        )}
      </header>

      {err && <div className="gs-admin-err">{err}</div>}
      {busy && <div className="gs-admin-loading">불러오는 중…</div>}

      {adding && (
        <form className="gs-admin-inlineform" onSubmit={addRow}>
          <div className="gs-admin-inlineform-row" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
            <div className="gs-admin-field">
              <label>이름 *</label>
              <input value={draft.name_ko} onChange={(e) => setDraft({ ...draft, name_ko: e.target.value })} placeholder="예: 김민태" />
            </div>
            <div className="gs-admin-field">
              <label>직책</label>
              <input value={draft.title_ko} onChange={(e) => setDraft({ ...draft, title_ko: e.target.value })} placeholder="원장 / 부원장 / 전문의" />
            </div>
            <div className="gs-admin-field">
              <label>경력 (년)</label>
              <input type="number" value={draft.years_experience} onChange={(e) => setDraft({ ...draft, years_experience: e.target.value })} placeholder="예: 15" />
            </div>
            <div className="gs-admin-field gs-admin-field-bool">
              <label><input type="checkbox" checked={draft.is_featured} onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })} /> 대표</label>
            </div>
          </div>
          <div className="gs-admin-inlineform-actions">
            <button type="button" className="gs-admin-ghostbtn" onClick={() => setAdding(false)}>취소</button>
            <button type="submit" className="gs-admin-savebtn">추가</button>
          </div>
        </form>
      )}

      {!busy && rows.length === 0 && !adding && (
        <div className="gs-admin-empty">아직 등록된 의사가 없습니다.</div>
      )}

      {!busy && rows.length > 0 && (
        <ul className="gs-dr-list">
          {rows.map((r) => (
            <DoctorRow key={r.id} row={r} onRemove={remove} onToggleFeatured={toggleFeatured} onChanged={load} />
          ))}
        </ul>
      )}
    </section>
  );
}

// 의사 한 행 — portrait + 인라인 정보 + 사진 업로드.
function DoctorRow({ row, onRemove, onToggleFeatured, onChanged }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function uploadPortrait(file) {
    if (!file) return;
    setUploading(true);
    try {
      const presign = await adminApi.presign({
        kind: 'doctors', owner: row.slug || row.id, slot: 'portrait',
        mime: file.type, size: file.size,
      });
      const url = await uploadToS3(presign, file);
      await adminApi.update('doctors', row.id, { portrait_url: url });
      onChanged?.();
    } catch (e) {
      alert(`업로드 실패: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <li className="gs-dr-row">
      <button
        type="button"
        className="gs-dr-portrait"
        onClick={() => fileInput.current?.click()}
        title="사진 업로드 / 교체"
      >
        {row.portrait_url
          ? <img src={row.portrait_url} alt={row.name_ko} />
          : <span className="gs-dr-portrait-empty">+ 사진</span>}
        {uploading && <span className="gs-dr-portrait-busy">…</span>}
      </button>
      <input
        ref={fileInput} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => uploadPortrait(e.target.files?.[0])}
      />
      <div className="gs-dr-info">
        <div className="gs-dr-name">
          {row.name_ko}
          {row.is_featured && <span className="gs-admin-chip is-on" style={{ marginLeft: 8 }}>대표</span>}
        </div>
        <div className="gs-dr-meta">
          {row.title_ko || '—'}{row.years_experience != null ? ` · 경력 ${row.years_experience}년` : ''}
        </div>
        {Array.isArray(row.specialties) && row.specialties.length > 0 && (
          <div className="gs-dr-spec">{row.specialties.slice(0, 5).join(' · ')}</div>
        )}
      </div>
      <div className="gs-dr-actions">
        <button type="button" onClick={() => onToggleFeatured(row)}>
          {row.is_featured ? '대표 해제' : '대표로'}
        </button>
        <a href={`/admin/doctors/${row.id}`} className="gs-admin-ghostbtn">자세히</a>
        <button type="button" className="gs-admin-textbtn-danger" onClick={() => onRemove(row)}>삭제</button>
      </div>
    </li>
  );
}

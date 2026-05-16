// 병원 편집 페이지 내부 패널 — 이 병원 B&A (전후사진) inline 관리.
// before/after 한 쌍을 한꺼번에 업로드. 동의 체크 필수.
import { useEffect, useRef, useState } from 'react';
import { adminApi, uploadToS3 } from './api.js';
import FkPicker from './FkPicker.jsx';

const VIS_OPTS = [
  { v: 'public',     label: '공개 (누구나)' },
  { v: 'logged_in',  label: '로그인 사용자만' },
  { v: 'staff_only', label: '운영진만' },
];

export default function HospitalBAPhotosPanel({ hospitalId }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr]   = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(initialDraft());

  function initialDraft() {
    return {
      procedure_id: null,
      before_url: null, after_url: null,
      patient_age_range: '30s', patient_gender: 'f',
      weeks_after: '',
      consent_signed: false, visibility: 'logged_in',
    };
  }

  async function load() {
    setBusy(true); setErr(null);
    try {
      const r = await adminApi.list('ba_photos', { hospital_id: hospitalId, limit: 200 });
      setRows(r.rows || []);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  useEffect(() => { if (hospitalId) load(); }, [hospitalId]);

  async function uploadFile(file, slot) {
    const presign = await adminApi.presign({
      kind: 'ba', owner: `h${hospitalId}`, slot,
      mime: file.type, size: file.size,
    });
    return uploadToS3(presign, file);
  }

  async function addRow(e) {
    e.preventDefault();
    if (!draft.before_url || !draft.after_url) return alert('Before · After 두 사진 모두 필요합니다.');
    if (!draft.consent_signed) return alert('⚠ 환자 서면 동의가 필요합니다. 동의 없이 등록 불가.');
    try {
      await adminApi.create('ba_photos', {
        hospital_id: hospitalId,
        procedure_id: draft.procedure_id || null,
        before_url: draft.before_url, after_url: draft.after_url,
        patient_age_range: draft.patient_age_range || null,
        patient_gender: draft.patient_gender || null,
        weeks_after: draft.weeks_after ? Number(draft.weeks_after) : null,
        consent_signed: true,
        consent_date: new Date().toISOString().slice(0, 10),
        is_anonymized: true,
        visibility: draft.visibility || 'logged_in',
        is_active: true,
      });
      setAdding(false);
      setDraft(initialDraft());
      load();
    } catch (e) { alert(`추가 실패: ${e.message}`); }
  }

  async function remove(r) {
    if (!confirm('이 B&A 케이스를 삭제하시겠습니까?')) return;
    try { await adminApi.remove('ba_photos', r.id); load(); }
    catch (e) { alert(`삭제 실패: ${e.message}`); }
  }

  async function changeVisibility(r, v) {
    try { await adminApi.update('ba_photos', r.id, { visibility: v }); load(); }
    catch (e) { alert(`변경 실패: ${e.message}`); }
  }

  if (!hospitalId) return null;

  return (
    <section className="gs-admin-formsec">
      <header className="gs-admin-panel-header">
        <h2>이 병원 B&A 전후사진 ({rows.length}건)</h2>
        {!adding && (
          <button type="button" className="gs-admin-newbtn" onClick={() => setAdding(true)}>
            + B&A 추가
          </button>
        )}
      </header>

      {err && <div className="gs-admin-err">{err}</div>}
      {busy && <div className="gs-admin-loading">불러오는 중…</div>}

      {adding && (
        <BANewForm draft={draft} setDraft={setDraft} uploadFile={uploadFile} onSubmit={addRow} onCancel={() => { setAdding(false); setDraft(initialDraft()); }} />
      )}

      {!busy && rows.length === 0 && !adding && (
        <div className="gs-admin-empty">아직 등록된 B&A 가 없습니다.</div>
      )}

      {!busy && rows.length > 0 && (
        <div className="gs-ba-grid">
          {rows.map((r) => (
            <article key={r.id} className="gs-ba-card">
              <div className="gs-ba-pair">
                <div className="gs-ba-half">
                  <img src={r.before_url} alt="before" />
                  <span className="gs-ba-tag">Before</span>
                </div>
                <div className="gs-ba-half">
                  <img src={r.after_url} alt="after" />
                  <span className="gs-ba-tag">After {r.weeks_after ? `· ${r.weeks_after}w` : ''}</span>
                </div>
              </div>
              <div className="gs-ba-meta">
                <strong>{r.procedure?.name_ko || '시술 미지정'}</strong>
                <span>{r.patient_age_range} · {r.patient_gender === 'm' ? '남' : r.patient_gender === 'f' ? '여' : '—'}</span>
              </div>
              <div className="gs-ba-actions">
                <select value={r.visibility} onChange={(e) => changeVisibility(r, e.target.value)}>
                  {VIS_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
                <a href={`/admin/ba_photos/${r.id}`} className="gs-admin-ghostbtn">자세히</a>
                <button type="button" className="gs-admin-textbtn-danger" onClick={() => remove(r)}>삭제</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function BANewForm({ draft, setDraft, uploadFile, onSubmit, onCancel }) {
  const beforeRef = useRef(null);
  const afterRef  = useRef(null);
  const [bsy, setBsy] = useState({ before: false, after: false });

  async function pick(slot, file) {
    if (!file) return;
    setBsy((s) => ({ ...s, [slot]: true }));
    try {
      const url = await uploadFile(file, slot);
      setDraft({ ...draft, [`${slot}_url`]: url });
    } catch (e) { alert(`업로드 실패: ${e.message}`); }
    finally { setBsy((s) => ({ ...s, [slot]: false })); }
  }

  return (
    <form className="gs-admin-inlineform" onSubmit={onSubmit}>
      <div className="gs-ba-newform">
        <BAUploadBox label="시술 전 (Before)" url={draft.before_url} busy={bsy.before}
          onClick={() => beforeRef.current?.click()}
          onClear={() => setDraft({ ...draft, before_url: null })} />
        <input ref={beforeRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => pick('before', e.target.files?.[0])} />

        <BAUploadBox label="시술 후 (After)" url={draft.after_url} busy={bsy.after}
          onClick={() => afterRef.current?.click()}
          onClear={() => setDraft({ ...draft, after_url: null })} />
        <input ref={afterRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => pick('after', e.target.files?.[0])} />
      </div>

      <div className="gs-admin-inlineform-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
        <div className="gs-admin-field">
          <label>시술 (선택)</label>
          <FkPicker value={draft.procedure_id} onChange={(v) => setDraft({ ...draft, procedure_id: v })} table="procedures" placeholder="시술 검색…" />
        </div>
        <div className="gs-admin-field">
          <label>환자 연령대</label>
          <input value={draft.patient_age_range} onChange={(e) => setDraft({ ...draft, patient_age_range: e.target.value })} placeholder="예: 30s" />
        </div>
        <div className="gs-admin-field">
          <label>성별</label>
          <select value={draft.patient_gender} onChange={(e) => setDraft({ ...draft, patient_gender: e.target.value })}>
            <option value="f">여</option><option value="m">남</option><option value="nb">기타</option>
          </select>
        </div>
        <div className="gs-admin-field">
          <label>시술 후 (주)</label>
          <input type="number" value={draft.weeks_after} onChange={(e) => setDraft({ ...draft, weeks_after: e.target.value })} placeholder="예: 4" />
        </div>
        <div className="gs-admin-field">
          <label>공개 범위</label>
          <select value={draft.visibility} onChange={(e) => setDraft({ ...draft, visibility: e.target.value })}>
            {VIS_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <label className="gs-ba-consent">
        <input type="checkbox" checked={draft.consent_signed} onChange={(e) => setDraft({ ...draft, consent_signed: e.target.checked })} />
        <span>⚠ 환자 서면 동의 보유 확인 — 동의서 없으면 절대 등록 X</span>
      </label>

      <div className="gs-admin-inlineform-actions">
        <button type="button" className="gs-admin-ghostbtn" onClick={onCancel}>취소</button>
        <button type="submit" className="gs-admin-savebtn">B&A 등록</button>
      </div>
    </form>
  );
}

function BAUploadBox({ label, url, busy, onClick, onClear }) {
  return (
    <div className="gs-ba-uploadbox">
      <div className="gs-ba-uploadlabel">{label}</div>
      <button type="button" className="gs-ba-uploadbtn" onClick={onClick}>
        {url
          ? <img src={url} alt={label} />
          : <span className="gs-ba-uploadhint">{busy ? '업로드 중…' : '+ 클릭해서 업로드'}</span>}
      </button>
      {url && (
        <button type="button" className="gs-admin-textbtn-danger" onClick={onClear}>제거</button>
      )}
    </div>
  );
}

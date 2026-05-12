// specs.js 의 메타데이터 기반 자동 폼.
// 모든 사용자-노출 텍스트는 한국어. 컬럼 라벨은 col.label, hint 는 col.help.
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './api.js';
import { getSpec, getKindLabel } from './specs.js';
import ImageUploader from './ImageUploader.jsx';
import ImageGalleryEditor from './ImageGalleryEditor.jsx';
import FkPicker, { invalidateFkCache } from './FkPicker.jsx';
import HospitalOfferingsPanel from './HospitalOfferingsPanel.jsx';
import HospitalDoctorsPanel from './HospitalDoctorsPanel.jsx';
import HospitalBAPhotosPanel from './HospitalBAPhotosPanel.jsx';
import BackButton from './BackButton.jsx';

function blankFromSpec(spec) {
  const o = {};
  for (const c of spec.cols) if (c.default !== undefined) o[c.name] = c.default;
  return o;
}

export default function AdminEdit({ kind, id }) {
  const spec = useMemo(() => getSpec(kind), [kind]);
  const [row, setRow]     = useState(null);
  const [busy, setBusy]   = useState(true);
  const [saving, setSave] = useState(false);
  const [err, setErr]     = useState(null);
  const [ok,  setOk]      = useState(null);

  useEffect(() => {
    if (!spec) return;
    if (!id) { setRow(blankFromSpec(spec)); setBusy(false); return; }
    setBusy(true);
    adminApi.get(kind, id)
      .then((r) => {
        const merged = { ...r.row };
        // hospitals — flatten the joined brand into synthetic brand_* fields
        // so the operator sees one unified form.
        if (kind === 'hospitals' && r.row.brand) {
          merged.brand_name_ko              = r.row.brand.name_ko;
          merged.brand_name_en              = r.row.brand.name_en;
          merged.brand_logo_url             = r.row.brand.logo_url;
          merged.brand_founding_doctor      = r.row.brand.founding_doctor;
          merged.brand_specialization_depth = r.row.brand.specialization_depth;
          merged.brand_is_chain             = r.row.brand.is_chain;
          merged.brand_website_url          = r.row.brand.website_url;
        }
        setRow(merged);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setBusy(false));
  }, [kind, id, spec]);

  if (!spec) return <div className="gs-admin-err">알 수 없는 모델: {kind}</div>;
  if (busy) return <div className="gs-admin-loading">불러오는 중…</div>;
  if (!row) return <div className="gs-admin-err">{err || '찾을 수 없습니다.'}</div>;

  function set(name, v) { setRow((r) => ({ ...r, [name]: v })); }

  function ownerFor() {
    return row.slug || row.id || 'new';
  }

  async function save(e) {
    e.preventDefault();
    setSave(true);
    setErr(null); setOk(null);
    try {
      const payload = {};
      for (const c of spec.cols) if (c.name in row) payload[c.name] = row[c.name];
      // hospitals — keep synthetic brand_* fields in the payload so the server
      // can upsert the brand row and link brand_id automatically.
      if (kind === 'hospitals') {
        for (const k of ['brand_name_ko','brand_name_en','brand_logo_url',
                         'brand_founding_doctor','brand_specialization_depth',
                         'brand_is_chain','brand_website_url']) {
          if (k in row) payload[k] = row[k];
        }
      }
      let saved;
      if (id) saved = await adminApi.update(kind, id, payload);
      else    saved = await adminApi.create(kind, payload);
      setRow(saved.row);
      setOk('저장됨.');
      invalidateFkCache(kind);
      if (!id) {
        const newId = spec.pkFields
          ? spec.pkFields.map((f) => saved.row[f]).join('-')
          : saved.row.id;
        window.history.pushState({}, '', `/admin/${kind}/${newId}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSave(false);
    }
  }

  // group 단위로 묶기
  const groups = [];
  let cur = { name: '기본', cols: [] };
  for (const c of spec.cols) {
    if (c.group) {
      if (cur.cols.length) groups.push(cur);
      cur = { name: c.group, cols: [c] };
    } else {
      cur.cols.push(c);
    }
  }
  if (cur.cols.length) groups.push(cur);

  const kindLabel = getKindLabel(kind);

  return (
    <div className="gs-admin-page">
      <div className="gs-admin-backbar">
        <BackButton fallback={`/admin/${kind}`} label={`${kindLabel} 목록`} />
      </div>
      <header className="gs-admin-header">
        <h1>
          <a href={`/admin/${kind}`} className="gs-admin-crumb">{kindLabel}</a>
          {' · '}
          {id ? `편집 #${id}` : '새로 만들기'}
        </h1>
        <div className="gs-admin-header-actions">
          <a href={`/admin/${kind}`} className="gs-admin-ghostbtn">취소</a>
          <button onClick={save} disabled={saving} className="gs-admin-savebtn">
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </header>

      {spec.listIntro && !id && (
        <div className="gs-admin-intro">{spec.listIntro}</div>
      )}

      {err && <div className="gs-admin-err">{err}</div>}
      {ok  && <div className="gs-admin-ok">{ok}</div>}

      <form onSubmit={save} className="gs-admin-form">
        {groups.map((g) => (
          <section key={g.name} className="gs-admin-formsec">
            <h2>{g.name}</h2>
            <div className="gs-admin-formgrid">
              {g.cols.map((c) => (
                <Field
                  key={c.name}
                  col={c}
                  value={row[c.name]}
                  onChange={(v) => set(c.name, v)}
                  owner={ownerFor()}
                />
              ))}
            </div>
          </section>
        ))}
        <button type="submit" disabled={saving} style={{ display: 'none' }}>저장</button>
      </form>

      {/* hospitals 전용 inline 패널들 — 같은 화면에서 시술/의사/B&A 관리 */}
      {kind === 'hospitals' && id && (
        <>
          <HospitalOfferingsPanel hospitalId={Number(id)} />
          <HospitalDoctorsPanel  hospitalId={Number(id)} />
          <HospitalBAPhotosPanel hospitalId={Number(id)} />
        </>
      )}
    </div>
  );
}

// ─── Field 렌더러 ─────────────────────────────────────────────────────
function Field({ col, value, onChange, owner }) {
  const id = `f-${col.name}`;
  const labelText = col.label || col.name;
  const showRaw = col.label && col.label !== col.name;

  // 공통 라벨 박스 — help 는 ? 아이콘 (hover/click 시 tooltip)
  const Label = (
    <label htmlFor={id} className="gs-admin-label">
      <span className="gs-admin-label-main">
        {labelText}
        {col.required && <span className="gs-admin-req"> *</span>}
        {col.help && (
          <span className="gs-admin-help-icon" tabIndex={0} aria-label={col.help} title={col.help}>
            ?
            <span className="gs-admin-help-pop">{col.help}</span>
          </span>
        )}
      </span>
      {showRaw && <span className="gs-admin-label-raw">{col.name}</span>}
    </label>
  );
  // bool 같이 라벨이 inline 인 케이스만 별도로 처리.
  const Help = null;

  if (col.type === 'image') {
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        {Label}
        {Help}
        <ImageUploader
          value={value}
          onChange={onChange}
          kind={col.upload?.kind || 'misc'}
          slot={col.upload?.slot || col.name}
          owner={owner}
        />
      </div>
    );
  }
  if (col.type === 'gallery') {
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        {Label}
        {Help}
        <ImageGalleryEditor
          value={value || []}
          onChange={onChange}
          kind={col.upload?.kind || 'misc'}
          slot={col.upload?.slot || 'gallery'}
          owner={owner}
        />
      </div>
    );
  }
  if (col.type === 'textarea') {
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        {Label}
        {Help}
        <textarea id={id} rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (col.type === 'bool') {
    return (
      <div className="gs-admin-field gs-admin-field-bool">
        <label className="gs-admin-label">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span className="gs-admin-label-main">
            {labelText}
            {col.help && (
              <span className="gs-admin-help-icon" tabIndex={0} aria-label={col.help} title={col.help}>
                ?
                <span className="gs-admin-help-pop">{col.help}</span>
              </span>
            )}
          </span>
          {showRaw && <span className="gs-admin-label-raw">{col.name}</span>}
        </label>
      </div>
    );
  }
  if (col.type === 'select') {
    const opts = col.options || [];
    const optLabels = col.optionLabels || {};
    return (
      <div className="gs-admin-field">
        {Label}
        {Help}
        <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">— 선택 안 함 —</option>
          {opts.map((o) => <option key={o} value={o}>{optLabels[o] || o}</option>)}
        </select>
      </div>
    );
  }
  if (col.type === 'tags') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        {Label}
        {Help}
        <input
          id={id}
          type="text"
          placeholder="콤마(,)로 구분"
          value={arr.join(', ')}
          onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        />
      </div>
    );
  }
  if (col.type === 'json') {
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        {Label}
        {Help}
        <textarea
          id={id}
          rows={4}
          placeholder='JSON 형식. 예: {"key":"value"} 또는 [{"a":1}]'
          value={value == null ? '' : (typeof value === 'string' ? value : JSON.stringify(value, null, 2))}
          onChange={(e) => {
            const txt = e.target.value;
            if (!txt.trim()) { onChange(null); return; }
            try { onChange(JSON.parse(txt)); } catch { onChange(txt); }
          }}
        />
      </div>
    );
  }
  if (col.type === 'number') {
    return (
      <div className="gs-admin-field">
        {Label}
        {Help}
        <input
          id={id} type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      </div>
    );
  }
  if (col.type === 'date') {
    return (
      <div className="gs-admin-field">
        {Label}
        {Help}
        <input id={id} type="date" value={value || ''} onChange={(e) => onChange(e.target.value || null)} />
      </div>
    );
  }
  if (col.type === 'datetime') {
    return (
      <div className="gs-admin-field">
        {Label}
        {Help}
        <input
          id={id} type="datetime-local"
          value={value ? new Date(value).toISOString().slice(0, 16) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        />
      </div>
    );
  }
  if (col.type === 'fk') {
    return (
      <div className="gs-admin-field">
        {Label}
        {Help}
        <FkPicker
          value={value}
          onChange={onChange}
          table={col.table}
          placeholder={`${col.label || col.name} 검색 (이름 또는 URL 식별자)`}
        />
        {col.table && (
          <a href={`/admin/${col.table}`} className="gs-admin-fk-link">{getKindLabel(col.table)} 관리 →</a>
        )}
      </div>
    );
  }
  // default = text
  return (
    <div className="gs-admin-field">
      {Label}
      {Help}
      <input id={id} type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

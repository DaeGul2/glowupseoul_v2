// Auto-generated form from specs.js. New / edit a row.
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './api.js';
import { getSpec, KINDS } from './specs.js';
import ImageUploader from './ImageUploader.jsx';
import ImageGalleryEditor from './ImageGalleryEditor.jsx';
import FkPicker, { invalidateFkCache } from './FkPicker.jsx';

const LABEL = Object.fromEntries(KINDS.map((k) => [k.kind, k.label]));

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
      .then((r) => setRow(r.row))
      .catch((e) => setErr(e.message))
      .finally(() => setBusy(false));
  }, [kind, id, spec]);

  if (!spec) return <div className="gs-admin-err">unknown kind: {kind}</div>;
  if (busy) return <div className="gs-admin-loading">Loading…</div>;
  if (!row) return <div className="gs-admin-err">{err || 'not found'}</div>;

  function set(name, v) { setRow((r) => ({ ...r, [name]: v })); }

  function ownerFor(col) {
    // S3 key owner — prefer slug; fall back to id; "new" rows get "new".
    return row.slug || row.id || 'new';
  }

  async function save(e) {
    e.preventDefault();
    setSave(true);
    setErr(null); setOk(null);
    try {
      const payload = {};
      for (const c of spec.cols) if (c.name in row) payload[c.name] = row[c.name];
      let saved;
      if (id) saved = await adminApi.update(kind, id, payload);
      else    saved = await adminApi.create(kind, payload);
      setRow(saved.row);
      setOk('Saved.');
      // Bust the FK picker cache so other forms see the new/updated row.
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

  // Render fields grouped by `group` heading.
  const groups = [];
  let cur = { name: 'Main', cols: [] };
  for (const c of spec.cols) {
    if (c.group) {
      if (cur.cols.length) groups.push(cur);
      cur = { name: c.group, cols: [c] };
    } else {
      cur.cols.push(c);
    }
  }
  if (cur.cols.length) groups.push(cur);

  return (
    <div className="gs-admin-page">
      <header className="gs-admin-header">
        <h1>
          <a href={`/admin/${kind}`} className="gs-admin-crumb">{LABEL[kind] || kind}</a> · {id ? `#${id}` : 'New'}
        </h1>
        <div className="gs-admin-header-actions">
          <a href={`/admin/${kind}`} className="gs-admin-ghostbtn">Cancel</a>
          <button onClick={save} disabled={saving} className="gs-admin-savebtn">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

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
                  owner={ownerFor(c)}
                />
              ))}
            </div>
          </section>
        ))}
        <button type="submit" disabled={saving} style={{ display: 'none' }}>Save</button>
      </form>
    </div>
  );
}

function Field({ col, value, onChange, owner }) {
  const id = `f-${col.name}`;
  if (col.type === 'image') {
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        <ImageUploader
          value={value}
          onChange={onChange}
          kind={col.upload?.kind || 'misc'}
          slot={col.upload?.slot || col.name}
          owner={owner}
          label={col.name}
        />
      </div>
    );
  }
  if (col.type === 'gallery') {
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        <ImageGalleryEditor
          value={value || []}
          onChange={onChange}
          kind={col.upload?.kind || 'misc'}
          slot={col.upload?.slot || 'gallery'}
          owner={owner}
          label={col.name}
        />
      </div>
    );
  }
  if (col.type === 'textarea') {
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        <label htmlFor={id}>{col.name}{col.required && <span className="gs-admin-req"> *</span>}</label>
        <textarea id={id} rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (col.type === 'bool') {
    return (
      <div className="gs-admin-field gs-admin-field-bool">
        <label>
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {col.name}
        </label>
      </div>
    );
  }
  if (col.type === 'select') {
    return (
      <div className="gs-admin-field">
        <label htmlFor={id}>{col.name}{col.required && <span className="gs-admin-req"> *</span>}</label>
        <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">—</option>
          {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (col.type === 'tags') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        <label htmlFor={id}>{col.name} <span className="gs-admin-hint">(comma-separated)</span></label>
        <input
          id={id}
          type="text"
          value={arr.join(', ')}
          onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        />
      </div>
    );
  }
  if (col.type === 'json') {
    return (
      <div className="gs-admin-field gs-admin-field-wide">
        <label htmlFor={id}>{col.name} <span className="gs-admin-hint">(JSON)</span></label>
        <textarea
          id={id}
          rows={4}
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
        <label htmlFor={id}>{col.name}</label>
        <input id={id} type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      </div>
    );
  }
  if (col.type === 'date') {
    return (
      <div className="gs-admin-field">
        <label htmlFor={id}>{col.name}</label>
        <input id={id} type="date" value={value || ''} onChange={(e) => onChange(e.target.value || null)} />
      </div>
    );
  }
  if (col.type === 'datetime') {
    return (
      <div className="gs-admin-field">
        <label htmlFor={id}>{col.name}</label>
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
        <label>
          {col.name}{col.required && <span className="gs-admin-req"> *</span>}{' '}
          <span className="gs-admin-hint">→ {col.table}</span>
        </label>
        <FkPicker
          value={value}
          onChange={onChange}
          table={col.table}
          placeholder={`Search ${col.table} by name or slug…`}
        />
        {col.table && (
          <a href={`/admin/${col.table}`} className="gs-admin-fk-link">manage {col.table} →</a>
        )}
      </div>
    );
  }
  // default = text
  return (
    <div className="gs-admin-field">
      <label htmlFor={id}>{col.name}{col.required && <span className="gs-admin-req"> *</span>}</label>
      <input id={id} type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

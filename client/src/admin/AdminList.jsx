import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './api.js';
import { getSpec, KINDS } from './specs.js';

const PAGE = 25;
const LABEL = Object.fromEntries(KINDS.map((k) => [k.kind, k.label]));

export default function AdminList({ kind }) {
  const spec = useMemo(() => getSpec(kind), [kind]);
  const [rows, setRows]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState('');
  const [err, setErr]       = useState(null);
  const [busy, setBusy]     = useState(true);

  useEffect(() => {
    setBusy(true);
    adminApi.list(kind, { limit: PAGE, offset })
      .then((r) => { setRows(r.rows); setTotal(r.total); })
      .catch((e) => setErr(e.message))
      .finally(() => setBusy(false));
  }, [kind, offset]);

  if (!spec) return <div className="gs-admin-err">unknown kind: {kind}</div>;

  const cols = spec.list;
  const filtered = filter
    ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(filter.toLowerCase()))
    : rows;

  function isComposite() { return Array.isArray(spec.pkFields); }
  function rowId(r) {
    if (isComposite()) return spec.pkFields.map((f) => r[f]).join('-');
    return r.id;
  }
  function editHref(r) {
    if (isComposite()) {
      const pk = spec.pkFields.map((f) => encodeURIComponent(r[f])).join('-');
      return `/admin/${kind}/${pk}`;
    }
    return `/admin/${kind}/${r.id}`;
  }

  async function remove(r) {
    if (!confirm('Delete this row?')) return;
    try {
      await adminApi.remove(kind, rowId(r));
      setRows((rs) => rs.filter((x) => rowId(x) !== rowId(r)));
    } catch (e) {
      alert(e.message);
    }
  }

  // FK columns: show the joined name from the eager-loaded association.
  const FK_ALIAS = {
    hospital_id: 'hospital',
    procedure_id: 'procedure',
    brand_id: 'brand',
    category_id: 'category',
    doctor_id: 'doctor',
    concern_id: 'concern',
    parent_id: 'parent',
    user_id: 'user',
  };

  function cellRender(col, val, row) {
    // FK column → show the related object's display name with a small id chip.
    if (col in FK_ALIAS) {
      const rel = row[FK_ALIAS[col]];
      if (rel) {
        const name = rel.name_ko || rel.name_en || rel.slug || `#${rel.id}`;
        return <span title={`#${rel.id} · ${rel.slug || ''}`}>{name}</span>;
      }
      return val == null ? <span className="gs-admin-null">—</span> : <code>#{val}</code>;
    }
    if (val === null || val === undefined) return <span className="gs-admin-null">—</span>;
    if (typeof val === 'boolean') return val ? '✓' : '·';
    if (typeof val === 'string' && /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)/i.test(val)) {
      return <img src={val} alt="" className="gs-admin-thumb" />;
    }
    if (Array.isArray(val))     return val.slice(0, 4).join(', ') + (val.length > 4 ? '…' : '');
    if (typeof val === 'object') return <code>{JSON.stringify(val).slice(0, 40)}…</code>;
    const s = String(val);
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }

  return (
    <div className="gs-admin-page">
      <header className="gs-admin-header">
        <h1>{LABEL[kind] || kind}</h1>
        <div className="gs-admin-header-actions">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter (on current page)…"
            className="gs-admin-filter"
          />
          <a className="gs-admin-newbtn" href={`/admin/${kind}/new`}>+ New</a>
        </div>
      </header>

      {err && <div className="gs-admin-err">{err}</div>}
      {busy && <div className="gs-admin-loading">Loading…</div>}

      {!busy && (
        <>
          <div className="gs-admin-table-wrap">
            <table className="gs-admin-table">
              <thead>
                <tr>
                  {cols.map((c) => <th key={c}>{c}</th>)}
                  <th className="gs-admin-table-actions">·</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={rowId(r)}>
                    {cols.map((c) => (
                      <td key={c}>
                        <a href={editHref(r)}>{cellRender(c, r[c], r)}</a>
                      </td>
                    ))}
                    <td className="gs-admin-table-actions">
                      <button onClick={() => remove(r)}>×</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={cols.length + 1} className="gs-admin-empty">No rows.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="gs-admin-pager">
            <span>{offset + 1}–{Math.min(offset + PAGE, total)} of {total}</span>
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Prev</button>
            <button disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>Next</button>
          </footer>
        </>
      )}
    </div>
  );
}

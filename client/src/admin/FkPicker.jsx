// FK picker — combobox. Search by name, select by row id.
// Caches the full list per-kind across mounts so re-opening forms is instant.
import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from './api.js';
import { getSpec } from './specs.js';

const _cache = new Map();    // kind → { promise, rows }

function loadOptions(kind) {
  if (_cache.has(kind)) return _cache.get(kind).promise;
  // Pull a generous page — most lookup tables are small.
  const p = adminApi.list(kind, { limit: 500 }).then((r) => {
    _cache.set(kind, { promise: p, rows: r.rows || [] });
    return r.rows || [];
  });
  _cache.set(kind, { promise: p, rows: [] });
  return p;
}

// Reset a kind's cache after a create/update so the picker shows new rows.
export function invalidateFkCache(kind) { _cache.delete(kind); }

function labelFor(spec, row, refLabel) {
  if (!row) return '';
  if (refLabel && row[refLabel] != null) return String(row[refLabel]);
  if (!spec) return `#${row?.id ?? row?.slug}`;
  const title = row?.[spec.titleField] ?? row?.label_ko ?? row?.name_ko ?? row?.name_en ?? row?.slug;
  return title ? String(title) : `#${row?.id ?? row?.slug}`;
}

// refField — column to send back to parent (defaults to 'id'). Use 'slug'
//            for lookup tables whose PK is a slug (e.g. mechanisms).
// refLabel — column for display label override.
export default function FkPicker({ value, onChange, table, placeholder = 'Type to search…', refField = 'id', refLabel = null }) {
  const spec = useMemo(() => getSpec(table), [table]);
  const [rows, setRows]   = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(true);
  const wrap = useRef(null);

  useEffect(() => {
    let live = true;
    loadOptions(table).then((r) => { if (live) { setRows(r); setBusy(false); } });
    return () => { live = false; };
  }, [table]);

  useEffect(() => {
    function onDoc(e) {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = useMemo(
    () => (value == null ? null : rows.find((r) => r[refField] === value || String(r[refField]) === String(value)) || null),
    [rows, value, refField]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? rows.filter((r) => {
          const hay = [
            r.id, r.slug, r.name_ko, r.name_en, r.name_zh, r.name_ja,
            r.label_ko, r.label_en,
            r.title_ko, r.local_name_ko,
          ].filter(Boolean).join(' ').toLowerCase();
          return hay.includes(q);
        })
      : rows;
    return pool.slice(0, 30);
  }, [rows, query]);

  function shortId(r) {
    const k = r[refField];
    return refField === 'id' ? `#${k}` : String(k);
  }

  return (
    <div className={`gs-fkp${open ? ' is-open' : ''}`} ref={wrap}>
      <div className="gs-fkp-summary" onClick={() => setOpen((v) => !v)}>
        {selected ? (
          <>
            <span className="gs-fkp-label">{labelFor(spec, selected, refLabel)}</span>
            <span className="gs-fkp-id">{shortId(selected)}</span>
          </>
        ) : (
          <span className="gs-fkp-placeholder">{busy ? '불러오는 중…' : (value ? `${refField === 'id' ? '#' : ''}${value} (찾을 수 없음)` : '선택하세요 →')}</span>
        )}
        <span className="gs-fkp-caret">▾</span>
      </div>

      {open && (
        <div className="gs-fkp-pop">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="gs-fkp-search"
          />
          <div className="gs-fkp-list">
            {value != null && (
              <button
                type="button"
                className="gs-fkp-clear"
                onClick={() => { onChange(null); setOpen(false); setQuery(''); }}
              >
                ✕ 선택 해제
              </button>
            )}
            {matches.length === 0 ? (
              <div className="gs-fkp-empty">일치하는 항목 없음.</div>
            ) : (
              matches.map((r) => (
                <button
                  type="button"
                  key={r[refField] ?? r.id ?? r.slug}
                  className={`gs-fkp-opt${selected?.[refField] === r[refField] ? ' is-selected' : ''}`}
                  onClick={() => { onChange(r[refField]); setOpen(false); setQuery(''); }}
                >
                  <span className="gs-fkp-opt-label">{labelFor(spec, r, refLabel)}</span>
                  <span className="gs-fkp-opt-sub">{r.slug && refField !== 'slug' ? `${r.slug} · #${r.id}` : shortId(r)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './api.js';
import { getSpec, getKindLabel } from './specs.js';

const PAGE = 25;

// 컬럼명 → 사용자 친화 한국어. specs.cols 의 label 을 우선 매핑, 없으면 fallback.
function buildColLabels(spec) {
  const map = {};
  for (const c of spec.cols || []) if (c.label) map[c.name] = c.label;
  // 공용 컬럼
  const fallback = {
    id: 'ID', slug: 'URL 식별자',
    name_ko: '이름 (한국어)', name_en: '이름 (영어)',
    is_active: '활성',
    contract_status: '계약 상태', city: '도시', district: '구',
    domain: '도메인', is_surgical: '수술',
    is_signature: '시그너처', is_seed: '시드',
    is_visible: '노출',
    display_initial: '이니셜', country_code: '국가',
    treatment_label_en: '시술 표기 (EN)',
    outcome: '결과',
    visibility: '공개 범위',
    body_area: '부위', display_order: '순서',
    relevance: '관련도',
    hospital_id: '병원', procedure_id: '시술', doctor_id: '의사',
    brand_id: '브랜드', category_id: '카테고리', concern_id: '고민',
    starting_price_krw: '시작 가격', price_tier: '가격대',
    is_featured: '대표',
  };
  return { ...fallback, ...map };
}

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

  if (!spec) return <div className="gs-admin-err">알 수 없는 모델: {kind}</div>;

  const cols = spec.list;
  const labels = buildColLabels(spec);
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
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;
    try {
      await adminApi.remove(kind, rowId(r));
      setRows((rs) => rs.filter((x) => rowId(x) !== rowId(r)));
    } catch (e) {
      alert(e.message);
    }
  }

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
        <h1>{getKindLabel(kind)}</h1>
        <div className="gs-admin-header-actions">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="현재 페이지에서 검색…"
            className="gs-admin-filter"
          />
          <a className="gs-admin-newbtn" href={`/admin/${kind}/new`}>+ 새로 만들기</a>
        </div>
      </header>

      {spec.listIntro && <div className="gs-admin-intro">{spec.listIntro}</div>}

      {err && <div className="gs-admin-err">{err}</div>}
      {busy && <div className="gs-admin-loading">불러오는 중…</div>}

      {!busy && (
        <>
          <div className="gs-admin-table-wrap">
            <table className="gs-admin-table">
              <thead>
                <tr>
                  {cols.map((c) => <th key={c}>{labels[c] || c}</th>)}
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
                      <button onClick={() => remove(r)} title="삭제">×</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={cols.length + 1} className="gs-admin-empty">아직 등록된 항목이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="gs-admin-pager">
            <span>총 {total}건 · {offset + 1}–{Math.min(offset + PAGE, total)}</span>
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>이전</button>
            <button disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>다음</button>
          </footer>
        </>
      )}
    </div>
  );
}

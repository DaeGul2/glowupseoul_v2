import { useEffect, useState } from 'react';
import { adminApi } from './api.js';
import { KINDS, KIND_SECTIONS } from './specs.js';

const KIND_BY_SLUG = Object.fromEntries(KINDS.map((k) => [k.kind, k]));

// 사이드바와 같은 섹션 구조로 stats 도 묶음.
function groupCounts(counts) {
  const grouped = {};
  for (const [k, v] of Object.entries(counts)) {
    const meta = KIND_BY_SLUG[k];
    const section = meta?.section || '_misc';
    (grouped[section] = grouped[section] || []).push({ k, v, meta });
  }
  // 사이드바 순서 + "_misc" 맨 뒤
  const ordered = [];
  for (const sec of KIND_SECTIONS) {
    if (grouped[sec.key]?.length) ordered.push({ section: sec, items: grouped[sec.key] });
  }
  if (grouped['_misc']?.length) {
    ordered.push({ section: { key: '_misc', label: '기타', hint: '' }, items: grouped['_misc'] });
  }
  return ordered;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="gs-admin-err">{err}</div>;
  if (!stats) return <div className="gs-admin-loading">불러오는 중…</div>;

  const sections = groupCounts(stats.counts || {});

  return (
    <div className="gs-admin-page">
      <h1>대시보드</h1>
      <p className="gs-admin-page-intro">
        모델별 등록 건수. 카탈로그 → 매트릭스 → 병원 순으로 채우는 게 좋습니다. 카드 클릭 시 해당 메뉴로.
      </p>

      {sections.map(({ section, items }) => (
        <section key={section.key} className="gs-admin-statsec">
          <div className="gs-admin-statsec-head">
            <h2 className="gs-admin-statsec-title">{section.label}</h2>
            {section.hint && <span className="gs-admin-statsec-hint">{section.hint}</span>}
          </div>
          <div className="gs-admin-statgrid">
            {items.map(({ k, v, meta }) => (
              <a key={k} className="gs-admin-statcard" href={`/admin/${k}`} title={meta?.help || ''}>
                <div className="gs-admin-statnum">{v.toLocaleString()}</div>
                <div className="gs-admin-statlabel">{meta?.label || k}</div>
              </a>
            ))}
          </div>
        </section>
      ))}

      <div className="gs-admin-statmeta">
        <span className={`gs-admin-chip ${stats.s3_configured ? 'is-on' : 'is-off'}`}>
          S3 {stats.s3_configured ? '연결됨' : '미설정'}
        </span>
        <span className="gs-admin-statmeta-hint">
          ※ S3 미설정 시 사진 업로드 불가. 운영자에게 문의하세요.
        </span>
      </div>
    </div>
  );
}

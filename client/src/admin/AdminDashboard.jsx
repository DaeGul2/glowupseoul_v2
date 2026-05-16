import { useEffect, useState } from 'react';
import { adminApi } from './api.js';
import { KINDS, KIND_SECTIONS } from './specs.js';

function fmtUsd(n) {
  const v = Number(n) || 0;
  if (v < 0.01) return `$${v.toFixed(6)}`;
  if (v < 1)    return `$${v.toFixed(4)}`;
  return `$${v.toFixed(2)}`;
}
function fmtNum(n) { return (Number(n) || 0).toLocaleString(); }

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
  const [scan, setScan]   = useState(null);
  const [err, setErr]     = useState(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setErr(e.message));
    adminApi.scanStats().then(setScan).catch(() => {});
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

      {scan && (
        <section className="gs-admin-statsec" style={{ marginTop: 18 }}>
          <div className="gs-admin-statsec-head">
            <h2 className="gs-admin-statsec-title">AI 스캔 · 누적 비용</h2>
            <span className="gs-admin-statsec-hint">
              IP 당 쿨다운: {scan.cooldown_sec}초
            </span>
          </div>
          <div className="gs-admin-statgrid">
            {[
              { k: 'today',     label: '오늘'    },
              { k: 'last_7d',   label: '최근 7일' },
              { k: 'last_30d',  label: '최근 30일' },
              { k: 'all_time',  label: '전체'    },
            ].map(({ k, label }) => {
              const b = scan[k] || { total_count: 0, total_cost_usd: 0, analyze: {}, synthesize: {} };
              return (
                <div key={k} className="gs-admin-statcard" style={{ cursor: 'default' }}>
                  <div className="gs-admin-statnum">{fmtNum(b.total_count)}</div>
                  <div className="gs-admin-statlabel">{label} 호출 수</div>
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--a-muted)', fontFamily: 'ui-monospace,monospace' }}>
                    <div>비용 합: <strong style={{ color: 'var(--a-text)' }}>{fmtUsd(b.total_cost_usd)}</strong></div>
                    <div>analyze: {fmtNum(b.analyze.count)} · {fmtUsd(b.analyze.cost_usd)}</div>
                    <div>synth: {fmtNum(b.synthesize.count)} · {fmtUsd(b.synthesize.cost_usd)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {scan.recent?.length > 0 && (
            <details style={{ marginTop: 18 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--a-muted)' }}>
                최근 호출 {scan.recent.length}건 ▾
              </summary>
              <table style={{ width: '100%', marginTop: 10, fontSize: 11, fontFamily: 'ui-monospace,monospace', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--a-muted)' }}>
                    <th style={{ padding: '6px 8px' }}>시각</th>
                    <th>type</th>
                    <th>IP</th>
                    <th>model</th>
                    <th style={{ textAlign: 'right' }}>tok in/out</th>
                    <th style={{ textAlign: 'right' }}>비용</th>
                    <th style={{ textAlign: 'right' }}>ms</th>
                    <th>status</th>
                  </tr>
                </thead>
                <tbody>
                  {scan.recent.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--a-border)' }}>
                      <td style={{ padding: '6px 8px' }}>{new Date(r.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
                      <td>{r.event_type}</td>
                      <td>{r.ip || '—'}</td>
                      <td>{r.model || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{r.tokens_in || 0}/{r.tokens_out || 0}</td>
                      <td style={{ textAlign: 'right' }}>{fmtUsd(r.cost_usd)}</td>
                      <td style={{ textAlign: 'right' }}>{r.duration_ms || 0}</td>
                      <td style={{ color: r.status_code === 200 ? 'inherit' : 'var(--a-danger)' }}>{r.status_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </section>
      )}

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

import { useEffect, useState } from 'react';
import { adminApi } from './api.js';
import { KINDS } from './specs.js';

const LABEL = Object.fromEntries(KINDS.map((k) => [k.kind, k.label]));

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="gs-admin-err">{err}</div>;
  if (!stats) return <div className="gs-admin-loading">불러오는 중…</div>;

  const c = stats.counts || {};
  const entries = Object.entries(c);

  return (
    <div className="gs-admin-page">
      <h1>대시보드</h1>
      <p className="gs-admin-page-intro">
        모델별 등록 건수 한눈에. 카드 클릭 시 해당 메뉴로 이동합니다.
      </p>
      <div className="gs-admin-statgrid">
        {entries.map(([k, v]) => (
          <a key={k} className="gs-admin-statcard" href={`/admin/${k}`}>
            <div className="gs-admin-statnum">{v.toLocaleString()}</div>
            <div className="gs-admin-statlabel">{LABEL[k] || k}</div>
          </a>
        ))}
      </div>
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

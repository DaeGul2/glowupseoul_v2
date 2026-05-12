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
  if (!stats) return <div className="gs-admin-loading">Loading…</div>;

  const c = stats.counts || {};
  const entries = Object.entries(c);

  return (
    <div className="gs-admin-page">
      <h1>Dashboard</h1>
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
          S3 {stats.s3_configured ? 'connected' : 'not configured'}
        </span>
      </div>
    </div>
  );
}

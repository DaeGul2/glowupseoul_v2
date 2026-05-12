// Partner application inbox — list / inspect / approve / reject.
import { useEffect, useState } from 'react';
import { adminApi } from './api.js';

export default function AdminPartners() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [open, setOpen] = useState(null);          // detail file
  const [detail, setDetail] = useState(null);
  const [err, setErr]   = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [flash, setFlash] = useState(null);

  async function refresh() {
    setBusy(true);
    try {
      const r = await adminApi.partnerList();
      setRows(r.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { refresh(); }, []);

  async function openDetail(file) {
    setOpen(file); setDetail(null);
    try {
      const r = await adminApi.partnerGet(file);
      setDetail(r.submission);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function approve() {
    if (!open) return;
    if (!confirm(`Approve "${detail?.brand?.name_ko}" — this will insert brand + hospital + ${detail?.procedures?.length || 0} hospital_procedure rows.`)) return;
    setActionBusy(true);
    try {
      const r = await adminApi.partnerApprove(open);
      setFlash(`✓ Approved. brand=${r.result?.brand?.slug} hospital=${r.result?.hospital?.slug} hp×${r.result?.hospital_procedures}${r.result?.warnings?.length ? ` · ${r.result.warnings.length} warning(s)` : ''}`);
      setOpen(null); setDetail(null);
      refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setActionBusy(false);
    }
  }

  async function reject() {
    if (!open) return;
    if (!confirm('Reject and archive this submission?')) return;
    setActionBusy(true);
    try {
      await adminApi.partnerReject(open);
      setFlash('Rejected.');
      setOpen(null); setDetail(null);
      refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="gs-admin-page">
      <header className="gs-admin-header">
        <h1>Partner Applications</h1>
        <div className="gs-admin-header-actions">
          <button onClick={refresh}>↻ Refresh</button>
        </div>
      </header>

      {flash && <div className="gs-admin-ok">{flash}</div>}
      {err && <div className="gs-admin-err">{err}</div>}

      {busy ? (
        <div className="gs-admin-loading">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="gs-admin-empty">No pending submissions.</div>
      ) : (
        <div className="gs-admin-table-wrap">
          <table className="gs-admin-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Brand</th>
                <th>Branch</th>
                <th>Applicant</th>
                <th>Procedures</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.file}>
                  <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</td>
                  <td>
                    <strong>{r.brand_ko}</strong>
                    {r.brand_en && <div className="gs-admin-sub">{r.brand_en}</div>}
                  </td>
                  <td>{r.city} · {r.district}</td>
                  <td>
                    {r.applicant}
                    <div className="gs-admin-sub">{r.email}</div>
                  </td>
                  <td>{r.procedure_count}</td>
                  <td>
                    <button onClick={() => openDetail(r.file)}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="gs-admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="gs-admin-modal-card">
            <header>
              <h2>{detail?.brand?.name_ko || open}</h2>
              <button onClick={() => setOpen(null)}>×</button>
            </header>
            {!detail ? (
              <div className="gs-admin-loading">Loading…</div>
            ) : (
              <div className="gs-admin-modal-body">
                <div className="gs-admin-kv">
                  <KV label="Applicant" v={`${detail.applicant?.name} · ${detail.applicant?.role}`} />
                  <KV label="Email"     v={detail.applicant?.email} />
                  <KV label="Phone"     v={detail.applicant?.phone} />
                  <KV label="Channel"   v={`${detail.applicant?.preferred_channel || '—'} ${detail.applicant?.channel_id || ''}`} />
                  <KV label="Brand"     v={`${detail.brand?.name_ko} (${detail.brand?.name_en || '—'})`} />
                  <KV label="Founder"   v={detail.brand?.founding_doctor} />
                  <KV label="Site"      v={detail.brand?.website_url} />
                  <KV label="Specialization" v={detail.brand?.specialization_depth} />
                  <KV label="Chain"     v={detail.brand?.is_chain ? 'Yes' : 'No'} />
                  <KV label="Location"  v={`${detail.hospital?.city} · ${detail.hospital?.district} · ${detail.hospital?.neighborhood || '—'}`} />
                  <KV label="Branch"    v={detail.hospital?.branch_name} />
                  <KV label="Address"   v={detail.hospital?.full_address_ko} />
                  <KV label="Phone (clinic)" v={detail.hospital?.phone} />
                  <KV label="Established" v={detail.hospital?.established_year} />
                  <KV label="Languages" v={(detail.hospital?.languages_supported || []).join(', ')} />
                  <KV label="Safety claim" v={detail.trust?.safety_claim} />
                  <KV label="BA photos"    v={detail.trust?.ba_photo_count} />
                  <KV label="Foreign cases/mo" v={detail.trust?.foreign_case_volume_monthly} />
                  <KV label="Commission asked" v={detail.commercial?.commission_pct != null ? `${detail.commercial.commission_pct}%` : '—'} />
                  <KV label="Notes"     v={detail.commercial?.notes} />
                </div>
                <h3>Capabilities</h3>
                <div className="gs-admin-chiplist">
                  {Object.entries(detail.hospital?.capabilities || {}).map(([k, v]) => (
                    <span key={k} className={`gs-admin-chip ${v ? 'is-on' : 'is-off'}`}>{k}</span>
                  ))}
                </div>
                <h3>Procedures ({detail.procedures?.length || 0})</h3>
                <table className="gs-admin-table">
                  <thead>
                    <tr><th>slug</th><th>local name</th><th>price (KRW)</th><th>device</th><th>signature</th></tr>
                  </thead>
                  <tbody>
                    {(detail.procedures || []).map((p, i) => (
                      <tr key={i}>
                        <td><code>{p.procedure_slug}</code></td>
                        <td>{p.local_name_ko}</td>
                        <td>{p.starting_price_krw?.toLocaleString() || '—'}</td>
                        <td>{(p.device_brands || []).join(', ')}</td>
                        <td>{p.is_signature ? '★' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer>
              <button className="gs-admin-danger" onClick={reject} disabled={actionBusy || !detail}>Reject</button>
              <div style={{ flex: 1 }} />
              <button className="gs-admin-savebtn" onClick={approve} disabled={actionBusy || !detail}>
                Approve → import to DB
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function KV({ label, v }) {
  return (
    <div className="gs-admin-kv-row">
      <div className="gs-admin-kv-label">{label}</div>
      <div className="gs-admin-kv-val">{v == null || v === '' ? '—' : String(v)}</div>
    </div>
  );
}

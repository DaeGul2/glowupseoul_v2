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
    if (!confirm(`"${detail?.brand?.name_ko}" 를 승인하시겠습니까?\n브랜드 + 병원 + 시술 ${detail?.procedures?.length || 0}건이 DB 에 등록됩니다.`)) return;
    setActionBusy(true);
    try {
      const r = await adminApi.partnerApprove(open);
      setFlash(`✓ 승인 완료. 브랜드=${r.result?.brand?.slug} · 병원=${r.result?.hospital?.slug} · 시술 ${r.result?.hospital_procedures}건${r.result?.warnings?.length ? ` · 경고 ${r.result.warnings.length}건` : ''}`);
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
    if (!confirm('이 신청서를 거절(보관) 처리하시겠습니까?')) return;
    setActionBusy(true);
    try {
      await adminApi.partnerReject(open);
      setFlash('거절 처리됨.');
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
        <h1>파트너 신청서</h1>
        <div className="gs-admin-header-actions">
          <button onClick={refresh}>↻ 새로고침</button>
        </div>
      </header>
      <div className="gs-admin-intro">
        병원이 보낸 등록 신청서 inbox. 내용을 검토한 뒤 \"승인 → DB 등록\" 을 누르면 자동으로 병원·시술 가격표로 옮겨갑니다 (계약 상태는 일단 \"pending\" 으로 들어가니, 매칭 노출하려면 그 행에서 \"active\" 로 바꿔주세요).
      </div>

      {flash && <div className="gs-admin-ok">{flash}</div>}
      {err && <div className="gs-admin-err">{err}</div>}

      {busy ? (
        <div className="gs-admin-loading">불러오는 중…</div>
      ) : rows.length === 0 ? (
        <div className="gs-admin-empty">대기 중인 신청서가 없습니다.</div>
      ) : (
        <div className="gs-admin-table-wrap">
          <table className="gs-admin-table">
            <thead>
              <tr>
                <th>신청 일시</th>
                <th>브랜드</th>
                <th>지점 / 위치</th>
                <th>신청자</th>
                <th>시술 수</th>
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
                    <button onClick={() => openDetail(r.file)}>열기</button>
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
              <div className="gs-admin-loading">불러오는 중…</div>
            ) : (
              <div className="gs-admin-modal-body">
                <div className="gs-admin-kv">
                  <KV label="신청자"        v={`${detail.applicant?.name} · ${detail.applicant?.role}`} />
                  <KV label="이메일"        v={detail.applicant?.email} />
                  <KV label="전화"          v={detail.applicant?.phone} />
                  <KV label="선호 채널"     v={`${detail.applicant?.preferred_channel || '—'} ${detail.applicant?.channel_id || ''}`} />
                  <KV label="브랜드"        v={`${detail.brand?.name_ko} (${detail.brand?.name_en || '—'})`} />
                  <KV label="대표/창립 의사" v={detail.brand?.founding_doctor} />
                  <KV label="홈페이지"      v={detail.brand?.website_url} />
                  <KV label="전문성"        v={detail.brand?.specialization_depth} />
                  <KV label="체인 여부"     v={detail.brand?.is_chain ? '예' : '아니오'} />
                  <KV label="위치"          v={`${detail.hospital?.city} · ${detail.hospital?.district} · ${detail.hospital?.neighborhood || '—'}`} />
                  <KV label="지점명"        v={detail.hospital?.branch_name} />
                  <KV label="주소"          v={detail.hospital?.full_address_ko} />
                  <KV label="병원 전화"     v={detail.hospital?.phone} />
                  <KV label="개원 연도"     v={detail.hospital?.established_year} />
                  <KV label="응대 가능 언어" v={(detail.hospital?.languages_supported || []).join(', ')} />
                  <KV label="안전 클레임"   v={detail.trust?.safety_claim} />
                  <KV label="B&A 사진 수"   v={detail.trust?.ba_photo_count} />
                  <KV label="월 외국 환자"  v={detail.trust?.foreign_case_volume_monthly} />
                  <KV label="요청 수수료"   v={detail.commercial?.commission_pct != null ? `${detail.commercial.commission_pct}%` : '—'} />
                  <KV label="비고"          v={detail.commercial?.notes} />
                </div>
                <h3>외국 환자 응대 역량</h3>
                <div className="gs-admin-chiplist">
                  {Object.entries(detail.hospital?.capabilities || {}).map(([k, v]) => (
                    <span key={k} className={`gs-admin-chip ${v ? 'is-on' : 'is-off'}`}>{k}</span>
                  ))}
                </div>
                <h3>제공 시술 ({detail.procedures?.length || 0}건)</h3>
                <table className="gs-admin-table">
                  <thead>
                    <tr><th>시술 식별자</th><th>병원 자체 명칭</th><th>가격 (원)</th><th>장비</th><th>시그너처</th></tr>
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
              <button className="gs-admin-danger" onClick={reject} disabled={actionBusy || !detail}>거절 (보관)</button>
              <div style={{ flex: 1 }} />
              <button className="gs-admin-savebtn" onClick={approve} disabled={actionBusy || !detail}>
                승인 → DB 등록
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

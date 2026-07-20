// Booking status — /booking (enter code) and /booking/:code (view).
// Shows the request → confirmed timeline; confirmed trips get the exact
// dates + an "Add to calendar" (.ics) download.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import WaIcon from './WaIcon.jsx';

const WA_NUM = '821064871060';

function prettyDate(isoStr) {
  if (!isoStr) return '';
  return new Date(`${isoStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

const STATUS_COPY = {
  requested: { label: 'Requested', note: 'Romie is reviewing your request — expect a WhatsApp message within 24 hours.' },
  confirmed: { label: 'Confirmed', note: 'Your trip dates are locked in. See you in Seoul!' },
  completed: { label: 'Completed', note: 'Hope you loved it — aftercare check-ins continue on WhatsApp.' },
  cancelled: { label: 'Cancelled', note: 'This booking was cancelled. Message Romie any time to start again.' },
  declined:  { label: 'Not available', note: 'We couldn\'t take this request — Romie can suggest alternatives on WhatsApp.' },
};

export default function BookingStatusPage() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!codeParam) { setData(null); return; }
    let alive = true;
    setLoading(true); setErr(null); setData(null);
    fetch(`/api/v3/bookings/${encodeURIComponent(codeParam)}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'not found'); return d; })
      .then((d) => alive && setData(d))
      .catch(() => alive && setErr('We couldn\'t find that booking code. Double-check it — e.g. GUS-7F3K.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [codeParam]);

  /* ---- code entry ---- */
  if (!codeParam) {
    return (
      <div className="v3s-page">
        <section className="v3s-wrap v3s-bk-status">
          <div className="v3s-sec-head" style={{ maxWidth: 720 }}>
            <span className="v3s-eyebrow">My booking</span>
            <h2>Check your <em>trip.</em></h2>
            <p>Enter the booking code from your request confirmation (it looks like GUS-7F3K).</p>
          </div>
          <form className="v3s-bk-codeform" onSubmit={(e) => { e.preventDefault(); if (input.trim()) navigate(`/booking/${input.trim().toUpperCase()}`); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="GUS-XXXX" maxLength={16} autoFocus />
            <button type="submit" className="v3s-btn" disabled={!input.trim()}>Check <span className="tail">→</span></button>
          </form>
        </section>
      </div>
    );
  }

  const sc = data ? (STATUS_COPY[data.status] || STATUS_COPY.requested) : null;
  const steps = ['requested', 'confirmed', 'completed'];
  const stepIdx = data ? Math.max(0, steps.indexOf(data.status)) : 0;
  const dead = data && ['cancelled', 'declined'].includes(data.status);

  return (
    <div className="v3s-page">
      <section className="v3s-wrap v3s-bk-status">
        <Link className="v3s-dt-back" to="/booking">‹ Check another code</Link>

        {loading && <div className="v3s-dt-loading">Loading…</div>}
        {err && (
          <div className="v3s-bk-status-card">
            <h2 style={{ marginTop: 0 }}>Hmm.</h2>
            <p>{err}</p>
            <a className="v3s-btn v3s-btn--ghost" href={`https://wa.me/${WA_NUM}`} style={{ textDecoration: 'none' }}><WaIcon /> Ask Romie instead</a>
          </div>
        )}

        {data && (
          <>
            <div className="v3s-sec-head" style={{ maxWidth: 760 }}>
              <span className="v3s-eyebrow">Booking {data.code}</span>
              <h2>{data.item_name} <em>trip.</em></h2>
            </div>

            <div className="v3s-bk-status-card">
              {!dead && (
                <div className="v3s-bk-timeline">
                  {steps.map((s, i) => (
                    <div key={s} className={`v3s-bk-tstep ${i <= stepIdx ? 'on' : ''} ${data.status === s ? 'now' : ''}`}>
                      <span className="dotmark" />
                      <span className="lbl">{STATUS_COPY[s].label}</span>
                      {i < steps.length - 1 && <span className="linebar" />}
                    </div>
                  ))}
                </div>
              )}

              <div className={`v3s-bk-status-note ${dead ? 'dead' : ''}`}>{sc.note}</div>

              <dl className="v3s-bk-status-facts">
                <div><dt>Status</dt><dd>{sc.label}</dd></div>
                {data.requested_date && <div><dt>Wish date</dt><dd>{prettyDate(data.requested_date)}</dd></div>}
                {data.status === 'confirmed' && data.confirmed_start && (
                  <div><dt>Confirmed dates</dt><dd>
                    {data.confirmed_start === data.confirmed_end
                      ? prettyDate(data.confirmed_start)
                      : `${prettyDate(data.confirmed_start)} — ${prettyDate(data.confirmed_end)}`}
                  </dd></div>
                )}
              </dl>

              <div className="v3s-bk-done-cta">
                {data.status === 'confirmed' && (
                  <a className="v3s-btn" href={`/api/v3/bookings/${data.code}/ics`}>＋ Add to my calendar</a>
                )}
                <a className={`v3s-btn ${data.status === 'confirmed' ? 'v3s-btn--ghost' : ''}`}
                  href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(`Hi Romie, about my booking ${data.code} (${data.item_name}) —`)}`}
                  target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <WaIcon /> Message Romie
                </a>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

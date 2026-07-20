// Booking wizard — modal, launched from "Book this trip" on detail pages.
// Step 1: pick a wish date (or "I haven't decided yet") → Step 2: details
// (+ Turnstile) → Step 3: done (code + WhatsApp handoff).
// Not an instant booking: Romie confirms the final dates on WhatsApp.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtKRW } from './catalogApi.js';
import { COUNTRIES, countryOf, onlyDigits, validatePhone, validateEmail, validateName } from '../lib/validation.js';
import WaIcon from './WaIcon.jsx';

const WA_NUM = '821064871060';

/* ---------------- date helpers ---------------- */
const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
function addMonths(y, m, n) { const d = new Date(y, m - 1 + n, 1); return [d.getFullYear(), d.getMonth() + 1]; }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
function prettyDate(isoStr) {
  if (!isoStr) return '';
  return new Date(`${isoStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

// 국가 목록/전화·이메일 검증 규칙은 ../lib/validation.js (admin 과 공유)

/* ---------------- calendar ---------------- */
function BookingCalendar({ availability, value, onChange }) {
  const minDate = availability?.window?.min_date;
  const maxDate = availability?.window?.max_date;
  const blocked = useMemo(() => new Set(availability?.blocked || []), [availability]);

  const start = minDate ? [Number(minDate.slice(0, 4)), Number(minDate.slice(5, 7))] : (() => { const t = new Date(); return [t.getFullYear(), t.getMonth() + 1]; })();
  const [[y, m], setYm] = useState(start);

  const dim = new Date(y, m, 0).getDate();
  const lead = new Date(y, m - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(iso(y, m, d));

  const canPrev = minDate ? iso(y, m, 1) > minDate : true;
  const canNext = maxDate ? iso(y, m, dim) < maxDate : true;

  return (
    <div className="v3s-bk-cal">
      <div className="v3s-bk-cal-head">
        <button type="button" onClick={() => canPrev && setYm(addMonths(y, m, -1))} disabled={!canPrev} aria-label="Previous month">‹</button>
        <div className="v3s-bk-cal-title">{MONTHS[m - 1]} <span>{y}</span></div>
        <button type="button" onClick={() => canNext && setYm(addMonths(y, m, 1))} disabled={!canNext} aria-label="Next month">›</button>
      </div>
      <div className="v3s-bk-cal-grid">
        {DOW.map((w, i) => <div key={w} className={`v3s-bk-cal-dow ${i === 0 || i === 6 ? 'we' : ''}`}>{w}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="v3s-bk-cal-cell empty" />;
          const out = (minDate && day < minDate) || (maxDate && day > maxDate);
          const isBlocked = blocked.has(day);
          const disabled = out || isBlocked;
          const cls = ['v3s-bk-cal-cell', disabled ? 'off' : '', isBlocked ? 'taken' : '', value === day ? 'sel' : ''].filter(Boolean).join(' ');
          return (
            <button type="button" key={day} className={cls} disabled={disabled}
              onClick={() => onChange(value === day ? null : day)}
              aria-label={day + (isBlocked ? ' — unavailable' : '')}>
              <span>{Number(day.slice(8))}</span>
            </button>
          );
        })}
      </div>
      <div className="v3s-bk-cal-legend">
        <span><i className="a" /> Available</span>
        <span><i className="t" /> Unavailable</span>
        <span><i className="s" /> Your pick</span>
      </div>
    </div>
  );
}

/* ---------------- Cloudflare Turnstile ---------------- */
function TurnstileWidget({ onToken }) {
  const ref = useRef(null);
  const cbRef = useRef(onToken);
  cbRef.current = onToken;
  const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!sitekey) return undefined;
    let widgetId = null;
    let cancelled = false;
    function render() {
      if (cancelled || !window.turnstile || !ref.current || ref.current.dataset.rendered) return;
      ref.current.dataset.rendered = '1';
      widgetId = window.turnstile.render(ref.current, {
        sitekey,
        theme: 'light',
        callback: (t) => cbRef.current(t),
        'expired-callback': () => cbRef.current(null),
        'error-callback': () => cbRef.current(null),
      });
    }
    if (window.turnstile) render();
    else {
      let s = document.getElementById('cf-turnstile-script');
      if (!s) {
        s = document.createElement('script');
        s.id = 'cf-turnstile-script';
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener('load', render);
    }
    const node = ref.current;
    return () => {
      cancelled = true;
      // StrictMode 재마운트 대비: 플래그를 지워야 두 번째 마운트에서 다시 렌더됨
      // (안 지우면 위젯은 remove 됐는데 가드에 걸려 영영 안 뜸 → 토큰 없음 → 제출 불가)
      if (node) delete node.dataset.rendered;
      if (widgetId != null && window.turnstile) { try { window.turnstile.remove(widgetId); } catch { /* noop */ } }
    };
  }, [sitekey]);

  if (!sitekey) return null;
  return <div ref={ref} className="v3s-bk-turnstile" />;
}

/* ---------------- wizard ---------------- */
const STEPS = [
  { key: 'date',    label: 'Dates' },
  { key: 'details', label: 'Details' },
  { key: 'done',    label: 'Done' },
];

export default function BookingWizard({ kind, row, onClose }) {  // kind: 'treatments' | 'surgeries'
  const singular = kind === 'surgeries' ? 'surgery' : 'treatment';

  const [step, setStep] = useState('date');
  const [availability, setAvailability] = useState(null);
  const [date, setDate] = useState(null);
  const [flexible, setFlexible] = useState(false);
  const [form, setForm] = useState({ client_name: '', country_code: '', whatsapp: '', email: '', notes: '' });
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null); // { code, requested_date }

  const bodyRef = useRef(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    let alive = true;
    fetch('/api/v3/bookings/availability').then((r) => r.json()).then((d) => alive && setAvailability(d)).catch(() => {});

    // 배경 스크롤 완전 잠금 — overflow:hidden 만으론 모바일/스크롤 체이닝을 못 막음.
    // body 를 fixed 로 고정하고 닫을 때 원래 스크롤 위치 복원.
    const scrollY = window.scrollY;
    const bs = document.body.style;
    const prev = { position: bs.position, top: bs.top, left: bs.left, right: bs.right, width: bs.width, overflow: bs.overflow };
    bs.position = 'fixed'; bs.top = `-${scrollY}px`; bs.left = '0'; bs.right = '0'; bs.width = '100%'; bs.overflow = 'hidden';

    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      Object.assign(bs, prev);
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [touched, setTouched] = useState({});
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));

  // form.whatsapp 은 "숫자만" 보관 (국내번호 — OTHER 는 국가번호 포함 전체 숫자).
  const country = countryOf(form.country_code);
  const nameCheck = validateName(form.client_name);
  const phoneCheck = form.country_code ? validatePhone(form.country_code, form.whatsapp) : { ok: false, error: 'Select your country first.' };
  const emailCheck = validateEmail(form.email);

  const needsTurnstile = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const detailsReady = nameCheck.ok && phoneCheck.ok && emailCheck.ok && (!needsTurnstile || token);
  const goto = (s) => { setStep(s); setErr(null); bodyRef.current?.scrollTo({ top: 0 }); };

  async function submit() {
    if (busy) return;
    if (!detailsReady) {
      setTouched({ client_name: true, country_code: true, whatsapp: true, email: true });
      return;
    }
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/v3/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: singular, slug: row.slug,
          requested_date: flexible ? null : date,
          client_name: nameCheck.value, country_code: form.country_code || null,
          whatsapp: phoneCheck.e164, email: emailCheck.value, notes: form.notes.trim() || null,
          turnstile_token: token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Something went wrong — please try again.');
      setDone({ code: data.code, requested_date: data.requested_date });
      goto('done');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const dateLabel = flexible ? 'Dates not decided yet' : (date ? prettyDate(date) : null);
  const waMsg = done
    ? `Hi Romie! I just requested a booking (${done.code}) — ${row.name}${done.requested_date ? ` around ${prettyDate(done.requested_date)}` : ' (my dates are still open)'}. Looking forward to hearing from you!`
    : '';

  return (
    <div className="v3s-bkw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="v3s-bkw" role="dialog" aria-modal="true" aria-label={`Book ${row.name}`}>
        {/* header */}
        <div className="v3s-bkw-head">
          <div className="v3s-bkw-title">
            <span className="v3s-eyebrow">Book this trip</span>
            <h3>{row.name}</h3>
          </div>
          <div className="v3s-bkw-steps">
            {STEPS.map((s, i) => (
              <span key={s.key} className={`v3s-bkw-step ${i <= stepIdx ? 'on' : ''} ${s.key === step ? 'now' : ''}`}>
                <i>{pad(i + 1)}</i> {s.label}
              </span>
            ))}
          </div>
          <button type="button" className="v3s-bkw-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* body */}
        <div className="v3s-bkw-body" ref={bodyRef}>
          {step === 'date' && (
            <div className="v3s-bkw-pane">
              <p className="v3s-bkw-lede">
                Pick the day you'd like to start. It's a request — one trip at a time, so Romie
                confirms the final dates with you on WhatsApp within 24 hours.
              </p>
              {availability
                ? <BookingCalendar availability={availability} value={flexible ? null : date}
                    onChange={(d) => { setDate(d); setFlexible(false); }} />
                : <div className="v3s-dt-loading">Loading calendar…</div>}
              {date && !flexible && <div className="v3s-bk-picked">✓ {prettyDate(date)}</div>}
              <button type="button"
                className={`v3s-bkw-flex ${flexible ? 'on' : ''}`}
                onClick={() => { setFlexible((f) => !f); if (!flexible) setDate(null); }}>
                {flexible ? '✓ ' : ''}I haven't decided my dates yet — Romie can help me plan
              </button>
            </div>
          )}

          {step === 'details' && (
            <div className="v3s-bkw-pane">
              <div className="v3s-bkw-summary">
                <span>{row.name}</span>
                <b>{dateLabel}</b>
                <button type="button" onClick={() => goto('date')}>change</button>
              </div>
              <label className="v3s-bk-field">Name <em>*</em>
                <input value={form.client_name} onChange={(e) => set('client_name', e.target.value)}
                  onBlur={() => touch('client_name')} placeholder="Your name" maxLength={120}
                  className={touched.client_name && !nameCheck.ok ? 'invalid' : ''} />
                {touched.client_name && !nameCheck.ok && <span className="v3s-bk-ferr">{nameCheck.error}</span>}
              </label>
              <label className="v3s-bk-field">Country <em>*</em>
                <select value={form.country_code}
                  onChange={(e) => { set('country_code', e.target.value); touch('country_code'); }}
                  onBlur={() => touch('country_code')}
                  className={touched.country_code && !form.country_code ? 'invalid' : ''}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}{c.dial ? ` (+${c.dial})` : ''}</option>)}
                </select>
                {touched.country_code && !form.country_code && <span className="v3s-bk-ferr">Select your country — it sets your phone code.</span>}
              </label>
              <label className="v3s-bk-field">WhatsApp number <em>*</em>
                <div className={`v3s-bk-phone ${touched.whatsapp && !phoneCheck.ok ? 'invalid' : ''} ${!form.country_code ? 'off' : ''}`}>
                  <span className="dial">{country ? (country.dial ? `+${country.dial}` : '+') : '+'}</span>
                  <input value={form.whatsapp}
                    onChange={(e) => set('whatsapp', onlyDigits(e.target.value).slice(0, 15))}
                    onBlur={() => touch('whatsapp')}
                    placeholder={!form.country_code ? 'Select country first'
                      : country?.code === 'OTHER' ? 'Country code + number (digits only)'
                      : 'Digits only — e.g. 81234567'}
                    disabled={!form.country_code}
                    maxLength={15} inputMode="numeric" autoComplete="tel-national" />
                </div>
                {touched.whatsapp && !phoneCheck.ok && <span className="v3s-bk-ferr">{phoneCheck.error}</span>}
                {phoneCheck.ok && <span className="v3s-bk-fok">✓ {phoneCheck.e164}</span>}
              </label>
              <label className="v3s-bk-field">Email <span className="opt">(optional)</span>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  onBlur={() => touch('email')} placeholder="you@example.com" maxLength={200}
                  className={touched.email && !emailCheck.ok ? 'invalid' : ''} />
                {touched.email && !emailCheck.ok && <span className="v3s-bk-ferr">{emailCheck.error}</span>}
              </label>
              <label className="v3s-bk-field">Anything Romie should know? <span className="opt">(optional)</span>
                <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={2000}
                  placeholder="Travel plans, skin history, questions — any language is fine." />
              </label>
              <div className="v3s-bk-price">
                <span>Reference price</span>
                <b>{row.price_krw != null ? `from ${fmtKRW(row.price_krw)}` : 'On consultation'}</b>
                {row.price_note && <em>{row.price_note}</em>}
              </div>
              <TurnstileWidget onToken={setToken} />
              {needsTurnstile && !token && (
                <p className="v3s-bk-fine" style={{ marginTop: 0 }}>
                  A quick security check appears above — the button unlocks once it completes (usually automatic).
                </p>
              )}
            </div>
          )}

          {step === 'done' && done && (
            <div className="v3s-bkw-pane v3s-bkw-done">
              <div className="v3s-bkw-done-mark">✓</div>
              <h3>All set. Romie takes it from here.</h3>
              <div className="v3s-bk-done-row"><span>Booking code</span><b className="code">{done.code}</b></div>
              <div className="v3s-bk-done-row">
                <span>{row.name}</span>
                <b>{done.requested_date ? prettyDate(done.requested_date) : 'Dates open'} <em>{done.requested_date ? '(your wish date)' : '(to plan together)'}</em></b>
              </div>
              <p>
                This is a <b>request</b>, not a confirmed reservation yet — Romie will reach out on
                WhatsApp within 24 hours{done.requested_date ? ' to confirm your exact dates' : ' to plan your dates together'}.
                Keep your code to check the status any time.
              </p>
              <div className="v3s-bk-done-cta">
                <a className="v3s-btn" href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noreferrer">
                  <WaIcon /> Continue on WhatsApp now
                </a>
                <Link className="v3s-btn v3s-btn--ghost" to={`/booking/${done.code}`} onClick={onClose}>Track my booking →</Link>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        {step !== 'done' && (
          <div className="v3s-bkw-foot">
            {err && <div className="v3s-bk-err" style={{ marginBottom: 10 }}>{err}</div>}
            <div className="v3s-bkw-foot-btns">
              {step === 'details' && <button type="button" className="v3s-btn v3s-btn--ghost" onClick={() => goto('date')} disabled={busy}>‹ Back</button>}
              {step === 'date' && (
                <button type="button" className="v3s-btn" disabled={!date && !flexible} onClick={() => goto('details')}>
                  Continue <span className="tail">→</span>
                </button>
              )}
              {step === 'details' && (
                <button type="button" className="v3s-btn" disabled={busy || (needsTurnstile && !token && nameCheck.ok && phoneCheck.ok && emailCheck.ok)} onClick={submit}>
                  {busy ? 'Sending…' : 'Request this trip'} <span className="tail">→</span>
                </button>
              )}
            </div>
            <p className="v3s-bk-fine" style={{ marginTop: 8 }}>
              No payment now · not a confirmed reservation until Romie confirms · your details go only to your coordinator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

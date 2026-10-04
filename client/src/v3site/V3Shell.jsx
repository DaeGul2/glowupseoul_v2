// Glow Up Seoul · v3 customer site — "Seoul Light".
// Real path routes (no hash): / · /treatments · /surgeries · /how-it-works · /about · /support
// Every top-level page opens with the same split hero: copy on the left, a 4:5
// motion reel (client/public/reels/*) on the right — stacked on phones.
import { useEffect, useLayoutEffect, useRef, useState, useMemo, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Link, NavLink, useLocation, useParams } from 'react-router-dom';
import { marked } from 'marked';
import Concierge from './Concierge.jsx';
import WaIcon from './WaIcon.jsx';
import BookingWizard from './BookingWizard.jsx';
import BookingStatusPage from './BookingStatusPage.jsx';
import { fetchCatalog, fetchDetail, DURATION_LABEL, PAIN_LABEL, RECOVERY_LABEL, fmtKRW } from './catalogApi.js';
import './v3site.css';

marked.setOptions({ breaks: true, gfm: true });

const WA = 'https://wa.me/821064871060';

// Chat launcher state, shared so the hero CTA can open the floating chat.
const ChatContext = createContext({ open: () => {} });

// Jump to the top without the global smooth-scroll animation getting in the way.
function toTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/* -------- calm wrapper (magnetic pull removed — luxury/calm motion only) -------- */
function Magnetic({ children, className = '' }) {
  return <span className={className} style={{ display: 'inline-flex' }}>{children}</span>;
}

/* -------- scroll reveal -------- */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.14 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`v3s-reveal ${seen ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

const FADE = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.85, delay: 0.06 + i * 0.1, ease: [0.16, 1, 0.3, 1] } }),
};

/* =================================================================== */
// 4:5 motion reel. Phones get the 720px encode; the clip pauses off-screen so
// it never decodes frames nobody sees (that was a main cause of scroll jank).
function HeroReel({ name, badge }) {
  const ref = useRef(null);
  const small = typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;
  const src = `/reels/${name}${small ? '-720' : ''}.mp4`;
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.play().catch(() => {});
      else el.pause();
    }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [src]);
  return (
    <div className="v3s-reel">
      <video ref={ref} className="v3s-reel-vid" src={src} poster={`/reels/${name}-poster.jpg`}
        autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      {badge && <span className="v3s-reel-badge"><i />{badge}</span>}
    </div>
  );
}

function SplitHero({ eyebrow, title, titleEm, sub, reel, badge, children }) {
  return (
    <header className="v3s-hero2">
      <div className="v3s-hero2-glow" aria-hidden="true"><i /><i /><i /></div>
      <div className="v3s-hero2-grid">
        <div className="v3s-hero2-l">
          <motion.div custom={0} variants={FADE} initial="hidden" animate="show">
            <span className="v3s-eyebrow">{eyebrow}</span>
          </motion.div>
          <motion.h1 custom={1} variants={FADE} initial="hidden" animate="show">
            {title} <em>{titleEm}</em>
          </motion.h1>
          {sub && <motion.p className="v3s-hero2-sub" custom={2} variants={FADE} initial="hidden" animate="show">{sub}</motion.p>}
          {children && <motion.div className="v3s-hero2-extra" custom={3} variants={FADE} initial="hidden" animate="show">{children}</motion.div>}
        </div>
        <motion.div className="v3s-hero2-r" initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}>
          <HeroReel name={reel} badge={badge} />
        </motion.div>
      </div>
    </header>
  );
}

function Home() {
  const chat = useContext(ChatContext);
  const [popular, setPopular] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchCatalog()
      .then((d) => {
        if (!alive) return;
        const t = (d.treatments || []).slice(0, 3).map((r) => ({ ...r, kind: 'treatments' }));
        const s = (d.surgeries || []).filter((r) => r.price_krw != null).slice(0, 2).map((r) => ({ ...r, kind: 'surgeries' }));
        setPopular([...t, ...s]);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <>
      <SplitHero
        eyebrow="Seoul · medical concierge" title="Your glow," titleEm="done right."
        sub="From skin treatments to surgery, one coordinator matches you to the best Seoul clinics and carries the whole journey — so you can skip the research."
        reel="home" badge="Romie · replies within 24h">
        <div className="v3s-hero2-cta">
          <button className="v3s-btn" onClick={() => chat.open()}>Start with Romie <span className="tail">→</span></button>
          <a className="v3s-btn v3s-btn--ghost" href={WA} style={{ textDecoration: 'none' }}><WaIcon /> Message on WhatsApp</a>
        </div>
        {popular.length > 0 && (
          <div className="v3s-hero2-pop">
            <span className="v3s-hero2-pop-k">Popular now</span>
            <div className="v3s-hero2-pop-row">
              {popular.map((p) => (
                <Link key={`${p.kind}-${p.id}`} className="v3s-hero2-pop-chip" to={`/${p.kind}/${p.slug}`}>
                  {p.thumbnail_url && <span className="img" style={{ backgroundImage: `url(${p.thumbnail_url})` }} />}
                  <span className="tx"><b>{p.name}</b><i>{p.price_krw != null ? `from ${fmtKRW(p.price_krw)}` : 'On consultation'}</i></span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </SplitHero>

      <div className="v3s-marquee">
        <div className="v3s-marquee-track">
          {[...Array(2)].flatMap((_, k) => ([
            ['500+', 'patients matched'], ['25+', 'countries'], ['98%', 'satisfaction'],
            ['24h', 'reply'], ['Hand-picked', 'clinics only'], ['Ministry of Health', 'registered'],
          ].map(([b, t], i) => (
            <span className="v3s-marquee-item" key={`${k}-${i}`}><span className="star">✦</span> {b} <small>{t}</small></span>
          ))))}
        </div>
      </div>

      <section className="v3s-section">
        <div className="v3s-wrap">
          <Reveal>
            <div className="v3s-sec-head">
              <span className="v3s-eyebrow">Where to begin</span>
              <h2>Two paths. <em>One hand</em> to guide you.</h2>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="v3s-paths">
              <Link className="v3s-path" to="/treatments">
                <div className="v3s-path-img" style={{ backgroundImage: 'url(/home-path-skin.png)' }} />
                <div className="v3s-path-body">
                  <span className="v3s-path-num">01</span>
                  <span className="v3s-path-kick">No scalpel · 1–3 days</span>
                  <h3>Skin &amp; glow</h3>
                  <p>Lasers, lifting, boosters, contour — the quiet glow-up, then back to your trip.</p>
                  <span className="v3s-path-go">Explore treatments <span className="tail">→</span></span>
                </div>
              </Link>
              <Link className="v3s-path" to="/surgeries">
                <div className="v3s-path-img" style={{ backgroundImage: 'url(/home-path-change.png)' }} />
                <div className="v3s-path-body">
                  <span className="v3s-path-num">02</span>
                  <span className="v3s-path-kick">Surgical · escorted</span>
                  <h3>A real change</h3>
                  <p>Eyes, nose, contour, lift — planned, escorted on the day, recovered with care.</p>
                  <span className="v3s-path-go">Explore surgery <span className="tail">→</span></span>
                </div>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="v3s-statement">
        <div className="v3s-wrap">
          <Reveal><h2>Not a booking app. <em>A personal concierge —</em> just for you.</h2></Reveal>
          <Reveal delay={120}>
            <div className="meta">
              <span>Founded <b>2022</b></span>
              <span>Hand-picked <b>clinics</b></span>
              <span><b>One</b> coordinator, start to finish</span>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function EditorialList({ items }) {
  return (
    <div className="v3s-steps">
      {items.map((c, i) => (
        <Reveal key={i} delay={i * 80}>
          <div className="v3s-step">
            <span className="v3s-step-n">{String(i + 1).padStart(2, '0')}</span>
            <div><h3>{c.t}</h3><p>{c.d}</p></div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function SubPage({ eyebrow, title, titleEm, lede, items, note }) {
  return (
    <div className="v3s-page">
      <section className="v3s-wrap">
        <Reveal>
          <div className="v3s-sec-head" style={{ maxWidth: 860 }}>
            <span className="v3s-eyebrow">{eyebrow}</span>
            <h2 style={{ fontSize: 'clamp(42px, 6.4vw, 88px)' }}>{title} <em>{titleEm}</em></h2>
            <p>{lede}</p>
          </div>
        </Reveal>
        {items && <EditorialList items={items} />}
        {note && <Reveal delay={140}><p className="v3s-page-note">{note}</p></Reveal>}
      </section>
      <CtaBand />
    </div>
  );
}

/* =================================================================== */
// Catalog for /treatments and /surgeries — split hero + search + tag filter + cards.
function CatalogIndex({ kind, eyebrow, title, titleEm, lede }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(false);
  const [bookFor, setBookFor] = useState(null);   // catalog card → booking wizard
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('All');
  useEffect(() => {
    let alive = true;
    setItems(null); setTag('All'); setQ('');
    fetchCatalog()
      .then((d) => { if (alive) setItems(kind === 'surgeries' ? d.surgeries : d.treatments); })
      .catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [kind]);

  // most-used tags first, so the chip row reads like a menu of concerns
  const tags = useMemo(() => {
    const n = new Map();
    (items || []).forEach((it) => (it.tags || []).forEach((t) => n.set(t, (n.get(t) || 0) + 1)));
    return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t).slice(0, 10);
  }, [items]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (items || []).filter((it) => (tag === 'All' || (it.tags || []).includes(tag))
      && (!needle || [it.name, it.summary, ...(it.tags || [])].join(' ').toLowerCase().includes(needle)));
  }, [items, q, tag]);

  const noun = kind === 'surgeries' ? 'surgeries' : 'treatments';

  return (
    <div className="v3s-cixpage">
      <SplitHero eyebrow={eyebrow} title={title} titleEm={titleEm} sub={lede} reel={kind}
        badge={items ? `${items.length} ${noun} · reference prices` : 'Reference prices'} />

      <section className="v3s-wrap">
        {err && <p className="v3s-page-note">Catalog is loading — message Romie any time and she'll send a hand-picked shortlist.</p>}
        {items && (
          <div className="v3s-cat-bar">
            <label className="v3s-cat-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${noun}`} aria-label={`Search ${noun}`} />
            </label>
            <div className="v3s-cat-chips" role="tablist">
              {['All', ...tags].map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tag === t}
                  className={`v3s-cat-chip ${tag === t ? 'on' : ''}`} onClick={() => setTag(t)}>{t}</button>
              ))}
            </div>
            <span className="v3s-cat-count">{shown.length} of {items.length}</span>
          </div>
        )}
        {items && (
          <div className="v3s-pgrid">
            {shown.map((it, i) => (
              <article key={it.id} className="v3s-pc" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <Link className="v3s-pc-link" to={`/${kind}/${it.slug}`}>
                  <div className="v3s-pc-img" style={it.thumbnail_url ? { backgroundImage: `url(${it.thumbnail_url})` } : undefined}>
                    <span className="v3s-pc-num">№ {String((items.indexOf(it)) + 1).padStart(2, '0')}</span>
                    {it.tags?.[0] && <span className="v3s-pc-tag">{it.tags[0]}</span>}
                  </div>
                  <div className="v3s-pc-body">
                    <h3 className="v3s-pc-name">{it.name}</h3>
                    {it.summary && <p className="v3s-pc-sum">{it.summary}</p>}
                    <div className="v3s-pc-facts">
                      {DURATION_LABEL[it.duration] && <span><em>Lasts</em>{DURATION_LABEL[it.duration]}</span>}
                      {RECOVERY_LABEL[it.recovery_level] && <span><em>Downtime</em>{RECOVERY_LABEL[it.recovery_level]}</span>}
                    </div>
                  </div>
                </Link>
                <div className="v3s-pc-foot">
                  <span className="v3s-pc-price">
                    {it.price_krw != null ? <><small>from</small> {fmtKRW(it.price_krw)}</> : 'On consultation'}
                  </span>
                  <button type="button" className="v3s-pc-book" onClick={() => setBookFor(it)}>Book</button>
                </div>
              </article>
            ))}
            {shown.length === 0 && (
              <div className="v3s-pgrid-empty">
                Nothing matches “{q || tag}”. <button type="button" onClick={() => { setQ(''); setTag('All'); }}>Show all</button>
              </div>
            )}
          </div>
        )}
        {!items && !err && <div className="v3s-pgrid v3s-pgrid--skel">{[0, 1, 2].map((i) => <div key={i} className="v3s-pc-skel" />)}</div>}
      </section>
      <CtaBand />
      {bookFor && <BookingWizard kind={kind} row={bookFor} onClose={() => setBookFor(null)} />}
    </div>
  );
}

function Treatments() {
  return <CatalogIndex kind="treatments"
    eyebrow="Non-surgical · 1–3 day trip" title="Skin &" titleEm="glow."
    lede="Lasers, lifting, boosters, contour — the quiet glow-up. Tap any to see how it works, what to expect, and what it costs." />;
}
function Surgeries() {
  return <CatalogIndex kind="surgeries"
    eyebrow="Surgical · escorted journey" title="A real" titleEm="change."
    lede="Eyes, nose, contour, lift. Carried carefully — planned in advance, escorted on the day, recovered with check-ins. Tap any to learn more." />;
}

// ---- The detail page — gorgeous, split, floating, full Markdown. ----
function ProcedureDetail({ kind }) {
  const { slug } = useParams();
  const chat = useContext(ChatContext);
  const [row, setRow] = useState(null);
  const [err, setErr] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setRow(null); setErr(false);
    fetchDetail(kind, slug).then((d) => alive && setRow(d.row)).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [kind, slug]);

  const html = useMemo(() => (row?.description ? marked.parse(row.description) : ''), [row]);

  if (err) return (
    <div className="v3s-page"><section className="v3s-wrap" style={{ textAlign: 'center', padding: '80px 0' }}>
      <h2>Not found</h2>
      <p className="v3s-page-note" style={{ display: 'inline-block', textAlign: 'left' }}>This page may be coming online. <Link to={`/${kind}`}>Back to the list</Link>.</p>
    </section></div>
  );
  if (!row) return <div className="v3s-page"><section className="v3s-wrap"><div className="v3s-dt-loading">Loading…</div></section></div>;

  const isSurg = kind === 'surgeries';

  return (
    <div className="v3s-detail">
      {/* split hero */}
      <section className="v3s-dt-hero">
        <div className="v3s-dt-hero-l">
          <Link className="v3s-dt-back" to={`/${kind}`}>‹ {isSurg ? 'Surgery' : 'Treatments'}</Link>
          <span className="v3s-eyebrow">{isSurg ? 'Surgical' : 'Non-surgical'}{row.tags?.length ? ` · ${row.tags.slice(0, 3).join(' · ')}` : ''}</span>
          <h1 className="v3s-dt-name">{row.name}</h1>
          {row.summary && <p className="v3s-dt-summary">{row.summary}</p>}
          <div className="v3s-dt-cta">
            <button className="v3s-btn" onClick={() => setBookOpen(true)}>Book this trip <span className="tail">→</span></button>
            <button className="v3s-btn v3s-btn--ghost" onClick={() => chat.open()}>Start a consultation</button>
          </div>
        </div>
        <div className="v3s-dt-hero-r">
          <div className="v3s-dt-photo" style={row.thumbnail_url ? { backgroundImage: `url(${row.thumbnail_url})` } : undefined} />
          <div className="v3s-dt-fcard v3s-dt-fcard--a"><span className="k">Results last</span><span className="v">{DURATION_LABEL[row.duration] || '—'}</span></div>
          <div className="v3s-dt-fcard v3s-dt-fcard--b"><span className="k">Downtime</span><span className="v">{RECOVERY_LABEL[row.recovery_level] || '—'}</span></div>
        </div>
      </section>

      {/* body: MD + sticky aside */}
      <section className="v3s-dt-body">
        <div className="v3s-md" dangerouslySetInnerHTML={{ __html: html }} />
        <aside className="v3s-dt-aside">
          <div className="v3s-dt-aside-card">
            <div className="v3s-dt-aside-h">At a glance</div>
            <dl className="v3s-dt-facts">
              <div><dt>Price</dt><dd>{fmtKRW(row.price_krw)}{row.price_note && <span>{row.price_note}</span>}</dd></div>
              <div><dt>Results last</dt><dd>{DURATION_LABEL[row.duration] || '—'}</dd></div>
              <div><dt>Comfort</dt><dd>{PAIN_LABEL[row.pain_level] || '—'}</dd></div>
              <div><dt>Downtime</dt><dd>{RECOVERY_LABEL[row.recovery_level] || '—'}{row.recovery_note && <span>{row.recovery_note}</span>}</dd></div>
            </dl>
          </div>
          {row.concern_links?.length > 0 && (
            <div className="v3s-dt-aside-card">
              <div className="v3s-dt-aside-h">Helps with</div>
              <div className="v3s-dt-concerns">
                {row.concern_links.map((c) => <span className="v3s-dt-concern" key={c.concern_id}>{c.name}</span>)}
              </div>
            </div>
          )}
          <div className="v3s-dt-aside-card v3s-dt-aside-cta">
            <div className="v3s-dt-aside-h">Considering {row.name}?</div>
            <p>Pick your dates — or tell Romie and we'll arrange the right clinic, in your language.</p>
            <button className="v3s-btn" onClick={() => setBookOpen(true)}>Book this trip <span className="tail">→</span></button>
            <button className="v3s-btn v3s-btn--ghost" onClick={() => chat.open()} style={{ marginTop: 8 }}>Start with Romie</button>
          </div>
        </aside>
      </section>

      {/* split: good for / things to note */}
      {(row.benefits?.length > 0 || row.cautions?.length > 0) && (
        <section className="v3s-dt-split">
          <div className="v3s-dt-split-grid">
            <div className="v3s-dt-split-card">
              <span className="v3s-eyebrow">Good for</span>
              <ul className="v3s-dt-list">{(row.benefits || []).map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
            <div className="v3s-dt-split-card v3s-dt-split-card--note">
              <span className="v3s-eyebrow">Things to note</span>
              <ul className="v3s-dt-list">{(row.cautions || []).map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          </div>
        </section>
      )}

      {/* why it helps — the DB rationale per concern */}
      {row.concern_links?.some((c) => c.reason) && (
        <section className="v3s-dt-why">
          <div className="v3s-wrap">
            <Reveal>
              <div className="v3s-dt-why-head">
                <span className="v3s-eyebrow">Why it helps</span>
                <h2>Why {row.name} works for <em>these concerns</em></h2>
              </div>
            </Reveal>
            <div className="v3s-dt-why-grid">
              {row.concern_links.filter((c) => c.reason).map((c, i) => (
                <Reveal key={c.concern_id} delay={i * 70}>
                  <div className="v3s-dt-why-item">
                    <span className="v3s-dt-why-tag">{c.name}</span>
                    <p>{c.reason}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 리캡 카드 제거 — aside/split 과 통째 중복이었음. 마지막 CTA 는 얇은 스트립 하나로. */}
      <section className="v3s-dt-recap">
        <div className="v3s-wrap">
          <Reveal>
            <div className="v3s-dt-sum-card" style={{ textAlign: 'center' }}>
              <span className="v3s-eyebrow">Ready when you are</span>
              <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(30px,4vw,52px)', margin: '16px 0 0' }}>
                {row.name}, arranged end to end.
              </h2>
              <div className="v3s-dt-sum-cta" style={{ justifyContent: 'center' }}>
                <button className="v3s-btn" onClick={() => setBookOpen(true)}>Book this trip <span className="tail">→</span></button>
                <button className="v3s-btn v3s-btn--ghost" onClick={() => chat.open()}>Start a consultation</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand />

      {bookOpen && <BookingWizard kind={kind} row={row} onClose={() => setBookOpen(false)} />}
    </div>
  );
}

function How() {
  return (
    <>
      <SplitHero eyebrow="How it works" title="Four quiet" titleEm="steps."
        sub="No app to install. No account. Most of it happens on WhatsApp — quietly."
        reel="how" badge="One coordinator · start to finish" />
      <section className="v3s-how-steps">
        <div className="v3s-wrap">
          <EditorialList items={[
            { t: 'One message', d: 'Tell Romie your concern on WhatsApp. That\'s the whole start.' },
            { t: 'A hand-picked shortlist', d: 'We send 2–3 clinics that fit your skin, budget and dates — with reasons, not a directory.' },
            { t: 'Arrive & be guided', d: 'Met, interpreted, and walked through every step. You never face the clinic alone.' },
            { t: 'Aftercare home', d: 'Check-ins after you leave. A swelling question at 11pm? The same coordinator answers.' },
          ]} />
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function About() {
  return <SubPage
    eyebrow="About" title="One coordinator." titleEm="One journey."
    lede="Glow Up Seoul is a Ministry of Health–registered concierge for foreign patients. We've spent a decade evaluating Korean clinics, and we work with only a hand-picked few — chosen on safety, doctor credentials, English fluency and aftercare. No marketplace. No noise. Just one person who carries your whole journey."
    note="Founded 2022 · Seoul · Gangnam · Busan." />;
}

/* =================================================================== */
// Support (help centre) — shell. Answers reuse what the site already says;
// the full FAQ will be filled from the consultation logs.
const FAQ = [
  { cat: 'Booking', items: [
    ['How do I book?', 'Open any treatment or surgery and tap “Book”, or simply message Romie on WhatsApp. Every request gets a booking code (it looks like GUS-7F3K).'],
    ['Do I need an app or an account?', 'No app to install. No account. Most of it happens on WhatsApp — quietly.'],
    ['How do I check my booking?', 'Go to “My booking” and enter your code. You can see where your request is and add confirmed dates to your calendar.'],
  ] },
  { cat: 'Prices & clinics', items: [
    ['Are the prices on the site final?', 'They are reference prices. Your clinic confirms the final price for your plan after the consultation.'],
    ['Which clinics do you work with?', 'Only a hand-picked few — chosen on safety, doctor credentials, English fluency and aftercare. No marketplace.'],
  ] },
  { cat: 'Your trip', items: [
    ['Will someone be with me at the clinic?', 'Yes. You are met, interpreted, and walked through every step. You never face the clinic alone.'],
    ['How long should I stay in Seoul?', 'Most non-surgical treatments fit a 1–3 day trip. Surgery needs more recovery time — Romie plans it with you.'],
  ] },
  { cat: 'Aftercare', items: [
    ['What happens after I fly home?', 'Check-ins after you leave. A swelling question at 11pm? The same coordinator answers.'],
  ] },
];

function Support() {
  const chat = useContext(ChatContext);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const needle = q.trim().toLowerCase();
  const groups = FAQ
    .filter((g) => cat === 'All' || g.cat === cat)
    .map((g) => ({ ...g, items: g.items.filter(([a, b]) => !needle || `${a} ${b}`.toLowerCase().includes(needle)) }))
    .filter((g) => g.items.length);

  return (
    <div className="v3s-page v3s-support">
      <section className="v3s-wrap">
        <div className="v3s-sup-head">
          <span className="v3s-eyebrow">Support</span>
          <h1>How can we <em>help?</em></h1>
          <p>Answers to common questions — or reach Romie directly. We reply within 24 hours.</p>
          <label className="v3s-cat-search v3s-sup-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions — booking, prices, aftercare…" aria-label="Search questions" />
          </label>
        </div>

        <div className="v3s-sup-actions">
          <button type="button" className="v3s-sup-act" onClick={() => chat.open()}>
            <span className="ico ico--chat">R</span><b>Chat with Romie</b><i>Answers in a few taps</i>
          </button>
          <a className="v3s-sup-act" href={WA} target="_blank" rel="noreferrer">
            <span className="ico ico--wa"><WaIcon /></span><b>WhatsApp</b><i>+82 10 6487 1060</i>
          </a>
          <a className="v3s-sup-act" href="mailto:glowupinseoul@gmail.com">
            <span className="ico">@</span><b>Email</b><i>glowupinseoul@gmail.com</i>
          </a>
          <Link className="v3s-sup-act" to="/booking">
            <span className="ico">#</span><b>My booking</b><i>Check with your code</i>
          </Link>
        </div>

        <div className="v3s-sup-faq">
          <div className="v3s-cat-chips">
            {['All', ...FAQ.map((g) => g.cat)].map((c) => (
              <button key={c} type="button" className={`v3s-cat-chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          {groups.map((g) => (
            <div className="v3s-sup-group" key={g.cat}>
              <div className="v3s-sup-group-h">{g.cat}</div>
              {g.items.map(([qq, a]) => (
                <details className="v3s-sup-q" key={qq}>
                  <summary>{qq}<span aria-hidden="true">+</span></summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          ))}
          {groups.length === 0 && (
            <div className="v3s-pgrid-empty">No answer for “{q}” yet. <button type="button" onClick={() => chat.open()}>Ask Romie</button></div>
          )}
        </div>
      </section>
      <CtaBand />
    </div>
  );
}

/* =================================================================== */
function CtaBand() {
  return (
    <section className="v3s-cta-band">
      <div className="v3s-wrap">
        <Reveal>
          <h2>Not sure where to <em>start?</em></h2>
          <p>Send one message. We reply within 24 hours — and quietly arrange the rest.</p>
          <Magnetic><a className="v3s-btn" href={WA} style={{ textDecoration: 'none' }}><WaIcon /> Message Romie on WhatsApp</a></Magnetic>
        </Reveal>
      </div>
    </section>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const cls = ({ isActive }) => isActive ? 'active' : undefined;
  // every nav click lands at the top — including a click on the page you're already on
  const go = () => { setMenuOpen(false); toTop(); };
  return (
    <nav className={`v3s-nav ${scrolled ? 'scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <Link className="v3s-logo" to="/" style={{ textDecoration: 'none' }} aria-label="Glow Up Seoul — home" onClick={go}>
        <img className="v3s-logo-img" src="/glowup-logo.png" alt="Glow Up Seoul" />
      </Link>
      <div className="v3s-nav-links">
        <NavLink to="/treatments" className={cls} onClick={go}>Treatments</NavLink>
        <NavLink to="/surgeries" className={cls} onClick={go}>Surgery</NavLink>
        <NavLink to="/how-it-works" className={cls} onClick={go}>How it works</NavLink>
        <NavLink to="/about" className={cls} onClick={go}>About</NavLink>
        <NavLink to="/support" className={cls} onClick={go}>Support</NavLink>
      </div>
      <div className="v3s-nav-right">
        <a className="v3s-btn v3s-btn--wa" href={WA} style={{ textDecoration: 'none' }}>
          <WaIcon /> <span className="v3s-nav-wa-tx">WhatsApp</span>
        </a>
        <button
          className="v3s-nav-burger" aria-label="Menu" aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>
      <div className="v3s-nav-mobile" role="menu">
        <NavLink to="/treatments" className={cls} onClick={go}>Treatments</NavLink>
        <NavLink to="/surgeries" className={cls} onClick={go}>Surgery</NavLink>
        <NavLink to="/how-it-works" className={cls} onClick={go}>How it works</NavLink>
        <NavLink to="/about" className={cls} onClick={go}>About</NavLink>
        <NavLink to="/support" className={cls} onClick={go}>Support</NavLink>
        <a className="v3s-nav-mobile-wa" href={WA} onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
          <WaIcon /> Message on WhatsApp
        </a>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="v3s-footer">
      <div className="v3s-wrap">
        <div className="v3s-footer-grid">
          <div>
            <img className="v3s-foot-logo" src="/glowup-logo.png" alt="Glow Up Seoul" />
            <p>A personal concierge for foreign patients in Seoul. Dermatology, plastic surgery, dental — fully handled, end to end.</p>
          </div>
          <div>
            <div className="v3s-foot-col-title">Explore</div>
            <Link to="/treatments" onClick={toTop}>Skin &amp; glow</Link>
            <Link to="/surgeries" onClick={toTop}>Surgery</Link>
            <Link to="/how-it-works" onClick={toTop}>How it works</Link>
            <Link to="/about" onClick={toTop}>About</Link>
            <Link to="/booking" onClick={toTop}>My booking</Link>
          </div>
          <div>
            <div className="v3s-foot-col-title">Reach us</div>
            <Link to="/support" onClick={toTop}>Support &amp; FAQ</Link>
            <a href={WA}>WhatsApp +82 10 6487 1060</a>
            <a href="mailto:glowupinseoul@gmail.com">glowupinseoul@gmail.com</a>
          </div>
        </div>
        <div className="v3s-footer-base">
          <span>© 2026 Glow Up Seoul · Ministry of Health &amp; Welfare registered</span>
          <span>Seoul · Gangnam · Busan</span>
        </div>
      </div>
    </footer>
  );
}

// Floating chat — launcher button (bottom-right) opens the Concierge dock.
function ChatWidget({ open, setOpen }) {
  return (
    <>
      {open && (
        <motion.div className="v3s-chatdock"
          initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          <Concierge />
        </motion.div>
      )}
      <button className={`v3s-launcher ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Chat with Romie'}>
        {open ? <span className="v3s-launcher-x">✕</span> : (
          <>
            <span className="v3s-launcher-ava">R</span>
            <span className="v3s-launcher-tx">Chat with Romie</span>
          </>
        )}
      </button>
    </>
  );
}

export default function V3Shell() {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#fafaf8';
    // v2 전역 CSS 의 풀스크린 grain(body::after, mix-blend-mode) + smooth scroll 이
    // v3 에도 새어 들어와 스크롤 렉을 유발 — v3 마운트 동안 차단.
    document.body.classList.add('no-grain');
    document.documentElement.classList.add('no-smooth');
    // 브라우저가 이전 스크롤 위치를 복원하지 않게 — 페이지 이동 = 항상 맨 위
    const prevRestore = window.history.scrollRestoration;
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    return () => {
      document.body.style.background = prev;
      document.body.classList.remove('no-grain');
      document.documentElement.classList.remove('no-smooth');
      if (prevRestore) window.history.scrollRestoration = prevRestore;
    };
  }, []);
  useLayoutEffect(() => {
    toTop();
    const r = requestAnimationFrame(toTop);   // again after the new page has painted
    return () => cancelAnimationFrame(r);
  }, [location.pathname]);

  return (
    <ChatContext.Provider value={{ open: () => setChatOpen(true) }}>
      <div className="v3s">
        <div className="v3s-atmos" aria-hidden="true"><div className="v3s-grain" /></div>
        <Nav />
        <main className="v3s-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/treatments" element={<Treatments />} />
            <Route path="/treatments/:slug" element={<ProcedureDetail kind="treatments" />} />
            <Route path="/surgeries" element={<Surgeries />} />
            <Route path="/surgeries/:slug" element={<ProcedureDetail kind="surgeries" />} />
            <Route path="/booking" element={<BookingStatusPage />} />
            <Route path="/booking/:code" element={<BookingStatusPage />} />
            <Route path="/how-it-works" element={<How />} />
            <Route path="/about" element={<About />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
        <ChatWidget open={chatOpen} setOpen={setChatOpen} />
      </div>
    </ChatContext.Provider>
  );
}

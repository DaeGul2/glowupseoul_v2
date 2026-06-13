// Glow Up Seoul · v3 customer site — editorial atelier (bright).
// Real path routes (no hash): / · /treatments · /surgeries · /how-it-works · /about
// Hero pairs an oversized statement with the interactive Concierge widget
// (the engagement engine). Category navigation is an editorial index list,
// not a card grid.
import { useEffect, useRef, useState, useMemo, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Link, NavLink, useLocation, useParams } from 'react-router-dom';
import { marked } from 'marked';
import Concierge from './Concierge.jsx';
import WaIcon from './WaIcon.jsx';
import { fetchCatalog, fetchDetail, DURATION_LABEL, PAIN_LABEL, RECOVERY_LABEL, fmtKRW } from './catalogApi.js';
import './v3site.css';

marked.setOptions({ breaks: true, gfm: true });

const WA = 'https://wa.me/821064871060';

// Chat launcher state, shared so the hero CTA can open the floating chat.
const ChatContext = createContext({ open: () => {} });

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

/* -------- editorial index row -------- */
function IndexRow({ num, title, sub, kick, to }) {
  return (
    <Link className="v3s-index-row" to={to}>
      <span className="fill" />
      <span className="v3s-index-num">{num}</span>
      <span className="v3s-index-main">
        <span className="v3s-index-title">{title}</span>
        <span className="v3s-index-sub">{sub}</span>
      </span>
      <span className="v3s-index-kick">{kick}</span>
      <span className="v3s-index-arrow">→</span>
    </Link>
  );
}

/* =================================================================== */
// Drop a beauty/skincare image URL here (or upload one) — elegant gradient
// placeholder shows until then.
const HERO_PHOTO = '';

// Cinematic Seoul hero — drone fly-through, then sunset journey, looping.
// Two stacked videos crossfade into each other for a smooth transition.
const HERO_CLIPS = ['/seoul-2.mp4', '/seoul-1.mp4'];
function HeroVideo() {
  const a = useRef(null);
  const b = useRef(null);
  const [showA, setShowA] = useState(true);
  function swap(toA) {
    const inV = (toA ? a : b).current;
    if (inV) { try { inV.currentTime = 0; } catch (_) {} inV.play().catch(() => {}); }
    setShowA(toA);
  }
  return (
    <>
      <video ref={a} className={`v3s-vhero-vid ${showA ? 'on' : ''}`} src={HERO_CLIPS[0]}
        autoPlay muted playsInline preload="auto" onEnded={() => swap(false)} />
      <video ref={b} className={`v3s-vhero-vid ${!showA ? 'on' : ''}`} src={HERO_CLIPS[1]}
        muted playsInline preload="auto" onEnded={() => swap(true)} />
    </>
  );
}

function Home() {
  const chat = useContext(ChatContext);
  return (
    <>
      <header className="v3s-vhero">
        <video className="v3s-vhero-vid on" src="/hero.mp4" autoPlay loop muted playsInline />
        <div className="v3s-vhero-scrim" />
        <div className="v3s-vhero-content">
          <motion.div custom={0} variants={FADE} initial="hidden" animate="show">
            <span className="v3s-eyebrow">Seoul · medical concierge</span>
          </motion.div>
          <motion.h1 custom={1} variants={FADE} initial="hidden" animate="show">
            Your glow, <em>done right.</em>
          </motion.h1>
          <motion.p className="v3s-vhero-sub" custom={2} variants={FADE} initial="hidden" animate="show">
            From skin treatments to surgery, one coordinator matches you to the best
            Seoul clinics and carries the whole journey — so you can skip the research.
          </motion.p>
          <motion.div className="v3s-vhero-cta" custom={3} variants={FADE} initial="hidden" animate="show">
            <button className="v3s-btn" onClick={() => chat.open()}>Start with Romie <span className="tail">→</span></button>
            <a className="v3s-btn v3s-btn--ghost" href={WA} style={{ textDecoration: 'none' }}><WaIcon /> Message on WhatsApp</a>
          </motion.div>
        </div>
      </header>

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

// Catalog-driven index for /treatments and /surgeries — real rows, link to detail.
function CatalogIndex({ kind, eyebrow, title, titleEm, lede }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchCatalog()
      .then((d) => { if (alive) setItems(kind === 'surgeries' ? d.surgeries : d.treatments); })
      .catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [kind]);

  return (
    <div className="v3s-page">
      <section className="v3s-wrap">
        {kind === 'treatments' && (
          <Reveal>
            <div className="v3s-cat-hero" style={{ backgroundImage: 'url(/treatments-hero.png)' }} role="img" aria-label="Glow Up Seoul" />
          </Reveal>
        )}
        <Reveal>
          <div className="v3s-sec-head" style={{ maxWidth: 860 }}>
            <span className="v3s-eyebrow">{eyebrow}</span>
            <h2 style={{ fontSize: 'clamp(42px, 6.4vw, 88px)' }}>{title} <em>{titleEm}</em></h2>
            <p>{lede}</p>
          </div>
        </Reveal>
        {err && <p className="v3s-page-note">Catalog is loading — message Romie any time and she'll send a hand-picked shortlist.</p>}
        {items && items.length > 0 && (
          <Reveal delay={80}>
            <div className="v3s-cat-grid">
              {items.map((it) => (
                <Link key={it.id} className="v3s-cat-card" to={`/${kind}/${it.slug}`}>
                  <div className="v3s-cat-card-img" style={it.thumbnail_url ? { backgroundImage: `url(${it.thumbnail_url})` } : undefined} />
                  <div className="v3s-cat-card-body">
                    <div className="v3s-cat-card-name">{it.name}</div>
                    {it.summary && <div className="v3s-cat-card-sum">{it.summary}</div>}
                    {it.tags?.length > 0 && (
                      <div className="v3s-cat-card-tags">
                        {it.tags.slice(0, 3).map((t) => <span className="v3s-cat-tag" key={t}>{t}</span>)}
                      </div>
                    )}
                    <div className="v3s-cat-card-foot">
                      <span>{it.price_krw != null ? `from ${fmtKRW(it.price_krw)}` : 'On consultation'}</span>
                      <span className="go">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </section>
      <CtaBand />
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
            <button className="v3s-btn" onClick={() => chat.open()}>Start a consultation <span className="tail">→</span></button>
            <a className="v3s-btn v3s-btn--ghost" href={WA} style={{ textDecoration: 'none' }}><WaIcon /> Ask on WhatsApp</a>
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
            <p>Tell Romie and we'll arrange the right clinic, in your language.</p>
            <button className="v3s-btn" onClick={() => chat.open()}>Start with Romie <span className="tail">→</span></button>
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

      {/* everything in one place, once more */}
      <section className="v3s-dt-recap">
        <div className="v3s-wrap">
          <Reveal>
            <div className="v3s-dt-sum-card">
              <div className="v3s-dt-sum-top">
                <span className="v3s-eyebrow">In summary</span>
                <h2>{row.name}</h2>
                {row.summary && <p>{row.summary}</p>}
              </div>
              <div className="v3s-dt-sum-grid">
                <div className="v3s-dt-sum-col">
                  <span className="v3s-dt-sum-h">At a glance</span>
                  <dl className="v3s-dt-facts">
                    <div><dt>Price</dt><dd>{fmtKRW(row.price_krw)}</dd></div>
                    <div><dt>Results last</dt><dd>{DURATION_LABEL[row.duration] || '—'}</dd></div>
                    <div><dt>Comfort</dt><dd>{PAIN_LABEL[row.pain_level] || '—'}</dd></div>
                    <div><dt>Downtime</dt><dd>{RECOVERY_LABEL[row.recovery_level] || '—'}</dd></div>
                  </dl>
                </div>
                {row.benefits?.length > 0 && (
                  <div className="v3s-dt-sum-col">
                    <span className="v3s-dt-sum-h">Good for</span>
                    <ul className="v3s-dt-list">{row.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul>
                  </div>
                )}
                {row.cautions?.length > 0 && (
                  <div className="v3s-dt-sum-col">
                    <span className="v3s-dt-sum-h">Things to note</span>
                    <ul className="v3s-dt-list">{row.cautions.map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                )}
              </div>
              {row.concern_links?.length > 0 && (
                <div className="v3s-dt-sum-concerns">
                  <span className="v3s-dt-sum-h">Helps with</span>
                  <div className="v3s-dt-concerns">
                    {row.concern_links.map((c) => <span className="v3s-dt-concern" key={c.concern_id}>{c.name}</span>)}
                  </div>
                </div>
              )}
              <div className="v3s-dt-sum-cta">
                <button className="v3s-btn" onClick={() => chat.open()}>Start a consultation <span className="tail">→</span></button>
                <a className="v3s-btn v3s-btn--ghost" href={WA} style={{ textDecoration: 'none' }}><WaIcon /> Ask on WhatsApp</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </div>
  );
}

function How() {
  return (
    <>
      <header className="v3s-vhero v3s-vhero--page">
        <HeroVideo />
        <div className="v3s-vhero-scrim" />
        <div className="v3s-vhero-content">
          <span className="v3s-eyebrow">How it works</span>
          <h1>Four quiet <em>steps.</em></h1>
          <p className="v3s-vhero-sub">No app to install. No account. Most of it happens on WhatsApp — quietly.</p>
        </div>
      </header>
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
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const cls = ({ isActive }) => isActive ? 'active' : undefined;
  return (
    <nav className={`v3s-nav ${scrolled ? 'scrolled' : ''}`}>
      <Link className="v3s-logo" to="/" style={{ textDecoration: 'none' }} aria-label="Glow Up Seoul — home">
        <img className="v3s-logo-img" src="/glowup-logo.png" alt="Glow Up Seoul" />
      </Link>
      <div className="v3s-nav-links">
        <NavLink to="/treatments" className={cls}>Treatments</NavLink>
        <NavLink to="/surgeries" className={cls}>Surgery</NavLink>
        <NavLink to="/how-it-works" className={cls}>How it works</NavLink>
        <NavLink to="/about" className={cls}>About</NavLink>
      </div>
      <a className="v3s-btn v3s-btn--wa" href={WA} style={{ textDecoration: 'none' }}>
        <WaIcon /> WhatsApp
      </a>
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
            <Link to="/treatments">Skin &amp; glow</Link>
            <Link to="/surgeries">Surgery</Link>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/about">About</Link>
          </div>
          <div>
            <div className="v3s-foot-col-title">Reach us</div>
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
    document.body.style.background = '#f3efe7';
    return () => { document.body.style.background = prev; };
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);

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
            <Route path="/how-it-works" element={<How />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
        <ChatWidget open={chatOpen} setOpen={setChatOpen} />
      </div>
    </ChatContext.Provider>
  );
}

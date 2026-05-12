import { useEffect, useMemo, useState } from 'react';
import db from '../data/db.js';
import { navigate, useScanFlow } from '../App.jsx';
import Hero from '../components/Hero.jsx';
import PublicFeedTicker from '../components/PublicFeedTicker.jsx';
import TreatmentCard from '../components/TreatmentCard.jsx';
import DeviceCategories from '../components/DeviceCategories.jsx';
import WhatsAppCTA from '../components/WhatsAppCTA.jsx';
import { useReveal } from '../utils/useReveal.js';

const PRESS = [
  'VOGUE Korea',
  'ELLE',
  'Allure',
  'Cosmopolitan',
  "Harper's Bazaar",
  'The Cut',
  'Refinery29',
  '小红书',
  'NYLON',
  'GQ Korea',
];

const BENTO_LAYOUT = {
  face:     { size: 'hero', sym: '◈', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80' },
  eyes:     { size: 'std',  sym: '◇', img: 'https://images.unsplash.com/photo-1614102073832-030967418971?auto=format&fit=crop&w=900&q=80' },
  nose:     { size: 'std',  sym: '⬡', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80' },
  body:     { size: 'wide', sym: '☽', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80' },
  skin:     { size: 'std',  sym: '✦', img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80' },
  hair:     { size: 'std',  sym: '◎', img: 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?auto=format&fit=crop&w=900&q=80' },
  wellness: { size: 'std',  sym: '✿', img: 'https://images.unsplash.com/photo-1571066811602-716837d681de?auto=format&fit=crop&w=900&q=80' },
  dental:   { size: 'std',  sym: '⬩', img: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=900&q=80' },
};

const STEPS = [
  { n: '01', t: 'Free Consultation',     timing: 'Same day → 24h', body: 'WhatsApp — one message is enough. Your coordinator (Romie or a Sisumate) reads it personally and replies in your language.' },
  { n: '02', t: 'Clinic & Doctor Match', timing: '1–3 days',       body: 'Hand-picked 2–3 clinics from our 22 partners, with reasons you can read. Not a list of 30.' },
  { n: '03', t: 'Arrive in Seoul',       timing: 'Day 0',          body: 'Met at the airport for Premium Care. Survival kit (transport · SIM · pharmacy) sent ahead for Care.' },
  { n: '04', t: 'Treatment Day',         timing: 'Day 1–7',        body: 'A Sisumate interprets, holds your bag, stays with you in recovery. You never face the clinic alone.' },
  { n: '05', t: 'Aftercare',             timing: 'Up to 90 days',  body: 'D+7 and D+30 check-ins. If a swelling question comes up at home, you message the same coordinator.' },
];

const TESTIMONIALS = [
  { initial: 'S.', country: 'Singapore', text: 'Romie replied at 11pm my time when I was panicking about a swelling photo. That, more than the matching, is why I trusted her.', treatment: 'PicoSure + Rejuran' },
  { initial: 'M.', country: 'Australia', text: 'I came in for "tighten my jawline" and left with a plan that included an injectable I had never heard of. It worked. Romie reads the brief.', treatment: 'HIFU + Botox' },
  { initial: 'A.', country: 'Indonesia', text: 'The Sisumate stayed in recovery with me. I don\'t speak Korean. I would have been terrified alone.', treatment: 'Rhinoplasty · Hershe' },
];

function Reveal({ children, className = '' }) {
  const { ref, revealed } = useReveal();
  return <div ref={ref} className={`gs-reveal ${revealed ? 'gs-revealed' : ''} ${className}`}>{children}</div>;
}

function PressMarquee() {
  return (
    <section className="gs-press">
      <div className="gs-press-eyebrow">As featured in</div>
      <div className="gs-press-track">
        {Array.from({ length: 2 }).flatMap((_, k) => (
          PRESS.flatMap((name, i) => [
            <span key={`p${k}-${i}`}>{name}</span>,
            <span key={`d${k}-${i}`} className="dash">/</span>,
          ])
        ))}
      </div>
    </section>
  );
}

function Editorial() {
  return (
    <section className="gs-editorial">
      <Reveal>
        <div className="gs-editorial-text">
          <div className="gs-eyebrow">◈  A concierge, not a marketplace</div>
          <h2>Choosing a clinic should not be a <em>research project.</em></h2>
          <p>
            You shouldn't have to read 40 Naver reviews in a language you don't speak to figure out whether a clinic's <em>"natural"</em> actually looks natural in photos.
          </p>
          <p>
            We've evaluated <strong>10,000+ clinics</strong> over a decade, and currently work with <strong>22</strong> — hand-picked on safety, doctor credentials, English fluency, and aftercare. One coordinator. One journey.
          </p>
          <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button className="gs-cta" onClick={() => navigate('/about')}>Our story →</button>
            <WhatsAppCTA label="Talk to Romie" />
          </div>
        </div>
      </Reveal>
      <Reveal>
        <div className="gs-editorial-media">
          <div className="gs-editorial-tag"><em>est.</em>2022 · Ministry of Health registered</div>
          <img src="https://images.unsplash.com/photo-1618255485625-c4adbed6c989?auto=format&fit=crop&w=1200&q=85" alt="Concierge" referrerPolicy="no-referrer" />
        </div>
      </Reveal>
    </section>
  );
}

function BentoCategories() {
  const cats = db.procedureCategories;
  return (
    <section className="gs-bento">
      <Reveal>
        <div className="gs-bento-head">
          <div className="gs-eyebrow">◇  Browse by area</div>
          <h2>What brings<br />you <em>here?</em></h2>
          <p>Tell us where you'd like to focus — Romie narrows down treatments and clinics for you.</p>
        </div>
      </Reveal>
      <Reveal>
        <div className="gs-bento-grid">
          {cats.map((c, i) => {
            const procs = db.proceduresByCategory(c.slug);
            const offerings = procs.reduce((sum, p) => sum + db.hospitalCountForProcedure(p.id), 0);
            const L = BENTO_LAYOUT[c.slug] || { size: 'std', sym: '✦', img: '' };
            return (
              <button
                key={c.slug}
                className="gs-bento-cell"
                data-size={L.size}
                onClick={() => navigate(`/category/${c.slug}`)}
              >
                <div className="gs-bento-bg" style={{ backgroundImage: `url(${L.img})` }} />
                <div className="gs-bento-tint" />
                <div className="gs-bento-content">
                  <div className="gs-bento-top">
                    <span className="gs-bento-num">{String(i + 1).padStart(2, '0')} / {String(cats.length).padStart(2, '0')}</span>
                    <span className="gs-bento-sym">{L.sym}</span>
                  </div>
                  <div className="gs-bento-bottom">
                    <span className="gs-bento-name-en">{c.name_en}</span>
                    <span className="gs-bento-name-ko">{c.name_ko}</span>
                    <div className="gs-bento-meta">
                      <span>{procs.length} treatments</span>
                      <span>· {offerings} offerings</span>
                    </div>
                  </div>
                </div>
                <span className="gs-bento-arrow">→</span>
              </button>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

function DeviceSection() {
  return (
    <section className="gs-bento" style={{ paddingBottom: 140 }}>
      <Reveal>
        <div className="gs-bento-head">
          <div className="gs-eyebrow">⬡  By device</div>
          <h2>Or by <em>name.</em></h2>
          <p>Patients often arrive asking by brand — <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'var(--text)' }}>"Can I get Ulthera at Hershe?"</em>. Here's where our 22 partners stand by device.</p>
        </div>
      </Reveal>
      <Reveal>
        <DeviceCategories />
      </Reveal>
    </section>
  );
}

function MagazineSteps() {
  return (
    <section className="gs-mag-steps">
      <div className="gs-mag-steps-inner">
        <Reveal>
          <div className="gs-section-head" style={{ textAlign: 'left', marginBottom: 64, maxWidth: 760, marginLeft: 0 }}>
            <div className="gs-eyebrow">✦  How it works</div>
            <h2 style={{ textAlign: 'left' }}>Five quiet <em>steps.</em></h2>
            <p style={{ marginLeft: 0 }}>No app to install. No account. Most of it happens on WhatsApp.</p>
          </div>
        </Reveal>
        {STEPS.map((s, i) => (
          <Reveal key={s.n}>
            <div className={`gs-mag-step ${i % 2 === 1 ? 'gs-mag-step--rev' : ''}`}>
              <div className="gs-mag-step-num">{s.n}</div>
              <div className="gs-mag-step-text">
                <div className="gs-eyebrow">Step {s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.body}</p>
                <span className="timing">{s.timing}</span>
              </div>
            </div>
          </Reveal>
        ))}
        <div style={{ textAlign: 'center', marginTop: 64 }}>
          <button className="gs-cta gs-cta--outline" onClick={() => navigate('/how-it-works')}>Read the full journey →</button>
        </div>
      </div>
    </section>
  );
}

function TierSplit() {
  return (
    <section style={{ padding: '120px 48px', background: 'var(--bg-soft)' }}>
      <Reveal>
        <div className="gs-section-head">
          <div className="gs-eyebrow">◎  Service Tiers</div>
          <h2>Care &amp; <em>Premium Care.</em></h2>
          <p>Two tiers, one promise — <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>free</em> to you. Clinics pay us only when you book.</p>
        </div>
      </Reveal>
      <Reveal>
        <div className="gs-tier-split">
          <div className="gs-tier-half gs-tier-half--care" onClick={() => navigate('/services#care')}>
            <div>
              <div className="gs-tier-half-num">01</div>
              <div className="gs-tier-half-eyebrow">✦ Care</div>
              <h3>Skin treatments —<br /><em>non-surgical.</em></h3>
              <p>Lasers · injectables · facials · acne · body contouring · hair restoration. Typical journey: a 1–3 day trip.</p>
              <ul>
                <li>1:1 coordinator from Day One</li>
                <li>Sisumate on treatment day</li>
                <li>1-week post-treatment follow-up</li>
              </ul>
            </div>
            <div className="gs-tier-half-foot">
              <div className="gs-tier-half-price">FREE</div>
              <span className="gs-cta gs-cta--outline">Explore Care →</span>
            </div>
          </div>
          <div className="gs-tier-half gs-tier-half--premium" onClick={() => navigate('/services#premium')}>
            <div>
              <div className="gs-tier-half-num">02</div>
              <div className="gs-tier-half-eyebrow">◈ Premium Care</div>
              <h3>Surgery —<br /><em>₩10M+ journeys.</em></h3>
              <p>Rhinoplasty · eyelid · facial contouring · body · hair transplant · dental. Typical journey: 7–14 day trip.</p>
              <ul>
                <li>Everything in Care</li>
                <li>Airport pickup &amp; recovery lodging</li>
                <li>Pharmacy / medication coverage</li>
                <li>D+7 &amp; D+30 post-op check-ins</li>
              </ul>
            </div>
            <div className="gs-tier-half-foot">
              <div className="gs-tier-half-price">FREE</div>
              <span className="gs-cta">Explore Premium →</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function MagazineTreatments({ trending }) {
  const [hero, ...rest] = trending;
  return (
    <section className="gs-mag-treatments" style={{ paddingTop: 140, paddingBottom: 140 }}>
      <Reveal>
        <div className="gs-section-head" style={{ textAlign: 'left', maxWidth: '100%', marginLeft: 0, marginBottom: 56 }}>
          <div className="gs-eyebrow">◇  Trending this month</div>
          <h2 style={{ textAlign: 'left' }}>Most-asked <em>procedures.</em></h2>
          <p style={{ marginLeft: 0 }}>Tap any card to compare across our partner clinics, or start an AI scan to get a personal shortlist.</p>
        </div>
      </Reveal>
      <Reveal>
        <div className="gs-mag-treat-grid">
          {hero && <div className="gs-mag-treat-hero"><TreatmentCard {...hero} /></div>}
          {rest.slice(0, 4).map((t) => (
            <TreatmentCard key={t.procedure.id} {...t} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function PullQuote() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % TESTIMONIALS.length), 7000);
    return () => clearInterval(t);
  }, []);
  const t = TESTIMONIALS[idx];
  return (
    <section className="gs-pullquote">
      <div className="gs-pullquote-inner">
        <Reveal>
          <blockquote key={t.text}>{t.text}</blockquote>
          <div className="gs-pullquote-cite">
            <strong>— {t.initial} · {t.country}</strong>
            <em>{t.treatment}</em>
          </div>
        </Reveal>
        <div className="gs-pullquote-dots">
          {TESTIMONIALS.map((_, i) => (
            <button key={i} className={`gs-pullquote-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} aria-label={`Testimonial ${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Finale() {
  const flow = useScanFlow();
  return (
    <section className="gs-finale">
      <div className="gs-finale-l">
        <div className="gs-eyebrow" style={{ color: 'var(--gold-light)' }}>✦  Begin</div>
        <h2>Not sure where to <em>start?</em></h2>
        <p>Run a 5-second AI face scan, or send Romie a single message on WhatsApp. We reply within 24 hours in EN / 中文 / 日本語 / Bahasa.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="gs-cta gs-cta--lg" onClick={flow?.openScan} style={{ background: 'var(--gold-light)', color: 'var(--text)' }}>
            <span>✦ Start scan</span><span className="gs-cta-tail">→</span>
          </button>
          <WhatsAppCTA label="Message Romie" />
        </div>
      </div>
      <div className="gs-finale-r" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1614102073832-030967418971?auto=format&fit=crop&w=1600&q=85)' }} />
    </section>
  );
}

export default function HomePage() {
  const trending = useMemo(() => (
    db.procedures
      .map((p) => {
        const offerings = db.offeringsForProcedure(p.id);
        const eventCount = offerings.filter((o) => o.hp.has_active_event).length;
        const score = offerings.length * 10 + eventCount * 5 + offerings.filter((o) => o.hp.is_signature).length * 3;
        return { procedure: p, offerings, hospital_count: offerings.length, price_range: db.priceRangeForProcedure(p.id), score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  ), []);

  return (
    <>
      <Hero />
      <PressMarquee />
      <Editorial />
      <PublicFeedTicker />
      <BentoCategories />
      <DeviceSection />
      <MagazineSteps />
      <TierSplit />
      <MagazineTreatments trending={trending} />
      <PullQuote />
      <Finale />
    </>
  );
}

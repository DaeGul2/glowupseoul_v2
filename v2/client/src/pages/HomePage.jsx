import db from '../data/db.js';
import { navigate, useScanFlow } from '../App.jsx';
import Hero from '../components/Hero.jsx';
import PublicFeedTicker from '../components/PublicFeedTicker.jsx';
import CategoryCards from '../components/CategoryCards.jsx';
import TreatmentCard from '../components/TreatmentCard.jsx';
import WhatsAppCTA from '../components/WhatsAppCTA.jsx';
import { useReveal } from '../utils/useReveal.js';

const STEPS = [
  { n: '01', t: 'Free Consultation',     s: 'WhatsApp — one message.' },
  { n: '02', t: 'Clinic & Doctor Match', s: 'A shortlist of 2–3.' },
  { n: '03', t: 'Arrive in Seoul',       s: 'Met at the airport.' },
  { n: '04', t: 'Treatment Day',         s: 'A Sisumate goes with you.' },
  { n: '05', t: 'Aftercare',             s: 'D+7 & D+30 check-ins.' },
];

const TESTIMONIALS = [
  { initial: 'S.', country: 'Singapore',  text: 'Romie replied at 11pm my time when I was panicking about a swelling photo. That, more than the matching, is why I trusted her.', treatment: 'PicoSure + Rejuran' },
  { initial: 'M.', country: 'Australia',  text: 'I came in for "tighten my jawline" and left with a plan that included an injectable I had never heard of. It worked. Romie reads the brief.',           treatment: 'HIFU + Botox' },
  { initial: 'A.', country: 'Indonesia',  text: 'The Sisumate stayed in recovery with me. I don\'t speak Korean. I would have been terrified alone.',                                                       treatment: 'Rhinoplasty · Hershe' },
];

function Reveal({ children, className = '' }) {
  const { ref, revealed } = useReveal();
  return <div ref={ref} className={`gs-reveal ${revealed ? 'gs-revealed' : ''} ${className}`}>{children}</div>;
}

export default function HomePage() {
  const flow = useScanFlow();
  const trending = db.procedures
    .map((p) => {
      const offerings = db.offeringsForProcedure(p.id);
      const eventCount = offerings.filter((o) => o.hp.has_active_event).length;
      const score = offerings.length * 10 + eventCount * 5 + offerings.filter((o) => o.hp.is_signature).length * 3;
      return { procedure: p, offerings, hospital_count: offerings.length, price_range: db.priceRangeForProcedure(p.id), score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <>
      <Hero />
      <PublicFeedTicker />

      <section className="gs-section">
        <Reveal>
          <div className="gs-section-head">
            <div className="gs-eyebrow">◈  Browse by Area</div>
            <h2>What brings<br />you <em>here?</em></h2>
            <p>Tell us where you'd like to focus — Romie narrows down treatments and clinics for you.</p>
          </div>
        </Reveal>
        <Reveal><CategoryCards /></Reveal>
      </section>

      <section className="gs-section" style={{ background: 'var(--bg-soft)', maxWidth: 'none', padding: '140px 48px' }}>
        <div style={{ maxWidth: 1480, margin: '0 auto' }}>
          <Reveal>
            <div className="gs-section-head">
              <div className="gs-eyebrow">◇  How it works</div>
              <h2>Five quiet <em>steps.</em></h2>
              <p>No app to install. Most of it happens on WhatsApp.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="gs-step-row">
              {STEPS.map((s) => (
                <div className="gs-step-mini" key={s.n}>
                  <div className="gs-step-n">{s.n}</div>
                  <h4>{s.t}</h4>
                  <p>{s.s}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <button className="gs-cta gs-cta--outline" onClick={() => navigate('/how-it-works')}>Read the full journey →</button>
          </div>
        </div>
      </section>

      <section className="gs-section">
        <Reveal>
          <div className="gs-section-head">
            <div className="gs-eyebrow">✦  Service Tiers</div>
            <h2>Care &amp; <em>Premium Care.</em></h2>
            <p>Two tiers, one promise — free to you. Clinics pay us only when you book.</p>
          </div>
        </Reveal>
        <Reveal>
          <div className="gs-tier-grid">
            <div className="gs-tier">
              <div className="gs-eyebrow">✦ Care</div>
              <h3>Skin treatments —<br />non-surgical.</h3>
              <p>Lasers · injectables · facials · acne · body contouring · hair.</p>
              <ul>
                <li>1:1 coordinator from Day One</li>
                <li>Sisumate on treatment day</li>
                <li>1-week post-treatment follow-up</li>
              </ul>
              <div className="gs-tier-price">FREE</div>
              <button className="gs-cta gs-cta--outline" onClick={() => navigate('/services#care')}>Explore Care →</button>
            </div>
            <div className="gs-tier gs-tier--premium">
              <div className="gs-eyebrow">◈ Premium Care</div>
              <h3>Surgery —<br />₩10M+.</h3>
              <p>Rhinoplasty · eyelid · facial contouring · body · hair transplant · dental.</p>
              <ul>
                <li>Everything in Care</li>
                <li>Airport pickup &amp; recovery lodging</li>
                <li>Pharmacy / medication coverage</li>
                <li>D+7 &amp; D+30 post-op check-ins</li>
              </ul>
              <div className="gs-tier-price">FREE</div>
              <button className="gs-cta" onClick={() => navigate('/services#premium')}>Explore Premium →</button>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="gs-section" style={{ background: 'var(--bg-ink)', maxWidth: 'none', padding: '160px 48px', color: 'rgba(255,255,255,0.9)' }}>
        <div style={{ maxWidth: 1480, margin: '0 auto' }}>
          <Reveal>
            <div className="gs-section-head" style={{ color: '#fff' }}>
              <div className="gs-eyebrow" style={{ color: 'var(--gold-light)' }}>◇  Trending This Month</div>
              <h2 style={{ color: '#fff' }}>Most-asked <em style={{ color: 'var(--gold-light)' }}>procedures.</em></h2>
              <p style={{ color: 'rgba(255,255,255,0.65)' }}>Tap a card to compare across our 22 partner clinics.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="gs-treatment-grid gs-treatment-grid--dark">
              {trending.map((t) => (
                <TreatmentCard key={t.procedure.id} {...t} dark />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="gs-section">
        <Reveal>
          <div className="gs-section-head">
            <div className="gs-eyebrow">☽  Stories</div>
            <h2>Quiet, slow,<br /><em>by design.</em></h2>
          </div>
        </Reveal>
        <Reveal>
          <div className="gs-testimonial-grid">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="gs-testimonial">
                <blockquote>{t.text}</blockquote>
                <figcaption>
                  <strong>{t.initial} · {t.country}</strong><br />
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'var(--accent)', fontSize: 16 }}>{t.treatment}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="gs-cta-strip">
        <Reveal>
          <h2>Not sure where to <em>start?</em></h2>
          <p>Run a 5-second face scan, or send a single message.<br />Your Sisumate replies within 24h in EN / 中文 / 日本語.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="gs-cta gs-cta--lg" onClick={flow?.openScan} style={{ background: 'var(--gold-light)', color: 'var(--text)' }}>
              <span>✦ Start scan</span><span className="gs-cta-tail">→</span>
            </button>
            <WhatsAppCTA label="Or message Romie" />
          </div>
        </Reveal>
      </section>
    </>
  );
}

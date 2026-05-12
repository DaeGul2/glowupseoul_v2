import WhatsAppCTA from '../components/WhatsAppCTA.jsx';
import { navigate } from '../App.jsx';
import { useSeo, breadcrumbLd } from '../utils/seo.js';

const STEPS = [
  {
    n: '01',
    title: 'Free Consultation',
    sub: 'WhatsApp — one message is enough.',
    body: 'Send us a photo, a concern, or a single question. Your coordinator (Romie or a Sisumate) reads it personally and replies within 24 hours in your language.',
    timing: 'Same day → 24h',
  },
  {
    n: '02',
    title: 'Clinic & Doctor Match',
    sub: 'A shortlist of 2–3 clinics, not 30.',
    body: 'Based on your story, budget, downtime tolerance and trip dates, we hand-pick 2–3 clinics from our 22 partners. You see why each one was chosen — not just a list.',
    timing: '1–3 days',
  },
  {
    n: '03',
    title: 'Arrive in Seoul',
    sub: 'Met at the airport. SIM, taxi, hotel — sorted.',
    body: 'For Premium Care patients we coordinate airport pickup and recovery lodging. For Care patients we send a Seoul survival kit (transport, SIM, pharmacy).',
    timing: 'Day 0',
  },
  {
    n: '04',
    title: 'Treatment Day',
    sub: 'A Sisumate goes with you.',
    body: 'Your Sisumate interprets the consultation, holds your bag during prep, and stays with you in recovery. You never face a Korean-only clinic alone.',
    timing: 'Day 1–7',
  },
  {
    n: '05',
    title: 'Aftercare & Follow-Up',
    sub: 'D+7, D+30 check-ins — not just goodbye at the door.',
    body: 'We check on you a week and a month post-procedure. If a swelling or healing question comes up at home, you message the same coordinator.',
    timing: 'Up to 90 days',
  },
];

export default function HowItWorksPage() {
  useSeo({
    title: 'How it works — five-step concierge journey',
    description: 'Scan, consult, match, travel, follow up. Five quiet steps from AI face scan to D+30 post-op check-in. One coordinator, one journey, entirely yours.',
    canonical: '/how-it-works',
    jsonLd: breadcrumbLd([{ name: 'Home', url: '/' }, { name: 'How it works', url: '/how-it-works' }]),
  });
  return (
    <>
      <section className="gs-hero" style={{ padding: '80px 28px 40px' }}>
        <div className="gs-eyebrow">◈ How it works</div>
        <h1>One coordinator.<br /><em>One journey.</em> Entirely yours.</h1>
        <p>Five quiet steps. No app to install, no account to create. Most of it happens on WhatsApp.</p>
      </section>

      <section className="gs-section">
        <div className="gs-step-list">
          {STEPS.map((s) => (
            <div className="gs-step" key={s.n}>
              <div className="gs-step-n">{s.n}</div>
              <div>
                <div className="gs-eyebrow" style={{ marginBottom: 4 }}>{s.timing}</div>
                <h3>{s.title} <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'var(--accent)' }}>· {s.sub}</em></h3>
                <p style={{ marginTop: 8, color: 'var(--text-soft)' }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="gs-section" style={{ background: 'var(--bg-soft)' }}>
        <div className="gs-section-head">
          <div className="gs-eyebrow">✦ Two tiers — both free for you</div>
          <h2>Care &amp; <em>Premium Care.</em></h2>
          <p>Which tier you fall into depends on the procedure type, not on what you pay us. (You pay us nothing. Clinics do.)</p>
        </div>
        <div className="gs-tier-grid">
          <div className="gs-tier">
            <div className="gs-eyebrow">✦ Care</div>
            <h3>Skin treatments — non-surgical.</h3>
            <p>Lasers, injectables, skin boosters, medical-grade facials, acne, body contouring (non-surgical), hair restoration.</p>
            <ul>
              <li>1:1 coordinator from Day One</li>
              <li>Sisumate on treatment day</li>
              <li>1-week post-treatment follow-up</li>
              <li>Translation of clinic instructions</li>
            </ul>
            <div className="gs-tier-price">FREE</div>
          </div>
          <div className="gs-tier gs-tier--premium">
            <div className="gs-eyebrow">◈ Premium Care</div>
            <h3>Surgery — facial or body, ₩10M+.</h3>
            <p>Rhinoplasty, eyelid surgery, facial contouring, body surgery, hair transplant, dental implants &amp; orthodontics.</p>
            <ul>
              <li>Everything in Care</li>
              <li>Airport pickup &amp; recovery lodging coordination</li>
              <li>Pharmacy &amp; medication coverage logistics</li>
              <li>D+7 &amp; D+30 post-op check-ins</li>
              <li>Emergency interpreter line</li>
            </ul>
            <div className="gs-tier-price">FREE</div>
          </div>
        </div>
      </section>

      <section className="gs-cta-strip">
        <h2>Step 01 is one message.</h2>
        <p>Send Romie a photo or your concern. The rest follows.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <WhatsAppCTA label="Start step 01 →" />
          <button className="gs-cta gs-cta--outline" onClick={() => navigate('/services')} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>See services →</button>
        </div>
      </section>
    </>
  );
}

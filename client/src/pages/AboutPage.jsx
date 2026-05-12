import { navigate } from '../App.jsx';
import WhatsAppCTA from '../components/WhatsAppCTA.jsx';
import { useSeo, breadcrumbLd } from '../utils/seo.js';

export default function AboutPage() {
  useSeo({
    title: 'About — Romie & the Glow Up Seoul concierge',
    description: 'Meet Romie — your dedicated coordinator for Korean dermatology, plastic surgery and dental care. Ministry of Health & Welfare registered. 500+ patients · 98% satisfaction.',
    canonical: '/about',
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About Glow Up Seoul', url: 'https://glowupseoul.com/about' },
      breadcrumbLd([{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }]),
    ],
  });
  return (
    <>
      <section className="gs-hero" style={{ padding: '80px 28px 40px' }}>
        <div className="gs-eyebrow">◈ About Us</div>
        <h1>Not a booking app.<br /><em>A personal concierge —</em> just for you.</h1>
        <p>Glow Up Seoul was built by someone who was asked one too many times: <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>"can you take me to your clinic?"</em></p>
      </section>

      <section className="gs-section gs-prose">
        <div className="gs-eyebrow">Founder · CEO</div>
        <h2>Romie.</h2>
        <p>
          After ten years living between Seoul and her hometown, Romie was the friend everyone messaged before they flew to Korea — for a clinic recommendation, a doctor's English level, a polite way to negotiate the price.
          What started as "I'll text you the WhatsApp" became hundreds of hours of unpaid coordination.
        </p>
        <p>
          In <strong>2022</strong> she made it a real agency — <strong>registered with the Korean Ministry of Health &amp; Welfare</strong> as a Foreign Patient Attraction Agency.
          Today Glow Up Seoul is a small team of coordinators and one promise: <em>one journey, entirely yours.</em>
        </p>

        <div className="gs-pillar-grid">
          <div className="gs-pillar">
            <div className="gs-eyebrow">✦ Why we exist</div>
            <h3>Because choosing a clinic should not be a research project.</h3>
            <p>You should not have to read 40 Naver reviews in a language you don't speak, to figure out whether a clinic's "natural" actually looks natural in photos.</p>
          </div>
          <div className="gs-pillar">
            <div className="gs-eyebrow">✦ How we earn</div>
            <h3>100% free for you. Clinics pay us — only when you book.</h3>
            <p>That means we have no incentive to over-sell. We only earn when our shortlist actually fits, and you actually go.</p>
          </div>
          <div className="gs-pillar">
            <div className="gs-eyebrow">✦ Our promise</div>
            <h3>One coordinator, from the first DM to your post-op check-in.</h3>
            <p>Not a chatbot. Not a different person every time. Romie or a Sisumate will be your one point of contact, always.</p>
          </div>
        </div>
      </section>

      <section className="gs-section" style={{ background: 'var(--bg-soft)' }}>
        <div className="gs-section-head">
          <div className="gs-eyebrow">◇ The numbers</div>
          <h2>Quiet, slow, <em>by-design.</em></h2>
        </div>
        <div className="gs-stat-grid">
          <div><strong>500+</strong><span>international patients matched</span></div>
          <div><strong>22</strong><span>partner clinics, hand-picked</span></div>
          <div><strong>10,000+</strong><span>clinics evaluated over 10 years</span></div>
          <div><strong>98%</strong><span>satisfaction across post-op surveys</span></div>
          <div><strong>25+</strong><span>countries served</span></div>
          <div><strong>24h</strong><span>WhatsApp SLA, 7 days a week</span></div>
        </div>
      </section>

      <section className="gs-prose gs-section">
        <div className="gs-eyebrow">◎ Vocabulary</div>
        <h2>Two words we use a lot.</h2>
        <p>
          <strong>Sisumate (시수메이트)</strong> — your dedicated companion on treatment or surgery day.
          Interpreter, gentle carer, and someone who quietly asks the right questions when you're swollen and overwhelmed in recovery.
        </p>
        <p>
          <strong>The Story</strong> — what we ask you to share before we recommend anything.
          Not "what procedure do you want," but <em>what's going on with your skin, your year, your trip.</em>
          Recommendations come from the story, not the menu.
        </p>
      </section>

      <section className="gs-cta-strip">
        <h2>Tell us your <em>Story.</em></h2>
        <p>Two minutes on WhatsApp. We'll reply within 24 hours in EN / 中文 / 日本語.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <WhatsAppCTA label="Start a conversation" />
          <button className="gs-cta gs-cta--outline" onClick={() => navigate('/how-it-works')} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>How it works →</button>
        </div>
      </section>
    </>
  );
}

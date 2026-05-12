import { useState } from 'react';
import WhatsAppCTA from '../components/WhatsAppCTA.jsx';
import { useSeo, faqPageLd, breadcrumbLd } from '../utils/seo.js';

const FAQ = [
  {
    cat: 'Booking',
    items: [
      { q: 'Do I really pay nothing for Glow Up Seoul?',
        a: 'Correct. We are 100% free for patients. Partner clinics pay us a referral fee only when you actually book and attend. That is why we have no incentive to over-recommend.' },
      { q: 'Can I book a clinic directly without going through you?',
        a: 'Yes, of course — every clinic on our site is a registered medical institution in Korea. But you would be on your own for interpreter, prep instructions, and post-op questions. Our service is the journey, not the introduction.' },
      { q: 'How long does the consultation reply take?',
        a: 'We aim to reply on WhatsApp within 24 hours, 7 days a week — usually much faster during Korea daytime (KST).' },
      { q: 'What if I want to change clinic after my shortlist?',
        a: 'No problem. Your coordinator will re-shortlist with your new constraints. There is no "lock-in" — you only commit once you say yes to a specific booking.' },
    ],
  },
  {
    cat: 'Travel',
    items: [
      { q: 'Do you arrange the flight and hotel?',
        a: 'Flights — no, that is on you. Recovery lodging — yes, for Premium Care patients we coordinate hotel options near your clinic and aftercare schedule. For Care (skin) tier we share recommended hotels in your budget.' },
      { q: 'What about airport pickup?',
        a: 'Premium Care includes airport pickup. For Care patients we send a Seoul transport guide and a coordinator-screened car service contact.' },
      { q: 'Do I need a visa?',
        a: 'Most patients enter on a tourist visa (K-ETA / visa-free, depending on country). For longer surgical stays we can issue a Korean Medical Visa (C-3-3) invitation letter through our agency registration.' },
    ],
  },
  {
    cat: 'Treatment',
    items: [
      { q: 'How are clinics selected?',
        a: 'Each clinic is visited by our team, vetted on doctor credentials, English-speaking capability, safety record, and after-care responsiveness. We have evaluated 10,000+ clinics over 10 years and currently work with 22.' },
      { q: 'Can I bring my own clinic that I researched?',
        a: 'Yes — if it is in Korea and accepts foreign patients, we can act as your interpreter / coordinator on a flat-fee Care service. Mention this in your first WhatsApp.' },
      { q: 'What if my procedure result is not what I expected?',
        a: 'Most partner clinics have a revision policy (usually 6–12 months for surgical, included in price). We mediate between you and the clinic in your language — that is part of why we exist.' },
      { q: 'Do you treat male patients?',
        a: 'Yes. Roughly 1 in 3 of our patients are men — most often for skin, hair, and rhinoplasty / facial contouring.' },
    ],
  },
  {
    cat: 'Privacy',
    items: [
      { q: 'What happens to my photo and scan?',
        a: 'Face scan snapshots are stored locally in your browser session by default. If you share a photo with your coordinator via WhatsApp, it stays in that thread — we do not feed it to any AI or third-party tool.' },
      { q: 'Will my consultation appear on the home page ticker?',
        a: 'Only if you opt in via the checkbox at the end of the form. We show initial + country + treatment only — never full name, city, or photo.' },
      { q: 'Do you sell or share my data?',
        a: 'No. As a Ministry of Health & Welfare registered agency we are bound by Korean PIPA. Your records are kept for the duration of your care plus the legally required retention window, then deleted.' },
    ],
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState({ '0_0': true });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  // Flatten for FAQ schema — surfaces in Google rich results.
  const flat = FAQ.flatMap((c) => c.items);
  useSeo({
    title: 'FAQ — booking, travel, treatment, privacy',
    description: 'Common questions on booking a Korean clinic, K-ETA / medical visa, recovery lodging, revision policies, photo privacy. Answered by the Glow Up Seoul concierge.',
    canonical: '/faq',
    jsonLd: [
      faqPageLd(flat),
      breadcrumbLd([{ name: 'Home', url: '/' }, { name: 'FAQ', url: '/faq' }]),
    ],
  });

  return (
    <>
      <section className="gs-hero" style={{ padding: '80px 28px 40px' }}>
        <div className="gs-eyebrow">◎ FAQ</div>
        <h1>Questions <em>worth asking.</em></h1>
        <p>Can't find your question? It's faster to message us than to email — we reply within 24h.</p>
      </section>

      <section className="gs-section gs-faq">
        {FAQ.map((cat, ci) => (
          <div key={cat.cat} className="gs-faq-cat">
            <div className="gs-eyebrow">✦ {cat.cat}</div>
            {cat.items.map((item, ii) => {
              const k = `${ci}_${ii}`;
              const isOpen = open[k];
              return (
                <div key={k} className={`gs-faq-item ${isOpen ? 'open' : ''}`}>
                  <button className="gs-faq-q" onClick={() => toggle(k)}>
                    <span>{item.q}</span>
                    <span className="gs-faq-toggle">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && <div className="gs-faq-a">{item.a}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <section className="gs-cta-strip">
        <h2>Different question? <em>Ask Romie.</em></h2>
        <p>WhatsApp · +82 10 6487 1060 · 24h SLA, 7 days a week.</p>
        <WhatsAppCTA label="Ask your question →" />
      </section>
    </>
  );
}

import { useSeo, breadcrumbLd } from '../utils/seo.js';
import { navigate } from '../App.jsx';

export default function TermsPage() {
  useSeo({
    title: 'Terms of Service',
    description: 'Terms of use for Glow Up Seoul — a medical tourism concierge connecting foreign patients with licensed Korean clinics. Not a medical provider.',
    canonical: '/terms',
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: '/' },
        { name: 'Terms of Service', url: '/terms' },
      ]),
    ],
  });

  const effective = 'May 14, 2026';

  return (
    <article className="gs-section gs-prose">
      <button className="gs-back" onClick={() => navigate('/')}>← Home</button>

      <div className="gs-eyebrow">◇ Legal</div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 500, lineHeight: 1.05, margin: '8px 0 12px' }}>
        Terms of <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Service.</em>
      </h1>
      <p style={{ color: 'var(--text-soft)', marginBottom: 40 }}>
        Effective {effective}. By using Glow Up Seoul you agree to these Terms and to our
        <a href="/privacy" style={{ color: 'var(--accent)' }}> Privacy Policy</a>.
      </p>

      <h2>1. What Glow Up Seoul is — and is not</h2>
      <p>Glow Up Seoul (the "Service") is a <strong>concierge and matching service</strong> operated as a Ministry
        of Health &amp; Welfare-registered Foreign Patient Attraction Agency in the Republic of Korea. We help
        foreign patients identify, schedule, and travel for cosmetic and dental procedures performed by
        <strong> independently licensed Korean medical institutions</strong>.</p>
      <p><strong>We are not a medical provider.</strong> We do not employ doctors. We do not perform medical
        procedures, prescribe medications, diagnose, or provide medical advice. All treatment decisions are made
        between you and a licensed physician at the clinic you choose.</p>

      <h2>2. Eligibility</h2>
      <ul>
        <li>You must be <strong>at least 18 years old</strong> (or the age of majority where you live) and able
          to enter into a binding contract.</li>
        <li>The Service is intended for <strong>foreign patients</strong> seeking care in Korea. If you are a
          resident of the Republic of Korea, you may use the informational pages but the matching and AI-scan
          features are not directed to you; please consult a Korean clinic directly.</li>
        <li>Some jurisdictions (e.g., certain US states) regulate biometric data processing in specific ways.
          If you have concerns about how local biometric statutes apply to your use of the scan, contact us
          before using the feature.</li>
      </ul>

      <h2>3. The AI face scan — what it is, and what it is not</h2>
      <p>The optional AI scan analyzes a photo you provide and returns a <strong>non-medical aesthetic
        summary</strong> — categories of cosmetic preference, regions, soft narrative text, and numeric "metrics"
        that represent <em>aesthetic signals only</em>, not medical findings. The scan:</p>
      <ul>
        <li><strong>Is not</strong> a diagnosis, a clinical assessment, a triage, or a substitute for examination
          by a qualified physician.</li>
        <li><strong>Does not</strong> identify, measure, or evaluate any medical condition, disease, abnormality,
          or risk.</li>
        <li><strong>May contain errors</strong>. AI output can be wrong, biased, or unsuitable. Treat it as a
          starting point for a conversation with a coordinator and a doctor — nothing more.</li>
      </ul>
      <p>Any "recommendation" returned by the Service is a <strong>cosmetic preference suggestion</strong> based on
        your stated wishes and aesthetic categories. Final treatment decisions require an in-person consultation
        and a licensed physician's professional medical judgment.</p>

      <h2>4. Pricing and payment</h2>
      <p>Use of the Service is <strong>free to patients</strong>. Pricing displayed on the Service is provided by
        partner clinics and may change without notice; the price you ultimately pay is set in writing by the
        clinic after consultation. You pay the clinic directly. We are compensated by partner clinics only after
        a confirmed booking.</p>

      <h2>5. Bookings, cancellations, refunds</h2>
      <p>Each clinic sets its own booking, cancellation, deposit, and refund terms. We will share them with you
        before you commit. We can mediate disputes in your language but cannot guarantee any specific outcome,
        and we are not a party to your medical-services contract with the clinic.</p>

      <h2>6. Medical outcomes &amp; risks</h2>
      <p>All medical procedures carry risk. Outcomes vary by individual. Photographs ("before / after") shown on
        the Service are provided by partner clinics with their patients' consent, are not guarantees of any
        result, and do not constitute medical advice. You agree to read each clinic's own informed-consent
        materials and to ask questions until you understand the risks.</p>

      <h2>7. Your responsibilities</h2>
      <ul>
        <li>Provide accurate information about your medical history when a clinic asks for it.</li>
        <li>Disclose medications, allergies, prior procedures, and pregnancy status to the clinic.</li>
        <li>Follow pre- and post-operative instructions issued by your clinic.</li>
        <li>Not upload photographs of anyone other than yourself, or content you do not have the right to share.</li>
        <li>Not use the Service to harass, defraud, or attempt to compromise our systems.</li>
      </ul>

      <h2>8. Intellectual property</h2>
      <p>The Service, including its text, design, code, and brand, is owned by Glow Up Seoul and its licensors.
        You may use it only as the Service intends. You retain ownership of content you submit (e.g., your scan
        photo, your free-text notes) but grant us a limited licence to process that content as described in the
        Privacy Policy.</p>

      <h2>9. Third-party services</h2>
      <p>Some features use third-party services (OpenAI for AI analysis, Google for clinic reviews, Meta /
        WhatsApp for messaging, Amazon Web Services for hosting). Your use of those features is also subject to
        the third party's terms. We are not responsible for content produced by third-party AI models beyond
        what is required by applicable law.</p>

      <h2>10. Disclaimers</h2>
      <p>The Service and all AI output are provided <strong>"as is" and "as available"</strong>. To the maximum
        extent permitted by law, we disclaim all warranties, express or implied, including merchantability,
        fitness for a particular purpose, accuracy, and non-infringement. Specifically:</p>
      <ul>
        <li>We make no warranty that the AI scan will be accurate, complete, current, or useful for any purpose.</li>
        <li>We do not warrant the medical efficacy, safety, or suitability of any procedure or clinic listed.</li>
        <li>We do not warrant that the Service will be uninterrupted or error-free.</li>
      </ul>

      <h2>11. Limitation of liability</h2>
      <p>To the maximum extent permitted by law, Glow Up Seoul and its operators will not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenues,
        data, or goodwill, arising out of or in connection with your use of the Service. Our aggregate
        liability for any direct damages is limited to <strong>USD 100</strong>. Nothing in these Terms limits
        liability that cannot be limited under applicable law (e.g., for gross negligence, willful misconduct,
        death or personal injury caused by negligence, or rights granted by mandatory consumer-protection law).</p>

      <h2>12. Indemnity</h2>
      <p>You agree to indemnify Glow Up Seoul against any claim arising from (a) your breach of these Terms,
        (b) inaccurate information you provided to a clinic, or (c) your unlawful use of the Service.</p>

      <h2>13. Termination</h2>
      <p>We may suspend or terminate access to the Service for breach of these Terms or where required by law.
        You may stop using the Service at any time. Sections 6 through 12, and any provision intended to
        survive, will survive termination.</p>

      <h2>14. Governing law &amp; disputes</h2>
      <p>These Terms are governed by the laws of the Republic of Korea, without regard to conflict-of-laws
        principles. Disputes will be brought before the courts of <strong>Seoul Central District Court</strong>,
        Korea, except where applicable consumer-protection law in your country of residence requires otherwise.
        Nothing in this section removes your right to mandatory protections under the law of your home
        jurisdiction.</p>

      <h2>15. Contact</h2>
      <p>
        Email <a href="mailto:glowupinseoul@gmail.com" style={{ color: 'var(--accent)' }}>glowupinseoul@gmail.com</a> ·
        WhatsApp <strong>+82 10 6487 1060</strong>.
      </p>

      <p style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border-soft)', fontSize: 13, color: 'var(--text-soft)' }}>
        <em>These Terms do not override the rights granted to you under Korean PIPA, EU/UK GDPR, or any other
        applicable consumer-protection or data-protection law.</em>
      </p>
    </article>
  );
}

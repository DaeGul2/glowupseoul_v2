import { useSeo, breadcrumbLd } from '../utils/seo.js';
import { navigate } from '../App.jsx';

// English-first privacy notice covering PIPA (Korea), GDPR (EU/UK), and
// US state biometric laws. Translations should follow but the legal anchor
// is this English version + the Korean section §13.
export default function PrivacyPolicyPage() {
  useSeo({
    title: 'Privacy Policy',
    description: 'How Glow Up Seoul collects, uses, and protects your personal information — including biometric face scan data, under Korean PIPA, EU GDPR, and US state laws.',
    canonical: '/privacy',
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: '/' },
        { name: 'Privacy Policy', url: '/privacy' },
      ]),
    ],
  });

  const effective = 'May 14, 2026';

  return (
    <article className="gs-section gs-prose">
      <button className="gs-back" onClick={() => navigate('/')}>← Home</button>

      <div className="gs-eyebrow">◇ Legal</div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 500, lineHeight: 1.05, margin: '8px 0 12px' }}>
        Privacy <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Policy.</em>
      </h1>
      <p style={{ color: 'var(--text-soft)', marginBottom: 40 }}>
        Effective {effective}. This notice applies to <strong>glowupseoul.com</strong> and the AI face-scan service.
        Read alongside our <a href="/terms" style={{ color: 'var(--accent)' }}>Terms of Service</a>.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Glow Up Seoul (the "Service", "we") is operated as a <strong>Ministry of Health &amp; Welfare-registered
        Foreign Patient Attraction Agency</strong> in the Republic of Korea. We are the data controller for personal
        information you provide to us. Contact: <a href="mailto:glowupinseoul@gmail.com" style={{ color: 'var(--accent)' }}>glowupinseoul@gmail.com</a> ·
        WhatsApp <strong>+82 10 6487 1060</strong>.
      </p>

      <h2>2. What we collect</h2>
      <p><strong>From the face-scan flow (optional).</strong> A live selfie image, captured locally in your browser.
        We send the image to a third-party AI provider (OpenAI, USA) to produce a non-medical aesthetic summary
        (concerns, regions, narrative text, numeric metrics). <strong>We never save the image itself</strong> to our database
        or servers; only the resulting text summary is stored.</p>
      <p><strong>From the preference form.</strong> Your stated concerns, budget tier, downtime tolerance, pain tolerance,
        preferred style, preferred language, optional trip dates, optional free-text notes, and an optional
        anonymous-feed display consent.</p>
      <p><strong>Technical &amp; session.</strong> A randomly generated session token (no personal identifier),
        IP-derived approximate region, browser/device user-agent, and basic usage events for safety and abuse
        prevention.</p>
      <p><strong>From your messages.</strong> Any information you choose to share over WhatsApp / WeChat / email
        after the scan flow ends.</p>

      <h2>3. Sensitive &amp; biometric information</h2>
      <p>Under Korean PIPA, your face-scan image is treated as <strong>biometric / sensitive information</strong>.
        Under EU GDPR it falls under <strong>Article 9 special categories</strong>. We process it only with your
        prior <strong>explicit, separate consent</strong>, given via the consent screen that appears before the
        scan begins. You may decline and use the preference form alone. If you withdraw consent later, you may
        also request erasure of the resulting text summary (see §11).</p>

      <h2>4. Why we process it (lawful basis)</h2>
      <ul>
        <li><strong>Explicit consent</strong> (GDPR Art. 6(1)(a) &amp; 9(2)(a) · PIPA Arts. 15, 23) — biometric face scan and any sensitive aesthetic information.</li>
        <li><strong>Contract</strong> (GDPR Art. 6(1)(b)) — to provide the concierge service you requested (matching, booking coordination, follow-up).</li>
        <li><strong>Legitimate interest</strong> (GDPR Art. 6(1)(f)) — security, fraud prevention, internal analytics on anonymized data.</li>
        <li><strong>Legal obligation</strong> (GDPR Art. 6(1)(c)) — record-keeping required of registered foreign-patient agencies in Korea.</li>
      </ul>

      <h2>5. Who we share with (third parties)</h2>
      <ul>
        <li><strong>OpenAI, L.L.C.</strong> (United States) — processes the face image and your scan/preference text
          to generate the AI summary. Subject to OpenAI's API terms; we request <em>zero data retention</em> where available.</li>
        <li><strong>Google LLC</strong> (United States) — Google Places API is used to fetch publicly available clinic
          reviews; <em>no personal data of yours</em> is sent to Google.</li>
        <li><strong>Meta Platforms, Inc.</strong> (USA, via WhatsApp) — only if you choose to message our coordinator
          on WhatsApp. The message contents pass through Meta's infrastructure.</li>
        <li><strong>Partner clinics</strong> in Korea — only the minimum information required to obtain a quote on
          your behalf, after you proceed to a paid inquiry. Clinics never receive your face image.</li>
        <li><strong>Amazon Web Services Korea LLC</strong> (Seoul region) — our database and storage processor.</li>
      </ul>
      <p>We do <strong>not</strong> sell your personal information. We do not use it for behavioral advertising.</p>

      <h2>6. International data transfers</h2>
      <p>Your face image, AI scan summary, and any free-text notes will leave Korea and be processed in the
        United States by OpenAI. By giving the separate cross-border-transfer consent at the scan screen, you
        authorize this transfer. For EU/UK users, transfers rely on <strong>Standard Contractual Clauses</strong>
        (where applicable) and supplementary measures.</p>

      <h2>7. Retention</h2>
      <ul>
        <li><strong>Face image:</strong> never stored on our servers; held only in your browser memory for the
          duration of the session.</li>
        <li><strong>AI scan summary (text) + match request:</strong> retained for up to 3 years from your last
          interaction, then anonymized or deleted. Earlier on request (see §11).</li>
        <li><strong>Inquiry / booking records:</strong> retained per Korean legal requirements for medical-tourism
          intermediaries (currently 5 years).</li>
        <li><strong>Public-feed entry (opt-in only):</strong> retained until you ask us to remove it, or for 12
          months, whichever is sooner.</li>
      </ul>

      <h2>8. Your rights</h2>
      <p>You have the right to <strong>access, correct, erase, restrict, or object to</strong> the processing of
        your personal information; to <strong>data portability</strong>; and to <strong>withdraw consent</strong>
        at any time (without affecting prior processing). EU/UK users may lodge a complaint with their local
        supervisory authority; Korean users may complain to the <strong>Personal Information Protection
        Commission (PIPC)</strong> at <em>privacy.go.kr</em>. To exercise any right, email
        <a href="mailto:glowupinseoul@gmail.com" style={{ color: 'var(--accent)' }}> glowupinseoul@gmail.com</a> from
        the address you used with us — we reply within <strong>30 days</strong>.</p>

      <h2>9. Security</h2>
      <p>We use TLS in transit, AWS-managed encryption at rest, access controls limited to our concierge team,
        and a written incident-response procedure. If a breach affecting your information occurs, we will notify
        you and the relevant authority without undue delay, as required by PIPA and GDPR.</p>

      <h2>10. US state biometric laws</h2>
      <p>Some US states (notably Illinois, Texas, and Washington) have specific biometric-information
        statutes that impose additional requirements on services that process face data. If you reside in such
        a state and you have concerns about how those statutes apply, please contact us before using the scan
        feature — we will work with you to find an alternative path (such as the preference-form-only flow).</p>

      <h2>11. How to delete your data</h2>
      <p>Email <a href="mailto:glowupinseoul@gmail.com" style={{ color: 'var(--accent)' }}>glowupinseoul@gmail.com</a> with
        the subject "Erasure request" and include the session token shown at the bottom of your results page (if
        any). We confirm completion within 30 days. Legally required records (booking history, tax invoices)
        may be retained for the statutory minimum period.</p>

      <h2>12. Children</h2>
      <p>The Service is not directed to children under 16. We do not knowingly collect personal information from
        minors. If you believe a minor has provided information, contact us and we will delete it.</p>

      <h2>13. Korean PIPA notice (개인정보처리방침 요지)</h2>
      <p>본 서비스는 「개인정보 보호법」에 따라 외국인 환자 매칭 컨시어지 목적으로 다음 정보를 처리합니다.</p>
      <ul>
        <li><strong>개인정보처리자</strong>: Glow Up Seoul (보건복지부 등록 외국인환자유치업자).</li>
        <li><strong>수집 항목</strong>: 얼굴 이미지(스캔 동의 시), 시술 관련 선호 정보, 세션 토큰, 자유 텍스트 메모.</li>
        <li><strong>민감정보 · 생체정보</strong>: 얼굴 이미지 및 외모 관련 시술 선호 정보. 이용자의 <strong>별도 동의</strong>가 있는 경우에 한해 처리합니다.</li>
        <li><strong>처리 목적</strong>: AI 기반 시술 카테고리 추천, 컨시어지 매칭, 후속 상담 및 안전 사후관리.</li>
        <li><strong>보유 기간</strong>: 얼굴 이미지는 서버 저장 없이 즉시 폐기. 매칭 요청 텍스트는 최대 3년. 의료관광 알선 기록은 관련 법령에 따른 보존 기간.</li>
        <li><strong>제3자 제공 및 국외 이전</strong>: AI 분석을 위해 미국 OpenAI 서버로 얼굴 이미지 및 텍스트가 전송됩니다. 이용자 동의가 필요합니다.</li>
        <li><strong>이용자 권리</strong>: 열람·정정·삭제·처리정지 요청 및 동의 철회 가능. 문의: glowupinseoul@gmail.com.</li>
        <li><strong>분쟁 해결</strong>: 개인정보 분쟁조정위원회(1833-6972), 개인정보보호위원회(privacy.go.kr).</li>
      </ul>

      <h2>14. Changes to this policy</h2>
      <p>We may update this policy to reflect legal or service changes. Material changes will be highlighted on
        the site for at least 7 days before they take effect. The "Effective" date at the top reflects the
        latest version.</p>

      <p style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border-soft)', fontSize: 13, color: 'var(--text-soft)' }}>
        <em>This policy is provided for transparency. It does not waive any rights you may have under applicable
        law, and where applicable law is more protective than this policy, that law controls.</em>
      </p>
    </article>
  );
}

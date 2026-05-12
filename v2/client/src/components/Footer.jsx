import { navigate } from '../App.jsx';

export default function Footer() {
  return (
    <footer className="gs-footer">
      <div className="inner">
        <div className="row">
          <div>
            <strong style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 18, color: 'var(--text)' }}>
              Glow Up Seoul
            </strong>
            <div style={{ marginTop: 6 }}>Your Skin. Your <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'var(--accent)' }}>Story.</em> Seoul.</div>
            <div className="gs-footer-links">
              <button onClick={() => navigate('/services')}>Services</button>
              <button onClick={() => navigate('/how-it-works')}>How it works</button>
              <button onClick={() => navigate('/about')}>About</button>
              <button onClick={() => navigate('/faq')}>FAQ</button>
            </div>
          </div>
          <div>
            <div className="govt">Ministry of Health &amp; Welfare Registered<br />Foreign Patient Attraction Agency · Korea</div>
          </div>
        </div>
        <div className="row" style={{ paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
          <span>WhatsApp +82 10 6487 1060 · glowupinseoul@gmail.com · 24h reply SLA</span>
          <span>© 2026 Glow Up Seoul · v2 preview</span>
        </div>
      </div>
    </footer>
  );
}

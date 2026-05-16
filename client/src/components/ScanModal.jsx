import { useEffect, useState } from 'react';
import FaceScanner from './FaceScanner.jsx';
import PreferenceForm from './PreferenceForm.jsx';
import BiometricConsentStage, { hasValidConsent } from './BiometricConsentStage.jsx';
import db from '../data/db.js';

export default function ScanModal({ open, onClose, onSubmit }) {
  // 'consent' → 'scan' → 'form'. We may skip 'consent' if it was already
  // given earlier in this tab session, and we may skip 'scan' if the user
  // declined the biometric processing.
  const [step, setStep] = useState('consent');
  const [snapshot, setSnapshot] = useState(null);
  const [ai, setAi] = useState(null);
  const [scanDeclined, setScanDeclined] = useState(false);

  useEffect(() => {
    if (open) {
      setSnapshot(null);
      setAi(null);
      setScanDeclined(false);
      setStep(hasValidConsent() ? 'scan' : 'consent');
    }
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  function onConsentAccept() { setStep('scan'); }
  function onConsentDecline() {
    // User opted out of biometric processing — skip the scan entirely and
    // jump straight to the preference form. No image is captured.
    setScanDeclined(true);
    setSnapshot(null);
    setAi(null);
    setStep('form');
  }
  function onScanComplete(payload) {
    setSnapshot(payload?.snapshot || null);
    setAi(payload?.ai || null);
    setStep('form');
  }
  function onSkip() { setSnapshot(null); setAi(null); setStep('form'); }
  function onPrefs(prefs) { onSubmit?.({ snapshot, ai, prefs }); }

  // Resolve AI concern slugs → concern_ids the form can pre-check
  const aiConcernIds = (ai?.concerns || [])
    .map((slug) => db.concernBySlug[slug]?.id)
    .filter(Boolean);

  return (
    <div className="gs-modal-shell" role="dialog" aria-modal="true">
      <div className="gs-modal-card">
        <button className="gs-modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="gs-modal-steps">
          <span className={step === 'consent' ? 'active' : ''}>01 · Consent</span>
          <span className={step === 'scan' ? 'active' : ''}>02 · Scan</span>
          <span className={step === 'form' ? 'active' : ''}>03 · Your Story</span>
          <span>04 · Match</span>
        </div>

        {step === 'consent' && (
          <BiometricConsentStage onAccept={onConsentAccept} onDecline={onConsentDecline} />
        )}

        {step === 'scan' && <FaceScanner onComplete={onScanComplete} onSkip={onSkip} />}

        {step === 'form' && (
          <div className="gs-form-stage">
            {scanDeclined && (
              <div className="gs-ai-banner" style={{ background: 'var(--bg-soft)' }}>
                <div className="gs-ai-banner-icon">◇</div>
                <div className="gs-ai-banner-body">
                  <div className="eyebrow">✦ Scan skipped</div>
                  <h4>We'll work from your preferences alone.</h4>
                  <p>No problem — your concierge will rely on the form below. You can request a scan
                  later by re-opening this modal.</p>
                </div>
              </div>
            )}
            {snapshot && (
              <div className="gs-snapshot-preview">
                <img src={snapshot} alt="Your scan" />
                <div>
                  <div className="gs-eyebrow">Your Scan</div>
                  <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-soft)' }}>
                    Analysis complete. Now tell us your <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'var(--accent)' }}>Story.</em>
                  </p>
                </div>
              </div>
            )}

            {ai && (
              <div className="gs-ai-banner">
                <div className="gs-ai-banner-icon">R</div>
                <div className="gs-ai-banner-body">
                  <div className="eyebrow">✦ Romie's read</div>
                  <h4>{ai.narrative || 'Analysis complete.'}</h4>
                  {ai.concerns?.length > 0 && (
                    <p>We pre-selected <strong>{ai.concerns.length}</strong> concern{ai.concerns.length > 1 ? 's' : ''} below based on your scan — feel free to override.</p>
                  )}
                  {ai.metrics && (
                    <div className="gs-ai-banner-metrics">
                      <div>Skin clarity <strong>{ai.metrics.skin_clarity}</strong></div>
                      <div>Tone evenness <strong>{ai.metrics.tone_evenness}</strong></div>
                      <div>Symmetry <strong>{ai.metrics.symmetry}</strong></div>
                      <div>Under-eye <strong>{ai.metrics.under_eye_darkness}</strong></div>
                      <div>Jawline def. <strong>{ai.metrics.jawline_definition}</strong></div>
                      <div>Youthful vol. <strong>{ai.metrics.youthful_volume}</strong></div>
                    </div>
                  )}
                  <p className="gs-ai-banner-disclaimer">
                    ◇ Aesthetic-preference signals only. <strong>Not a medical diagnosis.</strong> Final treatment
                    decisions require an in-person consultation with a licensed physician.
                  </p>
                  {ai._mock && (
                    <p style={{ marginTop: 8, fontSize: 11, color: 'var(--rose)' }}>
                      ⚠ mock response — set OPENAI_API_KEY in server/.env for real analysis.
                    </p>
                  )}
                </div>
              </div>
            )}

            <PreferenceForm onSubmit={onPrefs} preselectedConcernIds={aiConcernIds} />
          </div>
        )}
      </div>
    </div>
  );
}

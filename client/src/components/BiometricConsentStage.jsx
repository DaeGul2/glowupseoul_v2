import { useState } from 'react';

// Single-line consent gate — bundles the three legal asks (biometric processing,
// cross-border transfer, medical-disclaimer acknowledgement) into one checkbox.
// The details are linkable via /privacy + /terms and the collapsible panel below.
//
// Storage: sessionStorage 'gs_biometric_consent' = ISO timestamp on acceptance.

export const CONSENT_KEY = 'gs_biometric_consent';

export function hasValidConsent() {
  if (typeof window === 'undefined') return false;
  try { return Boolean(sessionStorage.getItem(CONSENT_KEY)); } catch { return false; }
}

export function recordConsent(detail) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CONSENT_KEY, JSON.stringify({
      at: new Date().toISOString(),
      ...detail,
    }));
  } catch {}
}

export default function BiometricConsentStage({ onAccept, onDecline }) {
  const [agreed, setAgreed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  function accept() {
    if (!agreed) return;
    recordConsent({ unified: true, version: '2026-05-14-b' });
    onAccept?.();
  }

  return (
    <div className="gs-consent-stage">
      <div className="gs-eyebrow" style={{ marginBottom: 8 }}>◇ Before we begin</div>
      <h2 className="gs-consent-heading">
        Quick <em>heads-up</em>{' '}
        <span style={{ color: 'var(--text-muted)' }}>about your photo.</span>
      </h2>
      <p className="gs-consent-lede">
        The optional scan analyzes a selfie to suggest cosmetic preference categories. We don't store the
        photo — only the resulting text summary. It's <strong>not a medical diagnosis</strong>; a licensed
        physician makes the final call.
      </p>

      <label className={`gs-consent-row gs-consent-row--single ${agreed ? 'checked' : ''}`}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <div>
          <div className="gs-consent-row-title">
            I agree to my photo being processed for an AI cosmetic-preference summary, and I understand this
            isn't medical advice.
          </div>
          <div className="gs-consent-row-sub">
            See our <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and{' '}
            <a href="/terms" target="_blank" rel="noreferrer">Terms</a> for the full version.
          </div>
        </div>
      </label>

      <button
        type="button"
        className="gs-consent-details-toggle"
        onClick={() => setShowDetails((v) => !v)}
        aria-expanded={showDetails}
      >
        {showDetails ? '− Hide details' : '+ How is my photo used?'}
      </button>

      {showDetails && (
        <div className="gs-consent-flow">
          <div className="gs-consent-flow-step">
            <div className="gs-consent-flow-num">1</div>
            <div className="gs-consent-flow-body">
              <strong>Capture</strong>
              <span>720p selfie in your browser — we never save the raw image on our server.</span>
            </div>
          </div>
          <div className="gs-consent-flow-arrow">→</div>
          <div className="gs-consent-flow-step">
            <div className="gs-consent-flow-num">2</div>
            <div className="gs-consent-flow-body">
              <strong>AI processing</strong>
              <span>Image goes to OpenAI's API to generate a text summary, then is discarded.</span>
            </div>
          </div>
          <div className="gs-consent-flow-arrow">→</div>
          <div className="gs-consent-flow-step">
            <div className="gs-consent-flow-num">3</div>
            <div className="gs-consent-flow-body">
              <strong>Text saved</strong>
              <span>Concerns, regions, narrative — kept up to 3 years. The image itself is <em>never</em> saved.</span>
            </div>
          </div>
        </div>
      )}

      <div className="gs-consent-actions">
        <button className="gs-cta" disabled={!agreed} onClick={accept}>
          Start my scan →
        </button>
        <button className="gs-cta gs-cta--outline" onClick={onDecline}>
          Skip — just use the form
        </button>
      </div>
    </div>
  );
}

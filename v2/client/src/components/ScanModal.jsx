import { useEffect, useState } from 'react';
import FaceScanner from './FaceScanner.jsx';
import PreferenceForm from './PreferenceForm.jsx';
import db from '../data/db.js';

export default function ScanModal({ open, onClose, onSubmit }) {
  const [step, setStep] = useState('scan');
  const [snapshot, setSnapshot] = useState(null);
  const [ai, setAi] = useState(null);

  useEffect(() => {
    if (open) { setStep('scan'); setSnapshot(null); setAi(null); }
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

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
          <span className={step === 'scan' ? 'active' : ''}>01 · Scan</span>
          <span className={step === 'form' ? 'active' : ''}>02 · Your Story</span>
          <span>03 · Match</span>
        </div>

        {step === 'scan' && <FaceScanner onComplete={onScanComplete} onSkip={onSkip} />}

        {step === 'form' && (
          <div className="gs-form-stage">
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

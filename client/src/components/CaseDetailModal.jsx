import { useEffect, useState } from 'react';
import { navigate } from '../App.jsx';
import { openWhatsApp } from './WhatsAppCTA.jsx';
import { buildCaseMessage } from '../utils/caseMessage.js';

const FLAGS = {
  SG: '🇸🇬', CN: '🇨🇳', JP: '🇯🇵', US: '🇺🇸', VN: '🇻🇳', TH: '🇹🇭',
  ID: '🇮🇩', AE: '🇦🇪', KR: '🇰🇷', AU: '🇦🇺', HK: '🇭🇰', TW: '🇹🇼',
};
const LANG_FLAGS = { en: '🇬🇧', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', vi: '🇻🇳', th: '🇹🇭', id: '🇮🇩', ru: '🇷🇺', ar: '🇸🇦' };
const PAIN_LABELS = ['—', 'Very low', 'Low', 'Moderate', 'High', 'Very high'];

function fmtKRW(n) { return n == null ? '—' : `₩${n.toLocaleString()}`; }
function ageLabel(iso) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const OUTCOME_TONES = {
  matched:   { label: 'Matched',   tone: 'gold' },
  quoted:    { label: 'Quoted',    tone: 'rose' },
  consulted: { label: 'Consulted', tone: 'neutral' },
  booked:    { label: 'Booked',    tone: 'success' },
  completed: { label: 'Completed', tone: 'success' },
};

export default function CaseDetailModal({ entry, open, onClose }) {
  const [previewLang, setPreviewLang] = useState(null); // null | 'en' | 'zh'

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => { if (!open) setPreviewLang(null); }, [open]);

  if (!open || !entry) return null;

  function sendInquiry(lang) {
    const msg = buildCaseMessage({ entry, lang });
    openWhatsApp(msg);
  }
  function copyInquiry(lang) {
    const msg = buildCaseMessage({ entry, lang });
    if (navigator.clipboard) navigator.clipboard.writeText(msg);
  }

  const c = entry.case || {};
  const prefs = c.prefs || {};
  const ai = c.ai_scan;
  const synth = c.synth;
  const top = c.top_match;
  const tag = OUTCOME_TONES[entry.outcome] || OUTCOME_TONES.matched;
  const flag = FLAGS[entry.country_code] || '🌐';
  const langFlag = LANG_FLAGS[prefs.language] || '';
  const metricLabel = { skin_clarity: 'Skin clarity', tone_evenness: 'Tone evenness', under_eye_darkness: 'Under-eye', jawline_definition: 'Jawline def.', symmetry: 'Symmetry', youthful_volume: 'Volume' };

  return (
    <div className="gs-case-shell" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="gs-case-card" onClick={(e) => e.stopPropagation()}>
        <button className="gs-modal-close" onClick={onClose} aria-label="Close">×</button>

        {/* === HEADER === */}
        <header className="gs-case-head">
          <div className="gs-case-head-l">
            <div className="gs-case-avatar">{entry.display_initial}</div>
            <div>
              <div className="gs-case-id-line">
                <span className="flag">{flag}</span>
                <strong>{entry.display_initial}</strong>
                <span>·  {entry.country_label_en}</span>
              </div>
              <div className="gs-case-age">{ageLabel(entry.displayed_at)} · anonymous case study</div>
            </div>
          </div>
          <div className={`gs-case-outcome gs-recent-tag--${tag.tone}`}>{tag.label}</div>
        </header>

        {/* === SECTION 1 — WHAT THEY ASKED FOR === */}
        <section className="gs-case-section">
          <div className="gs-case-section-head">
            <div className="gs-eyebrow">◈  01 · What they wanted</div>
            <h3>The brief, <em>verbatim.</em></h3>
          </div>
          <div className="gs-case-brief">
            <div className="gs-case-brief-row">
              <div className="gs-case-brief-label">Concerns</div>
              <div className="gs-case-brief-val">
                {(entry.concern_labels_en || '').split(' · ').map((c) => (
                  <span key={c} className="gs-case-chip">{c}</span>
                ))}
              </div>
            </div>
            <div className="gs-case-brief-grid">
              <div>
                <div className="gs-case-brief-label">Budget</div>
                <div className="gs-case-brief-num">{prefs.budget_label || '—'}</div>
              </div>
              <div>
                <div className="gs-case-brief-label">Max downtime</div>
                <div className="gs-case-brief-num">{prefs.downtime_max != null ? `${prefs.downtime_max}d` : '—'}</div>
              </div>
              <div>
                <div className="gs-case-brief-label">Pain tolerance</div>
                <div className="gs-case-brief-num">{PAIN_LABELS[prefs.pain_max || 0]}</div>
              </div>
              <div>
                <div className="gs-case-brief-label">Style</div>
                <div className="gs-case-brief-num">{prefs.style_label || '—'}{prefs.style_target ? ` · ${prefs.style_target}/5` : ''}</div>
              </div>
              <div>
                <div className="gs-case-brief-label">Language</div>
                <div className="gs-case-brief-num">{langFlag} {(prefs.language || '—').toUpperCase()}</div>
              </div>
            </div>
            {prefs.notes && (
              <div className="gs-case-brief-row">
                <div className="gs-case-brief-label">Notes</div>
                <blockquote className="gs-case-notes">"{prefs.notes}"</blockquote>
              </div>
            )}
          </div>
        </section>

        {/* === SECTION 2 — AI SCAN === */}
        <section className="gs-case-section gs-case-section--dark">
          <div className="gs-case-section-head">
            <div className="gs-eyebrow" style={{ color: 'var(--gold-light)' }}>✦  02 · What our AI saw</div>
            <h3 style={{ color: '#fff' }}>The <em>scan,</em> in their words.</h3>
          </div>
          {ai ? (
            <>
              <blockquote className="gs-case-ai-quote">"{ai.narrative}"</blockquote>
              <div className="gs-case-ai-confidence">Confidence <strong>{ai.confidence}</strong></div>
              {ai.metrics && (
                <div className="gs-case-metrics">
                  {Object.entries(ai.metrics).map(([k, v]) => (
                    <div key={k} className="gs-case-metric">
                      <div className="gs-case-metric-label">{metricLabel[k] || k}</div>
                      <div className="gs-case-metric-num">{v}</div>
                      <div className="gs-case-metric-bar"><div style={{ width: `${v}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
              {ai.regions?.length > 0 && (
                <div className="gs-case-regions">
                  {ai.regions.map((r) => (
                    <div key={r.label} className="gs-case-region">
                      <div className="gs-case-region-label">{r.label.replace('_', ' ')}</div>
                      <div className="gs-case-region-note">{r.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="gs-case-noai">
              <em>This patient skipped the AI face scan</em> — we worked from their stated preferences alone.
            </div>
          )}
        </section>

        {/* === SECTION 3 — ROMIE'S RECOMMENDATION === */}
        <section className="gs-case-section">
          <div className="gs-case-section-head">
            <div className="gs-eyebrow">◇  03 · What Romie recommended</div>
            <h3>The <em>match.</em></h3>
          </div>
          {synth?.overall && (
            <blockquote className="gs-case-synth-quote">"{synth.overall}"</blockquote>
          )}
          {top && (
            <article className="gs-case-match">
              <div className="gs-case-match-l">
                <div className="gs-eyebrow">Top match</div>
                <h4 className="gs-case-match-name">{top.procedure_name_en}</h4>
                <div className="gs-case-match-hospital">at {top.hospital_name_en}</div>
                {top.device_brands?.length > 0 && (
                  <div className="gs-case-match-device">Device · {top.device_brands.join(' · ')}</div>
                )}
                {synth?.rationale && (
                  <div className="gs-case-match-rationale">
                    <span className="gs-eyebrow">Why this fit</span>
                    <p>{synth.rationale}</p>
                  </div>
                )}
                {entry.treatment_slug && (
                  <button className="gs-case-match-link" onClick={() => { onClose?.(); navigate(`/treatment/${entry.treatment_slug}`); }}>
                    See full treatment page →
                  </button>
                )}
              </div>
              <div className="gs-case-match-r">
                <div className="gs-eyebrow">From</div>
                <div className="gs-case-match-price">{fmtKRW(top.price_krw)}</div>
                {top.discount_pct > 0 && (
                  <div className="gs-case-match-orig">
                    {fmtKRW(top.original_price_krw)} · −{top.discount_pct}%
                  </div>
                )}
                {entry.outcome_note_en && <div className="gs-case-match-outcome">{entry.outcome_note_en}</div>}
              </div>
            </article>
          )}
          {synth?.closing && (
            <p className="gs-case-closing">{synth.closing}</p>
          )}

          <div className="gs-med-disclaimer" style={{ margin: '24px 0 0' }} role="note" aria-label="Medical disclaimer">
            <div className="gs-med-disclaimer-icon" aria-hidden="true">✦</div>
            <div className="gs-med-disclaimer-body">
              <div className="gs-med-disclaimer-title">Not medical advice.</div>
              Glow Up Seoul is a foreign-patient concierge, <strong>not a medical provider</strong>. The match and
              rationale above reflect aesthetic preference categories and are <strong>not a diagnosis or
              prescription</strong>. Final treatment decisions require an in-person consultation with a licensed
              physician at the chosen clinic.
            </div>
          </div>
        </section>

        {/* === INQUIRY ACTIONS — send THIS case to WhatsApp === */}
        <footer className="gs-case-foot">
          <div className="gs-case-foot-head">
            <div className="gs-eyebrow">✦  Inquire with this exact case</div>
            <h4>Send the scan, brief &amp; AI read <em>verbatim.</em></h4>
            <p>
              Tap a language — your WhatsApp opens with the full case pre-filled in 5 clean sections.
              The consultant reads it in 10 seconds and replies with availability.
            </p>
          </div>

          <div className="gs-case-inquiry-actions">
            <button className="gs-case-inquiry-btn" onClick={() => sendInquiry('en')}>
              <span className="gs-case-inquiry-flag">🇬🇧</span>
              <span className="gs-case-inquiry-text">
                <span className="gs-case-inquiry-label">Send to WhatsApp</span>
                <span className="gs-case-inquiry-sub">English version</span>
              </span>
              <span className="gs-case-inquiry-arrow">→</span>
            </button>
            <button className="gs-case-inquiry-btn" onClick={() => sendInquiry('zh')}>
              <span className="gs-case-inquiry-flag">🇨🇳</span>
              <span className="gs-case-inquiry-text">
                <span className="gs-case-inquiry-label">发送到 WhatsApp</span>
                <span className="gs-case-inquiry-sub">中文版本</span>
              </span>
              <span className="gs-case-inquiry-arrow">→</span>
            </button>
          </div>

          <div className="gs-case-inquiry-tools">
            <button className="gs-case-inquiry-tool" onClick={() => setPreviewLang(previewLang === 'en' ? null : 'en')}>
              {previewLang === 'en' ? 'Hide preview' : 'Preview EN message ↓'}
            </button>
            <button className="gs-case-inquiry-tool" onClick={() => setPreviewLang(previewLang === 'zh' ? null : 'zh')}>
              {previewLang === 'zh' ? 'Hide preview' : 'Preview 中文 message ↓'}
            </button>
            {previewLang && (
              <button className="gs-case-inquiry-tool" onClick={() => copyInquiry(previewLang)}>
                Copy to clipboard ⧉
              </button>
            )}
          </div>

          {previewLang && (
            <pre className="gs-case-inquiry-preview">{buildCaseMessage({ entry, lang: previewLang })}</pre>
          )}
        </footer>

        <div className="gs-case-disclaimer">
          ✦ Shared with the patient's explicit opt-in. Initial · country · selections · AI text only — never full name, photo, or contact.
        </div>
      </div>
    </div>
  );
}

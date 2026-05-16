import { useEffect, useState } from 'react';
import db from '../data/db.js';
import { useScanFlow } from '../App.jsx';
import CaseDetailModal from './CaseDetailModal.jsx';

const FLAGS = {
  SG: '🇸🇬', CN: '🇨🇳', JP: '🇯🇵', US: '🇺🇸', VN: '🇻🇳', TH: '🇹🇭',
  ID: '🇮🇩', AE: '🇦🇪', KR: '🇰🇷', AU: '🇦🇺', HK: '🇭🇰', TW: '🇹🇼',
  MY: '🇲🇾', PH: '🇵🇭', IN: '🇮🇳', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
};

function ageLabel(iso) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const OUTCOME_TAGS = {
  matched:    { label: 'matched',   tone: 'gold' },
  quoted:     { label: 'quoted',    tone: 'rose' },
  consulted:  { label: 'consulted', tone: 'neutral' },
  booked:     { label: 'booked',    tone: 'success' },
  completed:  { label: 'completed', tone: 'success' },
};

export default function RecentMatches() {
  const flow = useScanFlow();
  const [entries, setEntries] = useState(() => db.getRecentMatches(6));
  const [openEntry, setOpenEntry] = useState(null);

  useEffect(() => {
    const unsub = db.subscribeFeed(() => setEntries(db.getRecentMatches(6)));
    return unsub;
  }, []);

  useEffect(() => {
    const t = setInterval(() => setEntries(db.getRecentMatches(6)), 60_000);
    return () => clearInterval(t);
  }, []);

  // Hide the whole section when there are no real entries — we never want to
  // show "Live · recently matched" with an empty grid.
  if (!entries || entries.length === 0) return null;

  return (
    <section className="gs-recent">
      <div className="gs-recent-head">
        <div className="gs-mark"><strong>02</strong> / Live · Recently matched</div>
        <h2>Real <em>journeys,</em><br />right now.</h2>
        <p>
          With patient consent, we share — anonymously — who came in for what, the AI scan they got, and what Romie matched them with.
          <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}> Tap any card to read the full case.</em>
        </p>
      </div>

      <div className="gs-recent-grid">
        {entries.map((e) => {
          const tag = OUTCOME_TAGS[e.outcome] || OUTCOME_TAGS.matched;
          const flag = FLAGS[e.country_code] || '🌐';
          const fresh = e.source_type === 'inquiry';
          const hasCase = Boolean(e.case);
          return (
            <article
              key={e.id}
              className={`gs-recent-card ${fresh ? 'gs-recent-card--fresh' : ''}`}
              onClick={() => hasCase && setOpenEntry(e)}
            >
              <header className="gs-recent-card-head">
                <div className="gs-recent-avatar">{e.display_initial}</div>
                <div className="gs-recent-id">
                  <div className="gs-recent-from">
                    <span className="flag">{flag}</span>
                    <span>{e.country_label_en}</span>
                  </div>
                  <div className="gs-recent-age">{ageLabel(e.displayed_at)}{fresh ? ' · you' : ''}</div>
                </div>
                <span className={`gs-recent-tag gs-recent-tag--${tag.tone}`}>{tag.label}</span>
              </header>

              <div className="gs-recent-concerns">
                <span className="gs-recent-label">Wanted</span>
                <div>{e.concern_labels_en || '—'}</div>
              </div>

              <div className="gs-recent-arrow">↓</div>

              <div className="gs-recent-rec">
                <span className="gs-recent-label">Matched with</span>
                <div className="gs-recent-rec-name">{e.treatment_label_en}</div>
                {e.hospital_label_en && (
                  <div className="gs-recent-rec-clinic-static">at {e.hospital_label_en}</div>
                )}
              </div>

              {hasCase && (
                <button
                  className="gs-recent-detail-btn"
                  onClick={(ev) => { ev.stopPropagation(); setOpenEntry(e); }}
                >
                  View full case →
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div className="gs-recent-foot">
        <button className="gs-cta gs-cta--lg" onClick={flow?.openScan}>
          <span>✦ Start your own scan</span><span className="gs-cta-tail">→</span>
        </button>
        <span className="gs-recent-foot-note">
          You decide whether to appear here. Opt-in is one checkbox at the end of the form, never auto-on.
        </span>
      </div>

      <CaseDetailModal
        entry={openEntry}
        open={Boolean(openEntry)}
        onClose={() => setOpenEntry(null)}
      />
    </section>
  );
}

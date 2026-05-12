import { useEffect, useState } from 'react';
import db from '../data/db.js';

function ageLabel(iso) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h/24)}d ago`;
}

export default function PublicFeedTicker() {
  const [entries, setEntries] = useState(() => db.getRecentMatches(20));
  const [i, setI] = useState(0);

  // Live subscribe — newly added entries (from completed scans) bump the rotation.
  useEffect(() => {
    const unsub = db.subscribeFeed(() => {
      setEntries(db.getRecentMatches(20));
      setI(0); // jump to the freshest entry
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (entries.length === 0) return;
    const t = setInterval(() => setI((x) => (x + 1) % entries.length), 4500);
    return () => clearInterval(t);
  }, [entries.length]);

  if (entries.length === 0) return null;
  const e = entries[i];

  return (
    <div className="gs-ticker" aria-live="polite">
      <span className="sym">◇</span>
      <span>{e.display_initial} in {e.country_label_en} — consultation for </span>
      <em>{e.treatment_label_en}</em>
      <span className="age">· {ageLabel(e.displayed_at)}</span>
      {e.outcome_note_en && <span className="age">· {e.outcome_note_en}</span>}
    </div>
  );
}

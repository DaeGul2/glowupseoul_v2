import { useState } from 'react';
import db from '../data/db.js';

const STYLE_LABELS = ['Subtle', 'Soft', 'Balanced', 'Bold', 'Dramatic'];
const PAIN_LABELS = ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'];

// Tier presets matching schema budget_tier
const BUDGET_TIERS = [
  { key: 'under_300',  max: 300_000,    label: 'Under ₩300k',  hint: '$' },
  { key: '300_800',    max: 800_000,    label: '₩300k – ₩800k', hint: '$$' },
  { key: '800_2000',   max: 2_000_000,  label: '₩800k – ₩2M',   hint: '$$$' },
  { key: '2000_5000',  max: 5_000_000,  label: '₩2M – ₩5M',     hint: '$$$' },
  { key: 'over_5000',  max: 30_000_000, label: 'Over ₩5M',      hint: '$$$$' },
];

export default function PreferenceForm({ onSubmit, preselectedConcernIds = [] }) {
  const [concernIds, setConcernIds] = useState(preselectedConcernIds);
  const [budgetTier, setBudgetTier] = useState('800_2000');
  const [downtimeMax, setDowntimeMax] = useState(3);
  const [painMax, setPainMax] = useState(3);
  const [styleTarget, setStyleTarget] = useState(2);
  const [language, setLanguage] = useState('en');
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [feedConsent, setFeedConsent] = useState(false);
  const [devicePrefSlugs, setDevicePrefSlugs] = useState([]);

  // Device chip list: feature iconic / k-favorite devices first, then the
  // rest. Empty array if devices haven't hydrated yet (degrades gracefully).
  const devicePool = (db.devices || []).slice().sort((a, b) => {
    const rank = (badge) => badge === 'iconic' ? 0 : badge === 'k-favorite' ? 1 : badge === 'premium' ? 2 : 3;
    const r = rank(a.badge) - rank(b.badge);
    if (r !== 0) return r;
    return (a.display_order || 999) - (b.display_order || 999);
  });

  // Concern chips grouped by category (shared with procedure_categories).
  // Concerns without category_id fall into "(Other)" group at the end.
  const concernGroups = (() => {
    const cats = (db.procedureCategories || []).slice().sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
    const byCat = new Map();
    for (const c of db.concerns || []) {
      const key = c.category_id ?? '_other';
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key).push(c);
    }
    const out = [];
    for (const cat of cats) {
      const list = byCat.get(cat.id);
      if (list?.length) out.push({ category: cat, concerns: list });
      byCat.delete(cat.id);
    }
    if (byCat.has('_other')) {
      out.push({ category: { id: '_other', name_ko: '기타', name_en: 'Other' }, concerns: byCat.get('_other') });
    }
    return out;
  })();

  function toggle(id) {
    setConcernIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function toggleDevice(slug) {
    setDevicePrefSlugs((prev) => prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug]);
  }

  function submit() {
    const tier = BUDGET_TIERS.find((b) => b.key === budgetTier);
    onSubmit({
      concernIds,
      budget_tier: budgetTier,
      budgetMax: tier.max,
      downtimeMax,
      painMax,
      styleTarget,
      language,
      tripStart: tripStart || null,
      tripEnd: tripEnd || null,
      notes,
      feedConsent,
      devicePrefSlugs,
    });
  }

  return (
    <div className="gs-pref-form">
      <div className="gs-form-row">
        <label className="gs-form-label"><span>✦</span> Concerns</label>
        {concernGroups.length > 1 ? (
          <div className="gs-chip-groups">
            {concernGroups.map((g) => (
              <div className="gs-chip-group" key={g.category.id}>
                <div className="gs-chip-group-head">
                  <span className="gs-chip-group-en">{g.category.name_en || g.category.name_ko}</span>
                  <span className="gs-chip-group-ko">· {g.category.name_ko}</span>
                </div>
                <div className="gs-chips">
                  {g.concerns.map((c) => (
                    <button key={c.id} type="button"
                      className={`gs-chip ${concernIds.includes(c.id) ? 'active' : ''}`}
                      onClick={() => toggle(c.id)}>
                      {c.name_ko} <span style={{ opacity: 0.55 }}>· {c.name_en}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Fallback — no category data (e.g., before hydrate): flat chip list.
          <div className="gs-chips">
            {db.concerns.map((c) => (
              <button key={c.id} type="button"
                className={`gs-chip ${concernIds.includes(c.id) ? 'active' : ''}`}
                onClick={() => toggle(c.id)}>
                {c.name_ko} <span style={{ opacity: 0.55 }}>· {c.name_en}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="gs-form-row">
        <label className="gs-form-label"><span>◈</span> Budget</label>
        <div className="gs-chips">
          {BUDGET_TIERS.map((b) => (
            <button key={b.key} type="button"
              className={`gs-chip ${budgetTier === b.key ? 'active' : ''}`}
              onClick={() => setBudgetTier(b.key)}>
              {b.label} <span style={{ opacity: 0.55 }}>· {b.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="gs-form-row gs-form-row--split">
        <div>
          <label className="gs-form-label"><span>◇</span> Max Downtime</label>
          <div className="gs-range">
            <div className="gs-range-val">{downtimeMax === 0 ? 'No downtime' : `Up to ${downtimeMax} days`}</div>
            <input type="range" min="0" max="21" value={downtimeMax} onChange={(e) => setDowntimeMax(+e.target.value)} />
            <div className="gs-range-axis"><span>0d</span><span>21d</span></div>
          </div>
        </div>
        <div>
          <label className="gs-form-label"><span>⬡</span> Pain Tolerance</label>
          <div className="gs-range">
            <div className="gs-range-val">{PAIN_LABELS[painMax]}</div>
            <input type="range" min="1" max="5" value={painMax} onChange={(e) => setPainMax(+e.target.value)} />
            <div className="gs-range-axis"><span>Low</span><span>High</span></div>
          </div>
        </div>
      </div>

      <div className="gs-form-row">
        <label className="gs-form-label"><span>☽</span> Preferred Style</label>
        <div className="gs-range">
          <div className="gs-range-val">{STYLE_LABELS[styleTarget - 1]}</div>
          <input type="range" min="1" max="5" value={styleTarget} onChange={(e) => setStyleTarget(+e.target.value)} />
          <div className="gs-range-axis"><span>Subtle</span><span>Dramatic</span></div>
        </div>
      </div>

      <div className="gs-form-row gs-form-row--split">
        <div>
          <label className="gs-form-label"><span>◎</span> Language Preference</label>
          <select className="gs-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">🇬🇧 English</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="ja">🇯🇵 日本語</option>
            <option value="ko">🇰🇷 한국어</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="vi">🇻🇳 Tiếng Việt</option>
          </select>
        </div>
        <div>
          <label className="gs-form-label"><span>✈</span> Trip dates (optional)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="gs-input" type="date" value={tripStart} onChange={(e) => setTripStart(e.target.value)} />
            <input className="gs-input" type="date" value={tripEnd} onChange={(e) => setTripEnd(e.target.value)} />
          </div>
        </div>
      </div>

      {devicePool.length > 0 && (
        <div className="gs-form-row">
          <label className="gs-form-label">
            <span>⬡</span> Preferred device <span style={{ opacity: 0.55, fontWeight: 400 }}>(optional — boosts clinics that actually use it)</span>
          </label>
          <div className="gs-chips">
            {devicePool.map((d) => (
              <button key={d.slug} type="button"
                className={`gs-chip ${devicePrefSlugs.includes(d.slug) ? 'active' : ''}`}
                onClick={() => toggleDevice(d.slug)}>
                {d.name_en || d.name_ko}
                {d.name_ko && d.name_en && <span style={{ opacity: 0.55 }}> · {d.name_ko}</span>}
                {d.badge && <span style={{ opacity: 0.45, marginLeft: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>{d.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="gs-form-row">
        <label className="gs-form-label"><span>✦</span> Anything else?</label>
        <textarea className="gs-textarea" rows={3} placeholder="e.g., wedding in a month, looking for fast-recovery treatments"
          value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <label className="gs-consent">
        <input type="checkbox" checked={feedConsent} onChange={(e) => setFeedConsent(e.target.checked)} />
        <span><em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>Help others —</em> share my consultation anonymously on the home page (initial + country + treatment only).</span>
      </label>

      <div className="gs-form-cta">
        <button className="gs-cta" disabled={concernIds.length === 0} onClick={submit}>
          Find my match →
        </button>
        {concernIds.length === 0 && <div className="gs-hint">Pick at least one concern to continue.</div>}
      </div>
    </div>
  );
}

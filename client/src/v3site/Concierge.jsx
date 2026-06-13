// Concierge — a real conversational chat, fully DB-driven.
// The questionnaire (areas + concerns) and the final recommendation (treatments
// / surgeries matched by concern) all come from /api/v3/catalog. Nothing about
// the catalog is hardcoded here — only the surgical/non-surgical axis (which
// mirrors the two tables) and conversational copy.
import { useState, useEffect, useRef } from 'react';
import WaIcon from './WaIcon.jsx';
import ScanOverlay from './ScanOverlay.jsx';

const WA = '821064871060';

// depth1 axis (mirrors treatments vs surgeries tables) — not catalog content.
const PATHS = [
  { key: 'glow',    track: 'non_surgical', emoji: '✦', label: 'A quiet glow-up', sub: 'Skin · lifting · glow — no surgery' },
  { key: 'change',  track: 'surgical',     emoji: '◈', label: 'A real change',   sub: 'Eyes · nose · contour — surgery' },
  { key: 'explore', track: 'both',         emoji: '◇', label: 'Just exploring',  sub: 'Not sure yet — show me' },
];
const PATH_LABEL = { glow: 'a non-surgical glow-up', change: 'surgery', explore: 'exploring my options' };
const PATH_ACK = {
  glow: 'A glow-up — lovely choice.',
  change: 'A real change it is — we\'ll take good care of you.',
  explore: 'Let\'s explore together.',
};

export default function Concierge() {
  const [cat, setCat] = useState(null);          // { areas, concerns, treatments, surgeries }
  const [catErr, setCatErr] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [stage, setStage] = useState('await');   // await | path | area | concern | done
  const [typing, setTyping] = useState(false);
  const [path, setPath] = useState(null);
  const [areaIds, setAreaIds] = useState([]);
  const [concernIds, setConcernIds] = useState([]);
  const [recs, setRecs] = useState([]);
  const [scanOpen, setScanOpen] = useState(false);
  const bodyRef = useRef(null);
  const timers = useRef([]);

  // load the catalog (DB), then greet
  useEffect(() => {
    let alive = true;
    setTyping(true);
    fetch('/api/v3/catalog')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('catalog'))))
      .then((d) => { if (alive) setCat(d); })
      .catch(() => { if (alive) setCatErr(true); })
      .finally(() => {
        if (!alive) return;
        const t = setTimeout(() => {
          setTyping(false);
          setMsgs([
            { role: 'bot', text: "Hi — I'm Romie, your Seoul beauty concierge." },
            { role: 'bot', text: 'Want me to take a quick look first? Share a photo and I\'ll suggest where to start — or we can just talk.' },
          ]);
          setStage('intro');
        }, 700);
        timers.current.push(t);
      });
    return () => { alive = false; timers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing, stage]);

  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const userSay = (text) => setMsgs((m) => [...m, { role: 'user', text }]);
  function botReply(texts, nextStage, delay = 750) {
    setStage('await'); setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, ...texts.map((tx) => ({ role: 'bot', text: tx }))]);
      setStage(nextStage);
    }, delay);
    timers.current.push(t);
  }

  // ---- derived questionnaire (all from DB) ----
  const trackOf = path ? PATHS.find((p) => p.key === path).track : null;
  const areasForPath = cat
    ? cat.areas.filter((a) => (trackOf === 'both' ? true : a.track === trackOf || a.track === 'both'))
    : [];
  const allowedAreaIds = areaIds.length ? areaIds : areasForPath.map((a) => a.id);
  const concernsForAreas = cat ? cat.concerns.filter((c) => allowedAreaIds.includes(c.area_id)) : [];
  const areaName = (id) => cat?.areas.find((a) => a.id === id)?.name;
  const concernName = (id) => cat?.concerns.find((c) => c.id === id)?.name;
  // scan only fits the non-surgical / exploring tracks (a selfie can't read "I want a nose job")
  const showScan = Boolean(cat) && trackOf !== 'surgical';

  function skipIntro() {
    userSay("Let's just talk");
    botReply(['No problem. First, what brings you to Seoul?'], 'path');
  }

  // Called by ScanOverlay. Must REJECT on failure (overlay shows its error state);
  // on success it seeds the questionnaire and drops the user into the concern step.
  async function onScanCapture(snapshot) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30_000);
    let d;
    try {
      const r = await fetch('/api/v3/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot, area_ids: allowedAreaIds }),
        signal: ctrl.signal,
      });
      if (!r.ok) throw new Error(`scan ${r.status}`);
      d = await r.json();
    } finally {
      clearTimeout(to);
    }

    if (!path) setPath('glow');                          // scan implies the non-surgical track
    const ids = Array.isArray(d.concern_ids) ? d.concern_ids : [];
    setConcernIds((prev) => Array.from(new Set([...prev, ...ids])));
    userSay('📷 Shared a photo for a quick look');
    if (ids.length) {
      const names = ids.map(concernName).filter(Boolean).join(', ');
      setMsgs((m) => [
        ...m,
        { role: 'bot', text: d.narrative || `A gentle starting point: ${names}.` },
        { role: 'bot', text: `I've pre-selected ${names || 'a few areas'} below — add or remove anything, then see your matches.` },
      ]);
    } else {
      setMsgs((m) => [...m, {
        role: 'bot',
        text: d.narrative || "I couldn't read that one clearly — just tap what bothers you below and I'll match you.",
      }]);
    }
    setStage('concern');
  }

  function pickPath(p) {
    setPath(p.key); setAreaIds([]); setConcernIds([]);
    userSay(p.label);
    botReply([`${PATH_ACK[p.key]} Which area shall we focus on?`], 'area');
  }
  function confirmArea() {
    userSay(areaIds.length ? areaIds.map(areaName).join(', ') : "I'm not sure yet");
    botReply(["Got it. And what would you most love to improve?"], 'concern');
  }
  function confirmConcern() {
    userSay(concernIds.length ? concernIds.map(concernName).join(', ') : 'Not sure — guide me');
    const matched = matchRecs();
    setRecs(matched);
    const intro = matched.length
      ? `Based on what you told me, here's what I'd explore for you.`
      : `Thank you — all noted.`;
    botReply([intro, 'Shall I send your consultation request with these details?'], 'done');
  }
  function matchRecs() {
    if (!cat) return [];
    const pool = trackOf === 'surgical' ? cat.surgeries
      : trackOf === 'non_surgical' ? cat.treatments
      : [...cat.treatments, ...cat.surgeries];
    const sel = new Set(concernIds);
    const scored = pool
      .map((p) => ({ p, n: (p.concern_ids || []).filter((id) => sel.has(id)).length }))
      .sort((a, b) => b.n - a.n);
    const hits = scored.filter((x) => x.n > 0);
    return (hits.length ? hits : scored).slice(0, 3).map((x) => x.p);
  }
  function restart() {
    timers.current.forEach(clearTimeout);
    setPath(null); setAreaIds([]); setConcernIds([]); setRecs([]); setMsgs([]); setTyping(true); setStage('await');
    const t = setTimeout(() => {
      setTyping(false);
      setMsgs([{ role: 'bot', text: 'Of course — let\'s start fresh. Want a quick look, or shall we just talk?' }]);
      setStage('intro');
    }, 550);
    timers.current.push(t);
  }

  const recNames = recs.map((r) => r.name);
  const focusText = areaIds.length ? areaIds.map(areaName).join(', ') : 'open to suggestions';
  const concernText = concernIds.length ? concernIds.map(concernName).join(', ') : 'not sure yet — please guide me';
  const waMessage =
    `[Glow Up Seoul · Consultation Request]\n\n` +
    `━━━ WHAT I'M HERE FOR ━━━\n` +
    `• Goal: ${PATH_LABEL[path] || 'a consultation'}\n` +
    `• Focus: ${focusText}\n` +
    `• Concerns: ${concernText}\n` +
    (recNames.length ? `\n━━━ SUGGESTED FOR ME ━━━\n${recNames.map((n) => `• ${n}`).join('\n')}\n` : '') +
    `\n━━━ ASK ━━━\nPlease send me a hand-picked shortlist and the next steps.`;
  const waHref = `https://wa.me/${WA}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="v3s-chat" id="v3-concierge">
      <div className="v3s-chat-head">
        <span className="v3s-chat-ava">R</span>
        <div>
          <div className="v3s-chat-name">Romie</div>
          <div className="v3s-chat-status"><i /> Concierge · online</div>
        </div>
        <span className="v3s-chat-tag">Live</span>
      </div>

      <div className="v3s-chat-body" ref={bodyRef}>
        {msgs.map((m, i) => (
          m.role === 'bot'
            ? <div className="v3s-chat-row" key={i}><span className="v3s-chat-ava sm">R</span><div className="v3s-msg v3s-msg-bot">{m.text}</div></div>
            : <div className="v3s-msg v3s-msg-user" key={i}>{m.text}</div>
        ))}
        {typing && <div className="v3s-chat-row"><span className="v3s-chat-ava sm">R</span><div className="v3s-typing"><span /><span /><span /></div></div>}
      </div>

      <div className="v3s-chat-actions">
        {stage === 'intro' && (
          <div className="v3s-cc-intro">
            <button type="button" className="v3s-cc-scan" onClick={() => setScanOpen(true)}>
              <span className="v3s-cc-scan-ico">📷</span>
              <span className="v3s-cc-scan-tx"><b>Take a quick look</b><i>A photo → a starting point in seconds</i></span>
              <span className="v3s-cc-scan-go">→</span>
            </button>
            <button className="v3s-cc-skip" onClick={skipIntro}>Skip — I’ll answer a few questions</button>
          </div>
        )}

        {stage === 'path' && (
          <div className="v3s-chat-opts">
            {PATHS.map((p) => (
              <button key={p.key} className="v3s-chat-opt" onClick={() => pickPath(p)}>
                <span className="v3s-chat-opt-sym">{p.emoji}</span>
                <span className="v3s-chat-opt-tx"><b>{p.label}</b><i>{p.sub}</i></span>
                <span className="v3s-chat-opt-go">→</span>
              </button>
            ))}
          </div>
        )}

        {stage === 'area' && (
          <>
            <div className="v3s-cc-chips">
              {areasForPath.map((a) => (
                <button key={a.id} type="button" className={`v3s-cc-chip ${areaIds.includes(a.id) ? 'on' : ''}`} onClick={() => toggle(areaIds, setAreaIds, a.id)}>
                  {a.name}{areaIds.includes(a.id) && <span className="v3s-cc-chip-x">✓</span>}
                </button>
              ))}
            </div>
            <button className="v3s-cc-next" onClick={confirmArea}>{areaIds.length ? 'Continue' : 'Not sure — continue'} <span>→</span></button>
          </>
        )}

        {stage === 'concern' && (
          <>
            {showScan && (
              <button type="button" className="v3s-cc-scan" onClick={() => setScanOpen(true)}>
                <span className="v3s-cc-scan-ico">📷</span>
                <span className="v3s-cc-scan-tx"><b>Take a quick look</b><i>Let Romie suggest a starting point</i></span>
                <span className="v3s-cc-scan-go">→</span>
              </button>
            )}
            <div className="v3s-cc-chips">
              {concernsForAreas.map((c) => (
                <button key={c.id} type="button" className={`v3s-cc-chip ${concernIds.includes(c.id) ? 'on' : ''}`} onClick={() => toggle(concernIds, setConcernIds, c.id)}>
                  {c.name}{concernIds.includes(c.id) && <span className="v3s-cc-chip-x">✓</span>}
                </button>
              ))}
            </div>
            <button className="v3s-cc-next" onClick={confirmConcern}>See my matches <span>→</span></button>
          </>
        )}

        {stage === 'done' && (
          <div className="v3s-chat-done">
            {recs.length > 0 && (
              <div className="v3s-rec-list">
                {recs.map((r) => {
                  // why it fits: reasons for the concerns the patient picked that this
                  // procedure matches. If they were "just exploring", show one anyway.
                  let why = (r.concern_ids || [])
                    .filter((id) => concernIds.includes(id))
                    .map((id) => ({ id, concern: concernName(id), reason: r.concern_reasons?.[id] }))
                    .filter((w) => w.reason);
                  if (!why.length) {
                    why = (r.concern_ids || [])
                      .map((id) => ({ id, concern: concernName(id), reason: r.concern_reasons?.[id] }))
                      .filter((w) => w.reason)
                      .slice(0, 1);
                  }
                  return (
                    <div className="v3s-rec" key={`${r.kind}-${r.id}`}>
                      <div className="v3s-rec-top">
                        <span className="v3s-rec-name">{r.name}</span>
                        <span className="v3s-rec-kind">{r.kind === 'surgery' ? 'Surgery' : 'Treatment'}</span>
                      </div>
                      {r.summary && <div className="v3s-rec-sum">{r.summary}</div>}
                      {why.length > 0 && (
                        <div className="v3s-rec-why">
                          {why.map((w) => (
                            <div className="v3s-rec-why-item" key={w.id}>
                              <span className="v3s-rec-why-tag">Why for {w.concern}</span>
                              <p>{w.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="v3s-cc-brief">
              <div className="v3s-cc-brief-row"><span>Goal</span><b>{PATH_LABEL[path]}</b></div>
              <div className="v3s-cc-brief-row"><span>Focus</span><b>{focusText}</b></div>
              <div className="v3s-cc-brief-row"><span>Concerns</span><b>{concernText}</b></div>
            </div>
            <a className="v3s-cc-send" href={waHref} target="_blank" rel="noreferrer"><WaIcon /> Yes — send my request</a>
            <button className="v3s-chat-restart" onClick={restart}>↺ Start over</button>
          </div>
        )}

        {catErr && stage !== 'done' && (
          <a className="v3s-cc-send" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" style={{ marginTop: 0 }}><WaIcon /> Message Romie on WhatsApp</a>
        )}
      </div>

      <ScanOverlay open={scanOpen} onClose={() => setScanOpen(false)} onCapture={onScanCapture} />
    </div>
  );
}

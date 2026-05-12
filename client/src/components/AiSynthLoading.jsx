import { useEffect, useRef, useState } from 'react';

const LINES = [
  '> initializing concierge model · gpt-4o-mini',
  '> ingesting AI scan: regions, metrics, narrative',
  '> reading your preferences · concerns × style × budget',
  '> cross-referencing 22 partner clinics · 69 active offerings',
  '> weighting language coverage · downtime · pain tolerance',
  '> filtering by contract status: active',
  '> ranking candidates by personal fit score',
  '> drafting "총평" — soft tone · italic flourishes',
  '> writing per-match rationale (×3) — Romie voice',
  '> validating against allow-list · sanitizing JSON',
  '✓ synthesis complete · streaming response',
];

const CANDIDATES = 8;
const CLINICS = 22;

export default function AiSynthLoading({ compact = false }) {
  const [step, setStep] = useState(0);
  const [scanned, setScanned] = useState(0);
  const [tokens, setTokens] = useState(0);
  const startRef = useRef(performance.now());

  useEffect(() => {
    let raf;
    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const p = Math.min(1, elapsed / 4800);
      setStep(Math.min(LINES.length - 1, Math.floor(p * LINES.length)));
      setScanned(Math.min(CLINICS, Math.floor(p * CLINICS) + (Math.sin(elapsed / 90) > 0 ? 1 : 0)));
      setTokens(Math.floor(p * 1180 + Math.sin(elapsed / 60) * 8));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const visible = LINES.slice(Math.max(0, step - 5), step + 1);

  return (
    <div className={`gs-aisynth ${compact ? 'gs-aisynth--compact' : ''}`}>
      <div className="gs-aisynth-head">
        <div className="gs-aisynth-orb">
          <div className="gs-aisynth-orb-core" />
          <div className="gs-aisynth-orb-ring r1" />
          <div className="gs-aisynth-orb-ring r2" />
          <div className="gs-aisynth-orb-ring r3" />
        </div>
        <div className="gs-aisynth-text">
          <div className="gs-eyebrow" style={{ color: 'var(--gold-light)' }}>✦ Romie is synthesizing</div>
          <div className="gs-aisynth-title">
            Reading your scan,<br />weighing your <em>priorities.</em>
          </div>
        </div>
      </div>

      <div className="gs-aisynth-cols">
        <div className="gs-aisynth-log">
          {visible.map((l, i) => (
            <div key={`${l}-${step - visible.length + 1 + i}`} className="gs-aisynth-log-line" style={{ opacity: 0.25 + (i / visible.length) * 0.75 }}>
              {l}
            </div>
          ))}
          <div className="gs-aisynth-cursor">▍</div>
        </div>

        <div className="gs-aisynth-stats">
          <div className="gs-aisynth-stat">
            <div className="gs-eyebrow">Candidates</div>
            <div className="gs-aisynth-num">{scanned.toString().padStart(2,'0')} / {CLINICS}</div>
          </div>
          <div className="gs-aisynth-stat">
            <div className="gs-eyebrow">Offerings scored</div>
            <div className="gs-aisynth-num">{Math.min(CANDIDATES, Math.floor((scanned / CLINICS) * CANDIDATES))} / {CANDIDATES}</div>
          </div>
          <div className="gs-aisynth-stat">
            <div className="gs-eyebrow">Tokens</div>
            <div className="gs-aisynth-num">{tokens.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="gs-aisynth-progress">
        <div className="gs-aisynth-progress-bar">
          <div className="gs-aisynth-progress-fill" />
        </div>
      </div>
    </div>
  );
}

export function AiPickSkeleton({ rank }) {
  return (
    <article className="gs-ai-pick gs-ai-pick--skel">
      <div className="gs-ai-pick-rank">{String(rank).padStart(2, '0')}</div>
      <div className="gs-ai-pick-thumb gs-skel-shimmer" />
      <div className="gs-ai-pick-body">
        <div className="gs-skel-line" style={{ width: '40%', height: 14 }} />
        <div className="gs-skel-line" style={{ width: '70%', height: 28, marginTop: 12 }} />
        <div className="gs-skel-line" style={{ width: '55%', height: 12, marginTop: 8 }} />
        <div className="gs-skel-line" style={{ width: '95%', height: 12, marginTop: 24 }} />
        <div className="gs-skel-line" style={{ width: '88%', height: 12, marginTop: 6 }} />
        <div className="gs-skel-line" style={{ width: '60%', height: 12, marginTop: 6 }} />
      </div>
    </article>
  );
}

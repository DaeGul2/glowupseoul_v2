import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { analyzeSnapshot } from '../utils/api.js';

// v2 upgraded scanner.
// Phase machine:  loading → idle → scanning(4.5s) → analyzing(API) → done
// Visual stack (drawn each frame on the live canvas):
//   1. Tesselation mesh, progressively revealed
//   2. Feature outlines (oval/eyes/brows/lips/iris)
//   3. Region heatmaps (forehead/cheek/under-eye/jawline) — color-coded zone fills
//   4. Floating metric badges anchored to landmarks (e.g., "PORE 0.42")
//   5. Crosshair targeting marks at key landmarks
//   6. Multiple sweep lines — horizontal during scanning, radial pulse during analyzing
//   7. Particle bursts at landmark hotspots
// HUD overlays (DOM, outside canvas):
//   - top-left: ANALYSIS_ID · timestamp · GPU
//   - top-right: status with blink
//   - bottom-left: streaming log lines
//   - bottom-right: progress + ETA + live counters

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_PATH = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const SCAN_DURATION = 4500;
const GOLD = '#c9a063';
const GOLD_LIGHT = '#e8d4a8';
const CYAN = '#7ad4d4';
const ROSE = '#c9837a';
const OVERLAY_SCALE = 1.12;

const STAGE_LOG = [
  { at: 0.00, text: '$ initializing biometric channel...' },
  { at: 0.08, text: '> 478 landmarks acquired' },
  { at: 0.18, text: '> tesselation graph: 3072 edges' },
  { at: 0.28, text: '> facial symmetry baseline locked' },
  { at: 0.38, text: '> sampling forehead · cheek · under_eye regions' },
  { at: 0.50, text: '> luminance histogram computed' },
  { at: 0.62, text: '> HSV pore-density map generated' },
  { at: 0.74, text: '> jawline curvature: parametric fit Δ=0.012' },
  { at: 0.86, text: '> handoff to medical concierge model' },
  { at: 0.96, text: '✓ scan complete · transmitting to AI' },
];

// Region definitions — sets of MediaPipe landmark indices that bound a face zone.
// These are the same indices used in MediaPipe's FACE_LANDMARKS_* sets.
const REGIONS = {
  FOREHEAD:  { idx: [10, 67, 109, 108, 151, 337, 338, 297, 299], color: GOLD,       label: 'FOREHEAD' },
  CHEEK_L:   { idx: [50, 101, 118, 117, 119, 120, 100, 142],     color: GOLD_LIGHT, label: 'CHEEK·L' },
  CHEEK_R:   { idx: [280, 330, 347, 346, 348, 349, 329, 371],    color: GOLD_LIGHT, label: 'CHEEK·R' },
  UNDER_EYE: { idx: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158], color: CYAN, label: 'UNDER_EYE' },
  JAWLINE:   { idx: [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397], color: ROSE, label: 'JAWLINE' },
  NOSE:      { idx: [1, 4, 5, 19, 94, 168, 195, 197, 168, 6],    color: GOLD,       label: 'NOSE' },
};

function faceBbox(lms) {
  const oval = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL || [];
  let minX = 1, minY = 1, maxX = 0, maxY = 0, found = false;
  for (const c of oval) {
    const p = lms[c.start];
    if (!p) continue;
    found = true;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, found, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

function regionPolygon(ctx, lms, sx, sy, idx) {
  ctx.beginPath();
  let started = false;
  for (const i of idx) {
    const p = lms[i];
    if (!p) continue;
    if (!started) { ctx.moveTo(sx(p), sy(p)); started = true; }
    else ctx.lineTo(sx(p), sy(p));
  }
  ctx.closePath();
}

function regionCentroid(lms, idx) {
  let x = 0, y = 0, n = 0;
  for (const i of idx) {
    const p = lms[i];
    if (!p) continue;
    x += p.x; y += p.y; n++;
  }
  return n ? { x: x / n, y: y / n } : { x: 0.5, y: 0.5 };
}

// Short id: ANID-AC04-3F2A — looks like a "lab" reference.
function newAnalysisId() {
  const chars = '0123456789ABCDEF';
  const block = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * 16)]).join('');
  return `ANID-${block(4)}-${block(4)}`;
}

const fmtClock = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
};

export default function FaceScanner({ onComplete, onSkip }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lmsRef = useRef(null);
  const phaseRef = useRef('loading');
  const scanStartRef = useRef(null);
  const analyzeStartRef = useRef(null);
  const progressRef = useRef(0);
  const snapTakenRef = useRef(false);
  const snapshotRef = useRef(null);

  const [phase, setPhase] = useState('loading');
  const [progress, setProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState(null);
  const [log, setLog] = useState([]);
  const [counters, setCounters] = useState({ landmarks: 0, edges: 0, pixels: 0 });
  const [clock, setClock] = useState(fmtClock());
  const [analysisId] = useState(newAnalysisId);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  function setPhaseBoth(p) { phaseRef.current = p; setPhase(p); }

  // Clock ticker
  useEffect(() => {
    const t = setInterval(() => setClock(fmtClock()), 1000);
    return () => clearInterval(t);
  }, []);

  // Init MediaPipe + camera
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        if (cancelled) return;
        const lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
          runningMode: 'VIDEO', numFaces: 1,
        });
        if (cancelled) { lm.close(); return; }
        landmarkerRef.current = lm;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        v.srcObject = stream;
        await new Promise((r) => { if (v.readyState >= 2) return r(); v.onloadedmetadata = () => r(); });
        await v.play();
        canvasRef.current.width = v.videoWidth || 720;
        canvasRef.current.height = v.videoHeight || 960;
        setPhaseBoth('idle');
        loop();
      } catch (e) {
        if (cancelled) return;
        setError(e.name === 'NotAllowedError'
          ? 'Camera access denied. Skip and continue with preferences.'
          : 'Could not initialize scanner. Skip to continue.');
        setPhaseBoth('error');
      }
    }
    init();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      try { landmarkerRef.current?.close(); } catch {}
      landmarkerRef.current = null;
    };
  }, []);

  function pushLog(line) {
    setLog((prev) => {
      const next = [...prev, { line, t: Date.now() }];
      return next.slice(-7);
    });
  }

  function loop() {
    const v = videoRef.current;
    const lm = landmarkerRef.current;
    if (v && lm && v.readyState >= 2 && !v.paused) {
      try {
        const r = lm.detectForVideo(v, performance.now());
        if (r.faceLandmarks?.[0]) {
          lmsRef.current = r.faceLandmarks[0];
          if (!faceDetected) setFaceDetected(true);
        } else {
          lmsRef.current = null;
          if (faceDetected) setFaceDetected(false);
        }
      } catch {}
    }

    if (phaseRef.current === 'scanning') {
      const elapsed = performance.now() - scanStartRef.current;
      const p = Math.min(1, elapsed / SCAN_DURATION);
      progressRef.current = p;
      setProgress(p);
      // live counters
      setCounters({
        landmarks: Math.min(478, Math.floor(p * 478)),
        edges: Math.min(3072, Math.floor(p * 3072)),
        pixels: Math.floor(p * 691_200 + Math.sin(performance.now() / 80) * 1200),
      });
      // log streaming
      const stage = [...STAGE_LOG].reverse().find((s) => p >= s.at);
      if (stage && (!log.length || log[log.length - 1]?.line !== stage.text)) {
        pushLog(stage.text);
      }
      if (p >= 1) {
        setPhaseBoth('analyzing');
        analyzeStartRef.current = performance.now();
        snapshotRef.current = captureSnapshot();
        kickAI();
        pushLog('$ POST /api/analyze · vision payload uploaded');
      }
    }

    if (phaseRef.current === 'analyzing') {
      // After analysis triggered we cycle progress for visual purposes (real wait is the fetch)
      const elapsed = performance.now() - analyzeStartRef.current;
      const cycle = (elapsed % 1600) / 1600;
      progressRef.current = cycle;
      setProgress(cycle);
    }

    drawFrame();

    if (phaseRef.current === 'done' && !snapTakenRef.current) {
      snapTakenRef.current = true;
      setTimeout(() => onComplete?.({ snapshot: snapshotRef.current, ai: aiResult }), 600);
    }

    rafRef.current = requestAnimationFrame(loop);
  }

  async function kickAI() {
    try {
      const result = await analyzeSnapshot(snapshotRef.current);
      setAiResult(result);
      pushLog(`✓ ${result.concerns?.length || 0} concerns identified · confidence ${result.confidence}`);
    } catch (e) {
      setAiError(e.message);
      if (e?.code === 'rate_limited') {
        const min = Math.ceil((e.retryAfterSec || 300) / 60);
        pushLog(`! rate limit · please retry in ~${min} min — using preferences only`);
      } else {
        pushLog('! analysis API offline — continuing with preferences only');
      }
    } finally {
      // Wait at least 1.6s in analyzing phase so the animation lands well
      const elapsed = performance.now() - (analyzeStartRef.current || performance.now());
      const remain = Math.max(0, 1600 - elapsed);
      setTimeout(() => setPhaseBoth('done'), remain);
    }
  }

  function drawFrame() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const lms = lmsRef.current;
    if (!lms) return;
    const ph = phaseRef.current;
    if (ph === 'loading' || ph === 'error') return;

    const bbox = faceBbox(lms);
    if (!bbox.found) return;
    const sx = (p) => (bbox.cx + (p.x - bbox.cx) * OVERLAY_SCALE) * W;
    const sy = (p) => (bbox.cy + (p.y - bbox.cy) * OVERLAY_SCALE) * H;
    const prog = progressRef.current;
    const scanning = ph === 'scanning';
    const analyzing = ph === 'analyzing';
    const done = ph === 'done';

    // ---------- 1. Tesselation mesh ----------
    if (scanning || analyzing || done) {
      const tess = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
      const limit = scanning ? Math.floor(tess.length * Math.min(1, prog * 1.2)) : tess.length;
      ctx.strokeStyle = analyzing ? CYAN : GOLD;
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i < limit; i++) {
        const a = lms[tess[i].start], b = lms[tess[i].end];
        if (!a || !b) continue;
        ctx.moveTo(sx(a), sy(a)); ctx.lineTo(sx(b), sy(b));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ---------- 2. Region heatmap fills ----------
    if (scanning || analyzing || done) {
      const phaseAlpha = scanning ? Math.min(0.16, prog * 0.20) : analyzing ? 0.22 : 0.16;
      const labels = aiResult?.regions?.map((r) => r.label) || [];
      for (const [key, def] of Object.entries(REGIONS)) {
        // Highlight regions returned by AI
        const isAiHit = labels.includes(def.label.replace('·L','').replace('·R',''));
        const a = isAiHit && done ? phaseAlpha * 1.8 : phaseAlpha;
        ctx.fillStyle = def.color;
        ctx.globalAlpha = a;
        regionPolygon(ctx, lms, sx, sy, def.idx);
        ctx.fill();
        ctx.globalAlpha = isAiHit && done ? 0.9 : 0.55;
        ctx.strokeStyle = def.color;
        ctx.lineWidth = isAiHit && done ? 1.6 : 0.8;
        regionPolygon(ctx, lms, sx, sy, def.idx);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ---------- 3. Feature outlines ----------
    const feats = [
      FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
      FaceLandmarker.FACE_LANDMARKS_LIPS,
      FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
    ];
    ctx.strokeStyle = analyzing ? CYAN : GOLD_LIGHT;
    ctx.globalAlpha = scanning || analyzing || done ? 0.95 : 0.55;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = analyzing ? CYAN : GOLD;
    ctx.shadowBlur = scanning ? 8 : analyzing ? 14 : 4;
    for (const set of feats) {
      if (!set) continue;
      ctx.beginPath();
      for (const cn of set) {
        const a = lms[cn.start], b = lms[cn.end];
        if (!a || !b) continue;
        ctx.moveTo(sx(a), sy(a)); ctx.lineTo(sx(b), sy(b));
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // ---------- 4. Crosshair targeting at region centroids ----------
    if (scanning || analyzing || done) {
      for (const [key, def] of Object.entries(REGIONS)) {
        const cen = regionCentroid(lms, def.idx);
        const cx = sx(cen), cy = sy(cen);
        ctx.strokeStyle = def.color;
        ctx.globalAlpha = analyzing ? 0.9 : 0.7;
        ctx.lineWidth = 1.0;
        // crosshair
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy); ctx.lineTo(cx - 2, cy);
        ctx.moveTo(cx + 2, cy); ctx.lineTo(cx + 8, cy);
        ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy - 2);
        ctx.moveTo(cx, cy + 2); ctx.lineTo(cx, cy + 8);
        ctx.stroke();
        // tiny circle
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = def.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ---------- 5. Floating metric badges (after AI returns) ----------
    if (done && aiResult?.metrics) {
      ctx.font = '500 11px Inter, sans-serif';
      const labels = aiResult.regions || [];
      for (const r of labels) {
        const key = r.label === 'CHEEKS' ? 'CHEEK_L' : r.label;
        const def = REGIONS[key];
        if (!def) continue;
        const cen = regionCentroid(lms, def.idx);
        const px = sx(cen), py = sy(cen);
        // box behind text
        const text = r.label.replace('_', ' ');
        const metric = aiResult.metrics.skin_clarity ?? 0;
        const sub = r.label === 'UNDER_EYE' ? `DARKNESS ${aiResult.metrics.under_eye_darkness}` :
                    r.label === 'JAWLINE'   ? `DEF ${aiResult.metrics.jawline_definition}` :
                    r.label === 'CHEEKS'    ? `CLARITY ${aiResult.metrics.skin_clarity}` :
                    r.label === 'FOREHEAD'  ? `EVEN ${aiResult.metrics.tone_evenness}` :
                                              `ID ${analysisId.slice(-4)}`;
        const bx = px + 14, by = py - 18, bw = ctx.measureText(`${text} · ${sub}`).width + 16, bh = 22;
        ctx.fillStyle = 'rgba(15,15,18,0.85)';
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 0.8;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
        // connector line
        ctx.strokeStyle = def.color;
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(bx, by + bh/2);
        ctx.stroke();
        // text
        ctx.fillStyle = GOLD_LIGHT;
        ctx.fillText(`${text} · `, bx + 8, by + 14);
        ctx.fillStyle = def.color;
        ctx.fillText(sub, bx + 8 + ctx.measureText(`${text} · `).width, by + 14);
      }
    }

    // ---------- 6. Sweep lines ----------
    if (scanning) {
      // horizontal sweep
      const y = bbox.minY * H + (bbox.maxY - bbox.minY) * H * prog;
      const grad = ctx.createLinearGradient(0, y - 28, 0, y + 28);
      grad.addColorStop(0, 'rgba(201,160,99,0)');
      grad.addColorStop(0.5, 'rgba(232,212,168,0.55)');
      grad.addColorStop(1, 'rgba(201,160,99,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, y - 28, W, 56);
      ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = 1.5;
      ctx.shadowColor = GOLD; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (analyzing) {
      // radial pulse from face center
      const cx = bbox.cx * W, cy = bbox.cy * H;
      const maxR = Math.max(W, H) * 0.6;
      const pulses = 3;
      for (let i = 0; i < pulses; i++) {
        const t = ((progressRef.current + i / pulses) % 1);
        const r = t * maxR;
        ctx.strokeStyle = CYAN;
        ctx.globalAlpha = (1 - t) * 0.5;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ---------- 7. Particle bursts at landmark hotspots ----------
    if (scanning || analyzing) {
      ctx.fillStyle = analyzing ? CYAN : GOLD_LIGHT;
      const step = 4;
      for (let i = 0; i < lms.length; i += step) {
        const p = lms[i];
        if (!p) continue;
        const appear = i / lms.length;
        if (scanning && prog < appear) continue;
        const pulse = analyzing ? 0.5 + 0.5 * Math.sin(performance.now() / 220 + i * 0.5)
                                : 0.6 + 0.4 * Math.sin(performance.now() / 280 + i * 0.4);
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(sx(p), sy(p), analyzing ? 1.4 : 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function captureSnapshot() {
    const v = videoRef.current, live = canvasRef.current;
    if (!v) return null;
    const W = v.videoWidth || 720, H = v.videoHeight || 960;
    try {
      const tmp = document.createElement('canvas');
      tmp.width = W; tmp.height = H;
      const ctx = tmp.getContext('2d');
      ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0, W, H);
      if (live) ctx.drawImage(live, 0, 0, W, H);
      ctx.restore();
      return tmp.toDataURL('image/jpeg', 0.86);
    } catch { return null; }
  }

  function begin() {
    if (phase !== 'idle' || !faceDetected) return;
    snapTakenRef.current = false;
    snapshotRef.current = null;
    setLog([]);
    setAiResult(null);
    setAiError(null);
    setCounters({ landmarks: 0, edges: 0, pixels: 0 });
    scanStartRef.current = performance.now();
    setPhaseBoth('scanning');
  }

  const statusText =
    phase === 'loading'   ? 'BOOT · loading vision model'
  : phase === 'idle'      ? (faceDetected ? 'STANDBY · face acquired' : 'STANDBY · position face')
  : phase === 'scanning'  ? `SCAN · ${Math.round(progress * 100)}%`
  : phase === 'analyzing' ? 'AI · medical concierge model'
  : phase === 'done'      ? 'COMPLETE · transmitted'
  :                         'ERROR';

  return (
    <div className="gs-scan-stage">
      <div className="gs-scan-frame">
        <video ref={videoRef} className="gs-scan-video" playsInline muted />
        <canvas ref={canvasRef} className="gs-scan-canvas" />

        {/* corner brackets */}
        <svg className="gs-scan-corners" viewBox="0 0 100 100" preserveAspectRatio="none">
          <g stroke={phase === 'analyzing' ? CYAN : GOLD} strokeWidth="0.5" fill="none" opacity="0.85">
            <path d="M 4 12 L 4 4 L 12 4" />
            <path d="M 96 12 L 96 4 L 88 4" />
            <path d="M 4 88 L 4 96 L 12 96" />
            <path d="M 96 88 L 96 96 L 88 96" />
          </g>
        </svg>

        {/* HUD — top-left: ID block */}
        <div className="gs-hud-tl">
          <div>ANID · {analysisId}</div>
          <div>T · {clock} KST</div>
          <div>DEVICE · GPU/WEBGL2</div>
          <div>MODEL · face_landmarker · float16</div>
        </div>

        {/* HUD — top-right: status */}
        <div className="gs-hud-tr">
          <div className={`gs-hud-dot ${phase === 'analyzing' ? 'cyan' : ''} ${phase === 'scanning' || phase === 'analyzing' ? 'blink' : ''}`}>●</div>
          <div>{statusText}</div>
          <div className="gs-hud-sub">FACE SCAN v2 · BIOMETRIC</div>
        </div>

        {/* HUD — bottom-left: streaming log */}
        <div className="gs-hud-bl">
          {log.slice(-7).map((l, i) => (
            <div key={l.t} className="gs-hud-log" style={{ opacity: 0.3 + (i / 7) * 0.7 }}>
              {l.line}
            </div>
          ))}
        </div>

        {/* HUD — bottom-right: progress + counters */}
        <div className="gs-hud-br">
          {(phase === 'scanning' || phase === 'analyzing') && (
            <>
              <div className="gs-hud-progress">
                <div className="bar"><div className="fill" style={{ width: `${progress * 100}%`, background: phase === 'analyzing' ? 'linear-gradient(90deg,#7ad4d4,#bff2f2)' : 'linear-gradient(90deg,#c9a063,#e8d4a8)' }} /></div>
              </div>
              <div className="gs-hud-counters">
                <span>LM {counters.landmarks.toString().padStart(3,'0')}/478</span>
                <span>·</span>
                <span>EDGE {counters.edges.toLocaleString()}/3072</span>
              </div>
              <div className="gs-hud-counters">
                <span>PX {counters.pixels.toLocaleString()}</span>
              </div>
            </>
          )}
          {phase === 'done' && aiResult && (
            <div className="gs-hud-counters">
              <span style={{ color: '#bff2f2' }}>✓ {aiResult.concerns?.length || 0} concerns</span>
              <span>·</span>
              <span>conf {aiResult.confidence}</span>
              {aiResult._mock && <span style={{ color: ROSE }}> · MOCK</span>}
            </div>
          )}
        </div>

        {/* Scanline glitch overlay */}
        {(phase === 'scanning' || phase === 'analyzing') && <div className="gs-scanlines" />}

        {error && <div className="gs-scan-error">{error}</div>}
      </div>

      <div className="gs-scan-actions">
        {phase === 'idle' && (
          <button className="gs-cta" onClick={begin} disabled={!faceDetected}>
            {faceDetected ? '✦ Begin Biometric Analysis' : 'Waiting for face…'}
          </button>
        )}
        {phase === 'loading' && <span className="gs-scan-hint">Loading vision model…</span>}
        {phase === 'analyzing' && <span className="gs-scan-hint">Consulting the concierge AI…</span>}
        <button className="gs-cta gs-cta--outline" onClick={onSkip}>Skip · or upload a photo</button>
      </div>
    </div>
  );
}

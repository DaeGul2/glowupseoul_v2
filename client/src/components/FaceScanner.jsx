import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const SCAN_DURATION = 4500;
const GOLD = '#c9a063';
const GOLD_LIGHT = '#e8d4a8';
const OVERLAY_SCALE = 1.12; // 메쉬를 얼굴 중심에서 12% 바깥으로 확장 → "Face ID 오버레이" 느낌

const STATUS_STAGES = [
  { at: 0, text: '얼굴 인식 중' },
  { at: 0.22, text: '윤곽 분석 중' },
  { at: 0.5, text: '특징점 추출 중' },
  { at: 0.78, text: '데이터 매핑 중' },
  { at: 0.96, text: '분석 완료' }
];

function computeFaceCenter(lms) {
  const oval = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL || [];
  if (!oval.length || !lms) return { x: 0.5, y: 0.5 };
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
  if (!found) return { x: 0.5, y: 0.5 };
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

export default function FaceScanner({ onComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastLandmarksRef = useRef(null);
  const phaseRef = useRef('loading');
  const startedAtRef = useRef(null);
  const progressRef = useRef(0);
  const snapshotTakenRef = useRef(false);
  const snapshotRef = useRef(null);

  const [phase, setPhase] = useState('loading');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(STATUS_STAGES[0].text);
  const [error, setError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);

  function updatePhase(p) {
    phaseRef.current = p;
    setPhase(p);
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        if (cancelled) return;

        const lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
        });
        if (cancelled) {
          lm.close();
          return;
        }
        landmarkerRef.current = lm;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const v = videoRef.current;
        v.srcObject = stream;
        await new Promise((resolve) => {
          if (v.readyState >= 2) return resolve();
          v.onloadedmetadata = () => resolve();
        });
        await v.play();

        const c = canvasRef.current;
        c.width = v.videoWidth || 720;
        c.height = v.videoHeight || 960;

        updatePhase('idle');
        loop();
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError(
            e.name === 'NotAllowedError'
              ? '카메라 접근이 거부되었습니다. 브라우저 권한을 허용해주세요.'
              : '얼굴 인식을 초기화할 수 없습니다. 건너뛰기로 진행하세요.'
          );
          updatePhase('error');
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      try {
        landmarkerRef.current?.close();
      } catch {}
      landmarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loop() {
    const v = videoRef.current;
    const lm = landmarkerRef.current;

    if (v && lm && v.readyState >= 2 && !v.paused) {
      try {
        const result = lm.detectForVideo(v, performance.now());
        if (result.faceLandmarks && result.faceLandmarks[0]) {
          lastLandmarksRef.current = result.faceLandmarks[0];
          if (!faceDetected) setFaceDetected(true);
        } else {
          lastLandmarksRef.current = null;
          if (faceDetected) setFaceDetected(false);
        }
      } catch (e) {
        // ignore transient detection errors
      }
    }

    if (phaseRef.current === 'scanning') {
      const elapsed = performance.now() - startedAtRef.current;
      const p = Math.min(1, elapsed / SCAN_DURATION);
      progressRef.current = p;
      setProgress(p);
      const stage = [...STATUS_STAGES].reverse().find(s => p >= s.at);
      if (stage) setStatusText(stage.text);
      if (p >= 1) {
        updatePhase('done');
      }
    }

    drawFrame();

    // 스캔 완료 직후 한 번만 합성 스냅샷 캡처 (video + 메쉬 오버레이)
    if (phaseRef.current === 'done' && !snapshotTakenRef.current) {
      snapshotTakenRef.current = true;
      snapshotRef.current = captureSnapshot();
      setTimeout(() => onComplete?.(snapshotRef.current), 700);
    }

    rafRef.current = requestAnimationFrame(loop);
  }

  function drawFrame() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width;
    const H = c.height;
    ctx.clearRect(0, 0, W, H);

    const lms = lastLandmarksRef.current;
    if (!lms) return;

    const phase = phaseRef.current;
    const prog = progressRef.current;
    const isScanning = phase === 'scanning';
    const isDone = phase === 'done';
    const live = phase === 'idle' || isScanning || isDone;
    if (!live) return;

    const center = computeFaceCenter(lms);
    const sx = (p) => (center.x + (p.x - center.x) * OVERLAY_SCALE) * W;
    const sy = (p) => (center.y + (p.y - center.y) * OVERLAY_SCALE) * H;

    // 1) 풀 메쉬 (스캔 중에만, 점진적 reveal)
    if (isScanning || isDone) {
      const tess = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
      const limit = isDone
        ? tess.length
        : Math.floor(tess.length * Math.min(1, prog * 1.2));
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = 0.14;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i < limit; i++) {
        const a = lms[tess[i].start];
        const b = lms[tess[i].end];
        if (!a || !b) continue;
        ctx.moveTo(sx(a), sy(a));
        ctx.lineTo(sx(b), sy(b));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 2) 특징 윤곽선 (idle 부터 항상 그림)
    const featureSets = [
      { conn: FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, lw: 2.4 },
      { conn: FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, lw: 1.6 },
      { conn: FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, lw: 1.6 },
      { conn: FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, lw: 1.6 },
      { conn: FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, lw: 1.6 },
      { conn: FaceLandmarker.FACE_LANDMARKS_LIPS, lw: 1.6 },
      { conn: FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, lw: 1.2 },
      { conn: FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, lw: 1.2 }
    ];

    const baseAlpha = isScanning || isDone ? 0.95 : 0.55;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = isScanning ? 8 : 0;
    for (const set of featureSets) {
      if (!set.conn) continue;
      ctx.strokeStyle = GOLD_LIGHT;
      ctx.globalAlpha = baseAlpha;
      ctx.lineWidth = set.lw;
      ctx.beginPath();
      for (const cn of set.conn) {
        const a = lms[cn.start];
        const b = lms[cn.end];
        if (!a || !b) continue;
        ctx.moveTo(sx(a), sy(a));
        ctx.lineTo(sx(b), sy(b));
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // 3) 랜드마크 점 (스캔 중에 점차 반짝임)
    if (isScanning || isDone) {
      ctx.fillStyle = GOLD_LIGHT;
      const step = 4;
      for (let i = 0; i < lms.length; i += step) {
        const p = lms[i];
        if (!p) continue;
        const appear = i / lms.length;
        if (prog < appear && !isDone) continue;
        const pulse = isDone
          ? 0.85
          : 0.6 + 0.4 * Math.sin(performance.now() / 280 + i * 0.4);
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(sx(p), sy(p), 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // 4) 스캔 sweep 라인 (스캔 중) — 확장된 oval bbox 기준
    if (isScanning) {
      let minY = H, maxY = 0;
      const oval = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL || [];
      for (const cn of oval) {
        const a = lms[cn.start];
        if (a) {
          const y = sy(a);
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      if (minY === H) { minY = 0; maxY = H; }

      const y = minY + (maxY - minY) * prog;
      const grad = ctx.createLinearGradient(0, y - 28, 0, y + 28);
      grad.addColorStop(0, 'rgba(201, 160, 99, 0)');
      grad.addColorStop(0.5, 'rgba(232, 212, 168, 0.55)');
      grad.addColorStop(1, 'rgba(201, 160, 99, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y - 28, W, 56);

      ctx.strokeStyle = GOLD_LIGHT;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = GOLD;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // video + 메쉬 오버레이를 합성해 jpeg data URL 반환 (사용자가 본 그대로 미러링됨)
  function captureSnapshot() {
    const v = videoRef.current;
    const live = canvasRef.current;
    if (!v) return null;
    const W = v.videoWidth || 720;
    const H = v.videoHeight || 960;
    try {
      const tmp = document.createElement('canvas');
      tmp.width = W;
      tmp.height = H;
      const ctx = tmp.getContext('2d');
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0, W, H);
      if (live) ctx.drawImage(live, 0, 0, W, H);
      ctx.restore();
      return tmp.toDataURL('image/jpeg', 0.88);
    } catch (e) {
      console.warn('snapshot failed', e);
      return null;
    }
  }

  function beginScan() {
    if (phase !== 'idle' || !faceDetected) return;
    snapshotTakenRef.current = false;
    snapshotRef.current = null;
    startedAtRef.current = performance.now();
    updatePhase('scanning');
  }

  function skip() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    onComplete?.(null);
  }

  return (
    <div>
      <div className="scanner-wrap">
        <video ref={videoRef} className="scanner-video" playsInline muted />
        <canvas ref={canvasRef} className="scanner-canvas" />

        <svg className="scanner-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
          <g stroke="#c9a063" strokeWidth="0.5" fill="none" opacity="0.85">
            <path d="M 8 14 L 8 8 L 14 8" />
            <path d="M 92 14 L 92 8 L 86 8" />
            <path d="M 8 86 L 8 92 L 14 92" />
            <path d="M 92 86 L 92 92 L 86 92" />
          </g>
        </svg>

        <div className="scanner-status">
          <span className={phase === 'scanning' ? 'blink' : ''}>
            ●{' '}
            {phase === 'loading'
              ? '모델 로딩 중'
              : phase === 'idle'
              ? faceDetected
                ? '얼굴 인식됨'
                : '얼굴을 화면에 위치시키세요'
              : phase === 'scanning'
              ? statusText
              : phase === 'done'
              ? '완료'
              : '오류'}
          </span>
          <span>FACE SCAN · v1.0</span>
        </div>

        {phase === 'idle' && !faceDetected && !error && (
          <div className="scanner-hint">얼굴을 화면 중앙에 위치시키세요</div>
        )}

        {(phase === 'scanning' || phase === 'done') && (
          <div className="scanner-progress">
            <div className="scanner-progress-bar">
              <div
                className="scanner-progress-fill"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="scanner-progress-label">
              {phase === 'done'
                ? 'SCAN COMPLETE'
                : `ANALYZING · ${Math.round(progress * 100)}%`}
            </div>
          </div>
        )}

        {error && (
          <div className="scan-error">
            <div>{error}</div>
          </div>
        )}
      </div>

      {phase === 'idle' && (
        <>
          <button className="primary" onClick={beginScan} disabled={!faceDetected}>
            {faceDetected ? '얼굴 분석 시작' : '얼굴 인식 대기 중…'}
          </button>
          <button className="secondary" onClick={skip}>
            건너뛰기
          </button>
        </>
      )}
      {phase === 'loading' && (
        <>
          <div className="helper-text">AI 모델을 불러오는 중입니다…</div>
          <button className="secondary" onClick={skip}>
            건너뛰기
          </button>
        </>
      )}
      {phase === 'error' && (
        <button className="secondary" onClick={skip} style={{ marginTop: 24 }}>
          건너뛰기
        </button>
      )}
    </div>
  );
}

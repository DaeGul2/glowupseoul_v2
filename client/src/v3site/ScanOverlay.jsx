// Fullscreen "quick look" capture overlay for the concierge chat.
// Owns the whole capture lifecycle so the user is never left confused:
//   camera/upload → analyzing (loading bar) → success (closes) | error (retry).
// onCapture(dataUrl) must return a Promise that resolves on success and rejects
// on failure (the parent does the /api/v3/scan call inside it).
import { useEffect, useRef, useState } from 'react';

export default function ScanOverlay({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState('camera');  // camera | analyzing | error
  const [mode, setMode] = useState('camera');    // camera | upload
  const [ready, setReady] = useState(false);
  const [camErr, setCamErr] = useState(false);
  const [shot, setShot] = useState(null);        // captured preview (data URL)

  function stop() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  // (re)start the camera whenever we're showing the live camera view
  useEffect(() => {
    if (!open || mode !== 'camera' || phase !== 'camera') return undefined;
    let cancelled = false;
    setReady(false); setCamErr(false);
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera api');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
        setReady(true);
      } catch {
        if (!cancelled) { setCamErr(true); setMode('upload'); }
      }
    })();
    return () => { cancelled = true; stop(); };
  }, [open, mode, phase]);

  // reset to a clean state every time it opens
  useEffect(() => {
    if (open) { setPhase('camera'); setMode('camera'); setShot(null); setCamErr(false); }
    return () => stop();
  }, [open]);

  function close() { stop(); onClose(); }

  async function run(dataUrl) {
    setShot(dataUrl);
    setPhase('analyzing');
    stop();
    try {
      await onCapture(dataUrl);   // parent calls the API + updates the chat
      onClose();                  // success → reveal the chat behind us
    } catch {
      setPhase('error');
    }
  }

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const w = v.videoWidth, h = v.videoHeight;
    const size = Math.min(w, h);
    const canvas = document.createElement('canvas');
    canvas.width = 720; canvas.height = 720;
    canvas.getContext('2d').drawImage(v, (w - size) / 2, (h - size) / 2, size, size, 0, 0, 720, 720);
    run(canvas.toDataURL('image/jpeg', 0.82));
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => run(String(reader.result));
    reader.onerror = () => setPhase('error');
    reader.readAsDataURL(f);
  }

  function retry() { setShot(null); setPhase('camera'); setMode(camErr ? 'upload' : 'camera'); }

  if (!open) return null;
  return (
    <div className="v3s-scan" role="dialog" aria-label="Quick look">
      <button className="v3s-scan-x" onClick={close} aria-label="Close">×</button>
      <div className="v3s-scan-inner">
        <span className="v3s-scan-eyebrow">Quick look</span>
        <h3 className="v3s-scan-title">
          {phase === 'analyzing' ? 'Looking…' : phase === 'error' ? 'Let’s try that again' : 'Let me take a gentle look'}
        </h3>

        {/* ---------- camera / upload ---------- */}
        {phase === 'camera' && mode === 'camera' && !camErr && (
          <div className="v3s-scan-stage">
            <video ref={videoRef} className="v3s-scan-video" muted playsInline />
            <div className="v3s-scan-frame" />
            {ready ? <div className="v3s-scan-line" /> : <div className="v3s-scan-hint">Starting camera…</div>}
          </div>
        )}
        {phase === 'camera' && mode === 'upload' && (
          <label className="v3s-scan-upload">
            <input type="file" accept="image/*" onChange={onFile} hidden />
            <span className="v3s-scan-upload-ico">↑</span>
            <span>{camErr ? 'Camera unavailable — upload a clear selfie' : 'Upload a clear selfie'}</span>
          </label>
        )}

        {/* ---------- analyzing (loading bar) ---------- */}
        {phase === 'analyzing' && (
          <div className="v3s-scan-stage v3s-scan-stage--busy">
            {shot && <img className="v3s-scan-shot" src={shot} alt="" />}
            <div className="v3s-scan-veil" />
            <div className="v3s-scan-line" />
          </div>
        )}

        {/* ---------- error ---------- */}
        {phase === 'error' && (
          <div className="v3s-scan-errbox">
            <span className="v3s-scan-err-ico">!</span>
            <p>The photo didn’t go through. It might be the connection — your photo was not saved.</p>
          </div>
        )}

        {/* ---------- actions ---------- */}
        <div className="v3s-scan-actions">
          {phase === 'camera' && mode === 'camera' && !camErr && (
            <button className="v3s-btn" disabled={!ready} onClick={capture}>Take photo <span className="tail">→</span></button>
          )}
          {phase === 'camera' && (
            <button className="v3s-scan-alt" onClick={() => setMode(mode === 'camera' ? 'upload' : 'camera')}>
              {mode === 'camera' ? 'Upload a photo instead' : 'Use camera'}
            </button>
          )}
          {phase === 'analyzing' && (
            <div className="v3s-scan-bar"><span /></div>
          )}
          {phase === 'error' && (
            <>
              <button className="v3s-btn" onClick={retry}>Try again <span className="tail">→</span></button>
              <button className="v3s-scan-alt" onClick={close}>Skip — I’ll answer a few questions</button>
            </>
          )}
        </div>

        {phase !== 'error' && <p className="v3s-scan-privacy">◇ Analyzed once · never stored</p>}
      </div>
    </div>
  );
}

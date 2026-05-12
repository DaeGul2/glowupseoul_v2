// Single-image uploader. Drop or click → presign → S3 PUT → URL written back.
import { useRef, useState } from 'react';
import { adminApi, uploadToS3 } from './api.js';

export default function ImageUploader({ value, onChange, kind, slot, owner, label, hint }) {
  const input = useRef(null);
  const [busy, setBusy]   = useState(false);
  const [pct, setPct]     = useState(0);
  const [error, setError] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    setError(null);
    setBusy(true);
    setPct(0);
    try {
      const presign = await adminApi.presign({
        kind, owner: owner || 'misc', slot,
        mime: file.type, size: file.size,
      });
      const url = await uploadToS3(presign, file, (p) => setPct(Math.round(p * 100)));
      onChange(url);
    } catch (e) {
      setError(e.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div className="gs-iu" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="gs-iu-box">
        {value ? (
          <>
            <img src={value} alt="" className="gs-iu-preview" />
            <div className="gs-iu-actions">
              <button type="button" onClick={() => input.current?.click()}>교체</button>
              <button type="button" className="gs-iu-danger" onClick={() => onChange(null)}>제거</button>
            </div>
          </>
        ) : (
          <button type="button" className="gs-iu-pick" onClick={() => input.current?.click()}>
            <span className="gs-iu-pick-plus">+</span>
            <span className="gs-iu-pick-text">{busy ? `업로드 중 ${pct}%` : '여기에 드래그하거나 클릭해서 업로드'}</span>
          </button>
        )}
        {busy && <div className="gs-iu-bar"><div style={{ width: `${pct}%` }} /></div>}
      </div>
      {error && <div className="gs-iu-error">{error}</div>}
      {hint && <div className="gs-iu-hint">{hint}</div>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {/* raw URL 은 사용자에게 직접 노출하지 않음 — 운영자가 URL 을 손으로 칠 일은 없음.
          외부 URL 을 박아야 하면 details/summary 안에 숨겨둠. */}
      {value && (
        <details className="gs-iu-url-wrap">
          <summary>URL 직접 입력/확인</summary>
          <input
            type="text"
            className="gs-iu-url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
          />
        </details>
      )}
    </div>
  );
}

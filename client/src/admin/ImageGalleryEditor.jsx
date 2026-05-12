// Multi-image gallery — drop several at once, reorder by drag, remove individually.
import { useRef, useState } from 'react';
import { adminApi, uploadToS3 } from './api.js';

export default function ImageGalleryEditor({ value, onChange, kind, slot, owner, label }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(0);     // count of in-flight uploads
  const [error, setError] = useState(null);
  const urls = Array.isArray(value) ? value : [];

  async function uploadOne(file) {
    const presign = await adminApi.presign({
      kind, owner: owner || 'misc', slot: slot || 'gallery',
      mime: file.type, size: file.size,
    });
    return uploadToS3(presign, file);
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setError(null);
    setBusy((n) => n + files.length);
    const results = [];
    for (const f of files) {
      try { results.push(await uploadOne(f)); }
      catch (e) { setError(e.message || 'upload failed'); }
      finally { setBusy((n) => n - 1); }
    }
    if (results.length) onChange([...urls, ...results]);
  }

  function remove(i) {
    onChange(urls.filter((_, idx) => idx !== i));
  }

  function move(i, dir) {
    const next = urls.slice();
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="gs-ige">
      {label && <div className="gs-iu-label">{label}</div>}
      <div className="gs-ige-grid">
        {urls.map((url, i) => (
          <div className="gs-ige-cell" key={url + i}>
            <img src={url} alt="" />
            <div className="gs-ige-cell-ops">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" onClick={() => move(i,  1)} disabled={i === urls.length - 1}>↓</button>
              <button type="button" className="gs-iu-danger" onClick={() => remove(i)}>×</button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="gs-ige-add"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer?.files); }}
        >
          + Add
          {busy > 0 && <span className="gs-ige-busy">{busy}</span>}
        </button>
      </div>
      {error && <div className="gs-iu-error">{error}</div>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// Thin fetch wrapper. Vite dev proxies /api → http://localhost:3001.
// In production the same path works behind any reverse proxy.

export async function analyzeSnapshot(snapshot, { signal } = {}) {
  const r = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshot }),
    signal,
  });
  if (!r.ok) throw new Error(`analyze HTTP ${r.status}`);
  return r.json();
}

export async function synthesizeMatch(payload, { signal } = {}) {
  const r = await fetch('/api/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!r.ok) throw new Error(`synthesize HTTP ${r.status}`);
  return r.json();
}

export async function getClinicReviews(slug, { refresh = false, signal } = {}) {
  const url = `/api/reviews/${encodeURIComponent(slug)}${refresh ? '?refresh=1' : ''}`;
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`reviews HTTP ${r.status}`);
  return r.json();
}

export async function getHealth() {
  try {
    const r = await fetch('/api/health');
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

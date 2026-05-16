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

export async function submitPartner(payload) {
  const r = await fetch('/api/partner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await r.json().catch(() => null);
  if (!r.ok) throw new Error(json?.error || `partner HTTP ${r.status}`);
  return json;
}

export async function getHealth() {
  try {
    const r = await fetch('/api/health');
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

// Public feed (homepage ticker + recent matches section). RDS-backed.
export async function getRecentFeed({ limit = 20, signal } = {}) {
  try {
    const r = await fetch(`/api/feed/recent?limit=${limit}`, { signal });
    if (!r.ok) return { entries: [] };
    return r.json();
  } catch { return { entries: [] }; }
}

// Persist a completed scan/match flow. session_token = our client-side id so
// the same user can later look up their own result.
export async function persistMatchRequest(payload) {
  try {
    const r = await fetch('/api/match-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await r.json().catch(() => null);
    if (!r.ok) {
      console.warn('persistMatchRequest failed', json?.error || r.status);
      return null;
    }
    return json;
  } catch (e) {
    console.warn('persistMatchRequest error', e);
    return null;
  }
}

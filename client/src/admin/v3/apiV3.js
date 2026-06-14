// v3 admin API — talks to /api/v3/admin/*. Auth = X-Admin-Key header
// (== server .env ADMIN_KEY). Verifies against /api/v3/admin/_stats so it
// works against the fresh v3 database (the legacy /api/admin/stats queries
// v2 tables that don't exist in glowupseoul_v3).

const KEY = 'gs_admin_key';

export const getKey   = () => sessionStorage.getItem(KEY) || '';
export const setKey   = (k) => sessionStorage.setItem(KEY, k);
export const clearKey = () => sessionStorage.removeItem(KEY);
export const isAuthed = () => Boolean(getKey());

async function req(method, path, body) {
  const headers = { 'X-Admin-Key': getKey() };
  const init = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (res.status === 401) { clearKey(); throw new Error('unauthorized'); }
  if (!res.ok) throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
  return data;
}

export async function verifyKey(key) {
  try {
    const res = await fetch('/api/v3/admin/_stats', { headers: { 'X-Admin-Key': key } });
    return res.ok;
  } catch { return false; }
}

export const api = {
  stats:  ()             => req('GET', '/api/v3/admin/_stats'),
  list:   (kind, q = '') => req('GET', `/api/v3/admin/${kind}${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get:    (kind, id)     => req('GET', `/api/v3/admin/${kind}/${id}`),
  create: (kind, body)   => req('POST', `/api/v3/admin/${kind}`, body),
  update: (kind, id, b)  => req('PATCH', `/api/v3/admin/${kind}/${id}`, b),
  remove: (kind, id)     => req('DELETE', `/api/v3/admin/${kind}/${id}`),

  // Tag master (normalized M:N)
  listTags:  ()      => req('GET', '/api/v3/admin/_tags'),
  createTag: (body)  => req('POST', '/api/v3/admin/_tags', body),

  // S3 direct upload (reuses the existing presign endpoint)
  presign:   (body)  => req('POST', '/api/admin/upload/presign', body),
};

// Direct browser → S3 PUT. Returns the public URL on success.
export function uploadToS3(presignRes, file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignRes.upload_url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
      ? resolve(presignRes.public_url)
      : reject(new Error(`S3 PUT ${xhr.status}`));
    xhr.onerror = () => reject(new Error('S3 network error'));
    xhr.send(file);
  });
}

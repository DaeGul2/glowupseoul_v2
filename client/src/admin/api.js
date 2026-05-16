// Admin fetch wrapper — auto-injects X-Admin-Key from sessionStorage.
// On 401 → wipes key + reloads (forces login screen).

const KEY_STORAGE = 'gs_admin_key';

export function getAdminKey()    { return sessionStorage.getItem(KEY_STORAGE) || ''; }
export function setAdminKey(k)   { sessionStorage.setItem(KEY_STORAGE, k); }
export function clearAdminKey()  { sessionStorage.removeItem(KEY_STORAGE); }
export function isAdminAuthed()  { return Boolean(getAdminKey()); }

async function request(method, path, body) {
  const headers = { 'X-Admin-Key': getAdminKey() };
  let init = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
  if (res.status === 401) {
    clearAdminKey();
    window.history.pushState({}, '', '/admin/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
    throw new Error('unauthorized');
  }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
  return data;
}

export const adminApi = {
  // Health/stats
  stats:           () => request('GET', '/api/admin/stats'),
  scanStats:       () => request('GET', '/api/admin/scan-stats'),

  // Generic CRUD per kind
  list:    (kind, q = {}) => {
    const qs = new URLSearchParams(q).toString();
    return request('GET', `/api/admin/${kind}${qs ? `?${qs}` : ''}`);
  },
  get:     (kind, id)         => request('GET',    `/api/admin/${kind}/${id}`),
  create:  (kind, body)       => request('POST',   `/api/admin/${kind}`, body),
  update:  (kind, id, body)   => request('PATCH',  `/api/admin/${kind}/${id}`, body),
  remove:  (kind, id)         => request('DELETE', `/api/admin/${kind}/${id}`),

  // Upload
  presign: (body) => request('POST', '/api/admin/upload/presign', body),

  // Partner submissions
  partnerList:    ()        => request('GET',  '/api/admin/partner-submissions'),
  partnerGet:     (file)    => request('GET',  `/api/admin/partner-submissions/${encodeURIComponent(file)}`),
  partnerApprove: (file)    => request('POST', `/api/admin/partner-submissions/${encodeURIComponent(file)}/approve`),
  partnerReject:  (file)    => request('POST', `/api/admin/partner-submissions/${encodeURIComponent(file)}/reject`),
};

// Verify key by calling /api/admin/stats. Resolves to true on success.
export async function verifyAdminKey(key) {
  try {
    const res = await fetch('/api/admin/stats', { headers: { 'X-Admin-Key': key } });
    return res.ok;
  } catch {
    return false;
  }
}

// Direct PUT to a presigned URL. Returns the public URL on success.
export async function uploadToS3(presign, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presign.upload_url);
    xhr.setRequestHeader('Content-Type', file.type);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
      ? resolve(presign.public_url)
      : reject(new Error(`S3 PUT ${xhr.status}`));
    xhr.onerror = () => reject(new Error('S3 network error'));
    xhr.send(file);
  });
}

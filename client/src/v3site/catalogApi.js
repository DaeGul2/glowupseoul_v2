// Public v3 catalog fetch (no auth). Catalog is cached for the session.
let _catalog = null;

export function fetchCatalog() {
  if (!_catalog) {
    _catalog = fetch('/api/v3/catalog')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('catalog'))))
      .catch((e) => { _catalog = null; throw e; });
  }
  return _catalog;
}

export function fetchDetail(kind, slug) {
  return fetch(`/api/v3/catalog/${kind}/${encodeURIComponent(slug)}`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))));
}

// shared enum → label maps (match the admin)
export const DURATION_LABEL = {
  temporary: 'Temporary', months_3_6: '3–6 months', months_6_12: '6–12 months',
  year_1_2: '1–2 years', years_2_plus: '2+ years', semi_permanent: 'Semi-permanent', permanent: 'Permanent',
};
export const PAIN_LABEL = { soft: 'Soft', mild: 'Mild', hard: 'Strong' };
export const RECOVERY_LABEL = { immediate: 'No downtime', '1_2_days': '1–2 days', '1_week_plus': '1 week or more' };
export const fmtKRW = (n) => (n == null ? 'On consultation' : `₩${Number(n).toLocaleString()}`);

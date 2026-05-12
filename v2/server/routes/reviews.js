import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHospitalForReviewQuery } from '../hospitalDirectory.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', 'cache');
const CACHE_FILE = join(CACHE_DIR, 'reviews.json');

// In-memory cache, persisted to disk on every successful upstream call.
// Shape: { [slug]: { fetchedAt: number, placeId: string|null, data: ReviewsPayload, source: 'google'|'mock' } }
let cache = null;
let cacheReady = false;

async function loadCache() {
  if (cacheReady) return cache;
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const txt = await fs.readFile(CACHE_FILE, 'utf8');
    cache = JSON.parse(txt);
  } catch {
    cache = {};
  }
  cacheReady = true;
  return cache;
}

async function persistCache() {
  if (!cacheReady) return;
  try { await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2)); } catch (e) { console.warn('[reviews] cache persist failed', e.message); }
}

function ttlMs() {
  const h = Number(process.env.REVIEWS_CACHE_HOURS || 24);
  return h * 3600 * 1000;
}

function hasKey() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY.trim());
}

// ---------------- Google Places API (New) ----------------
async function googleTextSearch(query) {
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'en', regionCode: 'KR' }),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`textSearch HTTP ${r.status} · ${body.slice(0, 200)}`);
  }
  const json = await r.json();
  return json.places?.[0] || null;
}

async function googlePlaceDetails(placeId, languageCode = 'en') {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${languageCode}`;
  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,websiteUri,reviews',
    },
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`placeDetails(${languageCode}) HTTP ${r.status} · ${body.slice(0, 200)}`);
  }
  return r.json();
}

// Fetch reviews in EN + ZH simultaneously, dedupe by review.name, keep only those
// whose ORIGINAL language is English or Chinese (no Korean→EN translations).
async function fetchEnZhReviews(placeId) {
  const [enDetails, zhDetails] = await Promise.all([
    googlePlaceDetails(placeId, 'en'),
    googlePlaceDetails(placeId, 'zh-CN'),
  ]);

  const seen = new Set();
  const merged = [];

  function consider(rv) {
    const key = rv.name || `${rv.publishTime}_${rv.authorAttribution?.displayName}`;
    if (seen.has(key)) return;
    seen.add(key);

    // Determine the review's TRUE original language.
    const origLang = (rv.originalText?.languageCode || rv.text?.languageCode || '').toLowerCase();
    const isEn = origLang === 'en' || origLang.startsWith('en-');
    const isZh = origLang.startsWith('zh');
    if (!isEn && !isZh) return; // skip ko/ja/etc. translations

    merged.push({
      ...rv,
      _origLang: origLang,
      // Prefer originalText over translated text — we want to show the author's actual words.
      _displayText: rv.originalText?.text || rv.text?.text || '',
      _displayLang: rv.originalText?.languageCode || rv.text?.languageCode || origLang,
    });
  }

  for (const rv of (enDetails.reviews || [])) consider(rv);
  for (const rv of (zhDetails.reviews || [])) consider(rv);

  // Sort: EN first then ZH, within each by recency
  merged.sort((a, b) => {
    const langOrder = (l) => (l.startsWith('en') ? 0 : 1);
    const la = langOrder(a._origLang);
    const lb = langOrder(b._origLang);
    if (la !== lb) return la - lb;
    return (b.publishTime || '').localeCompare(a.publishTime || '');
  });

  return {
    primary: enDetails, // place-level fields (rating, address, etc.) come from EN response
    reviews: merged,
  };
}

function normalizeReview(rv) {
  return {
    author:    rv.authorAttribution?.displayName || 'Anonymous',
    photo:     rv.authorAttribution?.photoUri || null,
    rating:    rv.rating ?? null,
    text:      rv._displayText || rv.originalText?.text || rv.text?.text || '',
    language:  rv._displayLang || rv.originalText?.languageCode || rv.text?.languageCode || null,
    relative:  rv.relativePublishTimeDescription || null,
    publishedAt: rv.publishTime || null,
  };
}

function shapePayload(primary, mergedReviews, hospital) {
  const reviews = (mergedReviews || []).slice(0, 8).map(normalizeReview);
  return {
    placeId:       primary?.id || null,
    name:          primary?.displayName?.text || hospital.name_en,
    address:       primary?.formattedAddress || null,
    rating:        primary?.rating ?? null,
    rating_count:  primary?.userRatingCount ?? 0,
    google_url:    primary?.googleMapsUri || null,
    website:       primary?.websiteUri || hospital.website || null,
    reviews,
    review_lang_breakdown: reviews.reduce((acc, r) => {
      const l = (r.language || 'other').slice(0, 2);
      acc[l] = (acc[l] || 0) + 1;
      return acc;
    }, {}),
  };
}

// ---------------- Mock fallback ----------------
function mockPayload(slug, hospital) {
  const seed = slug.length;
  const rng = (i) => ((seed * 9301 + i * 49297 + 233280) % 233280) / 233280;
  const rating = Math.round((4 + rng(1) * 0.9) * 10) / 10;
  const ratingCount = 120 + Math.floor(rng(2) * 1500);
  const samples = [
    { author: 'A. Tan',    rating: 5, text: 'Coordinator was incredible — they walked me through everything, prep, recovery, even my hotel. Result is exactly what I hoped for.', relative: '2 weeks ago', language: 'en' },
    { author: '王 Mei',     rating: 5, text: '医生很专业，护士很温柔。整体过程很轻松。预约和翻译都安排得很好，回去后会推荐给朋友。', relative: '1 month ago', language: 'zh-CN' },
    { author: 'Sarah K.',  rating: 4, text: 'Clean clinic, English-speaking staff, fair prices. The waiting room could use more seating but otherwise great experience.', relative: '3 months ago', language: 'en' },
    { author: '李 Jing',    rating: 5, text: '从首尔机场接机到术后护理都安排得非常周到。手术效果自然，价格也合理。强烈推荐给海外朋友。', relative: '4 months ago', language: 'zh-CN' },
    { author: 'James L.',  rating: 5, text: 'Followed up via WhatsApp a week after my procedure. That kind of aftercare is rare. Highly recommend.', relative: '5 months ago', language: 'en' },
    { author: 'Karoline',  rating: 5, text: 'I flew from Berlin specifically for this clinic. Worth every euro and minute. The Sisumate on surgery day was beyond kind.', relative: '6 months ago', language: 'en' },
  ].map((s, i) => ({ ...s, photo: null, publishedAt: new Date(Date.now() - (i + 1) * 7 * 86400_000).toISOString() }));
  return {
    placeId: null,
    name: hospital.name_en,
    address: `${hospital.neighborhood}, ${hospital.district}, ${hospital.city}`,
    rating,
    rating_count: ratingCount,
    google_url: `https://www.google.com/maps/search/?q=${encodeURIComponent(hospital.query_en)}`,
    website: hospital.website,
    reviews: samples,
    review_lang_breakdown: samples.reduce((acc, r) => { const l = (r.language || 'other').slice(0, 2); acc[l] = (acc[l] || 0) + 1; return acc; }, {}),
    _mock: true,
  };
}

// ---------------- Handler ----------------
export async function reviewsHandler(req, res) {
  try {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ error: 'slug required' });
    const hospital = getHospitalForReviewQuery(slug);
    if (!hospital) return res.status(404).json({ error: `unknown clinic slug: ${slug}` });

    await loadCache();
    const refresh = req.query.refresh === '1';
    const existing = cache[slug];
    const fresh = existing && (Date.now() - existing.fetchedAt) < ttlMs();
    if (fresh && !refresh) {
      return res.json({ ...existing.data, _cache: 'hit', _fetchedAt: existing.fetchedAt, _source: existing.source });
    }

    if (!hasKey()) {
      const data = mockPayload(slug, hospital);
      cache[slug] = { fetchedAt: Date.now(), placeId: null, data, source: 'mock' };
      await persistCache();
      return res.json({ ...data, _cache: 'miss', _fetchedAt: cache[slug].fetchedAt, _source: 'mock' });
    }

    // 1. find place_id (use cached one if we already have it)
    let placeId = existing?.placeId || hospital.googlePlaceId || null;
    if (!placeId) {
      const found = await googleTextSearch(hospital.query_en);
      if (!found?.id) throw new Error('place not found via text search');
      placeId = found.id;
    }

    // 2. place details + reviews — EN + ZH merged
    const { primary, reviews } = await fetchEnZhReviews(placeId);
    const data = shapePayload(primary, reviews, hospital);
    cache[slug] = { fetchedAt: Date.now(), placeId, data, source: 'google' };
    await persistCache();
    return res.json({ ...data, _cache: 'miss', _fetchedAt: cache[slug].fetchedAt, _source: 'google' });
  } catch (e) {
    console.error('[reviews] error', e?.message || e);
    // graceful fallback — return mock so UI doesn't crash, but flag it
    try {
      const slug = req.params.slug;
      const hospital = getHospitalForReviewQuery(slug);
      if (hospital) {
        const data = mockPayload(slug, hospital);
        return res.status(200).json({ ...data, _cache: 'miss', _source: 'mock_fallback', _error: e?.message });
      }
    } catch {}
    return res.status(500).json({ error: 'reviews fetch failed', detail: e?.message });
  }
}

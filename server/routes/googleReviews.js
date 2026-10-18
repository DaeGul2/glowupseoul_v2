// Glow Up Seoul 자체 구글 리뷰 — 홈페이지 "Reviews" 섹션용.
// Google Places API (New) 로 가게(장소)를 찾고 리뷰를 가져온다. 하드코딩/목업 없음:
// API 가 실패하면 { ok:false, url } 만 돌려주고, 페이지는 "구글에서 리뷰 보기" 링크만 보여준다.
//
// 장소 ID: GOOGLE_PLACE_ID 가 있으면 그걸 쓰고, 없으면 "Glow Up Seoul" 텍스트 검색으로 찾는다.
// Places API 는 리뷰를 최대 5개까지만 준다 (구글 정책). 전체 리뷰는 url 로 연결.

const SEARCH_QUERY = 'Glow Up Seoul';
// 사용자 제공 구글맵 링크 (리뷰 탭이 열리는 형태). API 실패 시에도 이 링크는 항상 보여줌.
export const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/place/glowup+seoul/data=!4m6!3m5!1s0x357ca395b5f2fda7:0x348e4305c8a65ae3!9m1!1b1!16s%2Fg%2F11xtyd24zx';

const OK_TTL_MS = Number(process.env.GOOGLE_REVIEWS_CACHE_HOURS || 6) * 3600 * 1000;
const ERR_TTL_MS = 10 * 60 * 1000;

let cache = null;      // { at, ttl, body }
let inflight = null;
let placeId = (process.env.GOOGLE_PLACE_ID || '').trim() || null;

const key = () => (process.env.GOOGLE_PLACES_API_KEY || '').trim();

async function gfetch(url, init, fieldMask) {
  const r = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), 'X-Goog-Api-Key': key(), 'X-Goog-FieldMask': fieldMask },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status} ${t.slice(0, 160)}`);
  }
  return r.json();
}

async function findPlaceId() {
  if (placeId) return placeId;
  const j = await gfetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      textQuery: SEARCH_QUERY, languageCode: 'en', regionCode: 'KR',
      locationBias: { circle: { center: { latitude: 37.5172, longitude: 127.0473 }, radius: 30000 } },
    }),
  }, 'places.id,places.displayName');
  const hit = (j.places || []).find((p) => /glow\s*up/i.test(p.displayName?.text || ''));
  if (!hit) throw new Error('place not found by text search');
  placeId = hit.id;
  return placeId;
}

function shape(d) {
  const reviews = (d.reviews || []).map((rv) => {
    const text = rv.text?.text || rv.originalText?.text || '';
    const orig = rv.originalText?.text || '';
    const tl = (rv.text?.languageCode || '').slice(0, 2);
    const ol = (rv.originalText?.languageCode || '').slice(0, 2);
    return {
      author: rv.authorAttribution?.displayName || 'Google user',
      author_url: rv.authorAttribution?.uri || null,
      photo: rv.authorAttribution?.photoUri || null,
      rating: rv.rating ?? null,
      text,
      translated: Boolean(orig && ol && tl && ol !== tl),
      relative: rv.relativePublishTimeDescription || '',
      time: rv.publishTime || null,
    };
  }).filter((r) => r.text);
  return {
    ok: true,
    name: d.displayName?.text || 'Glow Up Seoul',
    rating: d.rating ?? null,
    count: d.userRatingCount ?? 0,
    url: GOOGLE_REVIEWS_URL,
    write_url: d.id ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(d.id)}` : null,
    reviews,
  };
}

async function load() {
  if (!key()) throw new Error('GOOGLE_PLACES_API_KEY not set');
  const id = await findPlaceId();
  const d = await gfetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=en`,
    { method: 'GET' }, 'id,displayName,rating,userRatingCount,googleMapsUri,reviews');
  return shape(d);
}

export async function googleReviewsHandler(_req, res) {
  const now = Date.now();
  if (!cache || now - cache.at > cache.ttl) {
    if (!inflight) {
      inflight = load()
        .then((body) => { cache = { at: Date.now(), ttl: OK_TTL_MS, body }; })
        .catch((e) => {
          console.warn('[google-reviews]', e.message);
          // 이전에 받아둔 정상 응답이 있으면 계속 그걸 쓴다.
          if (cache?.body?.ok) cache = { ...cache, at: Date.now(), ttl: ERR_TTL_MS };
          else cache = { at: Date.now(), ttl: ERR_TTL_MS, body: { ok: false, url: GOOGLE_REVIEWS_URL, reviews: [] } };
        })
        .finally(() => { inflight = null; });
    }
    await inflight;
  }
  res.set('Cache-Control', 'public, max-age=600');
  res.json(cache.body);
}

// Glow Up Seoul 자체 구글 리뷰 — 홈페이지 "Reviews" 섹션 · 리뷰 모달 · 스크롤하면 올라오는 리뷰 카드용.
// Google Places API (New) 로 가게(장소)를 찾고 리뷰를 가져온다. 하드코딩/목업 없음:
// API 가 실패하면 { ok:false, url } 만 돌려주고, 페이지는 리뷰 영역을 조용히 접는다.
//
// 장소 ID: GOOGLE_PLACE_ID 가 있으면 그걸 쓰고, 없으면 "Glow Up Seoul" 텍스트 검색으로 찾는다.
// Places API 는 한 번에 리뷰를 최대 5개까지만 준다 (구글 정책). 리뷰가 그보다 많으면 언어를 바꿔
// (GOOGLE_REVIEWS_LANGS, 기본 zh-CN·id) 한 번씩 더 물어 겹치지 않는 리뷰를 모은다 — 언어마다 고르는 5개가 다르다.
// 비용: 리뷰가 든 장소 상세 = Enterprise+Atmosphere (월 1,000회 무료). 12시간 캐시 + 리뷰가 5개 이하면 추가 호출 없음.

const SEARCH_QUERY = 'Glow Up Seoul';
// 사용자 제공 구글맵 링크 (리뷰 탭이 열리는 형태). API 실패 시에도 이 링크는 항상 보여줌.
export const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/place/glowup+seoul/data=!4m6!3m5!1s0x357ca395b5f2fda7:0x348e4305c8a65ae3!9m1!1b1!16s%2Fg%2F11xtyd24zx';

const OK_TTL_MS = Number(process.env.GOOGLE_REVIEWS_CACHE_HOURS || 12) * 3600 * 1000;
const ERR_TTL_MS = 10 * 60 * 1000;
const EXTRA_LANGS = (process.env.GOOGLE_REVIEWS_LANGS || 'zh-CN,id').split(',').map((s) => s.trim()).filter(Boolean);
const FIELDS = 'id,displayName,rating,userRatingCount,googleMapsUri,googleMapsLinks,reviews';

let cache = null;      // { at, ttl, body }
let inflight = null;
let placeId = (process.env.GOOGLE_PLACE_ID || '').trim() || null;

const key = () => (process.env.GOOGLE_PLACES_API_KEY || '').trim();
const lang2 = (c) => String(c || '').toLowerCase().slice(0, 2);

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

const details = (id, lang) => gfetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=${encodeURIComponent(lang)}`,
  { method: 'GET' }, FIELDS);

// 같은 리뷰가 여러 언어 응답에 나오면 하나로 합친다. 화면에는 영어를 우선 보여주고 (영어 응답의 text = 영어 원문 또는 구글 번역),
// 영어 응답에 없던 리뷰는 원문 그대로 둔다 (중국어 리뷰는 중국어로).
function merge(responses) {
  const byId = new Map();
  responses.forEach(({ lang, d }) => (d.reviews || []).forEach((rv, idx) => {
    const id = rv.name || `${rv.authorAttribution?.displayName}|${rv.publishTime}`;
    const row = byId.get(id) || {
      id,
      author: rv.authorAttribution?.displayName || 'Google user',
      author_url: rv.authorAttribution?.uri || null,
      photo: rv.authorAttribution?.photoUri || null,
      rating: rv.rating ?? null,
      time: rv.publishTime || null,
      link: rv.googleMapsUri || null,
      orig: rv.originalText?.text || rv.text?.text || '',
      orig_lang: lang2(rv.originalText?.languageCode || rv.text?.languageCode || lang),
      en: null, relative: '', rank: null,
    };
    if (lang === 'en') {
      row.rank = idx;                                   // 구글이 "관련성 높은 순"으로 준 순서
      row.relative = rv.relativePublishTimeDescription || '';
      row.en = rv.text?.text || null;
    }
    byId.set(id, row);
  }));
  const rows = [...byId.values()].map((r) => {
    const en = r.orig_lang !== 'en' && r.en && r.en !== r.orig ? r.en : null;   // 구글 번역본
    return {
      id: r.id, author: r.author, author_url: r.author_url, photo: r.photo, rating: r.rating,
      text: r.orig_lang === 'en' ? r.orig : (en || r.orig),
      lang: r.orig_lang === 'en' || en ? 'en' : r.orig_lang,
      translated: Boolean(en),
      orig: en ? r.orig : null,
      orig_lang: r.orig_lang || null,
      relative: r.relative,
      time: r.time, link: r.link, rank: r.rank,
    };
  }).filter((r) => r.text);
  // 영어 응답에 있던 리뷰는 구글 순서대로, 다른 언어에서만 나온 리뷰는 최신순으로 뒤에
  const t = (r) => Date.parse(r.time || 0) || 0;
  const first = rows.filter((r) => r.rank != null).sort((a, b) => a.rank - b.rank);
  const rest = rows.filter((r) => r.rank == null).sort((a, b) => t(b) - t(a));
  return [...first, ...rest].map(({ rank, ...r }) => r);
}

async function load() {
  if (!key()) throw new Error('GOOGLE_PLACES_API_KEY not set');
  const id = await findPlaceId();
  const en = await details(id, 'en');
  const responses = [{ lang: 'en', d: en }];
  // 리뷰가 5개보다 많을 때만 다른 언어로 더 물어본다
  if ((en.userRatingCount || 0) > (en.reviews || []).length && EXTRA_LANGS.length) {
    const more = await Promise.allSettled(EXTRA_LANGS.map((l) => details(id, l).then((d) => ({ lang: l, d }))));
    more.forEach((m) => { if (m.status === 'fulfilled') responses.push(m.value); else console.warn('[google-reviews] extra lang', m.reason?.message); });
  }
  const pid = en.id || id;
  return {
    ok: true,
    name: en.displayName?.text || 'Glow Up Seoul',
    rating: en.rating ?? null,
    count: en.userRatingCount ?? 0,
    url: en.googleMapsLinks?.reviewsUri || GOOGLE_REVIEWS_URL,
    write_url: en.googleMapsLinks?.writeAReviewUri || (pid ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(pid)}` : null),
    reviews: merge(responses),
  };
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

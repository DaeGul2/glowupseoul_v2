// Glow Up Seoul 자체 구글 리뷰 — 홈페이지 "Reviews" 섹션 · 리뷰 모달 · 스크롤하면 올라오는 리뷰 카드용.
// Google Places API (New) 로 가게(장소)를 찾고 리뷰를 가져온다. 하드코딩/목업 없음:
// API 가 실패하면 { ok:false, url } 만 돌려주고, 페이지는 리뷰 영역을 조용히 접는다.
//
// 장소 ID: GOOGLE_PLACE_ID 가 있으면 그걸 쓰고, 없으면 "Glow Up Seoul" 텍스트 검색으로 찾는다.
// Places API 는 한 번에 리뷰를 최대 5개까지만 준다 (구글 정책). 리뷰가 그보다 많으면 언어를 바꿔
// (GOOGLE_REVIEWS_LANGS, 기본 zh-CN·id) 한 번씩 더 물어 겹치지 않는 리뷰를 모은다 — 언어마다 고르는 5개가 다르다.
// 비용: 리뷰가 든 장소 상세 = Enterprise+Atmosphere (월 1,000회 무료). 12시간 캐시 + 리뷰가 5개 이하면 추가 호출 없음.
// 10/19 "돈 내야 됨?": 구글 호출은 하루 GOOGLE_REVIEWS_DAILY_MAX(기본 30)번까지만 — 한 달 최대 900번이라 무료 한도 안.
// 횟수는 settings 테이블(google_reviews_usage)에 남겨서 Render 가 재시작돼도 이어서 센다. 상한에 걸리면 구글을 안 부르고
// 받아둔 리뷰를 계속 보여준다(없으면 섹션이 접힘). 장소 ID 는 구글 약관상 계속 저장해도 돼서 settings(google_place_id)에 둔다.

import { Setting } from '../db/modelsV3.js';
import { hasDbConfig } from '../db/sequelize.js';

const SEARCH_QUERY = 'Glow Up Seoul';
// 사용자 제공 구글맵 링크 (리뷰 탭이 열리는 형태). API 실패 시에도 이 링크는 항상 보여줌.
export const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/place/glowup+seoul/data=!4m6!3m5!1s0x357ca395b5f2fda7:0x348e4305c8a65ae3!9m1!1b1!16s%2Fg%2F11xtyd24zx';

const OK_TTL_MS = Number(process.env.GOOGLE_REVIEWS_CACHE_HOURS || 12) * 3600 * 1000;
const ERR_TTL_MS = 10 * 60 * 1000;
const EXTRA_LANGS = (process.env.GOOGLE_REVIEWS_LANGS || 'zh-CN,id').split(',').map((s) => s.trim()).filter(Boolean);
const FIELDS = 'id,displayName,rating,userRatingCount,googleMapsUri,googleMapsLinks,reviews';
const DAILY_MAX = Number(process.env.GOOGLE_REVIEWS_DAILY_MAX || 30);
const USAGE_KEY = 'google_reviews_usage';   // {"day":"2026-10-19","n":3}
const PLACE_KEY = 'google_place_id';
const EXTRA_KEY = 'google_reviews_extra';    // {"checked":"…","added":0} — 다른 언어로 물었을 때 새로 나온 리뷰 수

let cache = null;      // { at, ttl, body }
let inflight = null;
let placeId = (process.env.GOOGLE_PLACE_ID || '').trim() || null;
let memUsage = { day: '', n: 0 };   // DB 가 안 될 때만 쓰는 대체 카운터
let memExtra = null;                 // 〃 (다른 언어 확인 결과)

const key = () => (process.env.GOOGLE_PLACES_API_KEY || '').trim();
const lang2 = (c) => String(c || '').toLowerCase().slice(0, 2);
const today = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);   // 한국 날짜

async function getStored(skey) {
  if (!hasDbConfig()) return null;
  try { return (await Setting.findByPk(skey, { raw: true }))?.value ?? null; } catch { return null; }
}
async function putStored(skey, value) {
  if (!hasDbConfig()) return;
  try { await Setting.upsert({ skey, value }); } catch (e) { console.warn('[google-reviews] settings save', e.message); }
}

// 하루 호출 수 (구글에 보내기 전에 센다 — 실패한 호출도 포함해서 보수적으로)
async function readUsage() {
  const d = today();
  let u = memUsage.day === d ? memUsage : { day: d, n: 0 };
  try {
    const s = JSON.parse((await getStored(USAGE_KEY)) || '{}');
    if (s.day === d && Number(s.n) > u.n) u = { day: d, n: Number(s.n) };
  } catch { /* 깨진 값이면 메모리 기준 */ }
  return { ...u };
}
async function spend(u) {
  if (u.n >= DAILY_MAX) throw new Error(`daily limit reached (${u.n}/${DAILY_MAX})`);
  u.n += 1;
  memUsage = { day: u.day, n: u.n };
  await putStored(USAGE_KEY, JSON.stringify(memUsage));
}

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

async function findPlaceId(u) {
  if (placeId) return placeId;
  const saved = (await getStored(PLACE_KEY) || '').trim();
  if (saved) { placeId = saved; return placeId; }
  await spend(u);
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
  await putStored(PLACE_KEY, placeId);
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
  const u = await readUsage();
  const id = await findPlaceId(u);
  await spend(u);
  const en = await details(id, 'en').catch(async (e) => {
    // 구글이 장소 ID 를 바꾼 경우: 저장해둔 ID 를 지워서 다음에 다시 찾게 한다
    if (/HTTP 404/.test(e.message)) { placeId = null; await putStored(PLACE_KEY, ''); }
    throw e;
  });
  const responses = [{ lang: 'en', d: en }];
  // 리뷰가 5개보다 많을 때만 다른 언어로 더 물어본다 (하루 상한 안에서).
  // 지난번에 다른 언어로 물어서 새 리뷰가 하나도 안 나왔으면 일주일 동안은 건너뛴다 (10/19: 6개 중 5개가 전부 영어라 헛호출).
  let extra = {};
  try { extra = JSON.parse((await getStored(EXTRA_KEY)) || 'null') || memExtra || {}; } catch { extra = memExtra || {}; }
  const skipExtra = extra.added === 0 && Date.now() - Date.parse(extra.checked || 0) < 7 * 86400 * 1000;
  if ((en.userRatingCount || 0) > (en.reviews || []).length && !skipExtra && EXTRA_LANGS.length) {
    for (const l of EXTRA_LANGS) {
      if (u.n >= DAILY_MAX) break;
      await spend(u);
      try { responses.push({ lang: l, d: await details(id, l) }); } catch (e) { console.warn('[google-reviews] extra lang', l, e.message); }
    }
    const seen = new Set((en.reviews || []).map((r) => r.name));
    const added = new Set(responses.slice(1).flatMap((x) => (x.d.reviews || []).map((r) => r.name)).filter((n) => !seen.has(n))).size;
    memExtra = { checked: new Date().toISOString(), added };
    await putStored(EXTRA_KEY, JSON.stringify(memExtra));
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

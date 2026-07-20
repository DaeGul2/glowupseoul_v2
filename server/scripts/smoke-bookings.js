// bookings 흐름 스모크 테스트 — 서버 기동 없이 핸들러 직접 호출.
//   node scripts/smoke-bookings.js
// 검증: 신청 생성 → 코드 조회 → (운영자 확정 시뮬레이션) → availability 차단 → 정리.

import 'dotenv/config';
process.env.TURNSTILE_SECRET_KEY = '';   // 스모크에선 Turnstile 건너뜀 (핸들러 로직만 검증)
process.env.BOOKING_RATE_MAX = '100';    // 스모크의 연속 호출이 rate limit 에 안 걸리게

const { createBookingHandler, availabilityHandler, getBookingByCodeHandler } =
  await import('../routes/bookingsV3.js');
const { Booking, sequelize } = await import('../db/modelsV3.js');

function mockRes() {
  const r = { statusCode: 200, body: null };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
}
const req = (body = {}, query = {}, params = {}) => ({ body, query, params, ip: '127.0.0.1' });

let failed = 0;
const check = (name, cond, detail) => {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${cond ? '' : `  ← ${JSON.stringify(detail)}`}`);
  if (!cond) failed = 1;
};

// 리드타임(기본 3일) 밖의 안전한 테스트 날짜
const wish = new Date(Date.now() + 14 * 86400 * 1000).toISOString().slice(0, 10);

console.log('\n[1] POST /api/v3/bookings — 신청 생성');
let res = mockRes();
await createBookingHandler(req({
  kind: 'treatment', slug: 'ulthera',
  requested_date: wish,
  client_name: 'SMOKE TEST', country_code: 'SG',
  whatsapp: '+6500000000', notes: 'smoke test row — safe to delete',
}), res);
check('201 created', res.statusCode === 201, res.body);
const code = res.body?.code;
check('code issued (GUS-….)', /^GUS-[A-Z0-9]{4}$/.test(code || ''), res.body);
check('status = requested', res.body?.status === 'requested', res.body);

console.log('\n[1-b] 날짜 미정(flexible) 신청');
res = mockRes();
await createBookingHandler(req({
  kind: 'treatment', slug: 'ulthera', requested_date: null,
  client_name: 'SMOKE FLEX', whatsapp: '+6500000009',
}), res);
check('201 + requested_date null', res.statusCode === 201 && res.body?.requested_date == null, res.body);
const flexCode = res.body?.code;

console.log('\n[2] 검증 실패 케이스');
const VALID = { client_name: 'Smoke Tester', whatsapp: '+6581234567' };
res = mockRes();
await createBookingHandler(req({ kind: 'treatment', slug: 'ulthera', requested_date: '2020-01-01', ...VALID }), res);
check('과거 날짜 → 400', res.statusCode === 400, res.body);
res = mockRes();
await createBookingHandler(req({ kind: 'treatment', slug: 'no-such-slug', requested_date: wish, ...VALID }), res);
check('없는 시술 → 404', res.statusCode === 404, res.body);
res = mockRes();
await createBookingHandler(req({ kind: 'treatment', slug: 'ulthera', requested_date: wish, whatsapp: VALID.whatsapp }), res);
check('이름 누락 → 400', res.statusCode === 400, res.body);
res = mockRes();
await createBookingHandler(req({ kind: 'treatment', slug: 'ulthera', requested_date: wish, client_name: 'Smoke Tester', whatsapp: '+65 123' }), res);
check('전화 너무 짧음(6자리) → 400', res.statusCode === 400 && /whatsapp/.test(res.body?.error || ''), res.body);
res = mockRes();
await createBookingHandler(req({ kind: 'treatment', slug: 'ulthera', requested_date: wish, ...VALID, whatsapp: '+123456789012345678' }), res);
check('전화 너무 김(18자리) → 400', res.statusCode === 400, res.body);
res = mockRes();
await createBookingHandler(req({ kind: 'treatment', slug: 'ulthera', requested_date: wish, ...VALID, email: 'not-an-email' }), res);
check('잘못된 이메일 → 400', res.statusCode === 400 && /email/.test(res.body?.error || ''), res.body);
res = mockRes();
await createBookingHandler(req({ kind: 'treatment', slug: 'ulthera', requested_date: wish, ...VALID, email: 'ok@example.com', country_code: '12#' }), res);
check('잘못된 국가코드 → 400', res.statusCode === 400, res.body);

console.log('\n[3] GET /api/v3/bookings/:code — 고객 조회');
res = mockRes();
await getBookingByCodeHandler(req({}, {}, { code }), res);
check('200 + 상태 반환', res.statusCode === 200 && res.body?.status === 'requested', res.body);
check('개인정보 미노출', !('whatsapp' in (res.body || {})) && !('client_name' in (res.body || {})), res.body);

console.log('\n[4] requested 는 캘린더를 안 막는다');
res = mockRes();
await availabilityHandler(req({}, { from: wish, to: wish }), res);
check('blocked 에 없음', Array.isArray(res.body?.blocked) && !res.body.blocked.includes(wish), res.body);

console.log('\n[5] 운영자 확정 시뮬레이션 → 기간 차단');
const wishEnd = new Date(Date.parse(wish) + 2 * 86400 * 1000).toISOString().slice(0, 10);
await Booking.update(
  { status: 'confirmed', confirmed_start: wish, confirmed_end: wishEnd },
  { where: { code } }
);
res = mockRes();
await availabilityHandler(req({}, { from: wish, to: wishEnd }), res);
check('확정 기간 3일 전부 차단', res.body?.blocked?.length === 3 && res.body.blocked.includes(wish) && res.body.blocked.includes(wishEnd), res.body);

console.log('\n[6] 정리 — 테스트 행 삭제');
await Booking.destroy({ where: { code } });
if (flexCode) await Booking.destroy({ where: { code: flexCode } });
const left = await Booking.count({ where: { code } });
check('삭제 완료', left === 0, { left });

await sequelize.close();
console.log(failed ? '\n✗ SMOKE FAILED' : '\n✓ ALL SMOKE PASSED');
process.exit(failed);

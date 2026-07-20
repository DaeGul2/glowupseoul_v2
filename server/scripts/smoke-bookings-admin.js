// admin 부킹/설정 흐름 스모크 — 서버 기동 없이 핸들러 직접 호출.
//   node scripts/smoke-bookings-admin.js
// 검증: 블록 생성 → 겹침 409 → 확정 겹침 409 → 설정 patch/get → ICS → 정리.

import 'dotenv/config';
process.env.TURNSTILE_SECRET_KEY = '';
process.env.BOOKING_RATE_MAX = '100';

const { createBookingHandler, availabilityHandler, bookingIcsHandler } = await import('../routes/bookingsV3.js');
const {
  adminBookingList, adminBookingCreate, adminBookingUpdate, adminBookingDelete,
  adminSettingsGet, adminSettingsPatch,
} = await import('../routes/adminBookingsV3.js');
const { Booking, Setting, sequelize } = await import('../db/modelsV3.js');

function mockRes() {
  const r = { statusCode: 200, body: null, headers: {}, sent: null };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.set = (k, v) => { r.headers[k] = v; return r; };
  r.send = (b) => { r.sent = b; return r; };
  return r;
}
const req = (body = {}, query = {}, params = {}) => ({ body, query, params, ip: '127.0.0.1' });

let failed = 0;
const check = (name, cond, detail) => {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${cond ? '' : `  ← ${JSON.stringify(detail)?.slice(0, 300)}`}`);
  if (!cond) failed = 1;
};
const day = (n) => new Date(Date.now() + n * 86400 * 1000).toISOString().slice(0, 10);
const cleanup = [];

console.log('\n[1] 블록 생성 (개인 일정 차단)');
let res = mockRes();
await adminBookingCreate(req({ item_kind: 'block', confirmed_start: day(30), confirmed_end: day(32), admin_note: 'smoke: vacation' }), res);
check('201 + confirmed', res.statusCode === 201 && res.body?.row?.status === 'confirmed', res.body);
cleanup.push(res.body?.row?.id);

console.log('\n[2] 겹치는 블록 → 409');
res = mockRes();
await adminBookingCreate(req({ item_kind: 'block', confirmed_start: day(31), confirmed_end: day(31), admin_note: 'smoke: clash' }), res);
check('409 + overlaps 목록', res.statusCode === 409 && Array.isArray(res.body?.overlaps), res.body);

console.log('\n[3] 고객 신청 → 겹치는 기간으로 확정 시도 → 409, 빈 기간으로 확정 → OK');
res = mockRes();
await createBookingHandler(req({ kind: 'treatment', slug: 'ulthera', requested_date: day(40), client_name: 'SMOKE A', whatsapp: '+6500000001' }), res);
const bid = (await Booking.findOne({ where: { code: res.body?.code } }))?.id;
cleanup.push(bid);
check('신청 생성', res.statusCode === 201 && bid, res.body);
res = mockRes();
await adminBookingUpdate(req({ status: 'confirmed', confirmed_start: day(31), confirmed_end: day(33) }, {}, { id: bid }), res);
check('블록과 겹침 → 409', res.statusCode === 409, res.body);
res = mockRes();
await adminBookingUpdate(req({ status: 'confirmed', confirmed_start: day(40), confirmed_end: day(41) }, {}, { id: bid }), res);
check('빈 기간 확정 → 200', res.statusCode === 200 && res.body?.row?.status === 'confirmed', res.body);

console.log('\n[4] availability 에 블록+확정 모두 반영');
res = mockRes();
await availabilityHandler(req({}, { from: day(29), to: day(42) }), res);
const blocked = res.body?.blocked || [];
check('블록 3일 + 확정 2일 = 5일 차단', blocked.length === 5 && blocked.includes(day(30)) && blocked.includes(day(41)), res.body);

console.log('\n[5] 목록/필터');
res = mockRes();
await adminBookingList(req({}, { status: 'confirmed' }), res);
check('confirmed 필터에 2건 포함', (res.body?.rows || []).filter((r) => cleanup.includes(r.id)).length === 2, res.body?.rows?.length);

console.log('\n[6] ICS');
const code = (await Booking.findByPk(bid)).code;
res = mockRes();
await bookingIcsHandler(req({}, {}, { code }), res);
check('ics 응답', res.statusCode === 200 && String(res.sent).includes('BEGIN:VCALENDAR') && String(res.sent).includes(code), res.sent?.slice?.(0, 80));

console.log('\n[7] 설정 patch → get 반영');
res = mockRes();
await adminSettingsPatch(req({ booking_min_lead_days: '5', not_allowed_key: 'x' }), res);
check('patch ok + 화이트리스트 필터', res.body?.ok && res.body.applied.booking_min_lead_days === '5' && !('not_allowed_key' in res.body.applied), res.body);
res = mockRes();
await adminSettingsGet(req(), res);
check('effective 반영 (5)', res.body?.effective?.booking_min_lead_days === '5', res.body?.effective);
await Setting.destroy({ where: { skey: 'booking_min_lead_days' } });

console.log('\n[8] 정리');
for (const id of cleanup.filter(Boolean)) {
  res = mockRes();
  await adminBookingDelete(req({}, {}, { id }), res);
}
const left = await Booking.count({ where: { admin_note: { } } }).catch(() => 0);
check('테스트 행 삭제', (await Booking.count({ where: { client_name: 'SMOKE A' } })) === 0, { left });

await sequelize.close();
console.log(failed ? '\n✗ SMOKE FAILED' : '\n✓ ALL ADMIN SMOKE PASSED');
process.exit(failed);

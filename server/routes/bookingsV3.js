// v3 부킹 — 컨시어지 트립 예약 (1인 운영).
//
// 흐름:
//   POST /api/v3/bookings           고객 신청 (requested — 날짜 안 막음) + 운영자 알림
//   GET  /api/v3/bookings/availability   차단된 날짜 목록 (confirmed 기간 + block)
//   GET  /api/v3/bookings/:code     고객 본인 부킹 상태 조회 (개인정보 미노출)
//
// 원칙:
//   · requested 는 캘린더를 막지 않는다 — 운영자가 조율 후 확정한 기간만 차단.
//   · 알림 실패가 저장을 막지 않는다 — DB가 진실, 알림은 fire-and-forget.
//   · Turnstile secret 이 설정돼 있으면 토큰 검증 강제 (봇 차단).

import { Booking, Treatment, Surgery, Op } from '../db/modelsV3.js';
import { getSetting, getSettingInt } from '../utils/settingsStore.js';
import { verifyTurnstile } from '../utils/turnstile.js';
import { notifyNewBooking } from '../utils/notify.js';

/* ---------------- helpers ---------------- */

// KST 기준 오늘 (YYYY-MM-DD) — 서버가 UTC 여도 서울 날짜 기준으로 리드타임 계산.
function todayKst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const isIsoDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

// 헷갈리는 글자(0/O, 1/I/L) 제외한 부킹 코드 — 예: GUS-7F3K
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function genCode() {
  let s = '';
  for (let i = 0; i < 4; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return `GUS-${s}`;
}

const cap = (v, n) => (v == null ? null : String(v).slice(0, n).trim() || null);

// 서버측 최종 검증 (클라 검증은 UX 용 — 여기가 진짜 방어선)
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
// E.164: + 뒤 7~15자리. 입력에서 숫자만 추출해 정규화.
function normalizePhone(v) {
  const digits = String(v || '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return `+${digits}`;
}

// 초경량 IP rate-limit — Turnstile 통과한 봇/실수 연타 대비 2차 방어.
// BOOKING_RATE_MAX 는 테스트(smoke)용 오버라이드.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = Number(process.env.BOOKING_RATE_MAX) || 5;
const rateMap = new Map(); // ip → [timestamps]
function rateLimited(ip) {
  const now = Date.now();
  const arr = (rateMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) { rateMap.set(ip, arr); return true; }
  arr.push(now);
  rateMap.set(ip, arr);
  if (rateMap.size > 5000) rateMap.clear(); // 메모리 폭주 방지 (조악해도 충분)
  return false;
}

// 기간 [start,end] 를 날짜 문자열 배열로 전개 (최대 400일 가드)
function expandRange(start, end) {
  const out = [];
  let d = start;
  for (let i = 0; i < 400 && d <= end; i++) { out.push(d); d = addDays(d, 1); }
  return out;
}

async function loadBookingConfig() {
  const enabled = (await getSetting('booking_enabled', 'BOOKING_ENABLED', '1')) !== '0';
  // 잘못 저장된 값이 캘린더를 잠그지 않게 안전 범위로 클램프
  let minLead = await getSettingInt('booking_min_lead_days', 'BOOKING_MIN_LEAD_DAYS', 3);
  let maxAhead = await getSettingInt('booking_max_ahead_days', 'BOOKING_MAX_AHEAD_DAYS', 180);
  minLead = Math.min(Math.max(minLead, 0), 60);
  maxAhead = Math.min(Math.max(maxAhead, 7), 400);
  if (maxAhead <= minLead) maxAhead = minLead + 30;
  const today = todayKst();
  return { enabled, minLead, maxAhead, minDate: addDays(today, minLead), maxDate: addDays(today, maxAhead) };
}

// confirmed 상태(고객 부킹 + block)의 기간들이 [from,to] 창과 겹치는 행
async function findBlockingRows(from, to) {
  return Booking.findAll({
    where: {
      status: 'confirmed',
      confirmed_start: { [Op.ne]: null },
      confirmed_end: { [Op.ne]: null },
      [Op.and]: [
        { confirmed_start: { [Op.lte]: to } },
        { confirmed_end: { [Op.gte]: from } },
      ],
    },
    attributes: ['id', 'confirmed_start', 'confirmed_end'],
    raw: true,
  });
}

/* ---------------- handlers ---------------- */

// POST /api/v3/bookings
// body: { kind: 'treatment'|'surgery', slug, requested_date, client_name,
//         country_code, whatsapp, email?, notes?, turnstile_token }
export async function createBookingHandler(req, res) {
  try {
    const cfg = await loadBookingConfig();
    if (!cfg.enabled) return res.status(503).json({ error: 'bookings are temporarily closed' });

    if (rateLimited(req.ip || 'unknown')) {
      return res.status(429).json({ error: 'too many requests — please try again later' });
    }

    const b = req.body || {};

    const ts = await verifyTurnstile(b.turnstile_token, req.ip);
    if (!ts.ok) return res.status(403).json({ error: 'verification failed — please refresh and try again' });

    const kind = b.kind === 'surgery' ? 'surgery' : b.kind === 'treatment' ? 'treatment' : null;
    if (!kind) return res.status(400).json({ error: 'kind must be treatment or surgery' });

    const slug = cap(b.slug, 80);
    if (!slug) return res.status(400).json({ error: 'slug required' });
    const Model = kind === 'surgery' ? Surgery : Treatment;
    const item = await Model.findOne({ where: { slug, is_active: true, deleted_at: null } });
    if (!item) return res.status(404).json({ error: `${kind} not found` });

    const clientName = cap(b.client_name, 120);
    if (!clientName || clientName.length < 2) return res.status(400).json({ error: 'please enter your name' });

    const whatsapp = normalizePhone(b.whatsapp);
    if (!whatsapp) return res.status(400).json({ error: 'whatsapp number must be 7–15 digits (with country code)' });

    const email = cap(b.email, 200);
    if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'that email address does not look right' });

    const countryCode = cap(b.country_code, 8);
    if (countryCode && !/^[A-Za-z]{2,8}$/.test(countryCode)) return res.status(400).json({ error: 'bad country code' });

    // 날짜 미정("아직 정해진 날짜 없음") 허용 — requested_date = null 로 저장,
    // 운영자가 WhatsApp 조율 후 admin 에서 기간 확정.
    const flexible = b.requested_date == null || b.requested_date === '';
    let requestedDate = null;
    if (!flexible) {
      requestedDate = b.requested_date;
      if (!isIsoDate(requestedDate)) return res.status(400).json({ error: 'requested_date must be YYYY-MM-DD' });
      if (requestedDate < cfg.minDate) return res.status(400).json({ error: `earliest available date is ${cfg.minDate}` });
      if (requestedDate > cfg.maxDate) return res.status(400).json({ error: `latest available date is ${cfg.maxDate}` });
    }

    // 희망일이 이미 확정 차단된 날이면 신청 단계에서 미리 알려줌 (조율은 가능하니 soft 안내)
    const clash = requestedDate ? await findBlockingRows(requestedDate, requestedDate) : [];

    // 코드 충돌 시 재시도 (4자 코드 공간 ~92만 — 충돌 희박)
    let booking = null;
    for (let i = 0; i < 5 && !booking; i++) {
      try {
        booking = await Booking.create({
          code: genCode(),
          item_kind: kind,
          item_id: item.id,
          item_name: item.name,
          client_name: clientName,
          country_code: countryCode ? countryCode.toUpperCase() : null,
          whatsapp,
          email,
          notes: cap(b.notes, 2000),
          requested_date: requestedDate,
          status: 'requested',
        });
      } catch (e) {
        if (e?.name !== 'SequelizeUniqueConstraintError') throw e;
      }
    }
    if (!booking) return res.status(500).json({ error: 'could not allocate booking code' });

    // 알림은 응답을 막지 않는다
    notifyNewBooking(booking).catch((e) => console.error('[bookings] notify error:', e.message));

    return res.status(201).json({
      ok: true,
      code: booking.code,
      status: booking.status,
      requested_date: requestedDate,
      date_tentative: clash.length > 0, // true 면 "그 날짜는 조율이 필요할 수 있음" 안내용
      message: 'Request received — Romie will reach out on WhatsApp within 24 hours.',
    });
  } catch (e) {
    console.error('[bookings] create failed:', e);
    return res.status(500).json({ error: 'internal' });
  }
}

// GET /api/v3/bookings/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
// 고객 캘린더용 — 차단된 날짜 + 선택 가능 창(min/max) 반환.
export async function availabilityHandler(req, res) {
  try {
    const cfg = await loadBookingConfig();
    const from = isIsoDate(req.query.from) ? req.query.from : todayKst();
    const to = isIsoDate(req.query.to) ? req.query.to : cfg.maxDate;
    if (to < from) return res.status(400).json({ error: 'to must be >= from' });

    const rows = await findBlockingRows(from, to);
    const blocked = new Set();
    for (const r of rows) {
      const s = r.confirmed_start > from ? r.confirmed_start : from;
      const e = r.confirmed_end < to ? r.confirmed_end : to;
      for (const d of expandRange(s, e)) blocked.add(d);
    }
    return res.json({
      enabled: cfg.enabled,
      window: { min_date: cfg.minDate, max_date: cfg.maxDate },
      blocked: [...blocked].sort(),
    });
  } catch (e) {
    console.error('[bookings] availability failed:', e);
    return res.status(500).json({ error: 'internal' });
  }
}

// GET /api/v3/bookings/:code/ics — 확정된 부킹의 캘린더 파일 (Add to calendar)
export async function bookingIcsHandler(req, res) {
  try {
    const code = String(req.params.code || '').toUpperCase().trim().slice(0, 16);
    const b = await Booking.findOne({ where: { code } });
    if (!b || b.item_kind === 'block' || b.status !== 'confirmed' || !b.confirmed_start || !b.confirmed_end) {
      return res.status(404).json({ error: 'no confirmed booking for this code' });
    }
    const d = (iso) => iso.replaceAll('-', '');
    const endExcl = addDays(b.confirmed_end, 1); // DTEND (all-day) 는 exclusive
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Glow Up Seoul//Booking//EN',
      'BEGIN:VEVENT',
      `UID:${b.code}@glowupseoul.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;VALUE=DATE:${d(b.confirmed_start)}`,
      `DTEND;VALUE=DATE:${d(endExcl)}`,
      `SUMMARY:Glow Up Seoul — ${b.item_name} trip`,
      `DESCRIPTION:Booking ${b.code}. Your coordinator (Romie) will be in touch on WhatsApp.`,
      'LOCATION:Seoul, South Korea',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="glowupseoul-${b.code}.ics"`);
    return res.send(ics);
  } catch (e) {
    console.error('[bookings] ics failed:', e);
    return res.status(500).json({ error: 'internal' });
  }
}

// GET /api/v3/bookings/:code — 고객 본인 조회. 개인정보(이름/번호/메모)는 에코하지 않음.
export async function getBookingByCodeHandler(req, res) {
  try {
    const code = String(req.params.code || '').toUpperCase().trim().slice(0, 16);
    const b = await Booking.findOne({ where: { code } });
    if (!b || b.item_kind === 'block') return res.status(404).json({ error: 'booking not found' });
    return res.json({
      code: b.code,
      status: b.status,
      item_kind: b.item_kind,
      item_name: b.item_name,
      requested_date: b.requested_date,
      confirmed_start: b.confirmed_start,
      confirmed_end: b.confirmed_end,
      created_at: b.created_at,
    });
  } catch (e) {
    console.error('[bookings] get failed:', e);
    return res.status(500).json({ error: 'internal' });
  }
}

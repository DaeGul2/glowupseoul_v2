// v3 admin — 부킹 관리 + 운영 설정. requireAdmin(X-Admin-Key) 뒤에 마운트.
//
//   GET    /api/v3/admin/bookings?status=&month=YYYY-MM   목록
//   POST   /api/v3/admin/bookings                          수동 부킹 / 일정 차단(block) 생성
//   PATCH  /api/v3/admin/bookings/:id                      확정(기간+겹침검사)·상태 변경·메모
//   DELETE /api/v3/admin/bookings/:id                      삭제 (블록/오입력 정리용)
//   GET    /api/v3/admin/settings                          설정 전체 (effective 값 포함)
//   PATCH  /api/v3/admin/settings                          설정 upsert (+캐시 무효화)
//   POST   /api/v3/admin/settings/_test-alert              알림 채널 테스트 발사

import { Booking, Setting, Treatment, Surgery, Op } from '../db/modelsV3.js';
import { invalidateSettings, getSetting } from '../utils/settingsStore.js';
import { notifyNewBooking, notifyBookingConfirmed, buildBookingAlert } from '../utils/notify.js';

const STATUSES = ['requested', 'confirmed', 'completed', 'cancelled', 'declined'];
const isIsoDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const cap = (v, n) => (v == null ? null : String(v).slice(0, n).trim() || null);

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
// admin 은 수기 입력이 많아 느슨하게: 값이 있으면 형식만 검사, 빈 값 허용.
function checkContact(b) {
  if (b.whatsapp != null && String(b.whatsapp).trim() !== '') {
    const digits = String(b.whatsapp).replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return 'whatsapp number must be 7–15 digits';
  }
  if (b.email != null && String(b.email).trim() !== '' && !EMAIL_RE.test(String(b.email).trim())) {
    return 'that email address does not look right';
  }
  return null;
}

// [start,end] 가 다른 confirmed 기간과 겹치는 행 (자기 자신 제외)
async function findOverlaps(start, end, excludeId = null) {
  const where = {
    status: 'confirmed',
    confirmed_start: { [Op.lte]: end },
    confirmed_end: { [Op.gte]: start },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Booking.findAll({
    where,
    attributes: ['id', 'code', 'item_kind', 'item_name', 'client_name', 'confirmed_start', 'confirmed_end'],
    raw: true,
  });
}

/* ---------------- bookings ---------------- */

// GET /api/v3/admin/bookings?status=requested&month=2026-08&limit=200
export async function adminBookingList(req, res) {
  try {
    const where = {};
    const status = (req.query.status || '').trim();
    if (status && STATUSES.includes(status)) where.status = status;

    // month= 지정 시 그 달과 관련된 행 (확정 기간이 걸치거나, 희망일/생성일이 그 달)
    const month = (req.query.month || '').trim();
    if (/^\d{4}-\d{2}$/.test(month)) {
      const from = `${month}-01`;
      const to = `${month}-31`;
      where[Op.or] = [
        { requested_date: { [Op.between]: [from, to] } },
        { [Op.and]: [{ confirmed_start: { [Op.lte]: to } }, { confirmed_end: { [Op.gte]: from } }] },
      ];
    }

    const rows = await Booking.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Math.min(Number(req.query.limit) || 200, 500),
    });
    res.json({ rows });
  } catch (e) {
    res.status(500).json({ error: 'list failed', detail: e.message });
  }
}

// POST /api/v3/admin/bookings — 수동 생성.
// block:   { item_kind:'block', confirmed_start, confirmed_end, admin_note }
// booking: { item_kind:'treatment'|'surgery', item_id, client_name, whatsapp?, ...,
//            confirmed_start?, confirmed_end? }  (기간 주면 바로 confirmed)
export async function adminBookingCreate(req, res) {
  try {
    const b = req.body || {};
    const kind = ['treatment', 'surgery', 'block'].includes(b.item_kind) ? b.item_kind : null;
    if (!kind) return res.status(400).json({ error: 'item_kind must be treatment / surgery / block' });
    const contactErr = checkContact(b);
    if (contactErr) return res.status(400).json({ error: contactErr });

    let itemId = null;
    let itemName = cap(b.item_name, 200);
    if (kind !== 'block') {
      itemId = Number(b.item_id) || null;
      if (itemId) {
        const Model = kind === 'surgery' ? Surgery : Treatment;
        const item = await Model.findByPk(itemId);
        if (!item) return res.status(404).json({ error: `${kind} #${itemId} not found` });
        itemName = item.name;
      }
      if (!itemName) return res.status(400).json({ error: 'item_id or item_name required' });
    } else {
      itemName = itemName || 'Blocked';
    }

    const hasRange = b.confirmed_start || b.confirmed_end;
    let start = null; let end = null;
    if (kind === 'block' || hasRange) {
      start = b.confirmed_start;
      end = b.confirmed_end || b.confirmed_start;
      if (!isIsoDate(start) || !isIsoDate(end)) return res.status(400).json({ error: 'confirmed_start/end must be YYYY-MM-DD' });
      if (end < start) return res.status(400).json({ error: 'end must be >= start' });
      const overlaps = await findOverlaps(start, end);
      if (overlaps.length) return res.status(409).json({ error: 'date range overlaps an existing confirmed booking', overlaps });
    }

    const code = `GUS-${Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[01OIL]/g, 'X')}`;
    const row = await Booking.create({
      code,
      item_kind: kind,
      item_id: itemId,
      item_name: itemName,
      client_name: cap(b.client_name, 120),
      country_code: cap(b.country_code, 8),
      whatsapp: cap(b.whatsapp, 40),
      email: cap(b.email, 200),
      notes: cap(b.notes, 2000),
      requested_date: isIsoDate(b.requested_date) ? b.requested_date : start,
      status: start ? 'confirmed' : 'requested',
      confirmed_start: start,
      confirmed_end: end,
      admin_note: cap(b.admin_note, 2000),
    });
    res.status(201).json({ row });
  } catch (e) {
    res.status(500).json({ error: 'create failed', detail: e.message });
  }
}

// PATCH /api/v3/admin/bookings/:id
// 확정: { status:'confirmed', confirmed_start, confirmed_end }  ← 겹침 검사
// 그 외: status 변경(cancelled 등 — 차단 해제됨), admin_note, 고객 필드 수정
export async function adminBookingUpdate(req, res) {
  try {
    const row = await Booking.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'not found' });
    const b = req.body || {};
    const contactErr = checkContact(b);
    if (contactErr) return res.status(400).json({ error: contactErr });
    const patch = {};

    if ('status' in b) {
      if (!STATUSES.includes(b.status)) return res.status(400).json({ error: 'bad status' });
      patch.status = b.status;
    }
    for (const [k, n] of [['client_name', 120], ['country_code', 8], ['whatsapp', 40], ['email', 200], ['notes', 2000], ['admin_note', 2000], ['item_name', 200]]) {
      if (k in b) patch[k] = cap(b[k], n);
    }
    if ('requested_date' in b) {
      if (b.requested_date && !isIsoDate(b.requested_date)) return res.status(400).json({ error: 'requested_date must be YYYY-MM-DD' });
      patch.requested_date = b.requested_date || null;
    }

    const wantsRange = ('confirmed_start' in b) || ('confirmed_end' in b);
    const nextStatus = patch.status || row.status;
    if (wantsRange) {
      const start = b.confirmed_start ?? row.confirmed_start;
      const end = b.confirmed_end ?? b.confirmed_start ?? row.confirmed_end;
      if (start == null && end == null) {
        patch.confirmed_start = null; patch.confirmed_end = null;
      } else {
        if (!isIsoDate(start) || !isIsoDate(end)) return res.status(400).json({ error: 'confirmed_start/end must be YYYY-MM-DD' });
        if (end < start) return res.status(400).json({ error: 'end must be >= start' });
        patch.confirmed_start = start; patch.confirmed_end = end;
      }
    }

    // 확정 상태로 가거나(또는 유지하며 기간 변경) → 겹침 검사
    const effStart = patch.confirmed_start !== undefined ? patch.confirmed_start : row.confirmed_start;
    const effEnd = patch.confirmed_end !== undefined ? patch.confirmed_end : row.confirmed_end;
    if (nextStatus === 'confirmed') {
      if (!effStart || !effEnd) return res.status(400).json({ error: 'confirmed booking needs confirmed_start/end' });
      const overlaps = await findOverlaps(effStart, effEnd, row.id);
      if (overlaps.length) return res.status(409).json({ error: 'date range overlaps an existing confirmed booking', overlaps });
    }

    const wasConfirmed = row.status === 'confirmed';
    await row.update(patch);

    // requested → confirmed 전이 시, 고객이 이메일을 남겼으면 확정 안내 자동 발송
    if (!wasConfirmed && row.status === 'confirmed' && row.item_kind !== 'block') {
      notifyBookingConfirmed(row).catch((e) => console.error('[bookings] confirm email failed:', e.message));
    }
    res.json({ row });
  } catch (e) {
    res.status(500).json({ error: 'update failed', detail: e.message });
  }
}

// DELETE /api/v3/admin/bookings/:id — 하드 삭제 (블록/오입력 정리)
export async function adminBookingDelete(req, res) {
  try {
    const row = await Booking.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'not found' });
    await row.destroy();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'delete failed', detail: e.message });
  }
}

/* ---------------- settings ---------------- */

// admin 설정 탭에서 다루는 키 화이트리스트 (env 폴백 키와 매핑)
const SETTING_KEYS = [
  { skey: 'callmebot_phone',        env: 'CALLMEBOT_PHONE' },
  { skey: 'callmebot_apikey',       env: 'CALLMEBOT_APIKEY' },
  { skey: 'booking_notify_email',   env: 'BOOKING_NOTIFY_EMAIL' },
  { skey: 'booking_enabled',        env: 'BOOKING_ENABLED',        dflt: '1' },
  { skey: 'booking_min_lead_days',  env: 'BOOKING_MIN_LEAD_DAYS',  dflt: '3' },
  { skey: 'booking_max_ahead_days', env: 'BOOKING_MAX_AHEAD_DAYS', dflt: '180' },
];

// GET /api/v3/admin/settings — DB 저장값 + effective(폴백 반영) 동시 반환
export async function adminSettingsGet(_req, res) {
  try {
    const rows = await Setting.findAll({ raw: true });
    const stored = Object.fromEntries(rows.map((r) => [r.skey, r.value]));
    const effective = {};
    for (const k of SETTING_KEYS) {
      effective[k.skey] = await getSetting(k.skey, k.env, k.dflt ?? '');
    }
    res.json({ stored, effective });
  } catch (e) {
    res.status(500).json({ error: 'settings load failed', detail: e.message });
  }
}

// PATCH /api/v3/admin/settings — body: { skey: value, ... } (화이트리스트만)
export async function adminSettingsPatch(req, res) {
  try {
    const allowed = new Set(SETTING_KEYS.map((k) => k.skey));
    const body = req.body || {};
    const applied = {};
    for (const [k, v] of Object.entries(body)) {
      if (!allowed.has(k)) continue;
      const val = v == null ? '' : String(v).slice(0, 500).trim();
      await Setting.upsert({ skey: k, value: val });
      applied[k] = val;
    }
    invalidateSettings();
    res.json({ ok: true, applied });
  } catch (e) {
    res.status(500).json({ error: 'settings save failed', detail: e.message });
  }
}

// POST /api/v3/admin/settings/_test-alert — 지금 설정으로 테스트 알림 발사
export async function adminTestAlert(_req, res) {
  try {
    const fake = {
      code: 'GUS-TEST',
      item_kind: 'treatment',
      item_name: 'Test alert (from admin settings)',
      client_name: 'Alert Test',
      country_code: 'KR',
      whatsapp: '-',
      requested_date: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10),
    };
    await notifyNewBooking(fake);
    res.json({ ok: true, preview: buildBookingAlert(fake), note: '채널이 설정돼 있으면 실제로 발송됨 — 폰/메일함 확인' });
  } catch (e) {
    res.status(500).json({ error: 'test alert failed', detail: e.message });
  }
}

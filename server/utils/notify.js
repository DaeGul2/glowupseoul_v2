// 운영자 알림 — 부킹 신청이 들어오면 WhatsApp(CallMeBot) + 이메일(Resend) 발송.
// 둘 다 fire-and-forget: 알림 실패가 부킹 저장을 막지 않는다 (DB가 진실).
// 키가 없는 채널은 조용히 스킵하고 로그만 남긴다.

import { getSetting } from './settingsStore.js';

function kstStamp(d = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short',
  }).format(d);
}

// 부킹 → 운영자용 알림 텍스트 (한 호흡에 스캔 가능한 포맷)
export function buildBookingAlert(b) {
  const lines = [
    `[Booking] ${b.code}`,
    `- Name: ${b.client_name || '-'} (${b.country_code || '?'})`,
    `- Item: ${b.item_name || '-'} (${b.item_kind})`,
    `- Wish date: ${b.requested_date || 'Not decided yet (flexible)'}`,
    `- WhatsApp: ${b.whatsapp || '-'}`,
  ];
  if (b.email) lines.push(`- Email: ${b.email}`);
  if (b.notes) lines.push(`- Notes: ${String(b.notes).slice(0, 300)}`);
  lines.push(`- Received: ${kstStamp()} KST`);
  return lines.join('\n');
}

async function sendWhatsApp(text) {
  const phone = await getSetting('callmebot_phone', 'CALLMEBOT_PHONE');
  const apikey = await getSetting('callmebot_apikey', 'CALLMEBOT_APIKEY');
  if (!phone || !apikey) {
    console.log('[notify] CallMeBot not configured — WhatsApp alert skipped');
    return false;
  }
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok || /error/i.test(body)) {
    throw new Error(`callmebot ${res.status}: ${body.slice(0, 200)}`);
  }
  return true;
}

async function sendEmail(subject, text) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const to = await getSetting('booking_notify_email', 'BOOKING_NOTIFY_EMAIL');
  if (!apiKey || !to) {
    console.log('[notify] Resend not configured — email alert skipped');
    return false;
  }
  const from = (process.env.RESEND_FROM || 'onboarding@resend.dev').trim();
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return true;
}

// 확정 안내 — 고객이 이메일을 남긴 경우, 확정 즉시 자동 발송 (Resend).
// (WhatsApp 확정 안내는 운영자가 직접 — 어차피 조율 대화 중이므로.)
export async function notifyBookingConfirmed(booking) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey || !booking.email) {
    console.log('[notify] confirm email skipped (no resend key or no customer email)');
    return false;
  }
  const origin = (process.env.SITE_ORIGIN || 'https://glowupseoul.com').replace(/\/$/, '');
  const oneDay = booking.confirmed_start === booking.confirmed_end;
  const dates = oneDay ? booking.confirmed_start : `${booking.confirmed_start} – ${booking.confirmed_end}`;
  const text = [
    `Hi ${booking.client_name || 'there'},`,
    '',
    `Your Glow Up Seoul trip is confirmed.`,
    '',
    `• Booking: ${booking.code}`,
    `• ${booking.item_name}`,
    `• Dates: ${dates}`,
    '',
    `Track your booking: ${origin}/booking/${booking.code}`,
    `Add to calendar: ${origin}/api/v3/bookings/${booking.code}/ics`,
    '',
    `Questions any time — WhatsApp +82 10 6487 1060.`,
    '',
    `— Romie, Glow Up Seoul`,
  ].join('\n');
  const from = (process.env.RESEND_FROM || 'onboarding@resend.dev').trim();
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [booking.email], subject: `Your Seoul trip is confirmed — ${booking.item_name} (${booking.code})`, text }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  console.log(`[notify] confirm email sent (${booking.code} → ${booking.email})`);
  return true;
}

// 신청 접수 알림 — 채널별로 독립 실행, 하나 죽어도 다른 쪽은 나감.
export async function notifyNewBooking(booking) {
  const text = buildBookingAlert(booking);
  const results = await Promise.allSettled([
    sendWhatsApp(text),
    sendEmail(`[Booking] ${booking.code} — ${booking.item_name || booking.item_kind}`, text),
  ]);
  results.forEach((r, i) => {
    const ch = i === 0 ? 'whatsapp' : 'email';
    if (r.status === 'rejected') console.error(`[notify] ${ch} failed:`, r.reason?.message || r.reason);
    else if (r.value) console.log(`[notify] ${ch} sent (${booking.code})`);
  });
}

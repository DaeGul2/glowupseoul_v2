// 부킹 입력 검증 — 고객 위자드 + admin 이 공유.
// 전화: 국가별 국가번호(dial) + 국내번호 자릿수(nsn) 검증 → E.164(+국가번호숫자) 정규화.
// 서버(routes/bookingsV3.js)도 같은 규칙의 최종 검증을 별도로 수행한다 (클라 검증은 UX용).

export const COUNTRIES = [
  { code: 'SG', label: 'Singapore',      dial: '65',  nsn: [8, 8] },
  { code: 'TH', label: 'Thailand',       dial: '66',  nsn: [8, 9] },
  { code: 'ID', label: 'Indonesia',      dial: '62',  nsn: [9, 12] },
  { code: 'MY', label: 'Malaysia',       dial: '60',  nsn: [9, 10] },
  { code: 'VN', label: 'Vietnam',        dial: '84',  nsn: [9, 10] },
  { code: 'PH', label: 'Philippines',    dial: '63',  nsn: [10, 10] },
  { code: 'CN', label: 'China',          dial: '86',  nsn: [11, 11] },
  { code: 'HK', label: 'Hong Kong',      dial: '852', nsn: [8, 8] },
  { code: 'TW', label: 'Taiwan',         dial: '886', nsn: [9, 9] },
  { code: 'JP', label: 'Japan',          dial: '81',  nsn: [9, 11] },
  { code: 'KR', label: 'South Korea',    dial: '82',  nsn: [9, 10] },
  { code: 'US', label: 'United States',  dial: '1',   nsn: [10, 10] },
  { code: 'CA', label: 'Canada',         dial: '1',   nsn: [10, 10] },
  { code: 'GB', label: 'United Kingdom', dial: '44',  nsn: [10, 10] },
  { code: 'AU', label: 'Australia',      dial: '61',  nsn: [9, 9] },
  { code: 'AE', label: 'UAE',            dial: '971', nsn: [8, 9] },
  { code: 'SA', label: 'Saudi Arabia',   dial: '966', nsn: [8, 9] },
  { code: 'RU', label: 'Russia',         dial: '7',   nsn: [10, 10] },
  { code: 'KZ', label: 'Kazakhstan',     dial: '7',   nsn: [10, 10] },
  { code: 'OTHER', label: 'Other', dial: '', nsn: [7, 15] },
];

export const countryOf = (code) => COUNTRIES.find((c) => c.code === code) || null;
export const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

// raw = 사용자가 입력한 국내번호(또는 OTHER 는 국가번호 포함 전체).
// 성공 시 { ok: true, e164: '+6581234567' }, 실패 시 { ok: false, error }.
export function validatePhone(countryCode, raw) {
  const c = countryOf(countryCode);
  if (!c) return { ok: false, error: 'Select your country first.' };
  let digits = onlyDigits(raw);
  if (!digits) return { ok: false, error: 'Enter your WhatsApp number.' };

  if (c.code === 'OTHER') {
    if (digits.length < 7 || digits.length > 15) {
      return { ok: false, error: 'Enter your full number with country code (7–15 digits).' };
    }
    return { ok: true, e164: `+${digits}` };
  }

  // trunk prefix(맨 앞 0) 자동 제거 — 예: 010-1234-5678 → 1012345678
  digits = digits.replace(/^0+/, '');
  const [min, max] = c.nsn;
  if (digits.length < min || digits.length > max) {
    const range = min === max ? `${min} digits` : `${min}–${max} digits`;
    return { ok: false, error: `${c.label} numbers have ${range} after +${c.dial}. You entered ${digits.length}.` };
  }
  return { ok: true, e164: `+${c.dial}${digits}` };
}

// 실용적 이메일 검사 — RFC 전체가 아니라 "실존 가능한 형태" 수준 (프로덕션 표준 관행).
export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
export function validateEmail(v) {
  const t = String(v || '').trim();
  if (!t) return { ok: true, value: null };                       // optional
  if (t.length > 200 || !EMAIL_RE.test(t)) return { ok: false, error: "That email address doesn't look right." };
  return { ok: true, value: t };
}

export function validateName(v) {
  const t = String(v || '').trim();
  if (t.length < 2) return { ok: false, error: 'Please enter your name.' };
  if (t.length > 120) return { ok: false, error: 'That name is too long.' };
  return { ok: true, value: t };
}

// Cloudflare Turnstile 서버측 검증.
// TURNSTILE_SECRET_KEY 가 비어 있으면 검증을 건너뛴다 (dev 편의 — 운영에선 반드시 설정).

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token, remoteIp) {
  const secret = (process.env.TURNSTILE_SECRET_KEY || '').trim();
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, error: 'turnstile token missing' };

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: String(token), remoteip: remoteIp }),
    });
    const data = await res.json();
    if (data.success) return { ok: true };
    return { ok: false, error: (data['error-codes'] || []).join(',') || 'verification failed' };
  } catch (e) {
    // Cloudflare 장애 시 부킹까지 죽이지 않는다 — 통과시키고 로그만.
    console.error('[turnstile] verify request failed:', e.message);
    return { ok: true, degraded: true };
  }
}

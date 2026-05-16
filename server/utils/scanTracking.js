// AI 스캔 비용 계산 + IP rate limit + scan_events 로깅 헬퍼.
//
// 사용처:
//   - server/routes/analyze.js     → analyze 콜 한 번마다 logScan('analyze', …)
//   - server/routes/synthesize.js  → 동일
//   - server/index.js              → rateLimitAnalyzeIp 미들웨어를 analyze 라우트 앞에
import { ScanEvent } from '../db/models.js';
import { hasDbConfig } from '../db/sequelize.js';

// gpt-4o-mini 단가 (2026-05 기준). 다른 모델이면 여기 추가.
//   $0.150 per 1M input  / $0.600 per 1M output
const PRICING = {
  'gpt-4o-mini': { in: 0.150, out: 0.600 },
  'gpt-4o':      { in: 2.500, out: 10.000 },
  'gpt-4.1-mini':{ in: 0.150, out: 0.600 },     // 가격 변경되면 갱신
};

export function costUsd(model, tokensIn, tokensOut) {
  const p = PRICING[model] || PRICING['gpt-4o-mini'];
  const tIn  = Number.isFinite(tokensIn)  ? tokensIn  : 0;
  const tOut = Number.isFinite(tokensOut) ? tokensOut : 0;
  return (tIn * p.in + tOut * p.out) / 1_000_000;
}

// Express 가 nginx 뒤에서 돌 때 진짜 client IP. trust proxy 설정도 같이 필요.
export function clientIpOf(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || null;
}

// 비-fire-and-forget 로깅. DB 실패해도 본 요청 흐름에는 영향 없게 catch.
export async function logScan({ eventType, req, model, usage = {}, durationMs, statusCode = 200, error = null }) {
  if (!hasDbConfig()) return;
  try {
    await ScanEvent.create({
      event_type: eventType,
      ip: clientIpOf(req),
      session_token: req.body?.session_token || req.headers['x-session-token'] || null,
      user_agent: (req.headers['user-agent'] || '').slice(0, 255),
      model,
      tokens_in:  Number.isFinite(usage.prompt_tokens)     ? usage.prompt_tokens     : null,
      tokens_out: Number.isFinite(usage.completion_tokens) ? usage.completion_tokens : null,
      cost_usd:   model ? costUsd(model, usage.prompt_tokens, usage.completion_tokens) : null,
      duration_ms: Number.isFinite(durationMs) ? durationMs : null,
      status_code: statusCode,
      error: error ? String(error).slice(0, 1000) : null,
    });
  } catch (e) {
    console.warn('[scanTracking] log failed:', e?.message);
  }
}

// ── IP rate limit (in-memory, 단일 PM2 process 가정) ───────────────────
// IP 당 N 초 쿨다운. 호출 시점에 즉시 set (실제 OpenAI 콜 전에). 그래야 spam-prevention.
const COOLDOWN_MS = Number(process.env.SCAN_COOLDOWN_SEC || 300) * 1000;  // default 5분
const lastByIp = new Map();
const MAX_TRACKED_IPS = 5000;

export function rateLimitAnalyzeIp(req, res, next) {
  // 개발 환경에선 비활성 옵션
  if (process.env.SCAN_COOLDOWN_DISABLED === '1') return next();

  const ip = clientIpOf(req);
  if (!ip) return next();        // IP 못 잡으면 통과 (rare)

  const now = Date.now();
  const last = lastByIp.get(ip);
  if (last && now - last < COOLDOWN_MS) {
    const remainMs = COOLDOWN_MS - (now - last);
    const remainSec = Math.ceil(remainMs / 1000);
    res.set('Retry-After', String(remainSec));
    return res.status(429).json({
      error: 'rate_limited',
      message: `Please wait ${remainSec} seconds before requesting another scan.`,
      retry_after_sec: remainSec,
    });
  }
  lastByIp.set(ip, now);

  // 가벼운 GC — 사이즈 임계치 넘으면 만료된 항목 제거
  if (lastByIp.size > MAX_TRACKED_IPS) {
    for (const [k, v] of lastByIp.entries()) {
      if (now - v >= COOLDOWN_MS) lastByIp.delete(k);
    }
  }

  next();
}

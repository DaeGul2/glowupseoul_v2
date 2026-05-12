import { hasDbConfig, getSequelize } from './sequelize.js';

export async function checkDbHealth() {
  if (!hasDbConfig()) {
    return { ok: false, configured: false, reason: 'DB_HOST/DB_PASSWORD missing' };
  }
  const t0 = Date.now();
  try {
    await getSequelize().authenticate();
    return { ok: true, configured: true, latency_ms: Date.now() - t0 };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      latency_ms: Date.now() - t0,
      error: e.original?.code || e.message,
    };
  }
}

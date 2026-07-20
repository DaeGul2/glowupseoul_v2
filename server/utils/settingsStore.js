// 운영 설정 조회 — settings 테이블(DB) 우선, 비어 있으면 .env 폴백.
// 30초 캐시라 admin 에서 바꾸면 재시작 없이 최대 30초 내 반영.
// admin 설정 탭이 PATCH 할 때 invalidateSettings() 를 호출하면 즉시 반영.

import { Setting } from '../db/modelsV3.js';

const TTL_MS = 30_000;
let cache = null;
let cacheAt = 0;

export async function getAllSettings() {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;
  try {
    const rows = await Setting.findAll({ raw: true });
    cache = Object.fromEntries(rows.map((r) => [r.skey, r.value]));
  } catch (e) {
    // DB 장애 시 이전 캐시 유지 (없으면 빈 객체 → .env 폴백만 작동)
    console.error('[settings] load failed:', e.message);
    cache = cache || {};
  }
  cacheAt = Date.now();
  return cache;
}

export function invalidateSettings() {
  cache = null;
  cacheAt = 0;
}

// DB 값 → env 값 → 기본값 순서. 빈 문자열은 "미설정"으로 취급.
export async function getSetting(key, envKey, dflt = '') {
  const all = await getAllSettings();
  const v = all[key];
  if (v != null && String(v).trim() !== '') return String(v).trim();
  if (envKey && process.env[envKey] && String(process.env[envKey]).trim() !== '') {
    return String(process.env[envKey]).trim();
  }
  return dflt;
}

export async function getSettingInt(key, envKey, dflt) {
  const v = await getSetting(key, envKey, String(dflt));
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : dflt;
}

// Single import surface — page/component 에서 db.* 로 접근.
// 실서버 도입 시 이 파일만 fetch wrapper 로 갈아끼우면 됨.

import { mechanisms, mechanismBySlug } from './mechanisms.js';
import { procedureCategories, categoryBySlug, categoryById } from './procedureCategories.js';
import { concerns, concernBySlug, concernById } from './concerns.js';
import { procedures, procedureBySlug, procedureById } from './procedures.js';
import { concernProcedures } from './concernProcedures.js';
import { brands, brandBySlug, brandById } from './brands.js';
import { hospitals, hospitalBySlug, hospitalById } from './hospitals.js';
import { hospitalProcedures, hpByHospital, hpByProcedure } from './hospitalProcedures.js';
import { publicFeedEntries } from './publicFeed.js';
import { devices, deviceBySlug } from './devices.js';

// ---------- Query helpers (병원 + 시술 join 한 row 만들기) ----------

function buildOffering(hp) {
  const procedure = procedureById[hp.procedure_id];
  const hospital = hospitalById[hp.hospital_id];
  const brand = brandById[hospital.brand_id];
  const discount_pct = hp.original_price_krw && hp.starting_price_krw
    ? Math.round((1 - hp.starting_price_krw / hp.original_price_krw) * 100)
    : 0;
  return { hp, procedure, hospital, brand, discount_pct };
}

export const db = {
  // raw tables
  mechanisms, procedureCategories, concerns, procedures, concernProcedures,
  brands, hospitals, hospitalProcedures, publicFeedEntries,

  // lookups
  mechanismBySlug, categoryBySlug, categoryById,
  concernBySlug, concernById, procedureBySlug, procedureById,
  brandBySlug, brandById, hospitalBySlug, hospitalById,

  // ---------- queries ----------
  proceduresByCategory(categorySlug) {
    const cat = categoryBySlug[categorySlug];
    if (!cat) return [];
    return procedures.filter((p) => p.category_id === cat.id && p.is_active);
  },

  hospitalCountForProcedure(procedureId) {
    return (hpByProcedure[procedureId] || []).filter((hp) => hp.offered).length;
  },

  // For procedure card: price range across all offering hospitals
  priceRangeForProcedure(procedureId) {
    const rows = (hpByProcedure[procedureId] || []).filter((hp) => hp.offered && hp.price_disclosed && hp.starting_price_krw);
    if (rows.length === 0) return null;
    const prices = rows.map((r) => r.starting_price_krw);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  },

  // 시술 상세 — 이 시술을 다루는 모든 병원의 offering
  offeringsForProcedure(procedureId) {
    return (hpByProcedure[procedureId] || [])
      .filter((hp) => hp.offered)
      .map(buildOffering)
      .sort((a, b) => {
        if (a.hp.has_active_event !== b.hp.has_active_event) return a.hp.has_active_event ? -1 : 1;
        if (a.hp.is_signature !== b.hp.is_signature) return a.hp.is_signature ? -1 : 1;
        return (a.hp.starting_price_krw || Infinity) - (b.hp.starting_price_krw || Infinity);
      });
  },

  // 병원 상세 — 이 병원의 모든 시술
  offeringsForHospital(hospitalId) {
    return (hpByHospital[hospitalId] || [])
      .filter((hp) => hp.offered)
      .map(buildOffering)
      .sort((a, b) => {
        if (a.hp.is_signature !== b.hp.is_signature) return a.hp.is_signature ? -1 : 1;
        return (a.hp.starting_price_krw || Infinity) - (b.hp.starting_price_krw || Infinity);
      });
  },

  // 카테고리 페이지 — 시술 카드 (대표 1장씩)
  topOfferingsByCategory(categorySlug) {
    const procs = this.proceduresByCategory(categorySlug);
    return procs.map((p) => {
      const offerings = this.offeringsForProcedure(p.id);
      const range = this.priceRangeForProcedure(p.id);
      return { procedure: p, offerings, hospital_count: offerings.length, price_range: range };
    });
  },

  concernsForCategory(categorySlug) {
    const cat = categoryBySlug[categorySlug];
    if (!cat) return [];
    const procIds = new Set(procedures.filter((p) => p.category_id === cat.id).map((p) => p.id));
    const concernIds = new Set(
      concernProcedures.filter((cp) => procIds.has(cp.procedure_id) && cp.relevance === 'primary').map((cp) => cp.concern_id)
    );
    return [...concernIds].map((id) => concernById[id]).filter(Boolean);
  },

  // ---------- Device-axis queries ----------
  // For a device, return all hospital_procedures rows whose device_brands intersect
  // its known brand strings, joined with procedure + hospital.
  devicesWithStats() {
    return devices.map((d) => {
      const brandSet = new Set(d.brands);
      const matched = hospitalProcedures.filter((hp) =>
        hp.offered && (hp.device_brands || []).some((b) => brandSet.has(b))
      );
      const clinicIds = new Set(matched.map((hp) => hp.hospital_id));
      const prices = matched
        .filter((hp) => hp.price_disclosed && hp.starting_price_krw)
        .map((hp) => hp.starting_price_krw);
      const priceMin = prices.length ? Math.min(...prices) : null;
      const priceMax = prices.length ? Math.max(...prices) : null;
      const heroProcedure = procedureBySlug[d.hero_procedure_slug] || null;
      return {
        device: d,
        match_count: matched.length,
        clinic_count: clinicIds.size,
        price_min: priceMin,
        price_max: priceMax,
        hero_procedure: heroProcedure,
      };
    });
  },

  offeringsForDevice(deviceSlug) {
    const d = deviceBySlug[deviceSlug];
    if (!d) return [];
    const brandSet = new Set(d.brands);
    return hospitalProcedures
      .filter((hp) => hp.offered && (hp.device_brands || []).some((b) => brandSet.has(b)))
      .map((hp) => ({
        hp,
        procedure: procedureById[hp.procedure_id],
        hospital: hospitalById[hp.hospital_id],
        brand: brandById[hospitalById[hp.hospital_id].brand_id],
        discount_pct: hp.original_price_krw && hp.starting_price_krw ? Math.round((1 - hp.starting_price_krw / hp.original_price_krw) * 100) : 0,
      }));
  },

  devices, deviceBySlug,

  proceduresForConcern(concernId) {
    return concernProcedures
      .filter((cp) => cp.concern_id === concernId)
      .sort((a, b) => {
        const rank = { primary: 0, secondary: 1, adjunct: 2 };
        return rank[a.relevance] - rank[b.relevance];
      })
      .map((cp) => ({ ...cp, procedure: procedureById[cp.procedure_id] }));
  },
};

export default db;

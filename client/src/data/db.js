// Catalog store — single import surface for the entire site.
//
// Starts EMPTY. App.jsx calls db.hydrate() once on boot to fetch
// /api/catalog/bootstrap and fill the collections in-place (preserving
// references). After that, every page accesses db.* synchronously as before.
//
// Why in-place mutation: we want existing `import { hospitals } from './db.js'`
// patterns to keep working without refactoring every page. We splice/replace
// the same array reference, so modules that captured the import don't break.

import {
  publicFeedEntries, getPublicFeedEntries, addPublicFeedEntry,
  subscribeFeed, hydratePublicFeed,
} from './publicFeed.js';

// -------------------------------------------------------------------
// Mutable collections — filled on hydrate(), empty until then.
// -------------------------------------------------------------------
const mechanisms          = [];
const procedureCategories = [];
const concerns            = [];
const procedures          = [];
const concernProcedures   = [];
const brands              = [];
const hospitals           = [];
const hospitalProcedures  = [];
const devices             = [];
const procedureDevices    = [];

// Slug / id indexes — same reference, mutation-replaced on hydrate.
const mechanismBySlug = {};
const categoryBySlug  = {};
const categoryById    = {};
const concernBySlug   = {};
const concernById     = {};
const procedureBySlug = {};
const procedureById   = {};
const brandBySlug     = {};
const brandById       = {};
const hospitalBySlug  = {};
const hospitalById    = {};
const deviceBySlug    = {};
const deviceById      = {};

// Join indexes (one HP can appear in both)
const hpByHospital  = {};
const hpByProcedure = {};

// procedure_devices indexes
const pdByDevice    = {};
const pdByProcedure = {};

// -------------------------------------------------------------------
// Hydration helpers
// -------------------------------------------------------------------
function replaceArray(arr, src) {
  arr.splice(0, arr.length, ...(Array.isArray(src) ? src : []));
}
function replaceMap(obj, src) {
  for (const k of Object.keys(obj)) delete obj[k];
  Object.assign(obj, src);
}
function indexBy(arr, key) {
  const out = {};
  for (const r of arr) if (r && r[key] != null) out[r[key]] = r;
  return out;
}
function groupBy(arr, key) {
  const out = {};
  for (const r of arr) {
    if (r && r[key] != null) (out[r[key]] ||= []).push(r);
  }
  return out;
}

// Hospital rows from the API have brand_id; some templates (and mock had
// them flattened) read brand.name_ko via hospital. Resolve it post-fetch.
function denormalizeHospitals(hList, bMap) {
  for (const h of hList) {
    if (!h.brand_id) continue;
    const b = bMap[h.brand_id];
    if (!b) continue;
    // Only fill if the hospital row didn't already specify its own.
    if (!h.name_ko && b.name_ko) h.name_ko = b.name_ko;
    if (!h.name_en && b.name_en) h.name_en = b.name_en;
    if (!h.name_zh && b.name_zh) h.name_zh = b.name_zh;
    if (!h.name_ja && b.name_ja) h.name_ja = b.name_ja;
    if (!h.website_url && b.website_url) h.website_url = b.website_url;
  }
}

// HP rows often miss a local procedure name in early data; fallback to
// the canonical procedure name so cards/results don't show empty strings.
function denormalizeHospitalProcedures(hpList, pMap) {
  for (const hp of hpList) {
    if (!hp.procedure_id) continue;
    const p = pMap[hp.procedure_id];
    if (!p) continue;
    if (!hp.local_name_ko && p.name_ko) hp.local_name_ko = p.name_ko;
    if (!hp.local_name_en && p.name_en) hp.local_name_en = p.name_en;
  }
}

// Device rows from DB don't carry legacy `image / blurb / name / brands /
// mechanism_label_en / hero_procedure_slug`. Pages still read those names
// — enrich the row in-place so we don't have to touch every UI file.
function enrichDevices(dList, mMap, pdList, pMap) {
  for (const d of dList) {
    d.image              ||= d.thumbnail_url || '';
    d.description        ||= d.description_en || d.description_ko || '';
    d.blurb              ||= d.description;
    d.name               ||= d.name_en || d.name_ko || d.slug;
    const mech = d.mechanism_slug ? mMap[d.mechanism_slug] : null;
    d.mechanism            = d.mechanism_slug || null;     // legacy alias
    d.mechanism_label_en   = mech?.label_en || '';
    d.mechanism_label_ko   = mech?.label_ko || '';

    // Build the legacy `brands` array used by offeringsForDevice() to match
    // against hospital_procedures.device_brands JSON. Include canonical names
    // + tags. Loose substring matching kicks in for variants like
    // "Ulthera SPT" vs device "Ulthera".
    const bset = new Set();
    if (d.name_en) bset.add(d.name_en);
    if (d.name_ko) bset.add(d.name_ko);
    if (d.name_zh) bset.add(d.name_zh);
    if (Array.isArray(d.tags)) for (const t of d.tags) if (t) bset.add(t);
    d.brands = [...bset];
  }
  // hero_procedure_slug — first procedure_devices link where relevance='primary'
  const byDevice = {};
  for (const pd of pdList || []) {
    (byDevice[pd.device_id] ||= []).push(pd);
  }
  for (const d of dList) {
    const links = (byDevice[d.id] || []).slice().sort((a, b) => {
      const rank = { primary: 0, alternative: 1, compatible: 2 };
      return (rank[a.relevance] ?? 9) - (rank[b.relevance] ?? 9);
    });
    const top = links[0];
    if (top) {
      const p = pMap[top.procedure_id];
      d.hero_procedure_slug = p?.slug || '';
    } else {
      d.hero_procedure_slug = '';
    }
  }
}

// Loose substring match between device.brands and an hp.device_brands entry.
// Used to identify which hp offerings actually use a given device.
function deviceMatchesOffering(device, hp) {
  const offeringBrands = Array.isArray(hp.device_brands) ? hp.device_brands : [];
  if (offeringBrands.length === 0) return false;
  const candidates = (device.brands || []).map((s) => String(s).toLowerCase()).filter(Boolean);
  if (candidates.length === 0) return false;
  for (const ob of offeringBrands) {
    const lb = String(ob).toLowerCase();
    for (const c of candidates) {
      if (lb === c || lb.includes(c) || c.includes(lb)) return true;
    }
  }
  return false;
}

// -------------------------------------------------------------------
// Public hydrate API
// -------------------------------------------------------------------
let _hydrated = false;
let _hydrating = null;
let _lastCounts = null;

const BOOTSTRAP_URL = '/api/catalog/bootstrap';

async function fetchBootstrap() {
  const res = await fetch(BOOTSTRAP_URL);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`bootstrap ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function hydrate() {
  if (_hydrated) return { ok: true, counts: _lastCounts };
  if (_hydrating) return _hydrating;
  _hydrating = (async () => {
    const data = await fetchBootstrap();

    replaceArray(mechanisms,          data.mechanisms);
    replaceArray(procedureCategories, data.categories);
    replaceArray(concerns,            data.concerns);
    replaceArray(procedures,          data.procedures);
    replaceArray(concernProcedures,   data.concern_procedures);
    replaceArray(brands,              data.brands);
    replaceArray(hospitals,           data.hospitals);
    replaceArray(hospitalProcedures,  data.hospital_procedures);
    replaceArray(devices,             data.devices || []);
    replaceArray(procedureDevices,    data.procedure_devices || []);

    replaceMap(mechanismBySlug, indexBy(mechanisms, 'slug'));
    replaceMap(categoryBySlug,  indexBy(procedureCategories, 'slug'));
    replaceMap(categoryById,    indexBy(procedureCategories, 'id'));
    replaceMap(concernBySlug,   indexBy(concerns, 'slug'));
    replaceMap(concernById,     indexBy(concerns, 'id'));
    replaceMap(procedureBySlug, indexBy(procedures, 'slug'));
    replaceMap(procedureById,   indexBy(procedures, 'id'));
    replaceMap(brandBySlug,     indexBy(brands, 'slug'));
    replaceMap(brandById,       indexBy(brands, 'id'));
    replaceMap(hospitalBySlug,  indexBy(hospitals, 'slug'));
    replaceMap(hospitalById,    indexBy(hospitals, 'id'));
    replaceMap(deviceBySlug,    indexBy(devices, 'slug'));
    replaceMap(deviceById,      indexBy(devices, 'id'));

    // Cross-collection denormalization for view-layer convenience.
    denormalizeHospitals(hospitals, brandById);
    denormalizeHospitalProcedures(hospitalProcedures, procedureById);
    enrichDevices(devices, mechanismBySlug, procedureDevices, procedureById);

    replaceMap(hpByHospital,  groupBy(hospitalProcedures, 'hospital_id'));
    replaceMap(hpByProcedure, groupBy(hospitalProcedures, 'procedure_id'));
    replaceMap(pdByDevice,    groupBy(procedureDevices,   'device_id'));
    replaceMap(pdByProcedure, groupBy(procedureDevices,   'procedure_id'));

    _hydrated = true;
    _lastCounts = data.counts || {
      mechanisms: mechanisms.length, categories: procedureCategories.length,
      concerns: concerns.length, procedures: procedures.length,
      brands: brands.length, hospitals: hospitals.length,
      hospital_procedures: hospitalProcedures.length,
      concern_procedures: concernProcedures.length,
      devices: devices.length,
      procedure_devices: procedureDevices.length,
    };
    return { ok: true, counts: _lastCounts };
  })();

  try { return await _hydrating; }
  catch (e) {
    _hydrating = null;
    throw e;
  }
}

export function isHydrated() { return _hydrated; }
export function isEmpty() {
  return _hydrated && hospitals.length === 0 && procedures.length === 0;
}
export function getCounts() { return _lastCounts; }

// -------------------------------------------------------------------
// Query helpers (병원 + 시술 join — same shape as before)
// -------------------------------------------------------------------
function buildOffering(hp) {
  const procedure = procedureById[hp.procedure_id];
  const hospital  = hospitalById[hp.hospital_id];
  const brand     = hospital ? brandById[hospital.brand_id] : null;
  const discount_pct = hp.original_price_krw && hp.starting_price_krw
    ? Math.round((1 - hp.starting_price_krw / hp.original_price_krw) * 100)
    : 0;
  return { hp, procedure, hospital, brand, discount_pct };
}

export const db = {
  // raw tables
  mechanisms, procedureCategories, concerns, procedures, concernProcedures,
  brands, hospitals, hospitalProcedures, publicFeedEntries,
  devices, procedureDevices,

  // lookups
  mechanismBySlug, categoryBySlug, categoryById,
  concernBySlug, concernById, procedureBySlug, procedureById,
  brandBySlug, brandById, hospitalBySlug, hospitalById,
  deviceBySlug, deviceById,

  // hydration
  hydrate, isHydrated, isEmpty, getCounts,

  // ---------- queries ----------
  proceduresByCategory(categorySlug) {
    const cat = categoryBySlug[categorySlug];
    if (!cat) return [];
    return procedures.filter((p) => p.category_id === cat.id && p.is_active);
  },

  hospitalCountForProcedure(procedureId) {
    return (hpByProcedure[procedureId] || []).filter((hp) => hp.offered).length;
  },

  priceRangeForProcedure(procedureId) {
    const rows = (hpByProcedure[procedureId] || []).filter((hp) => hp.offered && hp.price_disclosed && hp.starting_price_krw);
    if (rows.length === 0) return null;
    const prices = rows.map((r) => r.starting_price_krw);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  },

  offeringsForProcedure(procedureId) {
    return (hpByProcedure[procedureId] || [])
      .filter((hp) => hp.offered)
      .map(buildOffering)
      .filter((o) => o.procedure && o.hospital)
      .sort((a, b) => {
        if (a.hp.has_active_event !== b.hp.has_active_event) return a.hp.has_active_event ? -1 : 1;
        if (a.hp.is_signature !== b.hp.is_signature) return a.hp.is_signature ? -1 : 1;
        return (a.hp.starting_price_krw || Infinity) - (b.hp.starting_price_krw || Infinity);
      });
  },

  offeringsForHospital(hospitalId) {
    return (hpByHospital[hospitalId] || [])
      .filter((hp) => hp.offered)
      .map(buildOffering)
      .filter((o) => o.procedure && o.hospital)
      .sort((a, b) => {
        if (a.hp.is_signature !== b.hp.is_signature) return a.hp.is_signature ? -1 : 1;
        return (a.hp.starting_price_krw || Infinity) - (b.hp.starting_price_krw || Infinity);
      });
  },

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
  // Matching is hybrid: 1) explicit hp.device_brands JSON (strict, when the
  // operator filled it in), OR 2) canonical procedure_devices matrix (loose —
  // any hp offering a procedure this device CAN do counts). The matrix path
  // lets device cards stay populated when hp.device_brands is empty (which is
  // our current "병원 메뉴 = hp 1행, 장비 비움" data discipline).
  devicesWithStats() {
    return devices.map((d) => {
      const procIds = new Set((pdByDevice[d.id] || []).map((pd) => pd.procedure_id));

      const matched = hospitalProcedures.filter((hp) => {
        if (!hp.offered) return false;
        const hospital = hospitalById[hp.hospital_id];
        if (!hospital || hospital.contract_status !== 'active') return false;
        return deviceMatchesOffering(d, hp) || procIds.has(hp.procedure_id);
      });

      const clinicIds = new Set(matched.map((hp) => hp.hospital_id));
      const prices = matched
        .filter((hp) => hp.price_disclosed && hp.starting_price_krw)
        .map((hp) => hp.starting_price_krw);
      const priceMin = prices.length ? Math.min(...prices) : null;
      const priceMax = prices.length ? Math.max(...prices) : null;
      const heroProcedure = d.hero_procedure_slug ? procedureBySlug[d.hero_procedure_slug] : null;

      return {
        device: d,
        match_count: matched.length,
        clinic_count: clinicIds.size,
        procedure_count: procIds.size,
        price_min: priceMin,
        price_max: priceMax,
        hero_procedure: heroProcedure,
      };
    });
  },

  offeringsForDevice(deviceSlug) {
    const d = deviceBySlug[deviceSlug];
    if (!d) return [];
    const procIds = new Set((pdByDevice[d.id] || []).map((pd) => pd.procedure_id));
    return hospitalProcedures
      .filter((hp) => {
        if (!hp.offered) return false;
        const hospital = hospitalById[hp.hospital_id];
        if (!hospital || hospital.contract_status !== 'active') return false;
        return deviceMatchesOffering(d, hp) || procIds.has(hp.procedure_id);
      })
      .map(buildOffering)
      .filter((o) => o.procedure && o.hospital);
  },

  // Which procedures CAN use this device (canonical, via procedure_devices).
  proceduresForDevice(deviceId) {
    return (pdByDevice[deviceId] || [])
      .slice()
      .sort((a, b) => {
        const rank = { primary: 0, alternative: 1, compatible: 2 };
        return (rank[a.relevance] ?? 9) - (rank[b.relevance] ?? 9);
      })
      .map((pd) => ({ ...pd, procedure: procedureById[pd.procedure_id] }))
      .filter((row) => row.procedure);
  },

  // Which devices CAN do this procedure (canonical, via procedure_devices).
  devicesForProcedure(procedureId) {
    return (pdByProcedure[procedureId] || [])
      .slice()
      .sort((a, b) => {
        const rank = { primary: 0, alternative: 1, compatible: 2 };
        return (rank[a.relevance] ?? 9) - (rank[b.relevance] ?? 9);
      })
      .map((pd) => ({ ...pd, device: deviceById[pd.device_id] }))
      .filter((row) => row.device);
  },

  // ---------- Public feed (recent matches) ----------
  getRecentMatches(limit = 10) {
    return getPublicFeedEntries()
      .slice()
      .sort((a, b) => new Date(b.displayed_at) - new Date(a.displayed_at))
      .slice(0, limit)
      .map((e) => ({
        ...e,
        treatment: e.treatment_slug ? procedureBySlug[e.treatment_slug] : null,
        hospital: e.hospital_slug ? hospitalBySlug[e.hospital_slug] : null,
        brand: e.hospital_slug && hospitalBySlug[e.hospital_slug]
          ? brandById[hospitalBySlug[e.hospital_slug].brand_id]
          : null,
      }));
  },

  addPublicFeedEntry,
  subscribeFeed,
  hydratePublicFeed,

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

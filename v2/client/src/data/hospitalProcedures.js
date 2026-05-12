// hospital_procedures — 병원 × 시술 별로 가격/디바이스/이벤트/시그너처 등 변동값.
// 같은 'HIFU' 라도 병원마다 가격·디바이스·할인 다르다는 걸 보여주는 핵심 테이블.

import { hospitalBySlug } from './hospitals.js';
import { procedureBySlug } from './procedures.js';

function priceTier(krw) {
  if (krw == null) return null;
  if (krw < 300000) return '$';
  if (krw < 1000000) return '$$';
  if (krw < 3500000) return '$$$';
  return '$$$$';
}

// [hospitalSlug, procedureSlug, { ...overrides }]
const seed = [
  // ============ 소이 (직각어깨 시그너처)
  ['soi_강남점','square_shoulder_filler',{ price: 850000,  is_signature: true,  local_ko: '소이 직각어깨 필러', device: ['Juvederm Voluma'],  event: '5월 한정 -20%',   event_until: '2026-05-31', years: 9 }],
  ['soi_강남점','hifu_face',              { price: 480000,  is_signature: false, local_ko: '소이 슈링크 600샷', device: ['Shurink Universe'], event: null, years: 7 }],
  ['soi_강남점','botox_face_slimming',    { price: 120000,  is_signature: false, local_ko: '소이 사각턱',       device: ['Innotox'],          event: null, years: 9 }],
  ['soi_강남점','aquapeel_facial',        { price: 89000,   is_signature: false, local_ko: '소이 아쿠아클린',   device: ['HydraFacial'],      event: null, years: 6 }],
  ['soi_강남점','picosure_pico',          { price: 220000,  is_signature: false, local_ko: '소이 피코토닝',     device: ['PicoSure'],         event: null, years: 5 }],

  // ============ 벨리셀
  ['vellicell_강남점','hifu_face',         { price: 390000,  is_signature: true,  local_ko: '벨리셀 슈링크 600샷', device: ['Shurink'],         event: '5월 신규 -30%', event_until: '2026-05-31', years: 12 }],
  ['vellicell_강남점','inmode',            { price: 280000,  is_signature: false, local_ko: '벨리셀 인모드 1회',  device: ['InMode Forma'],     event: null, years: 6 }],
  ['vellicell_강남점','rf_thermage',       { price: 1700000, is_signature: false, local_ko: '벨리셀 써마지 900샷', device: ['Thermage FLX'],    event: null, years: 8 }],
  ['vellicell_강남점','skinbooster_juvelook', { price: 290000, is_signature: false, local_ko: '벨리셀 쥬베룩', device: ['Juvelook'],            event: null, years: 4 }],

  // ============ 아윤
  ['ayun_청담점','hifu_face',              { price: 550000,  is_signature: true,  local_ko: '아윤 울쎄라 300샷', device: ['Ulthera Prime'],    event: null, years: 8 }],
  ['ayun_청담점','rf_thermage',            { price: 2200000, is_signature: true,  local_ko: '아윤 써마지 FLX 1200샷', device: ['Thermage FLX'], event: '여름 패키지 -15%', event_until: '2026-08-31', years: 9 }],
  ['ayun_청담점','thread_lift_pdo',        { price: 1500000, is_signature: false, local_ko: '아윤 실리프팅 30가닥', device: ['Mint Lift'],      event: null, years: 7 }],
  ['ayun_청담점','rejuran_healer',         { price: 350000,  is_signature: false, local_ko: '아윤 리쥬란 1회',     device: ['Rejuran Healer'], event: null, years: 5 }],

  // ============ 듀이디
  ['dewyd_강남점','aquapeel_facial',       { price: 99000,  is_signature: true,  local_ko: '듀이디 시그니처 페이셜', device: ['HydraFacial'],   event: '주중 한정 -25%', event_until: '2026-06-30', years: 5 }],
  ['dewyd_강남점','skinbooster_juvelook',  { price: 270000, is_signature: false, local_ko: '듀이디 쥬베룩 1회',     device: ['Juvelook'],       event: null, years: 5 }],
  ['dewyd_강남점','picosure_pico',         { price: 180000, is_signature: false, local_ko: '듀이디 피코 1회',       device: ['PicoWay'],        event: null, years: 4 }],

  // ============ 라미체 (Club Miz)
  ['lamiche_청담점','rf_thermage',         { price: 2500000, is_signature: false, local_ko: '라미체 써마지 VIP', device: ['Thermage FLX'],      event: null, years: 16 }],
  ['lamiche_청담점','hifu_face',            { price: 600000,  is_signature: false, local_ko: '라미체 울쎄라 SPT', device: ['Ulthera SPT'],       event: null, years: 16 }],
  ['lamiche_청담점','exosome_iv',           { price: 880000,  is_signature: true,  local_ko: '라미체 시그니처 엑소좀 IV', device: [],            event: null, years: 5 }],
  ['lamiche_청담점','stemcell_face',        { price: 1200000, is_signature: false, local_ko: '라미체 줄기세포 페이셜', device: [],              event: null, years: 5 }],

  // ============ 우아 (얼굴윤곽)
  ['wooamedical_강남점','zygoma_reduction',{ price: 9800000, is_signature: true,  local_ko: '우아 광대축소',    device: [],                    event: null, years: 12 }],
  ['wooamedical_강남점','genioplasty',     { price: 7500000, is_signature: false, local_ko: '우아 턱끝성형',    device: [],                    event: null, years: 12 }],
  ['wooamedical_강남점','double_eyelid_incision', { price: 2900000, is_signature: false, local_ko: '우아 쌍커풀 절개', device: [],            event: null, years: 12 }],
  ['wooamedical_강남점','rhinoplasty_bridge',     { price: 6500000, is_signature: false, local_ko: '우아 콧대 + 코끝', device: [],            event: null, years: 12 }],

  // ============ 워너비 (눈·코)
  ['wannabe_강남점','double_eyelid_incision',{ price: 2500000, is_signature: true,  local_ko: '워너비 자연유착 쌍커풀', device: [],            event: '여름 시술 -10%', event_until: '2026-07-31', years: 8 }],
  ['wannabe_강남점','double_eyelid_nonincision',{ price: 1300000, is_signature: false, local_ko: '워너비 매몰',     device: [],                event: null, years: 8 }],
  ['wannabe_강남점','rhinoplasty_tip',     { price: 4900000, is_signature: false, local_ko: '워너비 코끝',       device: [],                    event: null, years: 8 }],
  ['wannabe_강남점','dark_circle_lower_lid',{ price: 3500000, is_signature: false, local_ko: '워너비 하안검',   device: [],                    event: null, years: 6 }],

  // ============ 반니
  ['vannyps_강남점','zygoma_reduction',    { price: 8500000, is_signature: false, local_ko: '반니 광대축소',    device: [],                    event: null, years: 7 }],
  ['vannyps_강남점','genioplasty',         { price: 6800000, is_signature: false, local_ko: '반니 턱끝',        device: [],                    event: null, years: 7 }],
  ['vannyps_강남점','double_eyelid_incision', { price: 2700000, is_signature: false, local_ko: '반니 쌍커풀',  device: [],                    event: null, years: 7 }],

  // ============ Hershe (외국인 1위)
  ['hershe_청담점','rhinoplasty_bridge',   { price: 7900000, is_signature: true,  local_ko: 'Hershe Premium Rhino', device: [],               event: null, years: 17 }],
  ['hershe_청담점','rhinoplasty_tip',      { price: 4800000, is_signature: true,  local_ko: 'Hershe Tip Plasty', device: [],                   event: null, years: 17 }],
  ['hershe_청담점','double_eyelid_incision', { price: 3200000, is_signature: false, local_ko: 'Hershe Double Eyelid', device: [],            event: null, years: 17 }],
  ['hershe_청담점','zygoma_reduction',     { price: 11000000, is_signature: false, local_ko: 'Hershe Zygoma',  device: [],                    event: null, years: 17 }],

  // ============ 365mc (지방흡입)
  ['365mc_강남본원','lams_liposuction',    { price: 6900000, is_signature: true,  local_ko: '365mc LAMS — 복부',  device: ['MicroAire','VASER'], event: null, years: 22 }],
  ['365mc_강남본원','cryolipo_body',       { price: 1800000, is_signature: false, local_ko: '365mc 쿨스컬프팅', device: ['Zeltiq CoolSculpting'], event: null, years: 12 }],
  ['365mc_강남본원','emsculpt',            { price: 990000,  is_signature: false, local_ko: '365mc EMSCULPT 4회', device: ['BTL EMSCULPT NEO'], event: null, years: 8 }],

  // ============ 리엔장 (피부과 - 리엔셀 시그너처)
  ['lienjang_강남점','skinbooster_juvelook', { price: 320000, is_signature: true,  local_ko: '리엔셀 피부주사', device: ['Juvelook'],          event: null, years: 14 }],
  ['lienjang_강남점','rejuran_healer',      { price: 380000,  is_signature: false, local_ko: '리엔셀 리쥬란',   device: ['Rejuran Healer'],    event: null, years: 14 }],
  ['lienjang_강남점','hifu_face',           { price: 490000,  is_signature: false, local_ko: '리엔셀 슈링크',   device: ['Shurink Universe'],  event: null, years: 14 }],
  ['lienjang_강남점','picosure_pico',       { price: 230000,  is_signature: false, local_ko: '리엔셀 피코',     device: ['PicoSure'],          event: null, years: 14 }],
  ['lienjang_강남점','frax_co2',            { price: 380000,  is_signature: false, local_ko: '리엔셀 프락셔널', device: ['Lutronic eCO2'],     event: null, years: 14 }],

  // ============ 노즈립 (코·입술 전문)
  ['noselips_강남점','rhinoplasty_bridge', { price: 7200000, is_signature: true,  local_ko: '노즈립 콧대 + 코끝', device: [],                  event: null, years: 20 }],
  ['noselips_강남점','rhinoplasty_tip',    { price: 4500000, is_signature: true,  local_ko: '노즈립 코끝',     device: [],                    event: null, years: 20 }],
  ['noselips_강남점','nose_filler',        { price: 480000,  is_signature: false, local_ko: '노즈립 코필러',   device: ['Juvederm Voluma'],   event: null, years: 20 }],

  // ============ 살롱드닥터튠즈 (패키지)
  ['drtunes_강남점','hifu_face',           { price: 520000,  is_signature: false, local_ko: '닥터튠즈 슈링크', device: ['Shurink'],            event: null, years: 6, package_notes: '글로우 패키지 (HIFU + 피코 + 페이셜) 90만원' }],
  ['drtunes_강남점','thread_lift_pdo',     { price: 1100000, is_signature: true,  local_ko: '닥터튠즈 실리프팅', device: ['Mint Lift'],         event: null, years: 6 }],
  ['drtunes_강남점','aquapeel_facial',     { price: 110000,  is_signature: false, local_ko: '닥터튠즈 클렌징', device: ['HydraFacial'],        event: null, years: 6 }],

  // ============ 셀로라
  ['cellora_강남점','rejuran_healer',      { price: 340000,  is_signature: true,  local_ko: '셀로라 리쥬란',   device: ['Rejuran Healer'],    event: '신규 -40%', event_until: '2026-06-30', years: 3 }],
  ['cellora_강남점','exosome_iv',          { price: 450000,  is_signature: false, local_ko: '셀로라 엑소좀',   device: [],                    event: null, years: 3 }],
  ['cellora_강남점','stemcell_face',       { price: 690000,  is_signature: false, local_ko: '셀로라 줄기세포', device: [],                    event: null, years: 3 }],

  // ============ 1mm (정밀)
  ['1mm_강남점','double_eyelid_nonincision', { price: 1500000, is_signature: true, local_ko: '1mm 매몰', device: [],                          event: null, years: 8 }],
  ['1mm_강남점','double_eyelid_incision',    { price: 2800000, is_signature: false, local_ko: '1mm 절개', device: [],                         event: null, years: 8 }],
  ['1mm_강남점','rhinoplasty_tip',           { price: 5200000, is_signature: false, local_ko: '1mm 코끝', device: [],                         event: null, years: 8 }],

  // ============ 협의중 5곳 — 한정적 데이터
  ['eunel_강남점','aquapeel_facial',       { price: 80000,   is_signature: false, local_ko: '유넬 페이셜',     device: ['HydraFacial'],       event: null, years: 2, disclosed: false }],
  ['eunel_강남점','botox_face_slimming',   { price: 130000,  is_signature: false, local_ko: '유넬 사각턱',     device: ['Innotox'],           event: null, years: 2, disclosed: false }],
  ['lead_강남점','double_eyelid_incision', { price: 2400000, is_signature: false, local_ko: '리드 쌍커풀',     device: [],                    event: null, years: 4, disclosed: false }],
  ['lead_강남점','rhinoplasty_tip',        { price: 4600000, is_signature: false, local_ko: '리드 코끝',       device: [],                    event: null, years: 4, disclosed: false }],
  ['sunnygarden_강남점','rejuran_healer',  { price: 320000,  is_signature: false, local_ko: '햇살 리쥬란',     device: ['Rejuran Healer'],    event: null, years: 3, disclosed: false }],
  ['drkoops_강남점','double_eyelid_incision', { price: 2600000, is_signature: false, local_ko: '그림 쌍커풀', device: [],                    event: null, years: 9, disclosed: false }],
  ['thepride_강남점','rhinoplasty_bridge', { price: 6800000, is_signature: false, local_ko: '더프라이드 콧대',  device: [],                   event: null, years: 11, disclosed: false }],

  // ============ 리엔장 치과
  ['lienjang_dental_강남점','dental_implant', { price: 1800000, is_signature: true,  local_ko: '리엔장 임플란트', device: ['Osstem'],          event: null, years: 10 }],
  ['lienjang_dental_강남점','invisalign',     { price: 6500000, is_signature: false, local_ko: '리엔장 인비절라인', device: ['Invisalign'],     event: null, years: 10 }],
  ['lienjang_dental_강남점','teeth_whitening',{ price: 450000,  is_signature: false, local_ko: '리엔장 미백',    device: ['Zoom!'],             event: null, years: 10 }],

  // ============ 센텀코어 (부산)
  ['centumcore_센텀점','hifu_face',         { price: 380000,  is_signature: false, local_ko: '센텀코어 슈링크', device: ['Shurink'],           event: null, years: 9 }],
  ['centumcore_센텀점','rhinoplasty_bridge',{ price: 5800000, is_signature: false, local_ko: '센텀코어 코',     device: [],                    event: null, years: 9 }],
  ['centumcore_센텀점','double_eyelid_incision', { price: 2200000, is_signature: false, local_ko: '센텀코어 쌍커풀', device: [],               event: null, years: 9 }],
  ['centumcore_센텀점','frax_co2',          { price: 320000,  is_signature: false, local_ko: '센텀코어 프락셔널', device: ['Lutronic eCO2'],   event: null, years: 9 }],
];

export const hospitalProcedures = seed.map(([hSlug, pSlug, o], idx) => {
  const h = hospitalBySlug[hSlug];
  const p = procedureBySlug[pSlug];
  if (!h) throw new Error(`hospital_procedures: missing hospital ${hSlug}`);
  if (!p) throw new Error(`hospital_procedures: missing procedure ${pSlug}`);

  // Calc starting price + tier
  const starting_price_krw = o.price;
  const original = o.price && p.market_price_max ? Math.round(Math.max(o.price * 1.3, (p.market_price_min + p.market_price_max) / 2)) : null;

  return {
    id: idx + 1,
    hospital_id: h.id,
    procedure_id: p.id,
    offered: true,
    local_name_ko: o.local_ko || p.name_ko,
    local_name_en: o.local_en || p.name_en,
    local_name_zh: o.local_zh || p.name_zh,
    local_name_ja: o.local_ja || p.name_ja,
    price_tier: priceTier(starting_price_krw),
    price_disclosed: o.disclosed !== false && starting_price_krw != null,
    starting_price_krw,
    original_price_krw: original, // 화면용 (할인율 계산)
    pricing_notes: p.common_units ? `${p.common_units.join(' / ')} ${p.unit_type === 'shots' ? '샷' : p.unit_type === 'cc' ? 'cc' : p.unit_type === 'sessions' ? '회' : '옵션'}` : null,
    available_units: p.common_units || null,
    has_active_event: Boolean(o.event),
    event_notes: o.event || null,
    event_until: o.event_until || null,
    package_notes: o.package_notes || null,
    device_brands: o.device || [],
    doctor_specialty: o.doctor_specialty || null,
    years_offering: o.years,
    is_signature: o.is_signature,
    thumbnail_url: null,
    hero_image_url: null,
    source_url: h.website_url,
    notes: null,
    created_at: '2026-05-12T00:00:00Z',
    updated_at: '2026-05-12T00:00:00Z',
  };
});

export const hpByHospital = hospitalProcedures.reduce((acc, hp) => {
  (acc[hp.hospital_id] ||= []).push(hp);
  return acc;
}, {});

export const hpByProcedure = hospitalProcedures.reduce((acc, hp) => {
  (acc[hp.procedure_id] ||= []).push(hp);
  return acc;
}, {});

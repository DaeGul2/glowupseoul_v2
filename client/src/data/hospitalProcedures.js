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
  // ============ 소이 — 실측 메뉴 15행 (SIGNATURE 5 + 일반 L2 10)
  // 가격 전부 null (사이트에 "상담필요"), 장비/샷 옵션 비움 (시술 수준 룰).
  // — SIGNATURE 5 (메뉴 SIGNATURE 그룹) —
  ['soi_강남점','thread_lift_pdo',             { price: null, is_signature: true,  local_ko: '압토스 이중턱 실리프팅',    device: [], event: null, years: 9, disclosed: false }],
  ['soi_강남점','filler_full_face_3d',         { price: null, is_signature: true,  local_ko: '3D 풀페이스 필러',           device: [], event: null, years: 9, disclosed: false }],
  ['soi_강남점','square_shoulder_filler',      { price: null, is_signature: true,  local_ko: '소이 직각 어깨 필러',         device: [], event: null, years: 9, disclosed: false }],
  ['soi_강남점','filler_hip_apple',            { price: null, is_signature: true,  local_ko: '소이 골반 필러 (애플 힙)',    device: [], event: null, years: 9, disclosed: false }],
  ['soi_강남점','filler_ear',                  { price: null, is_signature: true,  local_ko: '미인 귀 필러',                 device: [], event: null, years: 9, disclosed: false }],
  // — LIFTING 메뉴 (실리프팅 SIGNATURE 행으로 흡수, 2행) —
  ['soi_강남점','hifu_face',                   { price: null, is_signature: false, local_ko: '안티에이징 리프팅 (울쎄라·써마지·마이크로EMS·프라임레이즈)', device: [], event: null, years: 7, disclosed: false }],
  ['soi_강남점','hifu_body',                   { price: null, is_signature: false, local_ko: '바디 리프팅 (울핏)',           device: [], event: null, years: 5, disclosed: false }],
  // — FILLER/BTX 메뉴 (3행) —
  ['soi_강남점','filler_ha_cheek',             { price: null, is_signature: false, local_ko: '필러 (국산·쥬비덤·레스틸렌·벨로테로·줄기세포·울트라콜·쥬베룩·레디어스·엘란쎄·바디필러)', device: [], event: null, years: 9, disclosed: false }],
  ['soi_강남점','botox_face_slimming',         { price: null, is_signature: false, local_ko: '보톡스 (국산·제오민 × 주름·턱·광대·관자·침샘·바디)', device: [], event: null, years: 9, disclosed: false }],
  ['soi_강남점','fat_dissolve_injection_face', { price: null, is_signature: false, local_ko: '에스핏주사 (페이스 2cc · 바디 S-PL 100cc · 바디 에스핏 10cc)', device: [], event: null, years: 5, disclosed: false }],
  // — SKIN 메뉴 (5행) —
  ['soi_강남점','skinbooster_juvelook',        { price: null, is_signature: false, local_ko: '스킨부스터 (L샤인·엑소힐러·큐어스템·리쥬란·쥬베룩·릴리이드M·스킨바이브·비타란/리제반PN·올리디아)', device: [], event: null, years: 6, disclosed: false }],
  ['soi_강남점','picosure_pico',               { price: null, is_signature: false, local_ko: '미백레이저 (프라임레이즈 색소·혈관, 포텐자)', device: [], event: null, years: 5, disclosed: false }],
  ['soi_강남점','aquapeel_facial',             { price: null, is_signature: false, local_ko: '피부관리 (이온토·듀오하이드로젠·블랙필·생크림필·쎄라필·라라필·알라딘필링 얼/바·여드름압출·골드PTT+토닝)', device: [], event: null, years: 6, disclosed: false }],
  ['soi_강남점','iv_therapy_generic',          { price: null, is_signature: false, local_ko: '수액 (다이어트·마늘·슈퍼백옥·신데렐라·미백플러스)', device: [], event: null, years: 5, disclosed: false }],
  ['soi_강남점','stemcell_face',               { price: null, is_signature: false, local_ko: '줄기세포',                     device: [], event: null, years: 4, disclosed: false }],

  // ============ 벨리셀 — 실측 메뉴 10행 (통증케어 제외, 시술 수준 룰)
  // 가격 전부 null (상담문의), 장비/샷 비움.
  ['vellicell_강남점','botox_face_slimming',         { price: null, is_signature: false, local_ko: '페이스 보톡스',                          device: [], event: null, years: 12, disclosed: false }],
  ['vellicell_강남점','botox_body',                  { price: null, is_signature: false, local_ko: '바디 보톡스 (종아리·승모근·어깨)',         device: [], event: null, years: 10, disclosed: false }],
  ['vellicell_강남점','fat_dissolve_injection_face', { price: null, is_signature: false, local_ko: '지방분해 주사',                            device: [], event: null, years: 10, disclosed: false }],
  ['vellicell_강남점','glp1_injection',              { price: null, is_signature: false, local_ko: '다이어트 주사제 (마운자로)',                device: [], event: null, years: 2,  disclosed: false }],
  ['vellicell_강남점','filler_ha_cheek',             { price: null, is_signature: false, local_ko: '페이스 필러',                              device: [], event: null, years: 12, disclosed: false }],
  ['vellicell_강남점','frax_co2',                    { price: null, is_signature: false, local_ko: '레이저리프팅 / 모공·흉터 개선 (프락셔널)', device: [], event: null, years: 8,  disclosed: false }],
  ['vellicell_강남점','skinbooster_juvelook',        { price: null, is_signature: false, local_ko: '스킨부스터 (콜라겐 볼륨·재생 / 탄력·물광)', device: [], event: null, years: 6,  disclosed: false }],
  ['vellicell_강남점','picosure_pico',               { price: null, is_signature: false, local_ko: '색소치료 (기미·잡티·여드름·점·문신)',         device: [], event: null, years: 9,  disclosed: false }],
  ['vellicell_강남점','aquapeel_facial',             { price: null, is_signature: false, local_ko: '메디컬 스킨케어',                          device: [], event: null, years: 8,  disclosed: false }],
  ['vellicell_강남점','iv_therapy_generic',          { price: null, is_signature: false, local_ko: '디톡스 & 바이탈 수액테라피',                device: [], event: null, years: 6,  disclosed: false }],

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

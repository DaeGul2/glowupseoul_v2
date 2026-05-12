// 매칭 매트릭스 (hand-curated).
// relevance: primary | secondary | adjunct
import { concernBySlug } from './concerns.js';
import { procedureBySlug } from './procedures.js';

const raw = [
  // sagging
  ['sagging','hifu_face','primary','SMAS 직접 자극으로 비절개 리프팅 1순위'],
  ['sagging','rf_thermage','primary','콜라겐 수축 — 탄력 + 처짐 동시'],
  ['sagging','thread_lift_pdo','primary','즉각 리프팅이 필요한 경우 최우선'],
  ['sagging','inmode','secondary','초경증 리프팅·홈케어 보조'],
  // wrinkles
  ['wrinkles','botox_face_slimming','primary','표정주름 1순위'],
  ['wrinkles','rf_thermage','primary','잔주름·탄력 동시 개선'],
  ['wrinkles','skinbooster_juvelook','secondary','얕은 잔주름 보강'],
  // volume_loss
  ['volume_loss','filler_ha_cheek','primary','꺼진 볼·관자놀이 표준 솔루션'],
  ['volume_loss','thread_lift_pdo','secondary','경증 처짐 동반 시'],
  // jawline
  ['jawline','hifu_face','primary','턱밑 SMAS 강화'],
  ['jawline','thread_lift_pdo','primary','턱선 끌어올리기'],
  ['jawline','rf_thermage','secondary','경증 턱선 정리'],
  // face_size
  ['face_size','botox_face_slimming','primary','교근 축소 1순위'],
  ['face_size','genioplasty','adjunct','수술적 윤곽이 필요한 경우'],
  // cheekbones
  ['cheekbones','zygoma_reduction','primary','광대 축소 표준 술식'],
  // pores
  ['pores','frax_co2','primary','분획 레이저 — 모공 표준'],
  ['pores','picosure_pico','secondary','색소+모공 동시'],
  ['pores','aquapeel_facial','adjunct','관리 베이스'],
  // skin_tone
  ['skin_tone','picosure_pico','primary','피코 — 톤 표준'],
  ['skin_tone','aquapeel_facial','secondary','수분·광채 보강'],
  // pigmentation
  ['pigmentation','picosure_pico','primary','피코 색소 분해 1순위'],
  ['pigmentation','frax_co2','secondary','진피 색소 동반 시'],
  // acne_scars
  ['acne_scars','frax_co2','primary','CO2 프락셔널 표준'],
  ['acne_scars','rejuran_healer','primary','재생 보강 — 진피 흉터'],
  ['acne_scars','skinbooster_juvelook','secondary','보습 + 콜라겐'],
  // acne_active
  ['acne_active','aquapeel_facial','primary','각질·염증 관리'],
  ['acne_active','rejuran_healer','secondary','진정·재생'],
  // dark_circles
  ['dark_circles','dark_circle_lower_lid','primary','지방형 다크서클 수술적 해결'],
  ['dark_circles','rejuran_healer','secondary','색소·잔주름형'],
  // eye_shape
  ['eye_shape','double_eyelid_incision','primary','반영구 쌍커풀'],
  ['eye_shape','double_eyelid_nonincision','primary','회복 빠른 쌍커풀'],
  // nose_shape
  ['nose_shape','rhinoplasty_tip','primary','코끝 모양'],
  ['nose_shape','rhinoplasty_bridge','primary','콧대'],
  ['nose_shape','nose_filler','secondary','비절개 옵션'],
  // body_contour
  ['body_contour','square_shoulder_filler','primary','어깨 라인 보정'],
  ['body_contour','emsculpt','secondary','근육 라인'],
  // fat_local
  ['fat_local','lams_liposuction','primary','부분 지방 — 수술적'],
  ['fat_local','cryolipo_body','primary','부분 지방 — 비수술'],
  ['fat_local','emsculpt','adjunct','근육 보강'],
  // hair_loss
  ['hair_loss','scalp_prp','primary','PRP 두피 자극'],
  ['hair_loss','hair_transplant','primary','진행 탈모 수술'],
  // aging_overall
  ['aging_overall','hifu_face','primary','전반 노화 1순위'],
  ['aging_overall','rf_thermage','primary','탄력+잔주름'],
  ['aging_overall','exosome_iv','secondary','내적 재생'],
  ['aging_overall','stemcell_face','secondary','진피 재생'],
  // dental_align
  ['dental_align','invisalign','primary','투명 교정 1순위'],
];

export const concernProcedures = raw.map(([concernSlug, procSlug, relevance, rationale_ko]) => {
  const c = concernBySlug[concernSlug];
  const p = procedureBySlug[procSlug];
  if (!c || !p) throw new Error(`concernProcedures: bad mapping ${concernSlug} → ${procSlug}`);
  return {
    concern_id: c.id,
    procedure_id: p.id,
    relevance,
    rationale_ko,
    rationale_en: rationale_ko,
    rationale_zh: rationale_ko,
    rationale_ja: rationale_ko,
  };
});

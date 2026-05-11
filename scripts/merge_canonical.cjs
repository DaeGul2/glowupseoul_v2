// 258 시술 → canonical treatment catalog (중복 merge)
//
// 참고: 강남언니(3축), 바비톡(3-tier intensity), 여신티켓(brand=category)
// 채택: foreign patient 관점 — concern 우선, body_area·mechanism 보조, 바비톡식 intensity_tier
//
// 출력: v2/docs/hospital_research.xlsx 에 시트 4개 추가
//   - CanonicalCatalog        (각 캐노니컬 시술 1행)
//   - CanonicalMembership     (캐노니컬 ↔ 원본 T### 매핑)
//   - MechanismEnum           (30개 mechanism 정리)
//   - CategoryAxes            (분류축 enum 정리: intensity_tier / body_area / concern)
//
// 실행: node scripts/merge_canonical.cjs

const XLSX = require('xlsx');
const path = require('path');

// =====================================================================
// 원본 Treatments 데이터 복제 (export_research.cjs 와 동기)
// =====================================================================
const T = []; let _tid = 0;
const tadd = (clinic_slug, clinic_name, category_self, name_ko, name_en, mech, body_area, is_surgical, note) => {
  _tid++;
  T.push({ id: 'T' + String(_tid).padStart(3, '0'), clinic_slug, clinic_name, category_self, name_ko, name_en: name_en || '', mechanism_guess: mech, body_area, is_surgical: is_surgical ? 'Y' : 'N', note: note || '' });
};

// 1. 소이의원
tadd('soi','소이의원','시그니처','압토스 이중턱 실리프팅','Aptos Thread (Double Chin)','thread','jawline,neck',false,'');
tadd('soi','소이의원','시그니처','3D 풀페이스 필러','3D Full-face Filler','injection_filler','face',false,'');
tadd('soi','소이의원','시그니처','직각 어깨 필러','Straight Shoulder Filler','injection_filler','body (shoulder)',false,'바디 부위 필러 — 시그니처');
tadd('soi','소이의원','시그니처','골반 필러','Pelvis Filler','injection_filler','body (pelvis)',false,'바디 부위 필러');
tadd('soi','소이의원','시그니처','애플힙 필러','Apple Hip Filler','injection_filler','buttocks',false,'바디 부위 필러');
tadd('soi','소이의원','시그니처','미인 귀 필러','Ear Filler','injection_filler','ear',false,'바디 부위 필러');
tadd('soi','소이의원','리프팅','안티에이징 리프팅','Anti-aging Lifting','hifu? rf?','face',false,'기기명 미상');
tadd('soi','소이의원','리프팅','바디 리프팅','Body Lifting','hifu? rf?','body',false,'기기명 미상');
tadd('soi','소이의원','주사','보톡스','Botox','injection_toxin','face',false,'');
tadd('soi','소이의원','주사','에스핏주사','SFit Injection','fat_dissolve_injection','face,body',false,'지방분해');
tadd('soi','소이의원','스킨','스킨부스터','Skin Booster','injection_skin','face',false,'');
tadd('soi','소이의원','스킨','미백레이저','Whitening Laser','laser_non_ablative','face',false,'');
tadd('soi','소이의원','스킨','피부관리','Facial Care','topical','face',false,'');
tadd('soi','소이의원','기타','수액(IV)','IV Therapy','iv_therapy','systemic',false,'enum 밖');
tadd('soi','소이의원','기타','줄기세포','Stem Cell','stem_cell','systemic',false,'enum 밖');

// 3. 아윤
tadd('ayun','아윤의원','리프팅','울쎄라 프라임','Ultherapy PRIME','hifu','face',false,'device_brand');
tadd('ayun','아윤의원','리프팅','써마지 FLX','Thermage FLX','rf','face',false,'device_brand');
tadd('ayun','아윤의원','윤곽','윤곽주사 (Face Contouring)','Face Contouring','injection_skin (lipolytic)','face',false,'');
tadd('ayun','아윤의원','스킨부스터','리버스 부스터','Rebirth Booster','injection_skin','face',false,'자체 브랜딩');
tadd('ayun','아윤의원','인젝션','리쥬란','Rejuran','injection_skin','face',false,'PN');

// 4. 듀이디
tadd('dewyd','듀이디의원','Toning','Reepot','Reepot','laser_non_ablative','face',false,'device');
tadd('dewyd','듀이디의원','Toning','Pico Plus','Pico Plus','laser_non_ablative','face',false,'device');
tadd('dewyd','듀이디의원','Toning','Pico Sure','Pico Sure','laser_non_ablative','face',false,'device');
tadd('dewyd','듀이디의원','Toning','Genesis','Laser Genesis','laser_non_ablative','face',false,'device');
tadd('dewyd','듀이디의원','Toning','Lucas Plus','Lucas Plus','laser_non_ablative','face',false,'device');
tadd('dewyd','듀이디의원','Resurfacing','Fraxel','Fraxel','laser_ablative','face',false,'device');
tadd('dewyd','듀이디의원','Resurfacing','CO2','CO2 Laser','laser_ablative','face',false,'device');
tadd('dewyd','듀이디의원','Resurfacing','CO2 Fraxel','CO2 Fraxel','laser_ablative','face',false,'device');
tadd('dewyd','듀이디의원','RF Microneedle','Potenza','Potenza','rf','face',false,'device — microneedle RF');
tadd('dewyd','듀이디의원','RF Microneedle','Potenza DIA','Potenza DIA','rf','face',false,'device');
tadd('dewyd','듀이디의원','Lifting','Titanium Onda','Titanium Onda','rf','face',false,'device');
tadd('dewyd','듀이디의원','Lifting','Ultherapy','Ultherapy','hifu','face',false,'device');
tadd('dewyd','듀이디의원','Lifting','Thermage FLX','Thermage FLX','rf','face',false,'device');
tadd('dewyd','듀이디의원','Lifting','Inmode','Inmode','rf','face',false,'device');
tadd('dewyd','듀이디의원','Lifting','Shrink Universe','Shrink Universe','hifu','face',false,'device');
tadd('dewyd','듀이디의원','Skinbooster','Rejuran','Rejuran','injection_skin','face',false,'');
tadd('dewyd','듀이디의원','Skinbooster','Rejuran HB','Rejuran HB','injection_skin','face',false,'');
tadd('dewyd','듀이디의원','Skinbooster','Eye Rejuran','Eye Rejuran','injection_skin','eye',false,'');
tadd('dewyd','듀이디의원','Skinbooster','Rizene','Rizene','injection_skin','face',false,'');
tadd('dewyd','듀이디의원','Skinbooster','Sculptra','Sculptra','injection_skin (collagen)','face',false,'collagen booster');
tadd('dewyd','듀이디의원','Filler','Juvederm','Juvederm','injection_filler','face',false,'');
tadd('dewyd','듀이디의원','Filler','Juvederm Volume','Juvederm Volume','injection_filler','face',false,'');
tadd('dewyd','듀이디의원','Filler','Relead M','Relead M','injection_skin','face',false,'');
tadd('dewyd','듀이디의원','Scar','Subsicion','Subcision','subcision','face',false,'흉터');
tadd('dewyd','듀이디의원','Acne','PDT','PDT','topical (light)','face',false,'photodynamic');
tadd('dewyd','듀이디의원','Acne','Extraction','Extraction','extraction','face',false,'압출');
tadd('dewyd','듀이디의원','Acne','Scaling','Scaling','extraction','face',false,'');
tadd('dewyd','듀이디의원','Acne','염증주사','Inflammation Injection','injection_toxin (steroid?)','face',false,'스테로이드 추정');

// 5. 라미체
tadd('lamiche','라미체의원','리프팅','울쎄라','Ulthera','hifu','face',false,'');
tadd('lamiche','라미체의원','리프팅','써마지 FLX','Thermage FLX','rf','face',false,'');
tadd('lamiche','라미체의원','리프팅','슈링크','Shurink','hifu','face',false,'');
tadd('lamiche','라미체의원','리프팅','인모드','Inmode','rf','face',false,'');
tadd('lamiche','라미체의원','리프팅','올리지오','Oligio','rf','face',false,'');
tadd('lamiche','라미체의원','리프팅','토르','Thor','rf? hifu?','face',false,'');
tadd('lamiche','라미체의원','여드름/모공','프락셀듀얼','Fraxel Dual','laser_ablative','face',false,'');
tadd('lamiche','라미체의원','여드름/모공','Legato2','Legato2','rf (microneedle)','face',false,'');
tadd('lamiche','라미체의원','여드름/모공','DRT','DRT','laser_non_ablative','face',false,'');
tadd('lamiche','라미체의원','여드름/모공','PDT','PDT','topical (light)','face',false,'');
tadd('lamiche','라미체의원','여드름/모공','모피어스8','Morpheus8','rf (microneedle)','face',false,'');
tadd('lamiche','라미체의원','여드름/모공','미라젯','Mirajet','laser_non_ablative','face',false,'');
tadd('lamiche','라미체의원','색소/홍조','Excel V','Excel V','laser_non_ablative','face',false,'vascular');
tadd('lamiche','라미체의원','색소/홍조','피코슈어','Picosure','laser_non_ablative','face',false,'');
tadd('lamiche','라미체의원','색소/홍조','BBL','BBL','laser_non_ablative','face',false,'IPL 계열');
tadd('lamiche','라미체의원','색소/홍조','Photona','Photona','laser_non_ablative','face',false,'');
tadd('lamiche','라미체의원','주사','보톡스','Botox','injection_toxin','face',false,'');
tadd('lamiche','라미체의원','주사','필러','Filler','injection_filler','face',false,'');
tadd('lamiche','라미체의원','주사','쥬베덤','Juvederm','injection_filler','face',false,'');
tadd('lamiche','라미체의원','주사','벨로테로','Belotero','injection_filler','face',false,'');
tadd('lamiche','라미체의원','주사','리쥬란힐러','Rejuran Healer','injection_skin','face',false,'');
tadd('lamiche','라미체의원','주사','스컬트라','Sculptra','injection_skin','face',false,'');
tadd('lamiche','라미체의원','주사','엘란쎄','Ellanse','injection_filler','face',false,'bio-filler');
tadd('lamiche','라미체의원','주사','윤곽주사','Contour Injection','injection_skin (lipolytic)','face',false,'');
tadd('lamiche','라미체의원','실','실리프트','Thread Lift','thread','face',false,'');

// 6. 우아
tadd('wooa','우아 성형외과','가슴','모티바 어고노믹스','Motiva Ergonomix','surgery','breast',true,'implant brand');
tadd('wooa','우아 성형외과','가슴','멘토 엑스트라','Mentor Extra','surgery','breast',true,'implant brand');
tadd('wooa','우아 성형외과','가슴','멘토 부스트','Mentor Boost','surgery','breast',true,'implant brand');
tadd('wooa','우아 성형외과','가슴','삼중평면법','Triple Plane Aug','surgery','breast',true,'기법');
tadd('wooa','우아 성형외과','가슴','하이브리드 가슴성형','Hybrid Breast Aug','surgery','breast',true,'implant+fat');
tadd('wooa','우아 성형외과','리프팅','스마스리프트','SMAS Lift','surgery','face',true,'');
tadd('wooa','우아 성형외과','리프팅','미니퀵리프팅','Mini Quick Lift','surgery','face',true,'');
tadd('wooa','우아 성형외과','체형','지방이식','Fat Grafting','fat_grafting','face,body',true,'');
tadd('wooa','우아 성형외과','쁘띠','써마지 FLX','Thermage FLX','rf','face',false,'');
tadd('wooa','우아 성형외과','쁘띠','아큐스컬프','Accusculpt','laser_ablative (sub)','face,body',false,'레이저 지방분해');
tadd('wooa','우아 성형외과','쁘띠','우아트임','Wooa Eye Cut','surgery','eye',true,'자체 브랜딩 (앞/뒤트임)');
tadd('wooa','우아 성형외과','쁘띠','줄기세포','Stem Cell','stem_cell','face,body',false,'');
tadd('wooa','우아 성형외과','쁘띠','필러','Filler','injection_filler','face',false,'');
tadd('wooa','우아 성형외과','쁘띠','볼라이트','Volite','injection_skin','face',false,'');
tadd('wooa','우아 성형외과','쁘띠','실리프팅','Thread Lift','thread','face',false,'');

// 7. 워너비
tadd('wannabe','워너비 성형외과','눈','쌍커풀','Double Eyelid','surgery','eye',true,'');
tadd('wannabe','워너비 성형외과','눈','눈밑지방재배치','Lower Bleph','surgery','eye',true,'');
tadd('wannabe','워너비 성형외과','코','매부리코','Hump Nose','surgery','nose',true,'');
tadd('wannabe','워너비 성형외과','코','무보형물 코성형','No-implant Rhinoplasty','surgery','nose',true,'');
tadd('wannabe','워너비 성형외과','안면윤곽','V라인','V-line','surgery','jaw',true,'');
tadd('wannabe','워너비 성형외과','안면윤곽','광대','Zygoma Reduction','surgery','cheek',true,'');
tadd('wannabe','워너비 성형외과','안면윤곽','사각턱','Mandible Reduction','surgery','jaw',true,'');
tadd('wannabe','워너비 성형외과','안티에이징','이마거상','Forehead Lift','surgery','forehead',true,'');
tadd('wannabe','워너비 성형외과','가슴','가슴확대','Breast Aug','surgery','breast',true,'');
tadd('wannabe','워너비 성형외과','가슴','가슴축소','Breast Reduction','surgery','breast',true,'');
tadd('wannabe','워너비 성형외과','바디라인','지방흡입','Liposuction','liposuction','body',true,'');
tadd('wannabe','워너비 성형외과','바디라인','복부성형','Abdominoplasty','surgery','abdomen',true,'');
tadd('wannabe','워너비 성형외과','탈모','모발이식','Hair Transplant','hair_transplant','scalp',true,'단독 센터');
tadd('wannabe','워너비 성형외과','줄기세포','줄기세포','Stem Cell','stem_cell','systemic',false,'단독 센터');
tadd('wannabe','워너비 성형외과','비수술','울쎄라피','Ultherapy','hifu','face',false,'');
tadd('wannabe','워너비 성형외과','비수술','써마지 FLX','Thermage FLX','rf','face',false,'');
tadd('wannabe','워너비 성형외과','비수술','보톡스','Botox','injection_toxin','face',false,'');
tadd('wannabe','워너비 성형외과','비수술','필러','Filler','injection_filler','face',false,'');
tadd('wannabe','워너비 성형외과','비수술','3D 지방이식','3D Fat Graft','fat_grafting','face',false,'');
tadd('wannabe','워너비 성형외과','비수술','민트리프팅','Mint Lift','thread','face',false,'PCL');
tadd('wannabe','워너비 성형외과','비수술','실루엣리프팅','Silhouette Lift','thread','face',false,'PLA');
tadd('wannabe','워너비 성형외과','비수술','엘라스티꿈리프팅','Elasticum Lift','thread','face',false,'');
tadd('wannabe','워너비 성형외과','비수술','원더리프팅','Wonder Lift','thread','face',false,'');
tadd('wannabe','워너비 성형외과','비수술','PRP','PRP','prp','face,scalp',false,'');
tadd('wannabe','워너비 성형외과','레이저','프락셀Ⅱ','Fraxel II','laser_ablative','face',false,'');
tadd('wannabe','워너비 성형외과','레이저','프락셀GV','Fraxel GV','laser_ablative','face',false,'');
tadd('wannabe','워너비 성형외과','레이저','CO2 레이저','CO2 Laser','laser_ablative','face',false,'');
tadd('wannabe','워너비 성형외과','레이저','IPL','IPL','laser_non_ablative','face',false,'');

// 9. Hershe
tadd('hershe','Hershe 성형외과','Lifting','MACS Lift','MACS Lift','surgery','face',true,'');
tadd('hershe','Hershe 성형외과','Lifting','Full Facelift','Full Facelift','surgery','face',true,'');
tadd('hershe','Hershe 성형외과','Lifting','Mid Facelift','Mid Facelift','surgery','face',true,'');
tadd('hershe','Hershe 성형외과','Lifting','Neck Lift','Neck Lift','surgery','neck',true,'');
tadd('hershe','Hershe 성형외과','Eyes','Sub-brow Lift','Sub-brow Lift','surgery','eye',true,'');
tadd('hershe','Hershe 성형외과','Eyes','Blepharoplasty','Blepharoplasty','surgery','eye',true,'');
tadd('hershe','Hershe 성형외과','Eyes','Eye Bag Removal','Eye Bag Removal','surgery','eye',true,'');
tadd('hershe','Hershe 성형외과','Beauty','Rhinoplasty','Rhinoplasty','surgery','nose',true,'');
tadd('hershe','Hershe 성형외과','Beauty','Breast Augmentation','Breast Augmentation','surgery','breast',true,'');
tadd('hershe','Hershe 성형외과','Body','Liposuction','Liposuction','liposuction','body',true,'');
tadd('hershe','Hershe 성형외과','Body','Fat Grafting','Fat Grafting','fat_grafting','face,body',true,'');
tadd('hershe','Hershe 성형외과','Buttocks','Hip Augmentation','Hip Augmentation','surgery','buttocks',true,'');
tadd('hershe','Hershe 성형외과','Buttocks','Hip Dip Correction','Hip Dip Correction','surgery','buttocks',true,'niche');
tadd('hershe','Hershe 성형외과','비수술','Epiticon','Epiticon','thread','face',false,'thread brand');
tadd('hershe','Hershe 성형외과','비수술','Mini SMAS Thread','Mini SMAS Thread','thread','face',false,'');
tadd('hershe','Hershe 성형외과','비수술','Liftera II','Liftera II','hifu','face',false,'');

// 10. 365mc
tadd('365mc','365mc','지방흡입','허벅지 지방흡입','Thigh Liposuction','liposuction','thigh',true,'');
tadd('365mc','365mc','지방흡입','복부 지방흡입','Abdomen Liposuction','liposuction','abdomen',true,'');
tadd('365mc','365mc','지방흡입','팔뚝 지방흡입','Arm Liposuction','liposuction','arm',true,'');
tadd('365mc','365mc','지방흡입','종아리 지방흡입','Calf Liposuction','liposuction','calf',true,'');
tadd('365mc','365mc','지방흡입','남성 여유증','Gynecomastia','liposuction','chest',true,'');
tadd('365mc','365mc','특수','안면 지방흡입','Facial Liposuction','liposuction','face',true,'');
tadd('365mc','365mc','특수','재수술 지방흡입','Revision Liposuction','liposuction','body',true,'');
tadd('365mc','365mc','시그너처','람스(LAMS)','LAMS','liposuction (proprietary)','body',true,'365mc 고유 기법');
tadd('365mc','365mc','시그너처','무한람스','Infinity LAMS','liposuction (proprietary)','body',true,'365mc 고유 기법');
tadd('365mc','365mc','주사','DCA 밉살주사','DCA Injection','fat_dissolve_injection','face,body',false,'');
tadd('365mc','365mc','지방줄기세포','지방줄기세포 스킨샷','Stem Cell Skin Shot','stem_cell','face',false,'');
tadd('365mc','365mc','지방줄기세포','지방줄기세포 헤어샷','Stem Cell Hair Shot','stem_cell','scalp',false,'');
tadd('365mc','365mc','지방줄기세포','지방줄기세포 바이오샷','Stem Cell Bio Shot','stem_cell','systemic',false,'');
tadd('365mc','365mc','지방줄기세포','지방줄기세포 뱅킹','Stem Cell Banking','stem_cell (banking)','systemic',false,'보관');
tadd('365mc','365mc','기타','팽팽크림','Firming Cream','topical','body',false,'');

// 11. 리엔장 강남
tadd('lienjang_gangnam','리엔장 강남','스킨부스터','리쥬란힐러','Rejuran Healer','injection_skin','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','스킨부스터','쥬베룩','Juvelook','injection_skin','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','스킨부스터','스킨바이브','Skinvive','injection_skin','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','스킨부스터','ASCE+ 엑소좀','ASCE+ Exosome','exosome','face',false,'재생');
tadd('lienjang_gangnam','리엔장 강남','스킨부스터','루미비온','Lumivion','injection_skin','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','스킨부스터','엘레베스','Elebes','injection_skin','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','스킨부스터','메타셀MCT','MetaCell MCT','injection_skin','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','HIFU/RF','울쎄라피','Ultherapy','hifu','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','HIFU/RF','써마지','Thermage','rf','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','HIFU/RF','울써마지','Ulthermage','hifu+rf','face',false,'동시 시술');
tadd('lienjang_gangnam','리엔장 강남','HIFU/RF','슈링크 유니버스','Shurink Universe','hifu','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','HIFU/RF','인모드','Inmode','rf','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','HIFU/RF','올리지오','Oligio','rf','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','HIFU/RF','리프테라2','Liftera 2','hifu','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','HIFU/RF','볼뉴머','Volnewmer','rf','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','HIFU/RF','리니어지','Linerage','hifu','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','에너지','온다리프팅','Onda Lifting','rf','face,body',false,'');
tadd('lienjang_gangnam','리엔장 강남','에너지','쿨페이즈','Coolphase','rf','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','에너지','소프웨이브','Sofwave','mmfu','face',false,'마이크로포커스');
tadd('lienjang_gangnam','리엔장 강남','에너지','티타늄리프팅','Titanium Lift','rf','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','실','실리프팅','Thread Lift','thread','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','주사','보톡스','Botox','injection_toxin','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','주사','필러','Filler','injection_filler','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','주사','윤곽주사','Contour Injection','injection_skin (lipolytic)','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','주사','브이올렛주사','V-let Injection','injection_skin','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','주사','리엔셀 피부주사','Liencell Skin Injection','injection_skin','face',false,'자체 브랜딩');
tadd('lienjang_gangnam','리엔장 강남','주사','리엔셀 정맥주사','Liencell IV','iv_therapy','systemic',false,'자체 브랜딩');
tadd('lienjang_gangnam','리엔장 강남','주사','리프팅주사','Lifting Injection','injection_skin','face',false,'');
tadd('lienjang_gangnam','리엔장 강남','바디','살빼주사','Slim Injection','fat_dissolve_injection','body',false,'');
tadd('lienjang_gangnam','리엔장 강남','바디','1인치주사','1-inch Injection','fat_dissolve_injection','body',false,'');
tadd('lienjang_gangnam','리엔장 강남','바디','바디보툴리늄','Body Botox','injection_toxin','body',false,'');
tadd('lienjang_gangnam','리엔장 강남','바디','울트라인','Ultraline','hifu (body)','body',false,'바디용');

// 12. 노즈립
tadd('noselips','노즈립','구순구개열','구순구개열 2차 수술','Cleft Lip/Palate Revision','reconstructive','lip,nose',true,'niche');
tadd('noselips','노즈립','코재수술','구축코 재수술','Contracted Nose Revision','surgery','nose',true,'');
tadd('noselips','노즈립','코재수술','휜코','Crooked Nose','surgery','nose',true,'');
tadd('noselips','노즈립','코재수술','매부리코','Hump Nose','surgery','nose',true,'');
tadd('noselips','노즈립','코성형','기능코성형','Functional Rhinoplasty','surgery','nose',true,'');
tadd('noselips','노즈립','코성형','콧구멍 비대칭','Nostril Asymmetry','surgery','nose',true,'');
tadd('noselips','노즈립','입술인중','인중성형','Philtrum Surgery','surgery','lip',true,'');
tadd('noselips','노즈립','입술인중','입술성형','Lip Surgery','surgery','lip',true,'');
tadd('noselips','노즈립','줄기세포','항노화 줄기세포','Anti-aging Stem Cell','stem_cell','face',false,'');
tadd('noselips','노즈립','줄기세포','리프팅 줄기세포','Lifting Stem Cell','stem_cell','face',false,'');
tadd('noselips','노즈립','흉터클리닉','Dual Repair Laser','Dual Repair Laser','laser_ablative','face,body',false,'');
tadd('noselips','노즈립','흉터클리닉','Fractional','Fractional Laser','laser_ablative','face,body',false,'');
tadd('noselips','노즈립','흉터클리닉','Cure Jet subcision','Cure Jet Subcision','subcision','face',false,'');

// 13. 살롱드닥터튠즈
tadd('salondrtunes','살롱드닥터튠즈','프로그램','Salon de Juvénile (줄기세포 프로그램)','Salon de Juvenile','stem_cell (program)','systemic',false,'bundle');
tadd('salondrtunes','살롱드닥터튠즈','프로그램','Salon de All-Layer (리프팅 프로그램)','Salon de All-Layer','hifu+rf+thread (program)','face',false,'bundle');
tadd('salondrtunes','살롱드닥터튠즈','프로그램','Salon de Sportif (다이어트/산후/경기력)','Salon de Sportif','iv_therapy+fat_dissolve (program)','body,systemic',false,'bundle');

// 15. 유넬
tadd('eunel','유넬의원','Lifting','리프팅','Lifting (unspecified)','hifu? rf? thread?','face',false,'기기 미상');
tadd('eunel','유넬의원','Anti-Aging','스킨부스터','Skin Booster','injection_skin','face',false,'');
tadd('eunel','유넬의원','Anti-Aging','콜라겐 부스터','Collagen Booster','injection_skin','face',false,'');
tadd('eunel','유넬의원','Anti-Aging','줄기세포','Stem Cell','stem_cell','face,systemic',false,'');
tadd('eunel','유넬의원','Petit','필러','Filler','injection_filler','face',false,'');
tadd('eunel','유넬의원','Petit','실','Thread','thread','face',false,'');
tadd('eunel','유넬의원','Skin Concerns','잡티·기미 케어','Pigmentation Care','laser_non_ablative','face',false,'');
tadd('eunel','유넬의원','Skin Concerns','모공·여드름흉터','Pore/Scar Care','rf? laser?','face',false,'');
tadd('eunel','유넬의원','Skin Concerns','여드름','Acne Care','extraction+topical','face',false,'');

// 16. 리드
tadd('lead','리드 성형외과','눈','쌍커풀','Double Eyelid','surgery','eye',true,'');
tadd('lead','리드 성형외과','눈','눈매교정','Eye Shape Correction','surgery','eye',true,'');
tadd('lead','리드 성형외과','눈','앞트임','Epicanthoplasty','surgery','eye',true,'');
tadd('lead','리드 성형외과','눈','뒤트임','Lateral Canthoplasty','surgery','eye',true,'');
tadd('lead','리드 성형외과','눈','눈밑지방재배치','Lower Bleph','surgery','eye',true,'');
tadd('lead','리드 성형외과','거상','내시경 이마거상','Endoscopic Forehead Lift','surgery','forehead',true,'');
tadd('lead','리드 성형외과','거상','상안검·눈썹거상','Upper Bleph + Brow Lift','surgery','eye,brow',true,'');
tadd('lead','리드 성형외과','거상','하안검·미드페이스리프트','Lower Bleph + Midface Lift','surgery','face',true,'');
tadd('lead','리드 성형외과','거상','안면거상','Facelift','surgery','face',true,'');
tadd('lead','리드 성형외과','거상','목거상','Neck Lift','surgery','neck',true,'');
tadd('lead','리드 성형외과','치료','양성종양·모반 제거','Benign Lesion Removal','surgery','skin',true,'');
tadd('lead','리드 성형외과','치료','귓불교정','Earlobe Correction','surgery','ear',true,'');
tadd('lead','리드 성형외과','치료','흉터·켈로이드','Scar/Keloid','reconstructive','skin',true,'');
tadd('lead','리드 성형외과','치료','화상','Burn Treatment','reconstructive','skin',true,'');
tadd('lead','리드 성형외과','기타','고압산소치료','Hyperbaric Oxygen','hyperbaric','systemic',false,'enum 밖');

// 17. 햇살담은뜰
tadd('sunnygarden','햇살담은뜰','실리프팅','Silhouette Soft','Silhouette Soft','thread (PLA 360)','face',false,'device');
tadd('sunnygarden','햇살담은뜰','실리프팅','Mint Lift','Mint Lift','thread (PCL 3D)','face',false,'device');
tadd('sunnygarden','햇살담은뜰','필러','Neauvia','Neauvia','injection_filler (HA+PEG)','face',false,'device');
tadd('sunnygarden','햇살담은뜰','바이오필러','Ellansé','Ellanse','injection_filler (PCL bio)','face',false,'device');
tadd('sunnygarden','햇살담은뜰','장비','Liftera2','Liftera 2','hifu','face',false,'device');
tadd('sunnygarden','햇살담은뜰','장비','Emsculpt','Emsculpt','em_muscle_stim','body',false,'device');

// 18. 그림
tadd('geurim','그림 성형외과','구순열','구순열 성형','Cleft Lip Surgery','reconstructive','lip',true,'niche 30년');
tadd('geurim','그림 성형외과','입술/인중','인중성형','Philtrum Surgery','surgery','lip',true,'');
tadd('geurim','그림 성형외과','입술/인중','입술축소','Lip Reduction','surgery','lip',true,'');
tadd('geurim','그림 성형외과','흉터','흉터성형','Scar Revision','reconstructive','skin',true,'');
tadd('geurim','그림 성형외과','이물제거','이물제거','Foreign Body Removal','surgery','face,body',true,'');
tadd('geurim','그림 성형외과','이마축소','이마축소','Forehead Reduction','surgery','forehead',true,'');
tadd('geurim','그림 성형외과','눈밑지방','눈밑지방','Under-eye Fat','surgery','eye',true,'');

// 19. 리엔장 치과
tadd('lienjang_dental','리엔장 치과','임플란트','One-day Implant','One-day Implant','implant','dental',true,'');
tadd('lienjang_dental','리엔장 치과','임플란트','Sleep Implant','Sleep Implant (sedation)','implant','dental',true,'수면진정');
tadd('lienjang_dental','리엔장 치과','임플란트','일반 임플란트','Standard Implant','implant','dental',true,'');
tadd('lienjang_dental','리엔장 치과','심미','Lienpearl Laminate','Lienpearl Laminate','prosthetic','dental',false,'veneer');
tadd('lienjang_dental','리엔장 치과','심미','미백','Teeth Whitening','bleaching_dental','dental',false,'');
tadd('lienjang_dental','리엔장 치과','심미','잇몸성형','Gum Contouring','periodontal (surgical)','dental',true,'');
tadd('lienjang_dental','리엔장 치과','교정','Invisalign','Invisalign','orthodontic','dental',false,'');
tadd('lienjang_dental','리엔장 치과','교정','부분교정','Partial Orthodontics','orthodontic','dental',false,'');
tadd('lienjang_dental','리엔장 치과','일반','충치치료','Caries Restoration','restorative','dental',false,'');
tadd('lienjang_dental','리엔장 치과','일반','스케일링','Scaling','periodontal','dental',false,'');

// 20. 센텀코어
tadd('centumcore','센텀코어','안면(수술)','눈성형','Eye Surgery','surgery','eye',true,'');
tadd('centumcore','센텀코어','안면(수술)','코성형','Nose Surgery','surgery','nose',true,'');
tadd('centumcore','센텀코어','안면(수술)','이마성형','Forehead Surgery','surgery','forehead',true,'');
tadd('centumcore','센텀코어','안면(수술)','지방이식','Fat Grafting','fat_grafting','face',true,'');
tadd('centumcore','센텀코어','바디(수술)','가슴성형','Breast Surgery','surgery','breast',true,'');
tadd('centumcore','센텀코어','바디(수술)','힙성형','Hip Surgery','surgery','buttocks',true,'');
tadd('centumcore','센텀코어','바디(수술)','바디 컨투어','Body Contouring','surgery','body',true,'');
tadd('centumcore','센텀코어','피부','색소/모공/여드름 레이저','Skin Laser','laser_non_ablative','face',false,'');
tadd('centumcore','센텀코어','리프팅','Belody','Belody','rf? hifu?','face',false,'장비');
tadd('centumcore','센텀코어','리프팅','HIFU','HIFU','hifu','face',false,'');
tadd('centumcore','센텀코어','리프팅','실리프팅','Thread Lift','thread','face',false,'');
tadd('centumcore','센텀코어','기능의학','면역증강 IV','Immune IV','iv_therapy','systemic',false,'');
tadd('centumcore','센텀코어','기능의학','남성/여성 케어 IV','Hormonal IV','iv_therapy','systemic',false,'');
tadd('centumcore','센텀코어','줄기세포','항노화 줄기세포','Anti-aging Stem Cell','stem_cell','face,systemic',false,'');
tadd('centumcore','센텀코어','줄기세포','탈모 줄기세포','Hair Stem Cell','stem_cell','scalp',false,'');
tadd('centumcore','센텀코어','줄기세포','관절 줄기세포','Joint Stem Cell','stem_cell','joint',false,'');

// =====================================================================
// 캐노니컬 카탈로그 정의
// 각 캐노니컬: { id, slug, name_ko, name_en, name_zh, mechanism, domain, intensity_tier,
//              body_areas, concerns, device_brand?, is_surgical, is_bundle?, members }
// members: [{clinic_slug, source_name}] — 어떤 원본 T### 가 이 캐노니컬에 속하는지
// =====================================================================

const C = [];
let _cid = 0;
const cadd = (canonical) => {
  _cid++;
  C.push({ id: 'CT' + String(_cid).padStart(3, '0'), ...canonical });
};

// ──────────────── HIFU / RF / MMFU LIFTING ────────────────
cadd({ slug:'hifu_ulthera', name_ko:'울쎄라 (Ulthera)', name_en:'HIFU Lifting (Ulthera)', name_zh:'HIFU提升 (Ulthera)',
  mechanism:'hifu', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face','neck'], concerns:['lifting','sagging','wrinkles','elasticity'],
  device_brand:'Ulthera/Ultherapy', is_surgical:false,
  members:[
    {clinic_slug:'ayun', source_name:'울쎄라 프라임'},
    {clinic_slug:'dewyd', source_name:'Ultherapy'},
    {clinic_slug:'lamiche', source_name:'울쎄라'},
    {clinic_slug:'wannabe', source_name:'울쎄라피'},
    {clinic_slug:'lienjang_gangnam', source_name:'울쎄라피'}
  ]});

cadd({ slug:'hifu_shurink', name_ko:'슈링크 (Shurink)', name_en:'HIFU Lifting (Shurink)', name_zh:'HIFU提升 (Shurink)',
  mechanism:'hifu', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face','neck'], concerns:['lifting','sagging','elasticity'],
  device_brand:'Shurink', is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'Shrink Universe'},
    {clinic_slug:'lamiche', source_name:'슈링크'},
    {clinic_slug:'lienjang_gangnam', source_name:'슈링크 유니버스'}
  ]});

cadd({ slug:'hifu_liftera', name_ko:'리프테라 (Liftera)', name_en:'HIFU Lifting (Liftera)', name_zh:'HIFU提升 (Liftera)',
  mechanism:'hifu', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','elasticity'],
  device_brand:'Liftera', is_surgical:false,
  members:[
    {clinic_slug:'hershe', source_name:'Liftera II'},
    {clinic_slug:'lienjang_gangnam', source_name:'리프테라2'},
    {clinic_slug:'sunnygarden', source_name:'Liftera2'}
  ]});

cadd({ slug:'hifu_linerage', name_ko:'리니어지 (Linerage)', name_en:'HIFU Lifting (Linerage)', name_zh:'HIFU提升 (Linerage)',
  mechanism:'hifu', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], device_brand:'Linerage', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'리니어지'}]});

cadd({ slug:'hifu_generic', name_ko:'HIFU (장비 미명시)', name_en:'HIFU (unspecified)', name_zh:'HIFU超声',
  mechanism:'hifu', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], is_surgical:false,
  members:[{clinic_slug:'centumcore', source_name:'HIFU'}]});

cadd({ slug:'hifu_body_ultraline', name_ko:'울트라인 (Body HIFU)', name_en:'Body HIFU (Ultraline)', name_zh:'身体HIFU (Ultraline)',
  mechanism:'hifu', domain:'body_contouring', intensity_tier:'petit',
  body_areas:['body'], concerns:['body_lifting','skin_tightening'],
  device_brand:'Ultraline', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'울트라인'}]});

cadd({ slug:'mmfu_sofwave', name_ko:'소프웨이브 (Sofwave)', name_en:'MMFU (Sofwave)', name_zh:'微聚焦超声 (Sofwave)',
  mechanism:'mmfu', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','wrinkles'], device_brand:'Sofwave', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'소프웨이브'}]});

cadd({ slug:'rf_thermage', name_ko:'써마지 FLX (Thermage)', name_en:'RF Lifting (Thermage)', name_zh:'热玛吉 (Thermage)',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','wrinkles','elasticity','pores'],
  device_brand:'Thermage FLX', is_surgical:false,
  members:[
    {clinic_slug:'ayun', source_name:'써마지 FLX'},
    {clinic_slug:'dewyd', source_name:'Thermage FLX'},
    {clinic_slug:'lamiche', source_name:'써마지 FLX'},
    {clinic_slug:'wooa', source_name:'써마지 FLX'},
    {clinic_slug:'wannabe', source_name:'써마지 FLX'},
    {clinic_slug:'lienjang_gangnam', source_name:'써마지'}
  ]});

cadd({ slug:'rf_inmode', name_ko:'인모드 (InMode)', name_en:'RF (InMode)', name_zh:'InMode射频',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','double_chin','elasticity'],
  device_brand:'InMode', is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'Inmode'},
    {clinic_slug:'lamiche', source_name:'인모드'},
    {clinic_slug:'lienjang_gangnam', source_name:'인모드'}
  ]});

cadd({ slug:'rf_oligio', name_ko:'올리지오 (Oligio)', name_en:'RF (Oligio)', name_zh:'Oligio射频',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','elasticity'],
  device_brand:'Oligio', is_surgical:false,
  members:[
    {clinic_slug:'lamiche', source_name:'올리지오'},
    {clinic_slug:'lienjang_gangnam', source_name:'올리지오'}
  ]});

cadd({ slug:'rf_onda', name_ko:'온다 (Onda)', name_en:'RF (Onda)', name_zh:'Onda射频',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face','body'], concerns:['lifting','elasticity','cellulite'],
  device_brand:'Onda', is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'Titanium Onda'},
    {clinic_slug:'lienjang_gangnam', source_name:'온다리프팅'}
  ]});

cadd({ slug:'rf_volnewmer', name_ko:'볼뉴머 (Volnewmer)', name_en:'RF (Volnewmer)', name_zh:'Volnewmer射频',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], device_brand:'Volnewmer', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'볼뉴머'}]});

cadd({ slug:'rf_coolphase', name_ko:'쿨페이즈 (Coolphase)', name_en:'RF (Coolphase)', name_zh:'Coolphase射频',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], device_brand:'Coolphase', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'쿨페이즈'}]});

cadd({ slug:'rf_titanium', name_ko:'티타늄 리프팅 (Titanium)', name_en:'RF (Titanium)', name_zh:'Titanium射频',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], device_brand:'Titanium', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'티타늄리프팅'}]});

cadd({ slug:'rf_thor', name_ko:'토르 (Thor)', name_en:'RF (Thor)', name_zh:'Thor',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], device_brand:'Thor', is_surgical:false,
  members:[{clinic_slug:'lamiche', source_name:'토르'}]});

cadd({ slug:'rf_belody', name_ko:'Belody', name_en:'RF (Belody)', name_zh:'Belody',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], device_brand:'Belody', is_surgical:false,
  members:[{clinic_slug:'centumcore', source_name:'Belody'}]});

cadd({ slug:'hifu_rf_combo_ulthermage', name_ko:'울써마지 (HIFU+RF 콤보)', name_en:'Ulthera+Thermage Combo', name_zh:'HIFU+RF联合',
  mechanism:'hifu', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','elasticity','wrinkles'],
  is_surgical:false, note:'동시 시술 — combo',
  members:[{clinic_slug:'lienjang_gangnam', source_name:'울써마지'}]});

// ──────────────── RF MICRONEEDLE ────────────────
cadd({ slug:'rf_microneedle_potenza', name_ko:'포텐자 (Potenza)', name_en:'RF Microneedle (Potenza)', name_zh:'Potenza射频微针',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['pores','acne_scars','texture'],
  device_brand:'Potenza', is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'Potenza'},
    {clinic_slug:'dewyd', source_name:'Potenza DIA'}
  ]});

cadd({ slug:'rf_microneedle_morpheus', name_ko:'모피어스8 (Morpheus8)', name_en:'RF Microneedle (Morpheus8)', name_zh:'Morpheus8射频微针',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['pores','acne_scars','texture','elasticity'],
  device_brand:'Morpheus8', is_surgical:false,
  members:[{clinic_slug:'lamiche', source_name:'모피어스8'}]});

cadd({ slug:'rf_microneedle_legato', name_ko:'Legato2', name_en:'RF Microneedle (Legato)', name_zh:'Legato射频微针',
  mechanism:'rf', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['pores','acne_scars'], device_brand:'Legato', is_surgical:false,
  members:[{clinic_slug:'lamiche', source_name:'Legato2'}]});

// ──────────────── LASERS ────────────────
cadd({ slug:'laser_co2', name_ko:'CO2 레이저', name_en:'CO2 Laser', name_zh:'CO2激光',
  mechanism:'laser_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face','skin'], concerns:['scars','texture','pores','spots'], is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'CO2'},
    {clinic_slug:'dewyd', source_name:'CO2 Fraxel'},
    {clinic_slug:'wannabe', source_name:'CO2 레이저'}
  ]});

cadd({ slug:'laser_fraxel', name_ko:'프락셀 (Fraxel)', name_en:'Fraxel Laser', name_zh:'Fraxel激光',
  mechanism:'laser_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face','skin'], concerns:['scars','texture','pigmentation','pores'],
  device_brand:'Fraxel', is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'Fraxel'},
    {clinic_slug:'lamiche', source_name:'프락셀듀얼'},
    {clinic_slug:'wannabe', source_name:'프락셀Ⅱ'},
    {clinic_slug:'wannabe', source_name:'프락셀GV'}
  ]});

cadd({ slug:'laser_pico', name_ko:'피코 레이저 (Pico)', name_en:'Pico Laser', name_zh:'皮秒激光',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face','skin'], concerns:['pigmentation','spots','tattoo','tone'],
  device_brand:'Picosure / Pico Plus', is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'Pico Plus'},
    {clinic_slug:'dewyd', source_name:'Pico Sure'},
    {clinic_slug:'lamiche', source_name:'피코슈어'}
  ]});

cadd({ slug:'laser_genesis', name_ko:'Laser Genesis', name_en:'Laser Genesis', name_zh:'Laser Genesis',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['redness','pores','texture'], is_surgical:false,
  members:[{clinic_slug:'dewyd', source_name:'Genesis'}]});

cadd({ slug:'laser_reepot', name_ko:'Reepot', name_en:'Reepot', name_zh:'Reepot',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['toning'], is_surgical:false,
  members:[{clinic_slug:'dewyd', source_name:'Reepot'}]});

cadd({ slug:'laser_lucas', name_ko:'Lucas Plus', name_en:'Lucas Plus', name_zh:'Lucas Plus',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['toning'], is_surgical:false,
  members:[{clinic_slug:'dewyd', source_name:'Lucas Plus'}]});

cadd({ slug:'laser_drt', name_ko:'DRT', name_en:'DRT Laser', name_zh:'DRT激光',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['toning','pigmentation'], is_surgical:false,
  members:[{clinic_slug:'lamiche', source_name:'DRT'}]});

cadd({ slug:'laser_mirajet', name_ko:'미라젯', name_en:'Mirajet', name_zh:'Mirajet',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['acne','pores'], is_surgical:false,
  members:[{clinic_slug:'lamiche', source_name:'미라젯'}]});

cadd({ slug:'laser_excelv', name_ko:'Excel V', name_en:'Excel V (Vascular Laser)', name_zh:'Excel V血管激光',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['redness','vascular','pigmentation'],
  device_brand:'Excel V', is_surgical:false,
  members:[{clinic_slug:'lamiche', source_name:'Excel V'}]});

cadd({ slug:'laser_bbl', name_ko:'BBL', name_en:'BBL (IPL)', name_zh:'BBL光子',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['pigmentation','tone','spots','redness'],
  device_brand:'BBL', is_surgical:false,
  members:[{clinic_slug:'lamiche', source_name:'BBL'}]});

cadd({ slug:'laser_ipl', name_ko:'IPL', name_en:'IPL', name_zh:'IPL光子',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['pigmentation','tone','spots'], is_surgical:false,
  members:[{clinic_slug:'wannabe', source_name:'IPL'}]});

cadd({ slug:'laser_photona', name_ko:'Photona', name_en:'Photona', name_zh:'Photona',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['toning','lifting'], is_surgical:false,
  members:[{clinic_slug:'lamiche', source_name:'Photona'}]});

cadd({ slug:'laser_dual_repair', name_ko:'Dual Repair Laser', name_en:'Dual Repair Laser', name_zh:'双修复激光',
  mechanism:'laser_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face','skin'], concerns:['scars'], is_surgical:false,
  members:[{clinic_slug:'noselips', source_name:'Dual Repair Laser'}]});

cadd({ slug:'laser_fractional', name_ko:'프락셔널 레이저 (Fractional)', name_en:'Fractional Laser', name_zh:'分段激光',
  mechanism:'laser_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face','skin'], concerns:['scars','texture'], is_surgical:false,
  members:[{clinic_slug:'noselips', source_name:'Fractional'}]});

cadd({ slug:'laser_whitening_generic', name_ko:'미백/색소 레이저 (generic)', name_en:'Whitening / Pigment Laser', name_zh:'美白/色素激光',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['whitening','pigmentation','tone'], is_surgical:false,
  members:[
    {clinic_slug:'soi', source_name:'미백레이저'},
    {clinic_slug:'centumcore', source_name:'색소/모공/여드름 레이저'}
  ]});

// ──────────────── INJECTION — BOTOX ────────────────
cadd({ slug:'botox', name_ko:'보톡스', name_en:'Botox', name_zh:'肉毒素 (Botox)',
  mechanism:'injection_toxin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['wrinkles','jawline','masseter','brow','crows_feet'], is_surgical:false,
  members:[
    {clinic_slug:'soi', source_name:'보톡스'},
    {clinic_slug:'lamiche', source_name:'보톡스'},
    {clinic_slug:'wannabe', source_name:'보톡스'},
    {clinic_slug:'lienjang_gangnam', source_name:'보톡스'}
  ]});

cadd({ slug:'botox_body', name_ko:'바디 보툴리늄', name_en:'Body Botox', name_zh:'身体肉毒',
  mechanism:'injection_toxin', domain:'body_contouring', intensity_tier:'petit',
  body_areas:['body','shoulder','calf'], concerns:['body_slim','muscle_reduction'], is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'바디보툴리늄'}]});

cadd({ slug:'inflammation_injection', name_ko:'염증 주사 (스테로이드)', name_en:'Inflammation Injection (Steroid)', name_zh:'消炎注射',
  mechanism:'injection_toxin', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['acne'], is_surgical:false,
  members:[{clinic_slug:'dewyd', source_name:'염증주사'}]});

// ──────────────── INJECTION — FILLER ────────────────
cadd({ slug:'filler_juvederm', name_ko:'쥬베덤 (Juvederm)', name_en:'HA Filler (Juvederm)', name_zh:'乔雅登 (Juvederm)',
  mechanism:'injection_filler', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['volume','wrinkles','contour'],
  device_brand:'Juvederm', is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'Juvederm'},
    {clinic_slug:'dewyd', source_name:'Juvederm Volume'},
    {clinic_slug:'lamiche', source_name:'쥬베덤'}
  ]});

cadd({ slug:'filler_belotero', name_ko:'벨로테로 (Belotero)', name_en:'HA Filler (Belotero)', name_zh:'Belotero',
  mechanism:'injection_filler', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['volume','wrinkles'], device_brand:'Belotero', is_surgical:false,
  members:[{clinic_slug:'lamiche', source_name:'벨로테로'}]});

cadd({ slug:'filler_ellanse', name_ko:'엘란쎄 (Ellansé)', name_en:'Bio-Filler (Ellansé)', name_zh:'Ellansé',
  mechanism:'injection_filler', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['volume','contour','collagen'],
  device_brand:'Ellansé', is_surgical:false,
  members:[
    {clinic_slug:'lamiche', source_name:'엘란쎄'},
    {clinic_slug:'sunnygarden', source_name:'Ellansé'}
  ]});

cadd({ slug:'filler_neauvia', name_ko:'Neauvia 필러', name_en:'Bio-Filler (Neauvia)', name_zh:'Neauvia',
  mechanism:'injection_filler', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['volume','contour'], device_brand:'Neauvia', is_surgical:false,
  members:[{clinic_slug:'sunnygarden', source_name:'Neauvia'}]});

cadd({ slug:'filler_face_generic', name_ko:'필러 (얼굴, generic)', name_en:'HA Filler (Generic, Face)', name_zh:'透明质酸填充',
  mechanism:'injection_filler', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['volume','contour','wrinkles'], is_surgical:false,
  members:[
    {clinic_slug:'soi', source_name:'3D 풀페이스 필러'},
    {clinic_slug:'lamiche', source_name:'필러'},
    {clinic_slug:'wooa', source_name:'필러'},
    {clinic_slug:'wannabe', source_name:'필러'},
    {clinic_slug:'eunel', source_name:'필러'},
    {clinic_slug:'lienjang_gangnam', source_name:'필러'}
  ]});

cadd({ slug:'filler_shoulder', name_ko:'직각 어깨 필러', name_en:'Shoulder Filler (Body Contouring)', name_zh:'肩部填充',
  mechanism:'injection_filler', domain:'body_contouring', intensity_tier:'petit',
  body_areas:['shoulder'], concerns:['body_contour'], is_surgical:false,
  members:[{clinic_slug:'soi', source_name:'직각 어깨 필러'}]});

cadd({ slug:'filler_pelvis', name_ko:'골반 필러', name_en:'Pelvis Filler', name_zh:'骨盆填充',
  mechanism:'injection_filler', domain:'body_contouring', intensity_tier:'petit',
  body_areas:['pelvis'], concerns:['body_contour'], is_surgical:false,
  members:[{clinic_slug:'soi', source_name:'골반 필러'}]});

cadd({ slug:'filler_apple_hip', name_ko:'애플힙 필러', name_en:'Apple Hip Filler', name_zh:'苹果臀填充',
  mechanism:'injection_filler', domain:'body_contouring', intensity_tier:'petit',
  body_areas:['buttocks'], concerns:['body_contour','hip_volume'], is_surgical:false,
  members:[{clinic_slug:'soi', source_name:'애플힙 필러'}]});

cadd({ slug:'filler_ear', name_ko:'귀 필러', name_en:'Ear Filler', name_zh:'耳部填充',
  mechanism:'injection_filler', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['ear'], concerns:['ear_shape'], is_surgical:false,
  members:[{clinic_slug:'soi', source_name:'미인 귀 필러'}]});

// ──────────────── INJECTION — SKIN BOOSTER ────────────────
cadd({ slug:'skinbooster_rejuran', name_ko:'리쥬란 (Rejuran)', name_en:'PN Skin Booster (Rejuran)', name_zh:'婴儿针 (Rejuran)',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face','eye'], concerns:['texture','elasticity','regeneration','undereye'],
  device_brand:'Rejuran', is_surgical:false,
  members:[
    {clinic_slug:'ayun', source_name:'리쥬란'},
    {clinic_slug:'dewyd', source_name:'Rejuran'},
    {clinic_slug:'dewyd', source_name:'Rejuran HB'},
    {clinic_slug:'dewyd', source_name:'Eye Rejuran'},
    {clinic_slug:'lamiche', source_name:'리쥬란힐러'},
    {clinic_slug:'lienjang_gangnam', source_name:'리쥬란힐러'}
  ]});

cadd({ slug:'skinbooster_juvelook', name_ko:'쥬베룩 (Juvelook)', name_en:'Skin Booster (Juvelook)', name_zh:'Juvelook',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['elasticity','collagen'], device_brand:'Juvelook', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'쥬베룩'}]});

cadd({ slug:'skinbooster_skinvive', name_ko:'스킨바이브 (Skinvive)', name_en:'Skin Booster (Skinvive)', name_zh:'Skinvive',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['hydration','glow'], device_brand:'Skinvive', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'스킨바이브'}]});

cadd({ slug:'skinbooster_lumivion', name_ko:'루미비온 (Lumivion)', name_en:'Skin Booster (Lumivion)', name_zh:'Lumivion',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['hydration','glow'], device_brand:'Lumivion', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'루미비온'}]});

cadd({ slug:'skinbooster_elebes', name_ko:'엘레베스 (Elebes)', name_en:'Skin Booster (Elebes)', name_zh:'Elebes',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['hydration'], device_brand:'Elebes', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'엘레베스'}]});

cadd({ slug:'skinbooster_metacell', name_ko:'메타셀 MCT', name_en:'Skin Booster (MetaCell MCT)', name_zh:'MetaCell',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['hydration','elasticity'], device_brand:'MetaCell', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'메타셀MCT'}]});

cadd({ slug:'skinbooster_rizene', name_ko:'Rizene', name_en:'Skin Booster (Rizene)', name_zh:'Rizene',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['hydration'], device_brand:'Rizene', is_surgical:false,
  members:[{clinic_slug:'dewyd', source_name:'Rizene'}]});

cadd({ slug:'skinbooster_relead', name_ko:'Relead M', name_en:'Skin Booster (Relead M)', name_zh:'Relead M',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['hydration'], device_brand:'Relead M', is_surgical:false,
  members:[{clinic_slug:'dewyd', source_name:'Relead M'}]});

cadd({ slug:'skinbooster_rebirth', name_ko:'Rebirth Booster', name_en:'Rebirth Booster (AYUN)', name_zh:'Rebirth Booster',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['hydration','elasticity','pores','tone'],
  is_surgical:false, note:'AYUN 자체 브랜딩',
  members:[{clinic_slug:'ayun', source_name:'리버스 부스터'}]});

cadd({ slug:'skinbooster_generic', name_ko:'스킨부스터 / 콜라겐부스터 (generic)', name_en:'Skin / Collagen Booster (Generic)', name_zh:'皮肤助推剂',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['hydration','elasticity','glow'], is_surgical:false,
  members:[
    {clinic_slug:'soi', source_name:'스킨부스터'},
    {clinic_slug:'wooa', source_name:'볼라이트'},
    {clinic_slug:'eunel', source_name:'스킨부스터'},
    {clinic_slug:'eunel', source_name:'콜라겐 부스터'}
  ]});

cadd({ slug:'collagen_sculptra', name_ko:'스컬트라 (Sculptra)', name_en:'Collagen Booster (Sculptra)', name_zh:'童颜针 (Sculptra)',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['volume','collagen','sagging'],
  device_brand:'Sculptra', is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'Sculptra'},
    {clinic_slug:'lamiche', source_name:'스컬트라'}
  ]});

cadd({ slug:'exosome_asce', name_ko:'ASCE+ 엑소좀', name_en:'Exosome (ASCE+)', name_zh:'外泌体 (ASCE+)',
  mechanism:'exosome', domain:'regenerative', intensity_tier:'petit',
  body_areas:['face','scalp'], concerns:['regeneration','glow','hair_loss'],
  device_brand:'ASCE+', is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'ASCE+ 엑소좀'}]});

// ──────────────── INJECTION — CONTOUR / LIPOLYTIC ────────────────
cadd({ slug:'injection_contour', name_ko:'윤곽 주사', name_en:'Lipolytic Contour Injection', name_zh:'轮廓针',
  mechanism:'fat_dissolve_injection', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['face_slim','double_chin','jawline'], is_surgical:false,
  members:[
    {clinic_slug:'ayun', source_name:'윤곽주사 (Face Contouring)'},
    {clinic_slug:'lamiche', source_name:'윤곽주사'},
    {clinic_slug:'lienjang_gangnam', source_name:'윤곽주사'}
  ]});

cadd({ slug:'injection_violet', name_ko:'브이올렛 주사', name_en:'V-let Injection', name_zh:'V-let',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','elasticity'], is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'브이올렛주사'}]});

cadd({ slug:'injection_liencell_skin', name_ko:'리엔셀 피부주사', name_en:'Liencell Skin Injection', name_zh:'Liencell皮肤注射',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['hydration','glow'], is_surgical:false, note:'리엔장 자체 브랜딩',
  members:[{clinic_slug:'lienjang_gangnam', source_name:'리엔셀 피부주사'}]});

cadd({ slug:'injection_lifting', name_ko:'리프팅 주사', name_en:'Lifting Injection', name_zh:'提升针',
  mechanism:'injection_skin', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','elasticity'], is_surgical:false,
  members:[{clinic_slug:'lienjang_gangnam', source_name:'리프팅주사'}]});

cadd({ slug:'fatdissolve_face_body', name_ko:'지방분해 주사 (DCA/카복시/MTS)', name_en:'Fat-dissolving Injection', name_zh:'溶脂针',
  mechanism:'fat_dissolve_injection', domain:'body_contouring', intensity_tier:'petit',
  body_areas:['face','body','arm','thigh','abdomen'], concerns:['body_slim','localized_fat'], is_surgical:false,
  members:[
    {clinic_slug:'soi', source_name:'에스핏주사'},
    {clinic_slug:'365mc', source_name:'DCA 밉살주사'},
    {clinic_slug:'lienjang_gangnam', source_name:'살빼주사'},
    {clinic_slug:'lienjang_gangnam', source_name:'1인치주사'}
  ]});

// ──────────────── IV / FUNCTIONAL ────────────────
cadd({ slug:'iv_therapy', name_ko:'IV 수액/영양주사', name_en:'IV Therapy / Functional', name_zh:'静脉营养',
  mechanism:'iv_therapy', domain:'regenerative', intensity_tier:'skin',
  body_areas:['systemic'], concerns:['immune','energy','vitality','hangover'], is_surgical:false,
  members:[
    {clinic_slug:'soi', source_name:'수액(IV)'},
    {clinic_slug:'lienjang_gangnam', source_name:'리엔셀 정맥주사'},
    {clinic_slug:'centumcore', source_name:'면역증강 IV'},
    {clinic_slug:'centumcore', source_name:'남성/여성 케어 IV'}
  ]});

// ──────────────── THREAD ────────────────
cadd({ slug:'thread_silhouette', name_ko:'실루엣 소프트 (PLA)', name_en:'Silhouette Soft (PLA 360°)', name_zh:'Silhouette Soft埋线',
  mechanism:'thread', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','sagging'], device_brand:'Silhouette Soft', is_surgical:false,
  members:[
    {clinic_slug:'sunnygarden', source_name:'Silhouette Soft'},
    {clinic_slug:'wannabe', source_name:'실루엣리프팅'}
  ]});

cadd({ slug:'thread_mint', name_ko:'민트리프팅 (PCL)', name_en:'Mint Lift (PCL)', name_zh:'Mint Lift埋线',
  mechanism:'thread', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','sagging'], device_brand:'Mint Lift', is_surgical:false,
  members:[
    {clinic_slug:'sunnygarden', source_name:'Mint Lift'},
    {clinic_slug:'wannabe', source_name:'민트리프팅'}
  ]});

cadd({ slug:'thread_elasticum', name_ko:'엘라스티꿈 리프팅', name_en:'Elasticum Lift', name_zh:'Elasticum',
  mechanism:'thread', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], device_brand:'Elasticum', is_surgical:false,
  members:[{clinic_slug:'wannabe', source_name:'엘라스티꿈리프팅'}]});

cadd({ slug:'thread_wonder', name_ko:'원더 리프팅', name_en:'Wonder Lift', name_zh:'Wonder Lift',
  mechanism:'thread', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], device_brand:'Wonder', is_surgical:false,
  members:[{clinic_slug:'wannabe', source_name:'원더리프팅'}]});

cadd({ slug:'thread_aptos', name_ko:'압토스 (Aptos)', name_en:'Aptos Thread', name_zh:'Aptos埋线',
  mechanism:'thread', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['jawline','neck'], concerns:['lifting','double_chin'], device_brand:'Aptos', is_surgical:false,
  members:[{clinic_slug:'soi', source_name:'압토스 이중턱 실리프팅'}]});

cadd({ slug:'thread_epiticon', name_ko:'Epiticon', name_en:'Epiticon Thread', name_zh:'Epiticon埋线',
  mechanism:'thread', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], device_brand:'Epiticon', is_surgical:false,
  members:[{clinic_slug:'hershe', source_name:'Epiticon'}]});

cadd({ slug:'thread_mini_smas', name_ko:'Mini SMAS Thread', name_en:'Mini SMAS Thread', name_zh:'Mini SMAS埋线',
  mechanism:'thread', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], is_surgical:false,
  members:[{clinic_slug:'hershe', source_name:'Mini SMAS Thread'}]});

cadd({ slug:'thread_generic', name_ko:'실리프팅 (generic)', name_en:'Thread Lift (Generic)', name_zh:'埋线提升',
  mechanism:'thread', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','sagging'], is_surgical:false,
  members:[
    {clinic_slug:'lamiche', source_name:'실리프트'},
    {clinic_slug:'wooa', source_name:'실리프팅'},
    {clinic_slug:'eunel', source_name:'실'},
    {clinic_slug:'lienjang_gangnam', source_name:'실리프팅'},
    {clinic_slug:'centumcore', source_name:'실리프팅'}
  ]});

// ──────────────── ACNE / EXTRACTION / SKIN CARE ────────────────
cadd({ slug:'acne_extraction', name_ko:'여드름 압출', name_en:'Acne Extraction', name_zh:'粉刺挑除',
  mechanism:'extraction', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['acne','pores','blackhead'], is_surgical:false,
  members:[
    {clinic_slug:'soi', source_name:'피부관리'},
    {clinic_slug:'dewyd', source_name:'Extraction'},
    {clinic_slug:'dewyd', source_name:'Scaling'}
  ]});

cadd({ slug:'acne_pdt', name_ko:'PDT (광역동 치료)', name_en:'PDT (Photodynamic)', name_zh:'PDT光动力',
  mechanism:'topical', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['acne','inflammation'], is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'PDT'},
    {clinic_slug:'lamiche', source_name:'PDT'}
  ]});

cadd({ slug:'acne_concern_generic', name_ko:'여드름 케어 (generic)', name_en:'Acne Care (Generic)', name_zh:'痤疮护理',
  mechanism:'extraction', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['acne'], is_surgical:false,
  members:[{clinic_slug:'eunel', source_name:'여드름'}]});

cadd({ slug:'scar_subcision', name_ko:'서브시전 (Subcision)', name_en:'Subcision (Acne Scar)', name_zh:'皮下剥离',
  mechanism:'subcision', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['acne_scars'], is_surgical:false,
  members:[
    {clinic_slug:'dewyd', source_name:'Subsicion'},
    {clinic_slug:'noselips', source_name:'Cure Jet subcision'}
  ]});

cadd({ slug:'pigmentation_care', name_ko:'잡티/기미 케어', name_en:'Pigmentation Care', name_zh:'色斑护理',
  mechanism:'laser_non_ablative', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['pigmentation','spots','melasma'], is_surgical:false,
  members:[{clinic_slug:'eunel', source_name:'잡티·기미 케어'}]});

cadd({ slug:'pore_scar_care', name_ko:'모공/여드름흉터 케어', name_en:'Pore / Scar Care', name_zh:'毛孔/痘印护理',
  mechanism:'rf', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['face'], concerns:['pores','acne_scars','texture'], is_surgical:false,
  members:[{clinic_slug:'eunel', source_name:'모공·여드름흉터'}]});

// ──────────────── STEM CELL ────────────────
cadd({ slug:'stemcell_antiaging', name_ko:'줄기세포 항노화 (얼굴)', name_en:'Anti-aging Stem Cell', name_zh:'抗衰老干细胞',
  mechanism:'stem_cell', domain:'regenerative', intensity_tier:'petit',
  body_areas:['face'], concerns:['regeneration','elasticity','wrinkles'], is_surgical:false,
  members:[
    {clinic_slug:'soi', source_name:'줄기세포'},
    {clinic_slug:'wooa', source_name:'줄기세포'},
    {clinic_slug:'wannabe', source_name:'줄기세포'},
    {clinic_slug:'eunel', source_name:'줄기세포'},
    {clinic_slug:'noselips', source_name:'항노화 줄기세포'},
    {clinic_slug:'noselips', source_name:'리프팅 줄기세포'},
    {clinic_slug:'centumcore', source_name:'항노화 줄기세포'}
  ]});

cadd({ slug:'stemcell_skin_shot', name_ko:'지방줄기세포 스킨샷', name_en:'Stem Cell Skin Shot', name_zh:'干细胞肌肤注射',
  mechanism:'stem_cell', domain:'regenerative', intensity_tier:'petit',
  body_areas:['face'], concerns:['regeneration','glow'], is_surgical:false,
  members:[{clinic_slug:'365mc', source_name:'지방줄기세포 스킨샷'}]});

cadd({ slug:'stemcell_hair', name_ko:'줄기세포 탈모 케어', name_en:'Hair Stem Cell', name_zh:'毛发干细胞',
  mechanism:'stem_cell', domain:'regenerative', intensity_tier:'petit',
  body_areas:['scalp'], concerns:['hair_loss'], is_surgical:false,
  members:[
    {clinic_slug:'365mc', source_name:'지방줄기세포 헤어샷'},
    {clinic_slug:'centumcore', source_name:'탈모 줄기세포'}
  ]});

cadd({ slug:'stemcell_bio', name_ko:'바이오샷 (전신)', name_en:'Bio Stem Cell (Systemic)', name_zh:'生物干细胞',
  mechanism:'stem_cell', domain:'regenerative', intensity_tier:'petit',
  body_areas:['systemic'], concerns:['immune','antiaging_systemic'], is_surgical:false,
  members:[{clinic_slug:'365mc', source_name:'지방줄기세포 바이오샷'}]});

cadd({ slug:'stemcell_banking', name_ko:'줄기세포 뱅킹', name_en:'Stem Cell Banking', name_zh:'干细胞储存',
  mechanism:'stem_cell', domain:'regenerative', intensity_tier:'petit',
  body_areas:['systemic'], concerns:['longevity_banking'], is_surgical:false,
  members:[{clinic_slug:'365mc', source_name:'지방줄기세포 뱅킹'}]});

cadd({ slug:'stemcell_joint', name_ko:'관절 줄기세포', name_en:'Joint Stem Cell', name_zh:'关节干细胞',
  mechanism:'stem_cell', domain:'regenerative', intensity_tier:'petit',
  body_areas:['joint'], concerns:['joint_pain','mobility'], is_surgical:false,
  members:[{clinic_slug:'centumcore', source_name:'관절 줄기세포'}]});

// ──────────────── PRP ────────────────
cadd({ slug:'prp', name_ko:'PRP (자가혈)', name_en:'PRP', name_zh:'PRP自体血',
  mechanism:'prp', domain:'regenerative', intensity_tier:'petit',
  body_areas:['face','scalp'], concerns:['regeneration','hair_loss','scars'], is_surgical:false,
  members:[{clinic_slug:'wannabe', source_name:'PRP'}]});

// ──────────────── LIPOSUCTION / FAT GRAFT / BODY ────────────────
cadd({ slug:'lipo_face', name_ko:'안면 지방흡입', name_en:'Facial Liposuction', name_zh:'面部吸脂',
  mechanism:'liposuction', domain:'body_contouring', intensity_tier:'surgery',
  body_areas:['face'], concerns:['face_slim','double_chin'], is_surgical:true,
  members:[{clinic_slug:'365mc', source_name:'안면 지방흡입'}]});

cadd({ slug:'lipo_abdomen', name_ko:'복부 지방흡입', name_en:'Abdomen Liposuction', name_zh:'腹部吸脂',
  mechanism:'liposuction', domain:'body_contouring', intensity_tier:'surgery',
  body_areas:['abdomen'], concerns:['body_slim'], is_surgical:true,
  members:[{clinic_slug:'365mc', source_name:'복부 지방흡입'}]});

cadd({ slug:'lipo_thigh', name_ko:'허벅지 지방흡입', name_en:'Thigh Liposuction', name_zh:'大腿吸脂',
  mechanism:'liposuction', domain:'body_contouring', intensity_tier:'surgery',
  body_areas:['thigh'], concerns:['body_slim'], is_surgical:true,
  members:[{clinic_slug:'365mc', source_name:'허벅지 지방흡입'}]});

cadd({ slug:'lipo_arm', name_ko:'팔뚝 지방흡입', name_en:'Arm Liposuction', name_zh:'手臂吸脂',
  mechanism:'liposuction', domain:'body_contouring', intensity_tier:'surgery',
  body_areas:['arm'], concerns:['body_slim'], is_surgical:true,
  members:[{clinic_slug:'365mc', source_name:'팔뚝 지방흡입'}]});

cadd({ slug:'lipo_calf', name_ko:'종아리 지방흡입', name_en:'Calf Liposuction', name_zh:'小腿吸脂',
  mechanism:'liposuction', domain:'body_contouring', intensity_tier:'surgery',
  body_areas:['calf'], concerns:['body_slim'], is_surgical:true,
  members:[{clinic_slug:'365mc', source_name:'종아리 지방흡입'}]});

cadd({ slug:'lipo_chest_male', name_ko:'남성 여유증 (가슴)', name_en:'Gynecomastia', name_zh:'男性乳腺',
  mechanism:'liposuction', domain:'body_contouring', intensity_tier:'surgery',
  body_areas:['chest'], concerns:['male_chest'], is_surgical:true,
  members:[{clinic_slug:'365mc', source_name:'남성 여유증'}]});

cadd({ slug:'lipo_revision', name_ko:'재수술 지방흡입', name_en:'Revision Liposuction', name_zh:'修复吸脂',
  mechanism:'liposuction', domain:'body_contouring', intensity_tier:'surgery',
  body_areas:['body'], concerns:['lipo_revision'], is_surgical:true,
  members:[{clinic_slug:'365mc', source_name:'재수술 지방흡입'}]});

cadd({ slug:'lipo_lams', name_ko:'람스 (LAMS)', name_en:'LAMS (365mc Proprietary)', name_zh:'LAMS吸脂',
  mechanism:'liposuction', domain:'body_contouring', intensity_tier:'surgery',
  body_areas:['body'], concerns:['body_slim'], device_brand:'LAMS', is_surgical:true,
  note:'365mc 고유 기법',
  members:[
    {clinic_slug:'365mc', source_name:'람스(LAMS)'},
    {clinic_slug:'365mc', source_name:'무한람스'}
  ]});

cadd({ slug:'lipo_general', name_ko:'지방흡입 (일반)', name_en:'Liposuction (Generic)', name_zh:'吸脂',
  mechanism:'liposuction', domain:'body_contouring', intensity_tier:'surgery',
  body_areas:['body'], concerns:['body_slim'], is_surgical:true,
  members:[
    {clinic_slug:'wannabe', source_name:'지방흡입'},
    {clinic_slug:'hershe', source_name:'Liposuction'}
  ]});

cadd({ slug:'accusculpt', name_ko:'아큐스컬프 (Accusculpt)', name_en:'Accusculpt (Laser Lipo)', name_zh:'Accusculpt激光溶脂',
  mechanism:'laser_ablative', domain:'body_contouring', intensity_tier:'petit',
  body_areas:['face','body'], concerns:['face_slim','localized_fat'],
  device_brand:'Accusculpt', is_surgical:false,
  members:[{clinic_slug:'wooa', source_name:'아큐스컬프'}]});

cadd({ slug:'fat_grafting', name_ko:'지방이식 (자가지방)', name_en:'Autologous Fat Grafting', name_zh:'自体脂肪移植',
  mechanism:'fat_grafting', domain:'face_aesthetic', intensity_tier:'surgery',
  body_areas:['face','breast','body'], concerns:['volume','regeneration'], is_surgical:true,
  members:[
    {clinic_slug:'wooa', source_name:'지방이식'},
    {clinic_slug:'wannabe', source_name:'3D 지방이식'},
    {clinic_slug:'hershe', source_name:'Fat Grafting'},
    {clinic_slug:'centumcore', source_name:'지방이식'}
  ]});

cadd({ slug:'body_emsculpt', name_ko:'엠스컬프 (Emsculpt)', name_en:'EM Muscle Stimulation (Emsculpt)', name_zh:'Emsculpt肌肉刺激',
  mechanism:'em_muscle_stim', domain:'body_contouring', intensity_tier:'petit',
  body_areas:['body','abdomen','buttocks','arm','thigh'], concerns:['muscle_tone','body_sculpt'],
  device_brand:'Emsculpt', is_surgical:false,
  members:[{clinic_slug:'sunnygarden', source_name:'Emsculpt'}]});

cadd({ slug:'lifting_unspecified', name_ko:'리프팅 (기기 미명시)', name_en:'Lifting (Unspecified)', name_zh:'提升 (未指定)',
  mechanism:'hifu', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting'], is_surgical:false,
  note:'병원이 기기 명시 안 함 — 컨시어지 시 추가 확인 필요',
  members:[
    {clinic_slug:'soi', source_name:'안티에이징 리프팅'},
    {clinic_slug:'soi', source_name:'바디 리프팅'},
    {clinic_slug:'eunel', source_name:'리프팅'}
  ]});

cadd({ slug:'cream_firming', name_ko:'팽팽크림 (TOPICAL)', name_en:'Firming Cream (Topical)', name_zh:'紧致面霜',
  mechanism:'topical', domain:'derm_medical', intensity_tier:'skin',
  body_areas:['body'], concerns:['elasticity'], is_surgical:false,
  members:[{clinic_slug:'365mc', source_name:'팽팽크림'}]});

// ──────────────── SURGERY — EYE ────────────────
cadd({ slug:'surgery_eye_double', name_ko:'쌍커풀 수술', name_en:'Double Eyelid Surgery', name_zh:'双眼皮手术',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye'], concerns:['eye_shape','double_eyelid'], is_surgical:true,
  members:[
    {clinic_slug:'wannabe', source_name:'쌍커풀'},
    {clinic_slug:'lead', source_name:'쌍커풀'}
  ]});

cadd({ slug:'surgery_eye_shape', name_ko:'눈매교정', name_en:'Eye Shape Correction (Ptosis)', name_zh:'眼型矫正',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye'], concerns:['eye_shape','ptosis'], is_surgical:true,
  members:[{clinic_slug:'lead', source_name:'눈매교정'}]});

cadd({ slug:'surgery_eye_canth_front', name_ko:'앞트임', name_en:'Epicanthoplasty (Inner Corner)', name_zh:'开内眼角',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye'], concerns:['eye_shape'], is_surgical:true,
  members:[{clinic_slug:'lead', source_name:'앞트임'}]});

cadd({ slug:'surgery_eye_canth_back', name_ko:'뒤트임', name_en:'Lateral Canthoplasty (Outer Corner)', name_zh:'开外眼角',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye'], concerns:['eye_shape'], is_surgical:true,
  members:[{clinic_slug:'lead', source_name:'뒤트임'}]});

cadd({ slug:'surgery_eye_lower', name_ko:'눈밑지방재배치', name_en:'Lower Blepharoplasty', name_zh:'眼下脂肪重置',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye'], concerns:['undereye','eye_bag','dark_circles'], is_surgical:true,
  members:[
    {clinic_slug:'wannabe', source_name:'눈밑지방재배치'},
    {clinic_slug:'lead', source_name:'눈밑지방재배치'},
    {clinic_slug:'geurim', source_name:'눈밑지방'}
  ]});

cadd({ slug:'surgery_eye_blepharo', name_ko:'안검 성형 (일반)', name_en:'Blepharoplasty (General)', name_zh:'眼睑整形',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye'], concerns:['eye_shape','undereye'], is_surgical:true,
  members:[{clinic_slug:'hershe', source_name:'Blepharoplasty'}]});

cadd({ slug:'surgery_eye_bag', name_ko:'안검 지방 제거', name_en:'Eye Bag Removal', name_zh:'眼袋去除',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye'], concerns:['eye_bag','undereye'], is_surgical:true,
  members:[{clinic_slug:'hershe', source_name:'Eye Bag Removal'}]});

cadd({ slug:'surgery_eye_subbrow', name_ko:'눈썹·상안검 거상', name_en:'Sub-brow / Upper Bleph Lift', name_zh:'眉下/上睑提升',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye','brow'], concerns:['eye_shape','sagging_eye'], is_surgical:true,
  members:[
    {clinic_slug:'hershe', source_name:'Sub-brow Lift'},
    {clinic_slug:'lead', source_name:'상안검·눈썹거상'}
  ]});

cadd({ slug:'surgery_eye_wooatrim', name_ko:'우아트임 (WOOA signature)', name_en:'Wooa Eye Cut (Signature)', name_zh:'Wooa开眼角',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye'], concerns:['eye_shape'], is_surgical:true, note:'WOOA 자체 브랜딩',
  members:[{clinic_slug:'wooa', source_name:'우아트임'}]});

// ──────────────── SURGERY — NOSE ────────────────
cadd({ slug:'surgery_nose_hump', name_ko:'매부리코', name_en:'Hump Nose', name_zh:'鹰钩鼻',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['nose'], concerns:['nose_shape','hump'], is_surgical:true,
  members:[
    {clinic_slug:'wannabe', source_name:'매부리코'},
    {clinic_slug:'noselips', source_name:'매부리코'}
  ]});

cadd({ slug:'surgery_nose_no_implant', name_ko:'무보형물 코성형', name_en:'No-implant Rhinoplasty', name_zh:'无假体鼻整形',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['nose'], concerns:['nose_shape','natural'], is_surgical:true,
  members:[{clinic_slug:'wannabe', source_name:'무보형물 코성형'}]});

cadd({ slug:'surgery_nose_crooked', name_ko:'휜코 (Crooked Nose)', name_en:'Crooked Nose', name_zh:'歪鼻',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['nose'], concerns:['nose_shape','asymmetry'], is_surgical:true,
  members:[{clinic_slug:'noselips', source_name:'휜코'}]});

cadd({ slug:'surgery_nose_contracted', name_ko:'구축코 재수술', name_en:'Contracted Nose Revision', name_zh:'挛缩鼻修复',
  mechanism:'reconstructive', domain:'surgical', intensity_tier:'surgery',
  body_areas:['nose'], concerns:['nose_revision','complication'], is_surgical:true,
  members:[{clinic_slug:'noselips', source_name:'구축코 재수술'}]});

cadd({ slug:'surgery_nose_functional', name_ko:'기능코성형', name_en:'Functional Rhinoplasty', name_zh:'功能性鼻整形',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['nose'], concerns:['breathing','deviated_septum'], is_surgical:true,
  members:[{clinic_slug:'noselips', source_name:'기능코성형'}]});

cadd({ slug:'surgery_nose_asymmetry', name_ko:'콧구멍 비대칭 교정', name_en:'Nostril Asymmetry Correction', name_zh:'鼻孔不对称',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['nose'], concerns:['nose_shape','asymmetry'], is_surgical:true,
  members:[{clinic_slug:'noselips', source_name:'콧구멍 비대칭'}]});

cadd({ slug:'surgery_nose_general', name_ko:'코성형 (일반)', name_en:'Rhinoplasty (General)', name_zh:'鼻整形',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['nose'], concerns:['nose_shape'], is_surgical:true,
  members:[
    {clinic_slug:'hershe', source_name:'Rhinoplasty'},
    {clinic_slug:'centumcore', source_name:'코성형'}
  ]});

// ──────────────── SURGERY — JAW / CONTOUR ────────────────
cadd({ slug:'surgery_jaw_vline', name_ko:'V라인 (사각턱 축소)', name_en:'V-line Jaw', name_zh:'V脸轮廓',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['jaw'], concerns:['jawline','face_slim'], is_surgical:true,
  members:[{clinic_slug:'wannabe', source_name:'V라인'}]});

cadd({ slug:'surgery_jaw_mandible', name_ko:'사각턱 축소', name_en:'Mandible Reduction', name_zh:'下颌角缩小',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['jaw'], concerns:['jawline','face_slim'], is_surgical:true,
  members:[{clinic_slug:'wannabe', source_name:'사각턱'}]});

cadd({ slug:'surgery_zygoma', name_ko:'광대 축소', name_en:'Zygoma Reduction', name_zh:'颧骨缩小',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['cheek'], concerns:['face_slim','zygoma'], is_surgical:true,
  members:[{clinic_slug:'wannabe', source_name:'광대'}]});

// ──────────────── SURGERY — BREAST ────────────────
cadd({ slug:'surgery_breast_aug', name_ko:'가슴 확대', name_en:'Breast Augmentation', name_zh:'隆胸',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['breast'], concerns:['breast_size'], is_surgical:true,
  note:'implant brand (Motiva/Mentor) 은 hospital_procedures.device_brand',
  members:[
    {clinic_slug:'wooa', source_name:'모티바 어고노믹스'},
    {clinic_slug:'wooa', source_name:'멘토 엑스트라'},
    {clinic_slug:'wooa', source_name:'멘토 부스트'},
    {clinic_slug:'wooa', source_name:'삼중평면법'},
    {clinic_slug:'wooa', source_name:'하이브리드 가슴성형'},
    {clinic_slug:'wannabe', source_name:'가슴확대'},
    {clinic_slug:'hershe', source_name:'Breast Augmentation'},
    {clinic_slug:'centumcore', source_name:'가슴성형'}
  ]});

cadd({ slug:'surgery_breast_red', name_ko:'가슴 축소', name_en:'Breast Reduction', name_zh:'缩胸',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['breast'], concerns:['breast_size'], is_surgical:true,
  members:[{clinic_slug:'wannabe', source_name:'가슴축소'}]});

// ──────────────── SURGERY — FACELIFT ────────────────
cadd({ slug:'surgery_lift_facelift', name_ko:'안면거상', name_en:'Facelift', name_zh:'面部除皱',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['face'], concerns:['sagging','aging','wrinkles'], is_surgical:true,
  members:[
    {clinic_slug:'hershe', source_name:'MACS Lift'},
    {clinic_slug:'hershe', source_name:'Full Facelift'},
    {clinic_slug:'hershe', source_name:'Mid Facelift'},
    {clinic_slug:'lead', source_name:'안면거상'}
  ]});

cadd({ slug:'surgery_lift_smas', name_ko:'SMAS 리프트', name_en:'SMAS Lift', name_zh:'SMAS提升',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['face'], concerns:['sagging','aging'], is_surgical:true,
  members:[{clinic_slug:'wooa', source_name:'스마스리프트'}]});

cadd({ slug:'surgery_lift_miniquick', name_ko:'미니퀵 리프팅', name_en:'Mini Quick Lift', name_zh:'迷你提升',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['face'], concerns:['sagging','minimal'], is_surgical:true,
  members:[{clinic_slug:'wooa', source_name:'미니퀵리프팅'}]});

cadd({ slug:'surgery_lift_forehead', name_ko:'이마거상', name_en:'Forehead Lift', name_zh:'额部提升',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['forehead'], concerns:['wrinkles','sagging_brow'], is_surgical:true,
  members:[
    {clinic_slug:'wannabe', source_name:'이마거상'},
    {clinic_slug:'lead', source_name:'내시경 이마거상'}
  ]});

cadd({ slug:'surgery_lift_midface', name_ko:'하안검·미드페이스리프트', name_en:'Lower Bleph + Midface Lift', name_zh:'下睑+中面部提升',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['face'], concerns:['sagging','undereye'], is_surgical:true,
  members:[{clinic_slug:'lead', source_name:'하안검·미드페이스리프트'}]});

cadd({ slug:'surgery_lift_neck', name_ko:'목거상', name_en:'Neck Lift', name_zh:'颈部提升',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['neck'], concerns:['neck_sagging','double_chin'], is_surgical:true,
  members:[
    {clinic_slug:'hershe', source_name:'Neck Lift'},
    {clinic_slug:'lead', source_name:'목거상'}
  ]});

// ──────────────── SURGERY — LIP / CLEFT / SCAR ────────────────
cadd({ slug:'surgery_lip_philtrum', name_ko:'인중성형', name_en:'Philtrum Surgery', name_zh:'人中整形',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['lip'], concerns:['philtrum'], is_surgical:true,
  members:[
    {clinic_slug:'noselips', source_name:'인중성형'},
    {clinic_slug:'geurim', source_name:'인중성형'}
  ]});

cadd({ slug:'surgery_lip_reduction', name_ko:'입술축소', name_en:'Lip Reduction', name_zh:'唇缩小',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['lip'], concerns:['lip_shape'], is_surgical:true,
  members:[{clinic_slug:'geurim', source_name:'입술축소'}]});

cadd({ slug:'surgery_lip_general', name_ko:'입술성형 (일반)', name_en:'Lip Surgery (General)', name_zh:'唇整形',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['lip'], concerns:['lip_shape'], is_surgical:true,
  members:[{clinic_slug:'noselips', source_name:'입술성형'}]});

cadd({ slug:'surgery_cleft_lip', name_ko:'구순열 성형 (Cleft Lip)', name_en:'Cleft Lip Repair', name_zh:'唇裂修复',
  mechanism:'reconstructive', domain:'surgical', intensity_tier:'surgery',
  body_areas:['lip'], concerns:['cleft','reconstruction'], is_surgical:true, note:'niche',
  members:[{clinic_slug:'geurim', source_name:'구순열 성형'}]});

cadd({ slug:'surgery_cleft_palate', name_ko:'구순구개열 2차 (Cleft Lip & Palate)', name_en:'Cleft Lip & Palate Revision', name_zh:'唇腭裂修复',
  mechanism:'reconstructive', domain:'surgical', intensity_tier:'surgery',
  body_areas:['lip','nose'], concerns:['cleft','reconstruction'], is_surgical:true, note:'niche',
  members:[{clinic_slug:'noselips', source_name:'구순구개열 2차 수술'}]});

cadd({ slug:'surgery_scar_revision', name_ko:'흉터 성형', name_en:'Scar Revision', name_zh:'疤痕修复',
  mechanism:'reconstructive', domain:'surgical', intensity_tier:'surgery',
  body_areas:['skin'], concerns:['scars','keloid'], is_surgical:true,
  members:[
    {clinic_slug:'geurim', source_name:'흉터성형'},
    {clinic_slug:'lead', source_name:'흉터·켈로이드'}
  ]});

cadd({ slug:'surgery_burn', name_ko:'화상 치료', name_en:'Burn Treatment', name_zh:'烧伤治疗',
  mechanism:'reconstructive', domain:'surgical', intensity_tier:'surgery',
  body_areas:['skin'], concerns:['burn'], is_surgical:true,
  members:[{clinic_slug:'lead', source_name:'화상'}]});

cadd({ slug:'surgery_foreign_body', name_ko:'이물 제거', name_en:'Foreign Body Removal', name_zh:'异物取出',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['face','body'], concerns:['old_filler','foreign_body'], is_surgical:true,
  members:[{clinic_slug:'geurim', source_name:'이물제거'}]});

cadd({ slug:'surgery_forehead_red', name_ko:'이마축소 (헤어라인)', name_en:'Forehead Reduction', name_zh:'额头缩小',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['forehead'], concerns:['forehead_size','hairline'], is_surgical:true,
  members:[{clinic_slug:'geurim', source_name:'이마축소'}]});

cadd({ slug:'surgery_benign', name_ko:'양성종양·모반 제거', name_en:'Benign Lesion Removal', name_zh:'良性肿物切除',
  mechanism:'surgery', domain:'derm_medical', intensity_tier:'surgery',
  body_areas:['skin'], concerns:['mole','tumor'], is_surgical:true,
  members:[{clinic_slug:'lead', source_name:'양성종양·모반 제거'}]});

cadd({ slug:'surgery_earlobe', name_ko:'귓불 교정', name_en:'Earlobe Correction', name_zh:'耳垂矫正',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['ear'], concerns:['earlobe'], is_surgical:true,
  members:[{clinic_slug:'lead', source_name:'귓불교정'}]});

// ──────────────── SURGERY — HIP / ABDOMEN / BODY ────────────────
cadd({ slug:'surgery_hip_aug', name_ko:'힙업 (Hip Augmentation)', name_en:'Hip Augmentation', name_zh:'臀部提升',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['buttocks'], concerns:['hip_volume','body_curve'], is_surgical:true,
  members:[
    {clinic_slug:'hershe', source_name:'Hip Augmentation'},
    {clinic_slug:'centumcore', source_name:'힙성형'}
  ]});

cadd({ slug:'surgery_hip_dip', name_ko:'힙딥 교정', name_en:'Hip Dip Correction', name_zh:'髋部凹陷矫正',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['buttocks','hip'], concerns:['hip_dip','body_curve'], is_surgical:true, note:'niche',
  members:[{clinic_slug:'hershe', source_name:'Hip Dip Correction'}]});

cadd({ slug:'surgery_abdomen', name_ko:'복부성형', name_en:'Abdominoplasty', name_zh:'腹壁整形',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['abdomen'], concerns:['loose_skin','post_pregnancy'], is_surgical:true,
  members:[{clinic_slug:'wannabe', source_name:'복부성형'}]});

cadd({ slug:'surgery_body_contour', name_ko:'바디 컨투어 수술', name_en:'Body Contouring Surgery', name_zh:'体型轮廓手术',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['body'], concerns:['body_contour'], is_surgical:true,
  members:[{clinic_slug:'centumcore', source_name:'바디 컨투어'}]});

cadd({ slug:'surgery_forehead_general', name_ko:'이마 성형 (일반)', name_en:'Forehead Surgery (General)', name_zh:'额部手术',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['forehead'], concerns:['forehead_shape'], is_surgical:true,
  members:[{clinic_slug:'centumcore', source_name:'이마성형'}]});

// ──────────────── HAIR ────────────────
cadd({ slug:'hair_transplant', name_ko:'모발이식 (FUE)', name_en:'Hair Transplant', name_zh:'植发',
  mechanism:'hair_transplant', domain:'surgical', intensity_tier:'surgery',
  body_areas:['scalp'], concerns:['hair_loss','hairline'], is_surgical:true,
  members:[{clinic_slug:'wannabe', source_name:'모발이식'}]});

// ──────────────── SPECIAL ────────────────
cadd({ slug:'special_hyperbaric', name_ko:'고압산소 치료', name_en:'Hyperbaric Oxygen Therapy', name_zh:'高压氧治疗',
  mechanism:'iv_therapy', domain:'regenerative', intensity_tier:'skin',
  body_areas:['systemic'], concerns:['recovery','wound_healing'], is_surgical:false,
  note:'enum 밖 — mechanism iv_therapy 에 매핑',
  members:[{clinic_slug:'lead', source_name:'고압산소치료'}]});

// ──────────────── BUNDLES (살롱드닥터튠즈) ────────────────
cadd({ slug:'bundle_salondrtunes_juvenile', name_ko:'Salon de Juvénile (줄기세포 프로그램)', name_en:'Salon de Juvénile (Stem Cell Program)', name_zh:'Salon de Juvénile干细胞计划',
  mechanism:'stem_cell', domain:'regenerative', intensity_tier:'petit',
  body_areas:['systemic','face'], concerns:['antiaging_systemic','regeneration'], is_surgical:false, is_bundle:true,
  members:[{clinic_slug:'salondrtunes', source_name:'Salon de Juvénile (줄기세포 프로그램)'}]});

cadd({ slug:'bundle_salondrtunes_alllayer', name_ko:'Salon de All-Layer (리프팅 프로그램)', name_en:'Salon de All-Layer (Lifting Program)', name_zh:'Salon de All-Layer提升计划',
  mechanism:'hifu', domain:'face_aesthetic', intensity_tier:'petit',
  body_areas:['face'], concerns:['lifting','elasticity'], is_surgical:false, is_bundle:true,
  members:[{clinic_slug:'salondrtunes', source_name:'Salon de All-Layer (리프팅 프로그램)'}]});

cadd({ slug:'bundle_salondrtunes_sportif', name_ko:'Salon de Sportif (다이어트/산후/경기력)', name_en:'Salon de Sportif (Diet / Postpartum / Performance)', name_zh:'Salon de Sportif',
  mechanism:'iv_therapy', domain:'regenerative', intensity_tier:'skin',
  body_areas:['systemic','body'], concerns:['body_slim','postpartum','energy'], is_surgical:false, is_bundle:true,
  members:[{clinic_slug:'salondrtunes', source_name:'Salon de Sportif (다이어트/산후/경기력)'}]});

// ──────────────── DENTAL ────────────────
cadd({ slug:'dental_implant_oneday', name_ko:'원데이 임플란트', name_en:'One-day Implant', name_zh:'即拔即种',
  mechanism:'implant', domain:'dental', intensity_tier:'surgery',
  body_areas:['dental'], concerns:['tooth_loss'], is_surgical:true,
  members:[{clinic_slug:'lienjang_dental', source_name:'One-day Implant'}]});

cadd({ slug:'dental_implant_sleep', name_ko:'수면 임플란트', name_en:'Sleep Implant (Sedation)', name_zh:'睡眠种植',
  mechanism:'implant', domain:'dental', intensity_tier:'surgery',
  body_areas:['dental'], concerns:['tooth_loss','dental_anxiety'], is_surgical:true,
  members:[{clinic_slug:'lienjang_dental', source_name:'Sleep Implant'}]});

cadd({ slug:'dental_implant_general', name_ko:'일반 임플란트', name_en:'Standard Implant', name_zh:'标准种植',
  mechanism:'implant', domain:'dental', intensity_tier:'surgery',
  body_areas:['dental'], concerns:['tooth_loss'], is_surgical:true,
  members:[{clinic_slug:'lienjang_dental', source_name:'일반 임플란트'}]});

cadd({ slug:'dental_laminate', name_ko:'라미네이트 (Veneer)', name_en:'Veneer (Laminate)', name_zh:'瓷贴面',
  mechanism:'prosthetic', domain:'dental', intensity_tier:'skin',
  body_areas:['dental'], concerns:['teeth_aesthetics'], is_surgical:false,
  device_brand:'Lienpearl',
  members:[{clinic_slug:'lienjang_dental', source_name:'Lienpearl Laminate'}]});

cadd({ slug:'dental_whitening', name_ko:'치아 미백', name_en:'Teeth Whitening', name_zh:'牙齿美白',
  mechanism:'bleaching_dental', domain:'dental', intensity_tier:'skin',
  body_areas:['dental'], concerns:['teeth_aesthetics','whitening'], is_surgical:false,
  members:[{clinic_slug:'lienjang_dental', source_name:'미백'}]});

cadd({ slug:'dental_gum_contour', name_ko:'잇몸 성형', name_en:'Gum Contouring', name_zh:'牙龈整形',
  mechanism:'periodontal', domain:'dental', intensity_tier:'surgery',
  body_areas:['dental'], concerns:['teeth_aesthetics','gummy_smile'], is_surgical:true,
  members:[{clinic_slug:'lienjang_dental', source_name:'잇몸성형'}]});

cadd({ slug:'dental_ortho_invisalign', name_ko:'인비절라인 (Invisalign)', name_en:'Invisalign', name_zh:'隐适美',
  mechanism:'orthodontic', domain:'dental', intensity_tier:'petit',
  body_areas:['dental'], concerns:['teeth_alignment'], is_surgical:false,
  device_brand:'Invisalign',
  members:[{clinic_slug:'lienjang_dental', source_name:'Invisalign'}]});

cadd({ slug:'dental_ortho_partial', name_ko:'부분교정', name_en:'Partial Orthodontics', name_zh:'局部正畸',
  mechanism:'orthodontic', domain:'dental', intensity_tier:'petit',
  body_areas:['dental'], concerns:['teeth_alignment'], is_surgical:false,
  members:[{clinic_slug:'lienjang_dental', source_name:'부분교정'}]});

cadd({ slug:'dental_caries', name_ko:'충치 치료', name_en:'Caries Restoration', name_zh:'蛀牙修复',
  mechanism:'restorative', domain:'dental', intensity_tier:'skin',
  body_areas:['dental'], concerns:['cavity'], is_surgical:false,
  members:[{clinic_slug:'lienjang_dental', source_name:'충치치료'}]});

cadd({ slug:'dental_scaling', name_ko:'스케일링 (치과)', name_en:'Dental Scaling', name_zh:'洗牙',
  mechanism:'periodontal', domain:'dental', intensity_tier:'skin',
  body_areas:['dental'], concerns:['gum_health','prevention'], is_surgical:false,
  members:[{clinic_slug:'lienjang_dental', source_name:'스케일링'}]});

// ──────────────── SURGERY — EYE (centumcore generic) ────────────────
cadd({ slug:'surgery_eye_general', name_ko:'눈 성형 (일반)', name_en:'Eye Surgery (General)', name_zh:'眼整形',
  mechanism:'surgery', domain:'surgical', intensity_tier:'surgery',
  body_areas:['eye'], concerns:['eye_shape'], is_surgical:true,
  members:[{clinic_slug:'centumcore', source_name:'눈성형'}]});

// =====================================================================
// Build CanonicalMembership rows + sanity-check coverage
// =====================================================================
const membership = [];
const canonByClinicAndName = new Map(); // key: clinic_slug|source_name -> canonical id

for (const c of C) {
  for (const m of c.members) {
    const key = `${m.clinic_slug}|${m.source_name}`;
    if (canonByClinicAndName.has(key)) {
      console.warn(`⚠️ DUPLICATE membership: ${key} (existing=${canonByClinicAndName.get(key)}, new=${c.id})`);
    }
    canonByClinicAndName.set(key, c.id);
    membership.push({
      canonical_id: c.id,
      canonical_name_ko: c.name_ko,
      clinic_slug: m.clinic_slug,
      source_name: m.source_name
    });
  }
}

// 매핑 누락 점검
const unmapped = [];
for (const t of T) {
  const key = `${t.clinic_slug}|${t.name_ko}`;
  if (!canonByClinicAndName.has(key)) {
    unmapped.push({ t_id: t.id, clinic_slug: t.clinic_slug, name_ko: t.name_ko });
  }
}

// =====================================================================
// Build CanonicalCatalog sheet rows
// =====================================================================
const catalogRows = C.map(c => ({
  id: c.id,
  slug: c.slug,
  name_ko: c.name_ko,
  name_en: c.name_en,
  name_zh: c.name_zh,
  mechanism: c.mechanism,
  domain: c.domain,
  intensity_tier: c.intensity_tier,
  body_areas: Array.isArray(c.body_areas) ? c.body_areas.join(',') : c.body_areas,
  concerns: Array.isArray(c.concerns) ? c.concerns.join(',') : c.concerns,
  device_brand: c.device_brand || '',
  is_surgical: c.is_surgical ? 'Y' : 'N',
  is_bundle: c.is_bundle ? 'Y' : 'N',
  hospital_count: c.members.length,
  example_hospitals: [...new Set(c.members.map(m => m.clinic_slug))].join(','),
  note: c.note || ''
}));

// =====================================================================
// Mechanism enum sheet
// =====================================================================
const mechanisms = [
  // face_aesthetic / energy
  ['hifu', '하이푸', 'HIFU', '高强度聚焦超声', 'face_aesthetic', 'Ulthera, Shurink, Liftera'],
  ['mmfu', 'MMFU 마이크로포커스', 'MMFU (Micro-focused)', '微聚焦超声', 'face_aesthetic', 'Sofwave'],
  ['rf', 'RF 고주파', 'Radiofrequency', '射频', 'face_aesthetic', 'Thermage, InMode, Oligio, Potenza'],
  // lasers
  ['laser_ablative', '박피 레이저', 'Ablative Laser', '剥脱性激光', 'derm_medical', 'CO2, Fraxel'],
  ['laser_non_ablative', '비박피 레이저', 'Non-ablative Laser', '非剥脱性激光', 'derm_medical', 'Pico, Toning, IPL, BBL'],
  // injections
  ['injection_toxin', '보톡스', 'Botox / Neurotoxin', '肉毒素', 'face_aesthetic', 'Botox, Dysport'],
  ['injection_filler', '필러', 'Filler', '填充剂', 'face_aesthetic', 'Juvederm, Belotero, Ellansé'],
  ['injection_skin', '스킨부스터', 'Skin Booster', '皮肤助推剂', 'face_aesthetic', 'Rejuran, Sculptra, Skinvive'],
  // thread / peel / extraction / topical
  ['thread', '실리프팅', 'Thread Lifting', '埋线提升', 'face_aesthetic', 'Silhouette Soft, Mint, Aptos'],
  ['peel', '필링', 'Chemical Peel', '化学换肤', 'derm_medical', 'TCA, glycolic'],
  ['extraction', '여드름 압출', 'Extraction', '粉刺挑除', 'derm_medical', 'comedone extraction'],
  ['subcision', '서브시전', 'Subcision', '皮下分离', 'derm_medical', 'needle/jet subcision'],
  ['topical', '국소요법', 'Topical / LED', '外用/LED', 'derm_medical', 'LED, PDT'],
  // surgical
  ['surgery', '수술', 'Surgery', '手术', 'surgical', 'general aesthetic surgery'],
  ['reconstructive', '재건수술', 'Reconstructive Surgery', '修复手术', 'surgical', 'cleft, scar, burn'],
  ['hair_transplant', '모발이식', 'Hair Transplant', '植发', 'surgical', 'FUE/FUT'],
  // body
  ['liposuction', '지방흡입', 'Liposuction', '吸脂', 'body_contouring', 'LAMS, VASER, PAL'],
  ['fat_grafting', '자가지방이식', 'Fat Grafting', '自体脂肪移植', 'body_contouring', 'autologous fat transfer'],
  ['fat_dissolve_injection', '지방분해주사', 'Fat-dissolving Injection', '溶脂注射', 'body_contouring', 'DCA, lipolysis'],
  ['cryolipolysis', '쿨스컬프팅', 'Cryolipolysis', '冷冻溶脂', 'body_contouring', 'CoolSculpting'],
  ['em_muscle_stim', '근육자극', 'EM Muscle Stimulation', '电磁肌肉刺激', 'body_contouring', 'Emsculpt'],
  // regenerative
  ['stem_cell', '줄기세포', 'Stem Cell Therapy', '干细胞治疗', 'regenerative', 'adipose-derived stem cell'],
  ['exosome', '엑소좀', 'Exosome Therapy', '外泌体疗法', 'regenerative', 'ASCE+'],
  ['prp', 'PRP', 'PRP (Platelet-rich Plasma)', '富血小板血浆', 'regenerative', 'autologous PRP'],
  ['iv_therapy', '수액/영양주사', 'IV Therapy', '静脉输液', 'regenerative', 'functional medicine IV'],
  // dental
  ['implant', '임플란트', 'Dental Implant', '种植牙', 'dental', 'titanium fixture'],
  ['orthodontic', '치아교정', 'Orthodontics', '正畸', 'dental', 'Invisalign, brackets'],
  ['prosthetic', '보철/베니어', 'Prosthetic / Veneer', '修复/贴面', 'dental', 'crowns, veneers'],
  ['restorative', '충치 치료', 'Restorative (Filling)', '充填治疗', 'dental', 'caries, root canal'],
  ['periodontal', '치주 치료', 'Periodontal Care', '牙周护理', 'dental', 'scaling, gum surgery'],
  ['bleaching_dental', '치아 미백', 'Teeth Whitening', '牙齿美白', 'dental', 'cosmetic bleaching'],
].map(([slug, label_ko, label_en, label_zh, domain, examples]) => ({
  slug, label_ko, label_en, label_zh, domain, examples
}));

// =====================================================================
// CategoryAxes sheet — 분류축 enum 정리
// =====================================================================
const axes = [
  { axis:'intensity_tier', slug:'surgery', name_ko:'수술', name_en:'Surgery', name_zh:'手术', meaning:'절개·전신마취·수일 입원/회복 (바비톡 식)' },
  { axis:'intensity_tier', slug:'petit', name_ko:'쁘띠', name_en:'Petit / Non-surgical', name_zh:'微整形', meaning:'바늘/장비 — 절개X, 다운타임 짧음' },
  { axis:'intensity_tier', slug:'skin', name_ko:'피부 케어', name_en:'Skin Care / Toning', name_zh:'皮肤护理', meaning:'레이저 토닝·압출·필링·미백 — 가장 가벼움' },
  { axis:'', slug:'', name_ko:'', name_en:'', name_zh:'', meaning:'' },
  { axis:'domain', slug:'face_aesthetic', name_ko:'얼굴 미용', name_en:'Face Aesthetic', name_zh:'面部美容', meaning:'리프팅·필러·보톡스·스킨부스터' },
  { axis:'domain', slug:'body_contouring', name_ko:'바디 컨투어', name_en:'Body Contouring', name_zh:'体型塑形', meaning:'지방흡입·DCA·EM·바디 HIFU' },
  { axis:'domain', slug:'regenerative', name_ko:'재생 의학', name_en:'Regenerative Medicine', name_zh:'再生医学', meaning:'줄기세포·엑소좀·PRP·IV' },
  { axis:'domain', slug:'surgical', name_ko:'외과 수술', name_en:'Surgical', name_zh:'外科手术', meaning:'눈·코·가슴·윤곽·거상·구순열' },
  { axis:'domain', slug:'derm_medical', name_ko:'피부 의학', name_en:'Dermatology Medical', name_zh:'皮肤医学', meaning:'여드름·흉터·색소·기미·홍조' },
  { axis:'domain', slug:'dental', name_ko:'치과 미용', name_en:'Dental', name_zh:'牙科美容', meaning:'임플란트·교정·라미네이트·미백' },
  { axis:'', slug:'', name_ko:'', name_en:'', name_zh:'', meaning:'' },
  { axis:'body_area', slug:'face', name_ko:'얼굴', name_en:'Face', name_zh:'脸部', meaning:'' },
  { axis:'body_area', slug:'eye', name_ko:'눈', name_en:'Eye', name_zh:'眼部', meaning:'' },
  { axis:'body_area', slug:'nose', name_ko:'코', name_en:'Nose', name_zh:'鼻部', meaning:'' },
  { axis:'body_area', slug:'lip', name_ko:'입술', name_en:'Lip', name_zh:'唇部', meaning:'' },
  { axis:'body_area', slug:'jaw', name_ko:'턱', name_en:'Jaw', name_zh:'下颌', meaning:'' },
  { axis:'body_area', slug:'cheek', name_ko:'광대/볼', name_en:'Cheek / Zygoma', name_zh:'颧骨/脸颊', meaning:'' },
  { axis:'body_area', slug:'forehead', name_ko:'이마', name_en:'Forehead', name_zh:'额头', meaning:'' },
  { axis:'body_area', slug:'brow', name_ko:'눈썹', name_en:'Brow', name_zh:'眉毛', meaning:'' },
  { axis:'body_area', slug:'ear', name_ko:'귀', name_en:'Ear', name_zh:'耳部', meaning:'' },
  { axis:'body_area', slug:'neck', name_ko:'목', name_en:'Neck', name_zh:'颈部', meaning:'' },
  { axis:'body_area', slug:'breast', name_ko:'가슴', name_en:'Breast', name_zh:'胸部', meaning:'' },
  { axis:'body_area', slug:'abdomen', name_ko:'복부', name_en:'Abdomen', name_zh:'腹部', meaning:'' },
  { axis:'body_area', slug:'arm', name_ko:'팔', name_en:'Arm', name_zh:'手臂', meaning:'' },
  { axis:'body_area', slug:'thigh', name_ko:'허벅지', name_en:'Thigh', name_zh:'大腿', meaning:'' },
  { axis:'body_area', slug:'calf', name_ko:'종아리', name_en:'Calf', name_zh:'小腿', meaning:'' },
  { axis:'body_area', slug:'buttocks', name_ko:'엉덩이', name_en:'Buttocks', name_zh:'臀部', meaning:'' },
  { axis:'body_area', slug:'shoulder', name_ko:'어깨', name_en:'Shoulder', name_zh:'肩部', meaning:'' },
  { axis:'body_area', slug:'pelvis', name_ko:'골반', name_en:'Pelvis', name_zh:'骨盆', meaning:'' },
  { axis:'body_area', slug:'chest', name_ko:'흉부 (남성)', name_en:'Chest (male)', name_zh:'胸部', meaning:'' },
  { axis:'body_area', slug:'body', name_ko:'전신 (바디 일반)', name_en:'Body (general)', name_zh:'身体', meaning:'' },
  { axis:'body_area', slug:'skin', name_ko:'피부 (전신)', name_en:'Skin (general)', name_zh:'皮肤', meaning:'' },
  { axis:'body_area', slug:'scalp', name_ko:'두피', name_en:'Scalp', name_zh:'头皮', meaning:'' },
  { axis:'body_area', slug:'joint', name_ko:'관절', name_en:'Joint', name_zh:'关节', meaning:'' },
  { axis:'body_area', slug:'dental', name_ko:'치아', name_en:'Dental', name_zh:'牙齿', meaning:'' },
  { axis:'body_area', slug:'systemic', name_ko:'전신 (IV·줄기세포)', name_en:'Systemic', name_zh:'全身', meaning:'IV·내복·전신 줄기세포' },
];

// =====================================================================
// Write — separate file (hospital_research.xlsx 가 열려있을 수 있어 lock 회피)
// =====================================================================
const outPath = path.join(__dirname, '..', 'v2', 'docs', 'hospital_canonical.xlsx');
const wb = XLSX.utils.book_new();

const addSheet = (sheetName, rows, cols) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  if (cols) ws['!cols'] = cols;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
};

addSheet('CanonicalCatalog', catalogRows, [
  {wch:6},{wch:34},{wch:38},{wch:42},{wch:34},
  {wch:14},{wch:16},{wch:12},{wch:24},{wch:50},
  {wch:18},{wch:10},{wch:10},{wch:8},{wch:48},{wch:40}
]);

addSheet('CanonicalMembership', membership, [
  {wch:6},{wch:38},{wch:20},{wch:38}
]);

addSheet('MechanismEnum', mechanisms, [
  {wch:20},{wch:20},{wch:26},{wch:20},{wch:18},{wch:50}
]);

addSheet('CategoryAxes', axes, [
  {wch:14},{wch:22},{wch:22},{wch:28},{wch:18},{wch:58}
]);

// Legend
const legend = [
  { sheet:'CanonicalCatalog', col:'id', meaning:'CT001~ — 캐노니컬 시술 일련번호 (병원 간 동일 시술은 1행으로 통합)' },
  { sheet:'CanonicalCatalog', col:'slug', meaning:'machine-readable 슬러그 (hifu_ulthera, rf_thermage 등)' },
  { sheet:'CanonicalCatalog', col:'mechanism', meaning:'단일 mechanism (스키마 enum 30개와 매핑)' },
  { sheet:'CanonicalCatalog', col:'domain', meaning:'face_aesthetic / body_contouring / regenerative / surgical / derm_medical / dental' },
  { sheet:'CanonicalCatalog', col:'intensity_tier', meaning:'바비톡 식 3-tier: surgery / petit / skin' },
  { sheet:'CanonicalCatalog', col:'body_areas', meaning:'시술 부위 (콤마 구분, face/eye/nose/breast/body 등)' },
  { sheet:'CanonicalCatalog', col:'concerns', meaning:'외국인 검색 키워드 — UI 칩 매핑' },
  { sheet:'CanonicalCatalog', col:'device_brand', meaning:'장비/제품 브랜드 (Ulthera, Thermage 등)' },
  { sheet:'CanonicalCatalog', col:'is_bundle', meaning:'패키지/프로그램 단위 (살롱드닥터튠즈)' },
  { sheet:'CanonicalCatalog', col:'hospital_count', meaning:'보유 병원 수 (시장 인기도 지표)' },
  { sheet:'',                  col:'',     meaning:'' },
  { sheet:'CanonicalMembership', col:'canonical_id', meaning:'CanonicalCatalog.id 참조' },
  { sheet:'CanonicalMembership', col:'source_name',  meaning:'원본 hospital_research.xlsx Treatments 시트의 name_ko 그대로' },
  { sheet:'',                  col:'',     meaning:'' },
  { sheet:'MechanismEnum',     col:'',     meaning:'30개 mechanism enum + 다국어 라벨 + 도메인 + 예시 장비/제품' },
  { sheet:'CategoryAxes',      col:'axis', meaning:'분류축 종류 — intensity_tier / domain / body_area' },
  { sheet:'',                  col:'',     meaning:'' },
  { sheet:'(전체)', col:'사용법', meaning:'CanonicalCatalog 가 진실의 원천. 각 캐노니컬이 어느 병원과 연결되는지는 CanonicalMembership 으로 join.' }
];
addSheet('Legend', legend, [{wch:24},{wch:18},{wch:90}]);

XLSX.writeFile(wb, outPath);

// =====================================================================
// Report
// =====================================================================
console.log('=== Canonical merge 완료 ===');
console.log('출력:', outPath);
console.log('');
console.log('통계:');
console.log('  - 원본 Treatments       :', T.length, '행');
console.log('  - Canonical 시술 수      :', C.length);
console.log('  - 압축률                  :', ((C.length / T.length) * 100).toFixed(1) + '%  (' + (T.length - C.length) + ' 행 merge)');
console.log('  - Membership 행          :', membership.length, '(canonical ↔ 원본 매핑)');
console.log('  - 누락 매핑              :', unmapped.length);
if (unmapped.length > 0) {
  console.log('');
  console.log('⚠️  누락된 매핑 (사용자 검토 필요):');
  for (const u of unmapped) console.log('   -', u.t_id, '|', u.clinic_slug, '|', u.name_ko);
}
console.log('');
console.log('시트 추가:');
console.log('  - CanonicalCatalog       :', catalogRows.length, '행 (캐노니컬 시술 1행씩)');
console.log('  - CanonicalMembership    :', membership.length, '행 (캐노니컬 ↔ 원본 join)');
console.log('  - MechanismEnum          :', mechanisms.length, '행 (mechanism 다국어 라벨)');
console.log('  - CategoryAxes           :', axes.length, '행 (intensity/domain/body_area axes)');

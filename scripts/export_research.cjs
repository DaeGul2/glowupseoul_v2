// 17개 병원 조사 결과 → xlsx
// 사용자가 구조 재설계용으로 검토할 raw 데이터
// 출력: v2/docs/hospital_research.xlsx
//
// Sheets:
//   1. Clinics            — 병원 요약 (한 행 = 한 병원)
//   2. Treatments         — 시술 풀 (한 행 = 한 시술, 병원별 펼침)
//   3. Patterns           — 시술 정규화 + 보유 병원 카운트
//   4. ForeignSignals     — 다국어/메신저/외국인 시그널 매트릭스

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// =====================================================================
// 1. Clinics
// =====================================================================
const clinics = [
  {
    order: 1, slug: 'soi', name_ko: '소이의원', name_en: 'SOI Clinic',
    url: 'https://www.soiclinic24.co.kr/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'mixed peri-surgical',
    signature: '바디 부위 필러 (어깨/골반/힙/귀)',
    own_categories: 'SIGNATURE / LIFTING / FILLER·BTX / SKIN / B&A',
    languages: 'KR / EN / 中文 / 日本語',
    languages_count: 4,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개 (상담)',
    chain: '단일',
    treatment_count_observed: 15,
    notes: 'IV/줄기세포 카테고리 enum 밖. 바디 시그너처 필러 다수.',
    status: 'active'
  },
  {
    order: 2, slug: 'vellicell', name_ko: '벨리셀의원', name_en: 'Vellicell Clinic',
    url: 'https://gangnam.vellicellclinic.com/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'unknown',
    signature: '(SPA 렌더링 — 미확인)',
    own_categories: '(미확인)',
    languages: '미확인', languages_count: 0,
    wechat: '', whatsapp: '', line: '', kakao: '',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '미확인', chain: '미확인',
    treatment_count_observed: 0,
    notes: 'SPA — 정적 추출 실패. headless browser 또는 수동 입력 필요.',
    status: 'SPA-fail'
  },
  {
    order: 3, slug: 'ayun', name_ko: '아윤의원', name_en: 'AYUN Clinic',
    url: 'https://ayunclinic.com/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'device-led derm',
    signature: 'Ultherapy PRIME · THERMAGE FLX (장비명 = SKU)',
    own_categories: '리프팅 / 윤곽 / 스킨부스터 / 인젝션',
    languages: 'KR', languages_count: 1,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 5,
    notes: '디바이스 브랜드명 = 메뉴. device_brand 필드 필수.',
    status: 'active'
  },
  {
    order: 4, slug: 'dewyd', name_ko: '듀이디의원', name_en: 'Dewyd Clinic',
    url: 'https://www.dewydclinic.com/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'device-led derm',
    signature: '다중 디바이스 브랜드 (Potenza, Picosure, Fraxel, Ulthera, Thermage 등)',
    own_categories: 'Reepot·Toning / Lifting / Skinbooster / Acne·Pore / Scar·Redness',
    languages: 'KOR / ENG / CHN / JPN', languages_count: 4,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개 (/clinicPrice 403)',
    chain: '단일',
    treatment_count_observed: 28,
    notes: '디바이스 브랜드명을 시술명으로 노출 → device_brand 필드 필수.',
    status: 'active'
  },
  {
    order: 5, slug: 'lamiche', name_ko: '클럽미즈 라미체의원', name_en: 'Club Miz Lamiche',
    url: 'https://www.lamiche.co.kr/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'mixed peri-surgical',
    signature: '인모드 / 울쎄라 / 써마지 FLX / 프락셀듀얼',
    own_categories: '리프팅·안티에이징 / 여드름·모공·흉터 / 색소·홍조 / 쁘띠·주사',
    languages: 'KR', languages_count: 1,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 25,
    notes: '순수 피부과 — 성형 X (CLAUDE.md 분류와 불일치).',
    status: 'active'
  },
  {
    order: 6, slug: 'wooa', name_ko: '우아 성형외과', name_en: 'WOOA Plastic Surgery',
    url: 'https://wooamedical.com/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'surgery specialty (breast)',
    signature: '가슴성형 (모티바·멘토)',
    own_categories: '가슴 / 눈 / 코 / 체형 / 리프팅 / 쁘띠 (6개 센터)',
    languages: 'KR / EN / CN / JP / MN / VN / ID', languages_count: 7,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: 'O (Real Selfie 45+)',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 15,
    notes: '몽골/인니/베트남 — 동남아·중앙아 확장. 줄기세포 보유.',
    status: 'active'
  },
  {
    order: 7, slug: 'wannabe', name_ko: '워너비 성형외과', name_en: 'Wannabe Plastic Surgery',
    url: 'https://www.wannabeps.com/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'surgery specialty (nose/eye + 다영역)',
    signature: '코·눈 (매부리코·무보형물 코)',
    own_categories: '눈 / 코 / 안면윤곽 / 안티에이징 / 가슴 / 바디라인 / 줄기세포 / 탈모 (8 센터)',
    languages: 'KR / EN / CN / JP', languages_count: 4,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: 'O (수술 전후)',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 28,
    notes: '탈모센터 단독 — hair_transplant mechanism. pickabeau.co 케이스 매칭 연동.',
    status: 'active'
  },
  {
    order: 8, slug: 'vanny', name_ko: '반니 성형외과', name_en: 'Vanny Plastic Surgery',
    url: 'https://vannyps.com/',
    region: '서울 강남', area_specific: '강남역',
    archetype: 'unknown',
    signature: '(SPA — 미확인)',
    own_categories: '성형/리프팅/쁘띠 (헤더만)',
    languages: '미확인', languages_count: 0,
    wechat: '', whatsapp: '', line: '', kakao: '',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '미확인',
    chain: '단일',
    treatment_count_observed: 0,
    notes: 'SPA — 정적 추출 실패. 광고 트래픽 의존형 추정.',
    status: 'SPA-fail'
  },
  {
    order: 9, slug: 'hershe', name_ko: 'Hershe 성형외과', name_en: 'Hershe Beauty',
    url: 'https://www.hershebeauty.com/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'surgery specialty (lifting/buttocks)',
    signature: 'MACS/SMAS/Neck lift + 힙업/힙딥 (Brazilian)',
    own_categories: 'Lifting / Eyes / Body / Buttocks / Beauty',
    languages: 'KR / EN / CN / JP / VN / ID', languages_count: 6,
    wechat: 'O', whatsapp: 'O', line: '', kakao: 'O',
    coordinator: 'O (시술별 specialty 매칭)',
    interpreter: '', pickup: '', ba_gallery: 'O',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 16,
    notes: '50개국 4만명 0사고. WeChat 보유 = 중국 타깃 최강. 힙딥 niche.',
    status: 'active'
  },
  {
    order: 10, slug: '365mc', name_ko: '365mc 병원 (서울)', name_en: '365mc Hospital Seoul',
    url: 'https://seoul.365mc.com/',
    region: '서울', area_specific: '서울 (다지점)',
    archetype: 'body contouring specialty',
    signature: '람스(LAMS) · 무한람스 · DCA · 지방줄기세포',
    own_categories: '부위별 지방흡입 / 특수 지방흡입 / 지방줄기세포 / 주사',
    languages: 'KR', languages_count: 1,
    wechat: '', whatsapp: '', line: '', kakao: 'O(추정)',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '체인 (전국)',
    treatment_count_observed: 11,
    notes: '거의 모든 시술이 기존 mechanism enum 밖. 별도 domain(body_contouring) 처리.',
    status: 'active'
  },
  {
    order: 11, slug: 'lienjang_gangnam', name_ko: '리엔장 강남 (피부과/성형외과)', name_en: 'Lienjang Gangnam',
    url: 'https://gangnam.lienjang.net/',
    region: '서울 강남', area_specific: '강남본점',
    archetype: 'mixed peri-surgical (chain)',
    signature: '리엔셀 자체 브랜드 주사',
    own_categories: '스킨부스터 / 리프팅(에너지) / 주사 / 바디 / 두피',
    languages: 'KR / EN / 中(간·번) / JP / TH / VN / ID / RU', languages_count: 9,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '체인 (6지점 + 5계열사)',
    treatment_count_observed: 32,
    notes: '9개 언어 최강. 단 WeChat 없음 — 중국 80% 타깃에 큰 갭. ASCE+ 엑소좀 보유.',
    status: 'active'
  },
  {
    order: 12, slug: 'noselips', name_ko: '최우식 노즈립 성형외과', name_en: 'Noselips (Dr.Choi)',
    url: 'https://www.noselips.co.kr/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'surgery niche (cleft/nose-revision)',
    signature: '구순구개열 2차 + 코 재수술 (최우식 30년)',
    own_categories: '구순구개열 / 코재수술 / 코성형 / 입술인중 / 줄기세포 / 흉터클리닉',
    languages: 'KR / EN / JP / THA / CHN / ARA / IND', languages_count: 7,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 13,
    notes: '아랍어·태국어 명시 — 중동 시장. 마취통증의학과 전문의 상주. 의사 = 브랜드.',
    status: 'active'
  },
  {
    order: 13, slug: 'salondrtunes', name_ko: '살롱드닥터튠즈 의원', name_en: 'Salon de Dr.Tunes',
    url: 'https://salondedrtunes.kr/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'regenerative / program-based',
    signature: '프로그램(센터) 단위 패키지',
    own_categories: 'Juvénile (줄기세포) / All-Layer (리프팅) / Sportif (다이어트·산후·경기력)',
    languages: 'KR / EN / 中文 / 日本語', languages_count: 4,
    wechat: 'O', whatsapp: 'O', line: '', kakao: 'O',
    coordinator: 'O', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 3,
    notes: '단일 시술 매핑 불가 — bundle/package 별도 entity 필요. WhatsApp + WeChat 공식 노출.',
    status: 'active'
  },
  {
    order: 14, slug: 'cellora', name_ko: '셀로라 의원', name_en: 'Cellora of GU',
    url: 'https://cellora.gu.clinic/kr',
    region: '서울 강남', area_specific: '강남',
    archetype: 'regenerative (presumed)',
    signature: '첨단재생의료기관 인증 (줄기세포·엑소좀 추정)',
    own_categories: '(SPA — 미확인)',
    languages: '미확인', languages_count: 0,
    wechat: '', whatsapp: '', line: '', kakao: '',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '미확인',
    chain: '단일',
    treatment_count_observed: 0,
    notes: 'SPA fail + 계약 협의중 → 우선순위 낮음.',
    status: 'SPA-fail / 계약협의중'
  },
  {
    order: 15, slug: 'eunel', name_ko: '유넬의원', name_en: 'Eunel Clinic',
    url: 'https://eunelclinic.co.kr/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'concern-based derm',
    signature: '고민 기반(skin concerns) 1차 분류',
    own_categories: 'Lifting / Anti-Aging / Petit / Skin Concerns',
    languages: 'KR', languages_count: 1,
    wechat: '', whatsapp: '', line: '', kakao: '미확인',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '미확인 (/52 페이지 별도)',
    chain: '단일',
    treatment_count_observed: 9,
    notes: '우리 concerns[] 매칭 키워드와 1:1 정렬 — 매칭로직 reference.',
    status: 'active'
  },
  {
    order: 16, slug: 'lead', name_ko: '리드 성형외과', name_en: 'Lead Plastic Surgery',
    url: 'https://lead.ps/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'surgery specialty (eye/lift)',
    signature: '눈성형 + 안면거상 (코·가슴 미언급)',
    own_categories: '눈성형 / 안티에이징 거상 / 치료(흉터·켈로이드·양성종양) / 리프팅 / 탄력·피부결 / 쁘띠 / 색소·혈관',
    languages: 'KOR / ENG', languages_count: 2,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 15,
    notes: '고압산소치료 = enum 밖. 부분 특화 성형외과.',
    status: 'active'
  },
  {
    order: 17, slug: 'sunnygarden', name_ko: '햇살담은뜰 정원의원', name_en: 'Sunny Garden Clinic',
    url: 'https://sunnygardenclinic.imweb.me/',
    region: '서울 강남', area_specific: '청담동',
    archetype: 'device-led (thread specialty)',
    signature: 'Silhouette Soft + Mint Lift (실리프팅 중심)',
    own_categories: '실리프팅 / 필러 / 바이오필러 / 장비리프팅',
    languages: 'KR / JP', languages_count: 2,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 6,
    notes: '일본어 토글 — 일본 환자 타깃. "노화 단계별 맞춤" 컨셉.',
    status: 'active'
  },
  {
    order: 18, slug: 'geurim', name_ko: '그림 성형외과', name_en: 'Geurim Plastic Surgery',
    url: 'https://m.drkoops.co.kr/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'surgery niche (cleft lip)',
    signature: '구순열(언청이) 30년 노하우',
    own_categories: '입술/인중 / 흉터 / 구순열 / 이물제거 / 이마축소 / 눈밑지방',
    languages: 'KR + JP (별도 도메인)', languages_count: 2,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '단일 (JP 별도 사이트)',
    treatment_count_observed: 7,
    notes: '거의 100% 절개/외과술. 일본어 별도 도메인 운영.',
    status: 'active'
  },
  {
    order: 19, slug: 'lienjang_dental', name_ko: '리엔장 치과 (강남점)', name_en: 'Lienjang Dental',
    url: 'https://gangnam.dental.lienjang.net/',
    region: '서울 강남', area_specific: '강남',
    archetype: 'dental',
    signature: 'Lienpearl Laminate · One-day Implant · Sleep Implant',
    own_categories: '임플란트 / 심미 / 교정 / 일반진료',
    languages: 'KR / EN / CN / JP', languages_count: 4,
    wechat: '', whatsapp: '', line: '', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '체인 (리엔장 계열)',
    treatment_count_observed: 10,
    notes: '치과 — mechanism enum 6개 추가 필요 (implant/orthodontic/prosthetic/restorative/periodontal/bleaching). 태국/베트남/일본 국제 네트워크.',
    status: 'active'
  },
  {
    order: 20, slug: 'centumcore', name_ko: '센텀코어의원 (부산)', name_en: 'Centum Core Clinic',
    url: 'https://centumcore.com/',
    region: '부산 해운대', area_specific: '마린시티',
    archetype: 'comprehensive (피부+성형+재생+기능의학)',
    signature: '줄기세포·기능의학 차별화 (피부+성형 통합)',
    own_categories: '안면성형 / 바디성형 / 피부 / 리프팅 / 기능의학 / 줄기세포',
    languages: 'KR / EN / JP / RU', languages_count: 4,
    wechat: 'O', whatsapp: '', line: 'O', kakao: 'O',
    coordinator: '', interpreter: '', pickup: '', ba_gallery: '',
    price_display: '비공개',
    chain: '단일',
    treatment_count_observed: 14,
    notes: '부산 최초 케이스 — 지역 일반화 검증. 러시아어 = 부산 러시아 환자 마켓. WeChat+LINE 보유.',
    status: 'active'
  }
];

// =====================================================================
// 2. Treatments — 모든 병원의 시술 풀
//    mech 컬럼은 raw 추정 (사용자 검토용). domain 도 후보일뿐.
// =====================================================================
const T = []; // helper builder
let _tid = 0;
const add = (clinic_slug, clinic_name, category_self, name_ko, name_en, mech, body_area, is_surgical, note) => {
  _tid++;
  T.push({
    id: 'T' + String(_tid).padStart(3, '0'),
    clinic_slug, clinic_name,
    category_self, name_ko, name_en: name_en || '',
    mechanism_guess: mech,
    body_area, is_surgical: is_surgical ? 'Y' : 'N',
    note: note || ''
  });
};

// 1. 소이의원
add('soi','소이의원','시그니처','압토스 이중턱 실리프팅','Aptos Thread (Double Chin)','thread','jawline,neck',false,'');
add('soi','소이의원','시그니처','3D 풀페이스 필러','3D Full-face Filler','injection_filler','face',false,'');
add('soi','소이의원','시그니처','직각 어깨 필러','Straight Shoulder Filler','injection_filler','body (shoulder)',false,'바디 부위 필러 — 시그니처');
add('soi','소이의원','시그니처','골반 필러','Pelvis Filler','injection_filler','body (pelvis)',false,'바디 부위 필러');
add('soi','소이의원','시그니처','애플힙 필러','Apple Hip Filler','injection_filler','buttocks',false,'바디 부위 필러');
add('soi','소이의원','시그니처','미인 귀 필러','Ear Filler','injection_filler','ear',false,'바디 부위 필러');
add('soi','소이의원','리프팅','안티에이징 리프팅','Anti-aging Lifting','hifu? rf?','face',false,'기기명 미상');
add('soi','소이의원','리프팅','바디 리프팅','Body Lifting','hifu? rf?','body',false,'기기명 미상');
add('soi','소이의원','주사','보톡스','Botox','injection_toxin','face',false,'');
add('soi','소이의원','주사','에스핏주사','SFit Injection','fat_dissolve_injection','face,body',false,'지방분해');
add('soi','소이의원','스킨','스킨부스터','Skin Booster','injection_skin','face',false,'');
add('soi','소이의원','스킨','미백레이저','Whitening Laser','laser_non_ablative','face',false,'');
add('soi','소이의원','스킨','피부관리','Facial Care','topical','face',false,'');
add('soi','소이의원','기타','수액(IV)','IV Therapy','iv_therapy','systemic',false,'enum 밖');
add('soi','소이의원','기타','줄기세포','Stem Cell','stem_cell','systemic',false,'enum 밖');

// 3. 아윤
add('ayun','아윤의원','리프팅','울쎄라 프라임','Ultherapy PRIME','hifu','face',false,'device_brand');
add('ayun','아윤의원','리프팅','써마지 FLX','Thermage FLX','rf','face',false,'device_brand');
add('ayun','아윤의원','윤곽','윤곽주사 (Face Contouring)','Face Contouring','injection_skin (lipolytic)','face',false,'');
add('ayun','아윤의원','스킨부스터','리버스 부스터','Rebirth Booster','injection_skin','face',false,'자체 브랜딩');
add('ayun','아윤의원','인젝션','리쥬란','Rejuran','injection_skin','face',false,'PN');

// 4. 듀이디
add('dewyd','듀이디의원','Toning','Reepot','Reepot','laser_non_ablative','face',false,'device');
add('dewyd','듀이디의원','Toning','Pico Plus','Pico Plus','laser_non_ablative','face',false,'device');
add('dewyd','듀이디의원','Toning','Pico Sure','Pico Sure','laser_non_ablative','face',false,'device');
add('dewyd','듀이디의원','Toning','Genesis','Laser Genesis','laser_non_ablative','face',false,'device');
add('dewyd','듀이디의원','Toning','Lucas Plus','Lucas Plus','laser_non_ablative','face',false,'device');
add('dewyd','듀이디의원','Resurfacing','Fraxel','Fraxel','laser_ablative','face',false,'device');
add('dewyd','듀이디의원','Resurfacing','CO2','CO2 Laser','laser_ablative','face',false,'device');
add('dewyd','듀이디의원','Resurfacing','CO2 Fraxel','CO2 Fraxel','laser_ablative','face',false,'device');
add('dewyd','듀이디의원','RF Microneedle','Potenza','Potenza','rf','face',false,'device — microneedle RF');
add('dewyd','듀이디의원','RF Microneedle','Potenza DIA','Potenza DIA','rf','face',false,'device');
add('dewyd','듀이디의원','Lifting','Titanium Onda','Titanium Onda','rf','face',false,'device');
add('dewyd','듀이디의원','Lifting','Ultherapy','Ultherapy','hifu','face',false,'device');
add('dewyd','듀이디의원','Lifting','Thermage FLX','Thermage FLX','rf','face',false,'device');
add('dewyd','듀이디의원','Lifting','Inmode','Inmode','rf','face',false,'device');
add('dewyd','듀이디의원','Lifting','Shrink Universe','Shrink Universe','hifu','face',false,'device');
add('dewyd','듀이디의원','Skinbooster','Rejuran','Rejuran','injection_skin','face',false,'');
add('dewyd','듀이디의원','Skinbooster','Rejuran HB','Rejuran HB','injection_skin','face',false,'');
add('dewyd','듀이디의원','Skinbooster','Eye Rejuran','Eye Rejuran','injection_skin','eye',false,'');
add('dewyd','듀이디의원','Skinbooster','Rizene','Rizene','injection_skin','face',false,'');
add('dewyd','듀이디의원','Skinbooster','Sculptra','Sculptra','injection_skin (collagen)','face',false,'collagen booster');
add('dewyd','듀이디의원','Filler','Juvederm','Juvederm','injection_filler','face',false,'');
add('dewyd','듀이디의원','Filler','Juvederm Volume','Juvederm Volume','injection_filler','face',false,'');
add('dewyd','듀이디의원','Filler','Relead M','Relead M','injection_skin','face',false,'');
add('dewyd','듀이디의원','Scar','Subsicion','Subcision','subcision','face',false,'흉터');
add('dewyd','듀이디의원','Acne','PDT','PDT','topical (light)','face',false,'photodynamic');
add('dewyd','듀이디의원','Acne','Extraction','Extraction','extraction','face',false,'압출');
add('dewyd','듀이디의원','Acne','Scaling','Scaling','extraction','face',false,'');
add('dewyd','듀이디의원','Acne','염증주사','Inflammation Injection','injection_toxin (steroid?)','face',false,'스테로이드 추정');

// 5. 라미체
add('lamiche','라미체의원','리프팅','울쎄라','Ulthera','hifu','face',false,'');
add('lamiche','라미체의원','리프팅','써마지 FLX','Thermage FLX','rf','face',false,'');
add('lamiche','라미체의원','리프팅','슈링크','Shurink','hifu','face',false,'');
add('lamiche','라미체의원','리프팅','인모드','Inmode','rf','face',false,'');
add('lamiche','라미체의원','리프팅','올리지오','Oligio','rf','face',false,'');
add('lamiche','라미체의원','리프팅','토르','Thor','rf? hifu?','face',false,'');
add('lamiche','라미체의원','여드름/모공','프락셀듀얼','Fraxel Dual','laser_ablative','face',false,'');
add('lamiche','라미체의원','여드름/모공','Legato2','Legato2','rf (microneedle)','face',false,'');
add('lamiche','라미체의원','여드름/모공','DRT','DRT','laser_non_ablative','face',false,'');
add('lamiche','라미체의원','여드름/모공','PDT','PDT','topical (light)','face',false,'');
add('lamiche','라미체의원','여드름/모공','모피어스8','Morpheus8','rf (microneedle)','face',false,'');
add('lamiche','라미체의원','여드름/모공','미라젯','Mirajet','laser_non_ablative','face',false,'');
add('lamiche','라미체의원','색소/홍조','Excel V','Excel V','laser_non_ablative','face',false,'vascular');
add('lamiche','라미체의원','색소/홍조','피코슈어','Picosure','laser_non_ablative','face',false,'');
add('lamiche','라미체의원','색소/홍조','BBL','BBL','laser_non_ablative','face',false,'IPL 계열');
add('lamiche','라미체의원','색소/홍조','Photona','Photona','laser_non_ablative','face',false,'');
add('lamiche','라미체의원','주사','보톡스','Botox','injection_toxin','face',false,'');
add('lamiche','라미체의원','주사','필러','Filler','injection_filler','face',false,'');
add('lamiche','라미체의원','주사','쥬베덤','Juvederm','injection_filler','face',false,'');
add('lamiche','라미체의원','주사','벨로테로','Belotero','injection_filler','face',false,'');
add('lamiche','라미체의원','주사','리쥬란힐러','Rejuran Healer','injection_skin','face',false,'');
add('lamiche','라미체의원','주사','스컬트라','Sculptra','injection_skin','face',false,'');
add('lamiche','라미체의원','주사','엘란쎄','Ellanse','injection_filler','face',false,'bio-filler');
add('lamiche','라미체의원','주사','윤곽주사','Contour Injection','injection_skin (lipolytic)','face',false,'');
add('lamiche','라미체의원','실','실리프트','Thread Lift','thread','face',false,'');

// 6. 우아
add('wooa','우아 성형외과','가슴','모티바 어고노믹스','Motiva Ergonomix','surgery','breast',true,'implant brand');
add('wooa','우아 성형외과','가슴','멘토 엑스트라','Mentor Extra','surgery','breast',true,'implant brand');
add('wooa','우아 성형외과','가슴','멘토 부스트','Mentor Boost','surgery','breast',true,'implant brand');
add('wooa','우아 성형외과','가슴','삼중평면법','Triple Plane Aug','surgery','breast',true,'기법');
add('wooa','우아 성형외과','가슴','하이브리드 가슴성형','Hybrid Breast Aug','surgery','breast',true,'implant+fat');
add('wooa','우아 성형외과','리프팅','스마스리프트','SMAS Lift','surgery','face',true,'');
add('wooa','우아 성형외과','리프팅','미니퀵리프팅','Mini Quick Lift','surgery','face',true,'');
add('wooa','우아 성형외과','체형','지방이식','Fat Grafting','fat_grafting','face,body',true,'');
add('wooa','우아 성형외과','쁘띠','써마지 FLX','Thermage FLX','rf','face',false,'');
add('wooa','우아 성형외과','쁘띠','아큐스컬프','Accusculpt','laser_ablative (sub)','face,body',false,'레이저 지방분해');
add('wooa','우아 성형외과','쁘띠','우아트임','Wooa Eye Cut','surgery','eye',true,'자체 브랜딩 (앞/뒤트임)');
add('wooa','우아 성형외과','쁘띠','줄기세포','Stem Cell','stem_cell','face,body',false,'');
add('wooa','우아 성형외과','쁘띠','필러','Filler','injection_filler','face',false,'');
add('wooa','우아 성형외과','쁘띠','볼라이트','Volite','injection_skin','face',false,'');
add('wooa','우아 성형외과','쁘띠','실리프팅','Thread Lift','thread','face',false,'');

// 7. 워너비
add('wannabe','워너비 성형외과','눈','쌍커풀','Double Eyelid','surgery','eye',true,'');
add('wannabe','워너비 성형외과','눈','눈밑지방재배치','Lower Bleph','surgery','eye',true,'');
add('wannabe','워너비 성형외과','코','매부리코','Hump Nose','surgery','nose',true,'');
add('wannabe','워너비 성형외과','코','무보형물 코성형','No-implant Rhinoplasty','surgery','nose',true,'');
add('wannabe','워너비 성형외과','안면윤곽','V라인','V-line','surgery','jaw',true,'');
add('wannabe','워너비 성형외과','안면윤곽','광대','Zygoma Reduction','surgery','cheek',true,'');
add('wannabe','워너비 성형외과','안면윤곽','사각턱','Mandible Reduction','surgery','jaw',true,'');
add('wannabe','워너비 성형외과','안티에이징','이마거상','Forehead Lift','surgery','forehead',true,'');
add('wannabe','워너비 성형외과','가슴','가슴확대','Breast Aug','surgery','breast',true,'');
add('wannabe','워너비 성형외과','가슴','가슴축소','Breast Reduction','surgery','breast',true,'');
add('wannabe','워너비 성형외과','바디라인','지방흡입','Liposuction','liposuction','body',true,'');
add('wannabe','워너비 성형외과','바디라인','복부성형','Abdominoplasty','surgery','abdomen',true,'');
add('wannabe','워너비 성형외과','탈모','모발이식','Hair Transplant','hair_transplant','scalp',true,'단독 센터');
add('wannabe','워너비 성형외과','줄기세포','줄기세포','Stem Cell','stem_cell','systemic',false,'단독 센터');
add('wannabe','워너비 성형외과','비수술','울쎄라피','Ultherapy','hifu','face',false,'');
add('wannabe','워너비 성형외과','비수술','써마지 FLX','Thermage FLX','rf','face',false,'');
add('wannabe','워너비 성형외과','비수술','보톡스','Botox','injection_toxin','face',false,'');
add('wannabe','워너비 성형외과','비수술','필러','Filler','injection_filler','face',false,'');
add('wannabe','워너비 성형외과','비수술','3D 지방이식','3D Fat Graft','fat_grafting','face',false,'');
add('wannabe','워너비 성형외과','비수술','민트리프팅','Mint Lift','thread','face',false,'PCL');
add('wannabe','워너비 성형외과','비수술','실루엣리프팅','Silhouette Lift','thread','face',false,'PLA');
add('wannabe','워너비 성형외과','비수술','엘라스티꿈리프팅','Elasticum Lift','thread','face',false,'');
add('wannabe','워너비 성형외과','비수술','원더리프팅','Wonder Lift','thread','face',false,'');
add('wannabe','워너비 성형외과','비수술','PRP','PRP','prp','face,scalp',false,'');
add('wannabe','워너비 성형외과','레이저','프락셀Ⅱ','Fraxel II','laser_ablative','face',false,'');
add('wannabe','워너비 성형외과','레이저','프락셀GV','Fraxel GV','laser_ablative','face',false,'');
add('wannabe','워너비 성형외과','레이저','CO2 레이저','CO2 Laser','laser_ablative','face',false,'');
add('wannabe','워너비 성형외과','레이저','IPL','IPL','laser_non_ablative','face',false,'');

// 9. Hershe
add('hershe','Hershe 성형외과','Lifting','MACS Lift','MACS Lift','surgery','face',true,'');
add('hershe','Hershe 성형외과','Lifting','Full Facelift','Full Facelift','surgery','face',true,'');
add('hershe','Hershe 성형외과','Lifting','Mid Facelift','Mid Facelift','surgery','face',true,'');
add('hershe','Hershe 성형외과','Lifting','Neck Lift','Neck Lift','surgery','neck',true,'');
add('hershe','Hershe 성형외과','Eyes','Sub-brow Lift','Sub-brow Lift','surgery','eye',true,'');
add('hershe','Hershe 성형외과','Eyes','Blepharoplasty','Blepharoplasty','surgery','eye',true,'');
add('hershe','Hershe 성형외과','Eyes','Eye Bag Removal','Eye Bag Removal','surgery','eye',true,'');
add('hershe','Hershe 성형외과','Beauty','Rhinoplasty','Rhinoplasty','surgery','nose',true,'');
add('hershe','Hershe 성형외과','Beauty','Breast Augmentation','Breast Augmentation','surgery','breast',true,'');
add('hershe','Hershe 성형외과','Body','Liposuction','Liposuction','liposuction','body',true,'');
add('hershe','Hershe 성형외과','Body','Fat Grafting','Fat Grafting','fat_grafting','face,body',true,'');
add('hershe','Hershe 성형외과','Buttocks','Hip Augmentation','Hip Augmentation','surgery','buttocks',true,'');
add('hershe','Hershe 성형외과','Buttocks','Hip Dip Correction','Hip Dip Correction','surgery','buttocks',true,'niche');
add('hershe','Hershe 성형외과','비수술','Epiticon','Epiticon','thread','face',false,'thread brand');
add('hershe','Hershe 성형외과','비수술','Mini SMAS Thread','Mini SMAS Thread','thread','face',false,'');
add('hershe','Hershe 성형외과','비수술','Liftera II','Liftera II','hifu','face',false,'');

// 10. 365mc
add('365mc','365mc','지방흡입','허벅지 지방흡입','Thigh Liposuction','liposuction','thigh',true,'');
add('365mc','365mc','지방흡입','복부 지방흡입','Abdomen Liposuction','liposuction','abdomen',true,'');
add('365mc','365mc','지방흡입','팔뚝 지방흡입','Arm Liposuction','liposuction','arm',true,'');
add('365mc','365mc','지방흡입','종아리 지방흡입','Calf Liposuction','liposuction','calf',true,'');
add('365mc','365mc','지방흡입','남성 여유증','Gynecomastia','liposuction','chest',true,'');
add('365mc','365mc','특수','안면 지방흡입','Facial Liposuction','liposuction','face',true,'');
add('365mc','365mc','특수','재수술 지방흡입','Revision Liposuction','liposuction','body',true,'');
add('365mc','365mc','시그너처','람스(LAMS)','LAMS','liposuction (proprietary)','body',true,'365mc 고유 기법');
add('365mc','365mc','시그너처','무한람스','Infinity LAMS','liposuction (proprietary)','body',true,'365mc 고유 기법');
add('365mc','365mc','주사','DCA 밉살주사','DCA Injection','fat_dissolve_injection','face,body',false,'');
add('365mc','365mc','지방줄기세포','지방줄기세포 스킨샷','Stem Cell Skin Shot','stem_cell','face',false,'');
add('365mc','365mc','지방줄기세포','지방줄기세포 헤어샷','Stem Cell Hair Shot','stem_cell','scalp',false,'');
add('365mc','365mc','지방줄기세포','지방줄기세포 바이오샷','Stem Cell Bio Shot','stem_cell','systemic',false,'');
add('365mc','365mc','지방줄기세포','지방줄기세포 뱅킹','Stem Cell Banking','stem_cell (banking)','systemic',false,'보관');
add('365mc','365mc','기타','팽팽크림','Firming Cream','topical','body',false,'');

// 11. 리엔장 강남
add('lienjang_gangnam','리엔장 강남','스킨부스터','리쥬란힐러','Rejuran Healer','injection_skin','face',false,'');
add('lienjang_gangnam','리엔장 강남','스킨부스터','쥬베룩','Juvelook','injection_skin','face',false,'');
add('lienjang_gangnam','리엔장 강남','스킨부스터','스킨바이브','Skinvive','injection_skin','face',false,'');
add('lienjang_gangnam','리엔장 강남','스킨부스터','ASCE+ 엑소좀','ASCE+ Exosome','exosome','face',false,'재생');
add('lienjang_gangnam','리엔장 강남','스킨부스터','루미비온','Lumivion','injection_skin','face',false,'');
add('lienjang_gangnam','리엔장 강남','스킨부스터','엘레베스','Elebes','injection_skin','face',false,'');
add('lienjang_gangnam','리엔장 강남','스킨부스터','메타셀MCT','MetaCell MCT','injection_skin','face',false,'');
add('lienjang_gangnam','리엔장 강남','HIFU/RF','울쎄라피','Ultherapy','hifu','face',false,'');
add('lienjang_gangnam','리엔장 강남','HIFU/RF','써마지','Thermage','rf','face',false,'');
add('lienjang_gangnam','리엔장 강남','HIFU/RF','울써마지','Ulthermage','hifu+rf','face',false,'동시 시술');
add('lienjang_gangnam','리엔장 강남','HIFU/RF','슈링크 유니버스','Shurink Universe','hifu','face',false,'');
add('lienjang_gangnam','리엔장 강남','HIFU/RF','인모드','Inmode','rf','face',false,'');
add('lienjang_gangnam','리엔장 강남','HIFU/RF','올리지오','Oligio','rf','face',false,'');
add('lienjang_gangnam','리엔장 강남','HIFU/RF','리프테라2','Liftera 2','hifu','face',false,'');
add('lienjang_gangnam','리엔장 강남','HIFU/RF','볼뉴머','Volnewmer','rf','face',false,'');
add('lienjang_gangnam','리엔장 강남','HIFU/RF','리니어지','Linerage','hifu','face',false,'');
add('lienjang_gangnam','리엔장 강남','에너지','온다리프팅','Onda Lifting','rf','face,body',false,'');
add('lienjang_gangnam','리엔장 강남','에너지','쿨페이즈','Coolphase','rf','face',false,'');
add('lienjang_gangnam','리엔장 강남','에너지','소프웨이브','Sofwave','mmfu','face',false,'마이크로포커스');
add('lienjang_gangnam','리엔장 강남','에너지','티타늄리프팅','Titanium Lift','rf','face',false,'');
add('lienjang_gangnam','리엔장 강남','실','실리프팅','Thread Lift','thread','face',false,'');
add('lienjang_gangnam','리엔장 강남','주사','보톡스','Botox','injection_toxin','face',false,'');
add('lienjang_gangnam','리엔장 강남','주사','필러','Filler','injection_filler','face',false,'');
add('lienjang_gangnam','리엔장 강남','주사','윤곽주사','Contour Injection','injection_skin (lipolytic)','face',false,'');
add('lienjang_gangnam','리엔장 강남','주사','브이올렛주사','V-let Injection','injection_skin','face',false,'');
add('lienjang_gangnam','리엔장 강남','주사','리엔셀 피부주사','Liencell Skin Injection','injection_skin','face',false,'자체 브랜딩');
add('lienjang_gangnam','리엔장 강남','주사','리엔셀 정맥주사','Liencell IV','iv_therapy','systemic',false,'자체 브랜딩');
add('lienjang_gangnam','리엔장 강남','주사','리프팅주사','Lifting Injection','injection_skin','face',false,'');
add('lienjang_gangnam','리엔장 강남','바디','살빼주사','Slim Injection','fat_dissolve_injection','body',false,'');
add('lienjang_gangnam','리엔장 강남','바디','1인치주사','1-inch Injection','fat_dissolve_injection','body',false,'');
add('lienjang_gangnam','리엔장 강남','바디','바디보툴리늄','Body Botox','injection_toxin','body',false,'');
add('lienjang_gangnam','리엔장 강남','바디','울트라인','Ultraline','hifu (body)','body',false,'바디용');

// 12. 노즈립
add('noselips','노즈립','구순구개열','구순구개열 2차 수술','Cleft Lip/Palate Revision','reconstructive','lip,nose',true,'niche');
add('noselips','노즈립','코재수술','구축코 재수술','Contracted Nose Revision','surgery','nose',true,'');
add('noselips','노즈립','코재수술','휜코','Crooked Nose','surgery','nose',true,'');
add('noselips','노즈립','코재수술','매부리코','Hump Nose','surgery','nose',true,'');
add('noselips','노즈립','코성형','기능코성형','Functional Rhinoplasty','surgery','nose',true,'');
add('noselips','노즈립','코성형','콧구멍 비대칭','Nostril Asymmetry','surgery','nose',true,'');
add('noselips','노즈립','입술인중','인중성형','Philtrum Surgery','surgery','lip',true,'');
add('noselips','노즈립','입술인중','입술성형','Lip Surgery','surgery','lip',true,'');
add('noselips','노즈립','줄기세포','항노화 줄기세포','Anti-aging Stem Cell','stem_cell','face',false,'');
add('noselips','노즈립','줄기세포','리프팅 줄기세포','Lifting Stem Cell','stem_cell','face',false,'');
add('noselips','노즈립','흉터클리닉','Dual Repair Laser','Dual Repair Laser','laser_ablative','face,body',false,'');
add('noselips','노즈립','흉터클리닉','Fractional','Fractional Laser','laser_ablative','face,body',false,'');
add('noselips','노즈립','흉터클리닉','Cure Jet subcision','Cure Jet Subcision','subcision','face',false,'');

// 13. 살롱드닥터튠즈 (프로그램)
add('salondrtunes','살롱드닥터튠즈','프로그램','Salon de Juvénile (줄기세포 프로그램)','Salon de Juvenile','stem_cell (program)','systemic',false,'bundle');
add('salondrtunes','살롱드닥터튠즈','프로그램','Salon de All-Layer (리프팅 프로그램)','Salon de All-Layer','hifu+rf+thread (program)','face',false,'bundle');
add('salondrtunes','살롱드닥터튠즈','프로그램','Salon de Sportif (다이어트/산후/경기력)','Salon de Sportif','iv_therapy+fat_dissolve (program)','body,systemic',false,'bundle');

// 15. 유넬
add('eunel','유넬의원','Lifting','리프팅','Lifting (unspecified)','hifu? rf? thread?','face',false,'기기 미상');
add('eunel','유넬의원','Anti-Aging','스킨부스터','Skin Booster','injection_skin','face',false,'');
add('eunel','유넬의원','Anti-Aging','콜라겐 부스터','Collagen Booster','injection_skin','face',false,'');
add('eunel','유넬의원','Anti-Aging','줄기세포','Stem Cell','stem_cell','face,systemic',false,'');
add('eunel','유넬의원','Petit','필러','Filler','injection_filler','face',false,'');
add('eunel','유넬의원','Petit','실','Thread','thread','face',false,'');
add('eunel','유넬의원','Skin Concerns','잡티·기미 케어','Pigmentation Care','laser_non_ablative','face',false,'');
add('eunel','유넬의원','Skin Concerns','모공·여드름흉터','Pore/Scar Care','rf? laser?','face',false,'');
add('eunel','유넬의원','Skin Concerns','여드름','Acne Care','extraction+topical','face',false,'');

// 16. 리드
add('lead','리드 성형외과','눈','쌍커풀','Double Eyelid','surgery','eye',true,'');
add('lead','리드 성형외과','눈','눈매교정','Eye Shape Correction','surgery','eye',true,'');
add('lead','리드 성형외과','눈','앞트임','Epicanthoplasty','surgery','eye',true,'');
add('lead','리드 성형외과','눈','뒤트임','Lateral Canthoplasty','surgery','eye',true,'');
add('lead','리드 성형외과','눈','눈밑지방재배치','Lower Bleph','surgery','eye',true,'');
add('lead','리드 성형외과','거상','내시경 이마거상','Endoscopic Forehead Lift','surgery','forehead',true,'');
add('lead','리드 성형외과','거상','상안검·눈썹거상','Upper Bleph + Brow Lift','surgery','eye,brow',true,'');
add('lead','리드 성형외과','거상','하안검·미드페이스리프트','Lower Bleph + Midface Lift','surgery','face',true,'');
add('lead','리드 성형외과','거상','안면거상','Facelift','surgery','face',true,'');
add('lead','리드 성형외과','거상','목거상','Neck Lift','surgery','neck',true,'');
add('lead','리드 성형외과','치료','양성종양·모반 제거','Benign Lesion Removal','surgery','skin',true,'');
add('lead','리드 성형외과','치료','귓불교정','Earlobe Correction','surgery','ear',true,'');
add('lead','리드 성형외과','치료','흉터·켈로이드','Scar/Keloid','reconstructive','skin',true,'');
add('lead','리드 성형외과','치료','화상','Burn Treatment','reconstructive','skin',true,'');
add('lead','리드 성형외과','기타','고압산소치료','Hyperbaric Oxygen','hyperbaric','systemic',false,'enum 밖');

// 17. 햇살담은뜰
add('sunnygarden','햇살담은뜰','실리프팅','Silhouette Soft','Silhouette Soft','thread (PLA 360)','face',false,'device');
add('sunnygarden','햇살담은뜰','실리프팅','Mint Lift','Mint Lift','thread (PCL 3D)','face',false,'device');
add('sunnygarden','햇살담은뜰','필러','Neauvia','Neauvia','injection_filler (HA+PEG)','face',false,'device');
add('sunnygarden','햇살담은뜰','바이오필러','Ellansé','Ellanse','injection_filler (PCL bio)','face',false,'device');
add('sunnygarden','햇살담은뜰','장비','Liftera2','Liftera 2','hifu','face',false,'device');
add('sunnygarden','햇살담은뜰','장비','Emsculpt','Emsculpt','em_muscle_stim','body',false,'device');

// 18. 그림
add('geurim','그림 성형외과','구순열','구순열 성형','Cleft Lip Surgery','reconstructive','lip',true,'niche 30년');
add('geurim','그림 성형외과','입술/인중','인중성형','Philtrum Surgery','surgery','lip',true,'');
add('geurim','그림 성형외과','입술/인중','입술축소','Lip Reduction','surgery','lip',true,'');
add('geurim','그림 성형외과','흉터','흉터성형','Scar Revision','reconstructive','skin',true,'');
add('geurim','그림 성형외과','이물제거','이물제거','Foreign Body Removal','surgery','face,body',true,'');
add('geurim','그림 성형외과','이마축소','이마축소','Forehead Reduction','surgery','forehead',true,'');
add('geurim','그림 성형외과','눈밑지방','눈밑지방','Under-eye Fat','surgery','eye',true,'');

// 19. 리엔장 치과
add('lienjang_dental','리엔장 치과','임플란트','One-day Implant','One-day Implant','implant','dental',true,'');
add('lienjang_dental','리엔장 치과','임플란트','Sleep Implant','Sleep Implant (sedation)','implant','dental',true,'수면진정');
add('lienjang_dental','리엔장 치과','임플란트','일반 임플란트','Standard Implant','implant','dental',true,'');
add('lienjang_dental','리엔장 치과','심미','Lienpearl Laminate','Lienpearl Laminate','prosthetic','dental',false,'veneer');
add('lienjang_dental','리엔장 치과','심미','미백','Teeth Whitening','bleaching_dental','dental',false,'');
add('lienjang_dental','리엔장 치과','심미','잇몸성형','Gum Contouring','periodontal (surgical)','dental',true,'');
add('lienjang_dental','리엔장 치과','교정','Invisalign','Invisalign','orthodontic','dental',false,'');
add('lienjang_dental','리엔장 치과','교정','부분교정','Partial Orthodontics','orthodontic','dental',false,'');
add('lienjang_dental','리엔장 치과','일반','충치치료','Caries Restoration','restorative','dental',false,'');
add('lienjang_dental','리엔장 치과','일반','스케일링','Scaling','periodontal','dental',false,'');

// 20. 센텀코어
add('centumcore','센텀코어','안면(수술)','눈성형','Eye Surgery','surgery','eye',true,'');
add('centumcore','센텀코어','안면(수술)','코성형','Nose Surgery','surgery','nose',true,'');
add('centumcore','센텀코어','안면(수술)','이마성형','Forehead Surgery','surgery','forehead',true,'');
add('centumcore','센텀코어','안면(수술)','지방이식','Fat Grafting','fat_grafting','face',true,'');
add('centumcore','센텀코어','바디(수술)','가슴성형','Breast Surgery','surgery','breast',true,'');
add('centumcore','센텀코어','바디(수술)','힙성형','Hip Surgery','surgery','buttocks',true,'');
add('centumcore','센텀코어','바디(수술)','바디 컨투어','Body Contouring','surgery','body',true,'');
add('centumcore','센텀코어','피부','색소/모공/여드름 레이저','Skin Laser','laser_non_ablative','face',false,'');
add('centumcore','센텀코어','리프팅','Belody','Belody','rf? hifu?','face',false,'장비');
add('centumcore','센텀코어','리프팅','HIFU','HIFU','hifu','face',false,'');
add('centumcore','센텀코어','리프팅','실리프팅','Thread Lift','thread','face',false,'');
add('centumcore','센텀코어','기능의학','면역증강 IV','Immune IV','iv_therapy','systemic',false,'');
add('centumcore','센텀코어','기능의학','남성/여성 케어 IV','Hormonal IV','iv_therapy','systemic',false,'');
add('centumcore','센텀코어','줄기세포','항노화 줄기세포','Anti-aging Stem Cell','stem_cell','face,systemic',false,'');
add('centumcore','센텀코어','줄기세포','탈모 줄기세포','Hair Stem Cell','stem_cell','scalp',false,'');
add('centumcore','센텀코어','줄기세포','관절 줄기세포','Joint Stem Cell','stem_cell','joint',false,'');

// =====================================================================
// 3. Patterns — 시술명 정규화 + 보유 병원 카운트
// =====================================================================
const groupMap = new Map();
for (const t of T) {
  const key = t.name_ko.trim();
  if (!groupMap.has(key)) groupMap.set(key, []);
  groupMap.get(key).push(t.clinic_name);
}
const patterns = Array.from(groupMap.entries())
  .map(([name, clinicArr]) => ({
    treatment_name: name,
    clinic_count: clinicArr.length,
    clinics: clinicArr.join(', ')
  }))
  .sort((a, b) => b.clinic_count - a.clinic_count || a.treatment_name.localeCompare(b.treatment_name, 'ko'));

// =====================================================================
// 4. ForeignSignals — 다국어/메신저/시그널 매트릭스
// =====================================================================
const signals = clinics
  .filter(c => c.status === 'active')
  .map(c => ({
    order: c.order, slug: c.slug, name_ko: c.name_ko,
    languages_count: c.languages_count,
    languages: c.languages,
    KR: c.languages.includes('KR') || c.languages.includes('KOR') ? 'O' : '',
    EN: c.languages.includes('EN') || c.languages.includes('ENG') ? 'O' : '',
    ZH: c.languages.includes('中') || c.languages.includes('CN') || c.languages.includes('CHN') ? 'O' : '',
    JA: c.languages.includes('日') || c.languages.includes('JP') || c.languages.includes('JPN') ? 'O' : '',
    RU: c.languages.includes('RU') ? 'O' : '',
    VN: c.languages.includes('VN') ? 'O' : '',
    ID: c.languages.includes('ID') || c.languages.includes('IND') ? 'O' : '',
    TH: c.languages.includes('TH') || c.languages.includes('THA') ? 'O' : '',
    AR: c.languages.includes('AR') || c.languages.includes('ARA') ? 'O' : '',
    MN: c.languages.includes('MN') ? 'O' : '',
    wechat: c.wechat, whatsapp: c.whatsapp, line: c.line, kakao: c.kakao,
    coordinator: c.coordinator, ba_gallery: c.ba_gallery,
    archetype: c.archetype,
    region: c.region
  }))
  .sort((a, b) => b.languages_count - a.languages_count);

// =====================================================================
// Build workbook
// =====================================================================
const wb = XLSX.utils.book_new();

const wsClinics = XLSX.utils.json_to_sheet(clinics, {
  header: ['order','slug','name_ko','name_en','url','region','area_specific','archetype','signature','own_categories',
           'languages','languages_count','wechat','whatsapp','line','kakao','coordinator','interpreter','pickup','ba_gallery',
           'price_display','chain','treatment_count_observed','notes','status']
});
wsClinics['!cols'] = [
  {wch:6},{wch:18},{wch:22},{wch:24},{wch:40},{wch:14},{wch:14},{wch:28},{wch:48},{wch:48},
  {wch:42},{wch:8},{wch:8},{wch:10},{wch:6},{wch:8},{wch:14},{wch:12},{wch:8},{wch:16},
  {wch:22},{wch:18},{wch:10},{wch:80},{wch:18}
];
XLSX.utils.book_append_sheet(wb, wsClinics, 'Clinics');

const wsTreatments = XLSX.utils.json_to_sheet(T, {
  header: ['id','clinic_slug','clinic_name','category_self','name_ko','name_en',
           'mechanism_guess','body_area','is_surgical','note']
});
wsTreatments['!cols'] = [
  {wch:6},{wch:20},{wch:22},{wch:18},{wch:30},{wch:30},{wch:30},{wch:16},{wch:8},{wch:42}
];
XLSX.utils.book_append_sheet(wb, wsTreatments, 'Treatments');

const wsPatterns = XLSX.utils.json_to_sheet(patterns, {
  header: ['treatment_name','clinic_count','clinics']
});
wsPatterns['!cols'] = [{wch:34},{wch:14},{wch:80}];
XLSX.utils.book_append_sheet(wb, wsPatterns, 'Patterns');

const wsSignals = XLSX.utils.json_to_sheet(signals, {
  header: ['order','slug','name_ko','languages_count','languages',
           'KR','EN','ZH','JA','RU','VN','ID','TH','AR','MN',
           'wechat','whatsapp','line','kakao','coordinator','ba_gallery','archetype','region']
});
wsSignals['!cols'] = [
  {wch:6},{wch:18},{wch:22},{wch:6},{wch:44},
  {wch:4},{wch:4},{wch:4},{wch:4},{wch:4},{wch:4},{wch:4},{wch:4},{wch:4},{wch:4},
  {wch:8},{wch:10},{wch:6},{wch:8},{wch:16},{wch:16},{wch:30},{wch:14}
];
XLSX.utils.book_append_sheet(wb, wsSignals, 'ForeignSignals');

// =====================================================================
// Schema legend sheet
// =====================================================================
const legend = [
  { sheet: 'Clinics', col: 'order', meaning: '사용자가 보낸 병원 list 순서 (1~20)' },
  { sheet: 'Clinics', col: 'archetype', meaning: '병원 분류 추정 (device-led derm / surgery specialty / mixed / body contouring / regenerative / dental 등)' },
  { sheet: 'Clinics', col: 'signature', meaning: '병원의 시그너처 시술/특징' },
  { sheet: 'Clinics', col: 'own_categories', meaning: '병원이 자체적으로 부르는 카테고리 분류 (정규화 X)' },
  { sheet: 'Clinics', col: 'languages_count', meaning: '지원 언어 개수' },
  { sheet: 'Clinics', col: 'wechat/whatsapp/line/kakao', meaning: '메신저 채널 보유 여부 (O / 공백)' },
  { sheet: 'Clinics', col: 'treatment_count_observed', meaning: '본 시트 Treatments 에서 이 병원에 등록된 시술 행 개수' },
  { sheet: 'Clinics', col: 'status', meaning: 'active / SPA-fail / 계약협의중' },
  { sheet: '', col: '', meaning: '' },
  { sheet: 'Treatments', col: 'id', meaning: '시술 일련번호 (T001 ~)' },
  { sheet: 'Treatments', col: 'clinic_slug / clinic_name', meaning: '소속 병원 식별자' },
  { sheet: 'Treatments', col: 'category_self', meaning: '병원이 부른 카테고리 그대로 (정규화 X)' },
  { sheet: 'Treatments', col: 'mechanism_guess', meaning: '시술 기전 추정 — 사용자가 검토/수정용' },
  { sheet: 'Treatments', col: 'body_area', meaning: '시술 부위' },
  { sheet: 'Treatments', col: 'is_surgical', meaning: '수술 시술 여부 (Y/N)' },
  { sheet: 'Treatments', col: 'note', meaning: 'device brand / niche / bundle 등 부연' },
  { sheet: '', col: '', meaning: '' },
  { sheet: 'Patterns', col: 'treatment_name', meaning: '시술명 (Treatments.name_ko 기준 정규화)' },
  { sheet: 'Patterns', col: 'clinic_count', meaning: '해당 시술 보유한 병원 수 (시장 인기도 지표)' },
  { sheet: 'Patterns', col: 'clinics', meaning: '보유 병원 리스트 (콤마 구분)' },
  { sheet: '', col: '', meaning: '' },
  { sheet: 'ForeignSignals', col: 'KR/EN/ZH/JA/RU/VN/ID/TH/AR/MN', meaning: '언어별 보유 여부 (O/공백)' },
  { sheet: 'ForeignSignals', col: '', meaning: '병원이 자체 사이트에서 다국어/메신저/외국인 시그널 노출 여부 (사용자 차별화 갭 분석용)' }
];
const wsLegend = XLSX.utils.json_to_sheet(legend, { header: ['sheet','col','meaning'] });
wsLegend['!cols'] = [{wch:18},{wch:38},{wch:90}];
XLSX.utils.book_append_sheet(wb, wsLegend, 'Legend');

// =====================================================================
// Write
// =====================================================================
const outDir = path.join(__dirname, '..', 'v2', 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'hospital_research.xlsx');
XLSX.writeFile(wb, out);

console.log('=== hospital_research.xlsx 생성 완료 ===');
console.log('경로:', out);
console.log('');
console.log('시트 구성:');
console.log('  Clinics         :', clinics.length, '병원');
console.log('  Treatments      :', T.length, '시술 행');
console.log('  Patterns        :', patterns.length, '정규화 시술명');
console.log('  ForeignSignals  :', signals.length, '병원 (active만)');
console.log('  Legend          : 컬럼 설명');

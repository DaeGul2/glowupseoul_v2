// 모델별 필드 메타데이터. 운영자(비개발자) 친화 라벨 + 설명 풀세트.
//
// 각 컬럼은 다음 키를 가짐:
//   name      — DB 컬럼명 (변경 금지)
//   label     — 화면에 보일 한국어 라벨
//   help      — 회색 한 줄 hint (이게 뭐고 / 언제 쓰고 / 예시)
//   type      — text | textarea | number | bool | date | datetime | select | tags | json | image | gallery | fk
//   group     — 섹션 헤딩 (한국어)
//   required  — true 시 별표
//   options   — select 의 enum 값 (DB 와 매칭, 화면 표기는 optionLabels 로)
//   optionLabels — { 'active': '운영중 (active)', … } 식 한글 보조 라벨
//   table     — fk 타입의 참조 테이블
//   upload    — image/gallery 타입의 S3 경로 { kind, slot }

const DOMAIN_OPTS = ['face_aesthetic','body_contouring','regenerative','surgical','derm_medical','dental'];
const DOMAIN_LABELS = {
  face_aesthetic: '얼굴 미용 (face_aesthetic)',
  body_contouring: '바디 윤곽 (body_contouring)',
  regenerative: '재생 / 웰니스 (regenerative)',
  surgical: '수술 (surgical)',
  derm_medical: '피부과 (derm_medical)',
  dental: '치과 (dental)',
};
const SPEC_OPTS = ['niche','device_led','general'];
const SPEC_LABELS = {
  niche: 'niche (전문 한 분야)',
  device_led: 'device_led (장비/시그너처 중심)',
  general: 'general (종합)',
};
const CONTRACT_OPTS = ['active','pending','negotiating','declined','paused'];
const CONTRACT_LABELS = {
  active: 'active (운영중 · 사이트 노출)',
  pending: 'pending (대기 · 미노출)',
  negotiating: 'negotiating (계약 협의중 · 미노출)',
  declined: 'declined (계약 거절)',
  paused: 'paused (일시중지)',
};
const INTENS_OPTS = ['subtle','moderate','dramatic'];
const INTENS_LABELS = { subtle: 'subtle (자연스러움)', moderate: 'moderate (보통)', dramatic: 'dramatic (드라마틱)' };
const ONSET_OPTS = ['immediate','gradual'];
const ONSET_LABELS = { immediate: 'immediate (즉시)', gradual: 'gradual (서서히)' };
const DURAT_OPTS = ['temporary','months','years','permanent'];
const DURAT_LABELS = {
  temporary: 'temporary (일시적)',
  months: 'months (몇 개월)',
  years: 'years (수년)',
  permanent: 'permanent (영구)',
};
const ANES_OPTS = ['topical','local','sedation','general','none'];
const ANES_LABELS = {
  topical: 'topical (도포 마취)',
  local: 'local (국소 마취)',
  sedation: 'sedation (수면 마취)',
  general: 'general (전신 마취)',
  none: 'none (무마취)',
};
const UNIT_OPTS = ['shots','cc','sessions','area','flat'];
const UNIT_LABELS = {
  shots: 'shots (샷)',
  cc: 'cc',
  sessions: 'sessions (회)',
  area: 'area (부위)',
  flat: 'flat (정액)',
};
const PRICE_T_OPTS = ['$','$$','$$$','$$$$'];
const PRICE_T_LABELS = {
  '$': '$ (저렴 · 10만원대)',
  '$$': '$$ (중간 · 30~80만원)',
  '$$$': '$$$ (고가 · 100~300만원)',
  '$$$$': '$$$$ (프리미엄 · 300만원+)',
};
const BUDGET_OPTS = ['under_300','300_800','800_2000','2000_5000','over_5000','flexible'];
const RELEV_OPTS = ['primary','secondary','adjunct'];
const RELEV_LABELS = {
  primary: 'primary (핵심 해결책)',
  secondary: 'secondary (보조 해결책)',
  adjunct: 'adjunct (병행 시 도움)',
};
const VIS_OPTS = ['public','logged_in','staff_only'];
const VIS_LABELS = {
  public: 'public (누구나)',
  logged_in: 'logged_in (로그인 사용자)',
  staff_only: 'staff_only (운영진 전용)',
};
const FEED_SRC_OPTS = ['inquiry','match_request','seed'];
const FEED_SRC_LABELS = {
  inquiry: 'inquiry (실 문의)',
  match_request: 'match_request (스캔 매칭)',
  seed: 'seed (운영자 시드)',
};
const FEED_OUT_OPTS = ['consulted','matched','quoted','booked','completed'];
const FEED_OUT_LABELS = {
  consulted: 'consulted (상담 완료)',
  matched: 'matched (매칭됨)',
  quoted: 'quoted (견적 받음)',
  booked: 'booked (예약 완료)',
  completed: 'completed (시술 완료)',
};

// ─────────────────────────────────────────────────────────────────────
// 사이드바 메뉴
// ─────────────────────────────────────────────────────────────────────
// 사이드바 메뉴 — 운영자 친화로 단순화.
//
// 사이드바에서 숨김 (편집은 다른 곳에서 inline 으로):
//   • brands               → 병원 편집 안에서 "브랜드 정보" 그룹으로 통합 (1:1 자동 처리)
//   • hospital_procedures  → 병원 편집 안에서 "이 병원이 제공하는 시술" 패널로 inline 관리
//
// 두 모델 모두 /admin/{kind} 라우트는 살아있음 (어드밴스드 진입용).
export const KINDS = [
  { kind: 'hospitals',             label: '병원',                help: '병원 지점 + 브랜드 정보 + 제공 시술 모두 한 화면에서 관리.' },
  { kind: 'procedures',            label: '시술',                help: '병원과 무관한 \"시술 자체\" 정보. 예: HIFU 리프팅 · 코 재수술.' },
  { kind: 'procedure_categories',  label: '카테고리',             help: '시술 분류 (얼굴/눈/코/바디/피부/헤어/웰니스/치과 8개).' },
  { kind: 'concerns',              label: '고민(검색 키워드)',    help: '외국 환자가 쓰는 표현. 예: \"lifting\", \"acne scars\".' },
  { kind: 'doctors',               label: '의사',                help: '병원 소속 의사. 외국 환자가 가장 신뢰하는 정보.' },
  { kind: 'ba_photos',             label: 'B&A (전후사진)',       help: '동의받은 전/후 사진. 환자 메타와 시술 정보 함께.' },
  { kind: 'public_feed_entries',   label: '실시간 피드',          help: '메인 페이지에 흐르는 \"M. in Singapore — HIFU\" 식의 사회적 증거 ticker.' },
  { kind: 'concern_procedures',    label: '고민↔시술 매트릭스',   help: '\"이 고민에는 이 시술이 잘 맞는다\"는 매핑. 수기 큐레이션.' },
];

// ─────────────────────────────────────────────────────────────────────
// 공용 컬럼 (slug, is_active, deleted_at 등)
// ─────────────────────────────────────────────────────────────────────
const SLUG = {
  name: 'slug',
  label: 'URL 식별자',
  help: 'URL · 사진 폴더 · 매칭에 쓰이는 짧은 영문 키. 예: hifu_face / hershe_청담점. 한 번 정하면 절대 바꾸지 마세요 (외부 링크가 깨집니다).',
  type: 'text', required: true, group: '기본 정보',
};
const ACTIVE = {
  name: 'is_active', label: '활성 (사이트 노출)', type: 'bool', default: true, group: '플래그',
  help: '체크 해제하면 사이트 어디에도 안 보입니다. 임시 숨김에 사용.',
};

// ─────────────────────────────────────────────────────────────────────
// 모델별 spec
// ─────────────────────────────────────────────────────────────────────
export const SPECS = {

  // ===================================================================
  // brands
  // ===================================================================
  brands: {
    titleField: 'name_ko',
    listLabel: '브랜드',
    listIntro: '병원 브랜드(상호) 단위. 같은 브랜드의 지점은 \"병원 지점\" 메뉴에서 별도로 추가하세요.',
    list: ['id', 'slug', 'name_ko', 'name_en', 'specialization_depth', 'is_chain', 'is_active'],
    cols: [
      SLUG,
      { name: 'name_ko', label: '브랜드명 (한국어)', type: 'text', required: true, help: '예: 소이의원, 우아 성형외과', group: '기본 정보' },
      { name: 'name_en', label: '브랜드명 (영어)',  type: 'text', help: '영문 사이트에 노출. 예: Soi Clinic' },
      { name: 'name_zh', label: '브랜드명 (중국어)', type: 'text', help: '중국 환자용. 예: 索伊医院' },
      { name: 'name_ja', label: '브랜드명 (일본어)', type: 'text' },
      { name: 'founding_doctor', label: '대표/창립 의사', type: 'text', help: '브랜드 시그너처 인물. 예: 최우식 (노즈립).' },
      { name: 'specialization_depth', label: '전문성 깊이', type: 'select', options: SPEC_OPTS, optionLabels: SPEC_LABELS, default: 'general',
        help: '"niche" = 한 분야 특화 (코 재수술 등) · "device_led" = 시그너처 장비 라인업 · "general" = 종합' },
      { name: 'is_chain', label: '체인 여부', type: 'bool', help: '여러 지점이 있으면 체크 (예: 리엔장 6지점).' },
      { name: 'website_url', label: '공식 홈페이지 URL', type: 'text', help: '예: https://www.soiclinic24.co.kr/' },
      { name: 'logo_url',       label: '로고 (투명 PNG/SVG)', type: 'image', upload: { kind: 'brands', slot: 'logo' }, group: '사진',
        help: '헤더 / 카드 모서리에 노출. 정사각 512×512 권장. 배경 투명.' },
      { name: 'brand_hero_url', label: '브랜드 커버 사진',    type: 'image', upload: { kind: 'brands', slot: 'hero' },
        help: '(선택) 브랜드 페이지 상단 가로 와이드 컷. 1600px 이상.' },
      { name: 'description_ko', label: '한 줄 설명 (한국어)', type: 'textarea', group: '설명',
        help: '브랜드 컨셉 한 줄. 예: "직각어깨 필러 시그너처 · 강남 14년."' },
      { name: 'description_en', label: '한 줄 설명 (영어)',  type: 'textarea' },
      { name: 'description_zh', label: '한 줄 설명 (중국어)', type: 'textarea' },
      { name: 'description_ja', label: '한 줄 설명 (일본어)', type: 'textarea' },
      ACTIVE,
    ],
  },

  // ===================================================================
  // hospitals  (= 브랜드 + 지점 + 제공 시술 통합 관리)
  // ===================================================================
  hospitals: {
    titleField: 'name_ko',
    listLabel: '병원',
    listIntro: '병원 1곳 = 1행. 같은 브랜드의 다른 지점은 별도 행으로 추가. 브랜드 정보 (로고/체인 여부)는 같은 화면에서 함께 입력.',
    list: ['id', 'slug', 'name_ko', 'city', 'district', 'contract_status', 'is_active'],
    // hospital 편집 페이지에서만 보이는 inline 패널.
    // AdminEdit 가 이 키들을 감지해서 폼 하단에 패널 렌더링.
    inlinePanels: ['offerings', 'doctors', 'ba_photos'],
    cols: [
      SLUG,
      { name: 'branch_name', label: '지점명', type: 'text', help: '예: 강남점, 청담점, 센텀점. 단일 지점이면 비워둠.' },
      { name: 'name_ko', label: '간판명 (한국어)', type: 'text', required: true, help: '실제 간판에 보이는 이름. 보통 브랜드명 그대로.' },
      { name: 'name_en', label: '간판명 (영어)',  type: 'text' },
      { name: 'name_zh', label: '간판명 (중국어)', type: 'text' },
      { name: 'name_ja', label: '간판명 (일본어)', type: 'text' },

      // ── 브랜드 정보 (자동 처리) ─────────────────────────────────────
      // 운영자는 여기 입력만. AdminEdit 가 저장 시 brand 자동 upsert + brand_id 연결.
      { name: 'brand_name_ko', label: '브랜드명 (한국어)', type: 'text', group: '브랜드 정보 (체인 본부 또는 단일 브랜드)',
        help: '같은 브랜드가 여러 지점이면 동일한 이름 사용. 비워두면 위 \"간판명\" 으로 자동 생성.' },
      { name: 'brand_name_en', label: '브랜드명 (영어)', type: 'text' },
      { name: 'brand_logo_url', label: '브랜드 로고', type: 'image', upload: { kind: 'brands', slot: 'logo' },
        help: '투명 PNG/SVG 권장. 헤더 / 카드에 노출.' },
      { name: 'brand_founding_doctor', label: '대표/창립 의사', type: 'text', help: '예: 최우식 (노즈립).' },
      { name: 'brand_specialization_depth', label: '브랜드 전문성', type: 'select',
        options: ['niche','device_led','general'],
        optionLabels: { niche: 'niche (한 분야 특화)', device_led: 'device_led (장비 시그너처)', general: 'general (종합)' },
        default: 'general' },
      { name: 'brand_is_chain', label: '체인 (여러 지점 있음)', type: 'bool',
        help: '리엔장 6지점 같은 케이스. 체크하면 같은 브랜드의 다른 지점을 별도 \"병원\" 으로 추가하세요.' },
      { name: 'brand_website_url', label: '브랜드 공식 홈페이지', type: 'text' },

      { name: 'country', label: '국가', type: 'text', default: 'KR', group: '위치', help: 'ISO-2 코드. 기본 KR (한국).' },
      { name: 'city', label: '도시', type: 'text', required: true, help: '예: 서울, 부산' },
      { name: 'district', label: '구', type: 'text', required: true, help: '예: 강남구, 해운대구' },
      { name: 'neighborhood', label: '동', type: 'text', help: '예: 청담동, 신사동, 마린시티' },
      { name: 'full_address_ko', label: '주소 (한국어)', type: 'text', help: '예: 서울 강남구 청담동 12-3' },
      { name: 'full_address_en', label: '주소 (영어)',  type: 'text' },
      { name: 'lat', label: '위도', type: 'number', help: '구글 맵에서 복사. 예: 37.5172' },
      { name: 'lng', label: '경도', type: 'number', help: '예: 127.0473' },
      { name: 'phone', label: '대표 전화', type: 'text', group: '연락처', help: '예: 02-555-2424' },
      { name: 'email', label: '대표 이메일', type: 'text' },
      { name: 'kakao_id', label: '카카오톡 ID', type: 'text' },
      { name: 'wechat_id', label: 'WeChat ID', type: 'text', help: '중국 환자 핵심 채널. 가능한 채워주세요.' },
      { name: 'whatsapp', label: 'WhatsApp 번호', type: 'text', help: '국가코드 포함. 예: +82-10-3333-1004' },
      { name: 'line_id', label: 'LINE ID', type: 'text' },
      { name: 'website_url', label: '병원 홈페이지', type: 'text' },
      { name: 'languages_supported', label: '응대 가능 언어', type: 'tags', default: ['ko'], group: '언어 / 외국 환자 응대',
        help: '코드만 콤마로. ko / en / zh / ja / ru / vi / id / th / ar 등. 예: ko, en, zh' },
      { name: 'has_intl_coordinator', label: '국제 코디네이터 있음', type: 'bool', help: '외국 환자 전담 직원 보유.' },
      { name: 'has_interpreter', label: '통역사 상주', type: 'bool' },
      { name: 'interpreter_languages', label: '통역 가능 언어', type: 'tags' },
      { name: 'english_doctor', label: '영어 가능 의사', type: 'bool', help: '의사 본인이 직접 영어로 진료 가능한지.' },
      { name: 'female_doctor_available', label: '여성 의사 옵션', type: 'bool', help: '여성 환자가 요청 시 여성 의사 배정 가능.' },
      { name: 'accepts_foreign_card', label: '해외 카드 결제', type: 'bool' },
      { name: 'airport_pickup', label: '공항 픽업 가능', type: 'bool' },
      { name: 'recovery_lodging_partner', label: '회복 숙소 제휴', type: 'bool', help: '근처 호텔/레지던스와 제휴 (술 후 회복 패키지).' },
      { name: 'halal_friendly', label: '할랄 친화', type: 'bool', help: '무슬림 환자 대응 (할랄 식단 안내 등).' },
      { name: 'private_room_available', label: '1인실 회복실', type: 'bool' },
      { name: 'anesthesiologist_onsite', label: '마취과 전문의 상주', type: 'bool', help: '수술 안전성 신호. 외국 환자가 가장 신경 쓰는 항목.' },
      { name: 'safety_claim', label: '안전 클레임', type: 'textarea', group: '신뢰 시그널',
        help: '병원 자체 안전 통계. 예: "50개국 4만명 무사고", "지방흡입 60만건".' },
      { name: 'foreign_case_volume_monthly', label: '월간 외국 환자 건수', type: 'number', help: '대략. 매칭 가중치에 사용.' },
      { name: 'established_year', label: '개원 연도', type: 'number', help: '4자리 연도. 예: 2014' },
      { name: 'ba_gallery_url', label: 'B&A 갤러리 URL', type: 'text', help: '외부 갤러리 링크 (있으면). 내부 등록은 \"B&A\" 메뉴.' },
      { name: 'ba_photo_count', label: 'B&A 보유 사진 수', type: 'number', help: '대략. 신뢰도 표시용.' },
      { name: 'doctor_profile_url', label: '의사 프로필 URL', type: 'text', help: '외부 링크. 의사별 상세 등록은 \"의사\" 메뉴.' },
      { name: 'external_review_links', label: '외부 리뷰 링크 (JSON)', type: 'json',
        help: '예: { "naver": "https://...", "instagram": "https://..." }' },
      { name: 'thumbnail_url',  label: '카드 썸네일',  type: 'image',   upload: { kind: 'hospitals', slot: 'thumbnail' }, group: '사진',
        help: '비교 페이지 / 카테고리 카드에 노출. 4:3 또는 1:1, 800px 권장.' },
      { name: 'hero_image_url', label: '상세 페이지 히어로', type: 'image', upload: { kind: 'hospitals', slot: 'hero' },
        help: '병원 상세 페이지 상단 와이드. 16:9, 1600px 이상.' },
      { name: 'gallery_urls',   label: '시설 갤러리',   type: 'gallery', upload: { kind: 'hospitals', slot: 'gallery' },
        help: '외관 · 대기실 · 진료실 · 의사 단체샷 등. 5~10장.' },
      { name: 'thumbnail_alt_ko', label: '썸네일 대체 텍스트 (한국어)', type: 'text', help: '접근성 + SEO. 예: "소이의원 외관"' },
      { name: 'thumbnail_alt_en', label: '썸네일 대체 텍스트 (영어)',  type: 'text' },
      { name: 'contract_status', label: '계약 상태', type: 'select', options: CONTRACT_OPTS, optionLabels: CONTRACT_LABELS, default: 'pending', group: '운영',
        help: '"active" 만 사이트와 매칭에 노출됩니다. 신규 지점은 처음엔 "pending" 으로 등록 후 검토 후 active.' },
      { name: 'commission_pct', label: '수수료 (%)', type: 'number', help: '예: 15. 사이트 노출 X.' },
      { name: 'notes', label: '운영 메모', type: 'textarea', help: '내부용. 사이트 어디에도 안 보임.' },
      ACTIVE,
    ],
  },

  // ===================================================================
  // procedures
  // ===================================================================
  procedures: {
    titleField: 'name_ko',
    listLabel: '시술',
    listIntro: '병원과 무관한 \"시술 자체\" 정보. 가격·장비는 \"병원×시술 가격표\" 메뉴에서 병원별로.',
    list: ['id', 'slug', 'name_ko', 'domain', 'is_surgical', 'is_active'],
    cols: [
      SLUG,
      { name: 'category_id', label: '카테고리', type: 'fk', table: 'procedure_categories', help: '얼굴/눈/코/바디/피부/헤어/웰니스/치과 중 하나.' },
      { name: 'name_ko', label: '시술명 (한국어)', type: 'text', required: true, help: '예: HIFU 얼굴 리프팅' },
      { name: 'name_en', label: '시술명 (영어)',  type: 'text', help: '예: HIFU Face Lifting. 영문 사이트와 SEO 키워드에 직접 영향.' },
      { name: 'name_zh', label: '시술명 (중국어)', type: 'text' },
      { name: 'name_ja', label: '시술명 (일본어)', type: 'text' },
      { name: 'description_ko', label: '시술 설명 (한국어)', type: 'textarea', group: '설명', help: '2-3 문장. 시술 원리 / 효과 / 누구에게 좋은지.' },
      { name: 'description_en', label: '시술 설명 (영어)',  type: 'textarea' },
      { name: 'description_zh', label: '시술 설명 (중국어)', type: 'textarea' },
      { name: 'description_ja', label: '시술 설명 (일본어)', type: 'textarea' },
      { name: 'mechanism', label: '작용 기전', type: 'tags', required: true, group: '분류',
        help: '시술 원리 슬러그를 콤마로. 예: hifu / rf / injection_filler / surgery. 자세한 목록은 mechanisms 테이블 참조.' },
      { name: 'domain', label: '도메인', type: 'select', options: DOMAIN_OPTS, optionLabels: DOMAIN_LABELS, required: true,
        help: '시술이 속하는 큰 영역. 카테고리와 별개 (운영 분석용).' },
      { name: 'body_area', label: '부위', type: 'tags', required: true,
        help: '시술 부위 슬러그를 콤마로. 예: face, neck / nose / breast, abdomen / skin' },
      { name: 'pain_level', label: '통증 (1-5)', type: 'number', group: '의학적 정보', help: '1 = 거의 없음, 5 = 매우 강함.' },
      { name: 'intensity', label: '강도', type: 'select', options: INTENS_OPTS, optionLabels: INTENS_LABELS, help: '결과의 변화 폭.' },
      { name: 'downtime_days', label: '다운타임 (일)', type: 'number', help: '평균 회복 일수. 0~21 사이.' },
      { name: 'result_onset', label: '결과 발현', type: 'select', options: ONSET_OPTS, optionLabels: ONSET_LABELS, help: '시술 직후 vs 서서히.' },
      { name: 'result_duration', label: '효과 지속', type: 'select', options: DURAT_OPTS, optionLabels: DURAT_LABELS },
      { name: 'typical_sessions', label: '권장 횟수', type: 'number', help: '보통 몇 회 받는지. 예: 1, 3, 5' },
      { name: 'is_surgical', label: '수술 여부', type: 'bool', group: '수술 정보 (수술인 경우만)',
        help: '체크하면 아래 수술 관련 필드들이 의미를 가짐.' },
      { name: 'anesthesia_typical', label: '주 마취 방식', type: 'select', options: ANES_OPTS, optionLabels: ANES_LABELS },
      { name: 'op_duration_hours', label: '수술 시간 (시간)', type: 'number', help: '예: 1.5 = 1시간 30분' },
      { name: 'hospitalization_days', label: '입원 일수', type: 'number' },
      { name: 'stitch_removal_days', label: '실밥 제거일 (D+)', type: 'number', help: '수술 후 며칠째.' },
      { name: 'swelling_peak_days', label: '부기 최대일 (D+)', type: 'number' },
      { name: 'final_result_weeks', label: '최종 결과 (주)', type: 'number', help: '예: 12 = 약 3개월 후 안정.' },
      { name: 'revision_eligible', label: '재수술 정책 있음', type: 'bool', help: '병원이 일정 기간 무료 재수술 보장하는지 (일반적 시장 정보).' },
      { name: 'market_price_min', label: '시장 가격 하한 (원)', type: 'number', group: '시장 가격 (참고)',
        help: '병원별 실 가격은 \"병원×시술\" 에서. 여긴 필터/대략 표시용.' },
      { name: 'market_price_max', label: '시장 가격 상한 (원)', type: 'number' },
      { name: 'price_unit', label: '가격 단위 표기', type: 'text', help: '예: "회당", "100샷"' },
      { name: 'unit_type', label: '단위 종류', type: 'select', options: UNIT_OPTS, optionLabels: UNIT_LABELS },
      { name: 'common_units', label: '자주 쓰는 단위 수량', type: 'tags', help: '예: 100, 200, 300 (HIFU 샷 수)' },
      { name: 'device_examples', label: '대표 장비 예시', type: 'tags', group: '장비',
        help: '예: Ulthera SPT, Shurink, Thermage FLX (브랜드명).' },
      { name: 'thumbnail_url',    label: '카드 썸네일',  type: 'image',   upload: { kind: 'procedures', slot: 'thumbnail' }, group: '사진',
        help: '카테고리 그리드용. 1:1 또는 4:3, 800px.' },
      { name: 'hero_image_url',   label: '시술 상세 히어로', type: 'image', upload: { kind: 'procedures', slot: 'hero' },
        help: '시술 상세 페이지 상단. 16:9, 1600px+.' },
      { name: 'gallery_urls',     label: '결과 예시 갤러리', type: 'gallery', upload: { kind: 'procedures', slot: 'gallery' },
        help: '병원 무관한 generic 시술 사진. 5~10장.' },
      { name: 'illustration_url', label: '메커니즘 일러스트', type: 'image', upload: { kind: 'procedures', slot: 'illustration' },
        help: '(선택) 시술 원리 다이어그램. 800px, 투명 PNG.' },
      { name: 'tags', label: '검색 태그', type: 'tags', help: '내부 검색용 영문 키워드.' },
      ACTIVE,
    ],
  },

  // ===================================================================
  // procedure_categories
  // ===================================================================
  procedure_categories: {
    titleField: 'name_ko',
    listLabel: '카테고리',
    listIntro: '시술 분류 최상위. 현재 8개 (얼굴/눈/코/바디/피부/헤어/웰니스/치과). 추가는 신중히.',
    list: ['id', 'slug', 'name_ko', 'domain', 'display_order', 'is_active'],
    cols: [
      SLUG,
      { name: 'name_ko', label: '카테고리명 (한국어)', type: 'text', required: true, help: '예: 얼굴, 눈, 코' },
      { name: 'name_en', label: '카테고리명 (영어)',  type: 'text', required: true, help: '예: Face, Eyes, Nose' },
      { name: 'name_zh', label: '카테고리명 (중국어)', type: 'text' },
      { name: 'name_ja', label: '카테고리명 (일본어)', type: 'text' },
      { name: 'domain', label: '도메인', type: 'select', options: DOMAIN_OPTS, optionLabels: DOMAIN_LABELS, required: true,
        help: '대표 도메인. 실제 시술은 여러 도메인 섞일 수 있음.' },
      { name: 'parent_id', label: '상위 카테고리', type: 'fk', table: 'procedure_categories', help: '하위 카테고리 만들 때만. 보통 비워둠.' },
      { name: 'display_order', label: '노출 순서', type: 'number', default: 0, help: '낮은 숫자가 먼저. 예: 10, 20, 30' },
      { name: 'thumbnail_url', label: '카드 썸네일', type: 'image', upload: { kind: 'categories', slot: 'thumbnail' }, group: '사진',
        help: '홈 카테고리 카드에 노출. 1:1 또는 4:3.' },
      { name: 'hero_image_url', label: '카테고리 페이지 히어로', type: 'image', upload: { kind: 'categories', slot: 'hero' },
        help: '/category/face 같은 페이지 상단 와이드.' },
      ACTIVE,
    ],
  },

  // ===================================================================
  // concerns
  // ===================================================================
  concerns: {
    titleField: 'name_ko',
    listLabel: '고민 (검색 키워드)',
    listIntro: '외국 환자가 \"내 문제\"를 어떻게 부르는지. 시술명 X, 환자 표현 그대로. 예: \"sagging\", \"acne scars\", \"double eyelid\".',
    list: ['id', 'slug', 'name_ko', 'name_en', 'body_area', 'is_active'],
    cols: [
      SLUG,
      { name: 'name_ko', label: '고민 (한국어)', type: 'text', required: true, help: '예: 처짐, 모공, 여드름 흉터' },
      { name: 'name_en', label: '고민 (영어)',  type: 'text', required: true, help: '예: sagging, pores, acne scars' },
      { name: 'name_zh', label: '고민 (중국어)', type: 'text' },
      { name: 'name_ja', label: '고민 (일본어)', type: 'text' },
      { name: 'description_ko', label: '설명 (한국어)', type: 'textarea' },
      { name: 'description_en', label: '설명 (영어)',  type: 'textarea' },
      { name: 'body_area', label: '주 부위', type: 'text', required: true, help: '예: face / body / skin / hair / dental' },
      { name: 'display_order', label: '노출 순서', type: 'number', default: 0 },
      ACTIVE,
    ],
  },

  // ===================================================================
  // hospital_procedures
  // ===================================================================
  hospital_procedures: {
    titleField: 'id',
    listLabel: '병원 × 시술 가격표',
    listIntro: '한 병원이 한 시술을 \"얼마에 / 어떤 장비로 / 어떤 이벤트로\" 제공하는지. 같은 시술이라도 병원마다 1행씩.',
    list: ['id', 'hospital_id', 'procedure_id', 'starting_price_krw', 'price_tier', 'is_signature'],
    cols: [
      { name: 'hospital_id',  label: '병원 지점', type: 'fk', table: 'hospitals',  required: true, group: '연결',
        help: '이 가격표가 적용될 병원 지점.' },
      { name: 'procedure_id', label: '시술', type: 'fk', table: 'procedures', required: true,
        help: '이 가격표의 시술. 없으면 \"시술\" 메뉴에서 먼저 추가.' },
      { name: 'offered', label: '현재 제공 중', type: 'bool', default: true, help: '체크 해제하면 매칭에서 제외 (잠시 안 함).' },
      { name: 'local_name_ko', label: '병원 자체 명칭 (한국어)', type: 'text', group: '병원 자체 명칭',
        help: '병원이 부르는 고유 이름. 예: 리엔셀 피부주사, 슈링크 600샷 패키지. 비워두면 시술명 사용.' },
      { name: 'local_name_en', label: '병원 자체 명칭 (영어)',  type: 'text' },
      { name: 'price_tier', label: '가격대 (티어)', type: 'select', options: PRICE_T_OPTS, optionLabels: PRICE_T_LABELS, group: '가격',
        help: '대략 분류. 외국 환자가 한눈에 보는 표기.' },
      { name: 'price_disclosed', label: '가격 공개 허용', type: 'bool', help: '체크 시 starting_price_krw 가 사이트에 노출.' },
      { name: 'starting_price_krw', label: '시작 가격 (원)', type: 'number', help: '예: 390000 = ₩390,000' },
      { name: 'pricing_notes', label: '가격 안내 메모', type: 'textarea', help: '예: "100/200/300샷 옵션", "VIP 멤버 추가 할인"' },
      { name: 'available_units', label: '선택 가능한 수량', type: 'tags', help: '예: 100, 200, 300 (HIFU)' },
      { name: 'has_active_event', label: '이벤트 진행 중', type: 'bool', group: '이벤트', help: '체크 시 카드에 \"event\" 뱃지.' },
      { name: 'event_notes', label: '이벤트 내용', type: 'textarea', help: '예: "5월 한정 -30%"' },
      { name: 'event_until', label: '이벤트 종료일', type: 'date' },
      { name: 'package_notes', label: '패키지 메모', type: 'textarea', group: '패키지', help: '예: "회복 호텔 3박 포함"' },
      { name: 'device_brands', label: '사용 장비 브랜드', type: 'tags', group: '장비',
        help: '예: Ulthera Prime, Thermage FLX. 외국 환자가 브랜드명으로 검색.' },
      { name: 'doctor_specialty', label: '담당 의사 전문', type: 'text', help: '예: "쌍커풀 30년"' },
      { name: 'years_offering', label: '이 시술 제공 연수', type: 'number' },
      { name: 'is_signature', label: '병원 시그너처', type: 'bool', help: '병원이 이 시술을 대표로 미는지. 카드에 ★ 뱃지.' },
      { name: 'thumbnail_url',  label: '카드 썸네일 (병원 자체 샷)', type: 'image', upload: { kind: 'hospital_procedures', slot: 'thumbnail' }, group: '사진 (병원 자체 샷이 있을 때만)',
        help: '병원이 이 시술의 자체 사진을 가질 때만. 비워두면 시술 기본 썸네일 사용.' },
      { name: 'hero_image_url', label: '히어로 (병원 자체)', type: 'image', upload: { kind: 'hospital_procedures', slot: 'hero' } },
      { name: 'source_url', label: '원본 출처 URL', type: 'text', group: '메타', help: '병원 홈페이지 해당 페이지.' },
      { name: 'notes', label: '운영 메모', type: 'textarea', help: '내부용.' },
    ],
  },

  // ===================================================================
  // doctors
  // ===================================================================
  doctors: {
    titleField: 'name_ko',
    listLabel: '의사',
    listIntro: '병원 소속 의사. 외국 환자가 \"누가 시술하는지\"를 가장 신뢰. 의사당 사진 + 경력 + 다국어 bio 권장.',
    list: ['id', 'slug', 'name_ko', 'hospital_id', 'is_featured', 'is_active'],
    cols: [
      SLUG,
      { name: 'hospital_id', label: '소속 병원', type: 'fk', table: 'hospitals', required: true, help: '이 의사가 진료하는 지점.' },
      { name: 'brand_id', label: '브랜드 (체인 의사인 경우)', type: 'fk', table: 'brands', help: '여러 지점을 도는 의사면. 보통 비워둠.' },
      { name: 'name_ko', label: '이름 (한국어)', type: 'text', required: true, help: '예: 김민태' },
      { name: 'name_en', label: '이름 (영어)',  type: 'text', help: '예: Dr. Min-tae Kim' },
      { name: 'name_zh', label: '이름 (중국어)', type: 'text' },
      { name: 'name_ja', label: '이름 (일본어)', type: 'text' },
      { name: 'title_ko', label: '직책 (한국어)', type: 'text', group: '직책', help: '예: 원장, 부원장, 전문의' },
      { name: 'title_en', label: '직책 (영어)',  type: 'text', help: '예: Chief Doctor, Director' },
      { name: 'title_zh', label: '직책 (중국어)', type: 'text' },
      { name: 'title_ja', label: '직책 (일본어)', type: 'text' },
      { name: 'portrait_url',   label: '단독 정면 사진', type: 'image',   upload: { kind: 'doctors', slot: 'portrait' }, group: '사진',
        help: '정사각 또는 4:5. 의사 카드 / 병원 상세에 사용. 1:1, 800px.' },
      { name: 'hero_image_url', label: '와이드 컷 (선택)',   type: 'image',   upload: { kind: 'doctors', slot: 'hero' } },
      { name: 'gallery_urls',   label: '활동 사진 (시술 중·단체 등)',   type: 'gallery', upload: { kind: 'doctors', slot: 'gallery' } },
      { name: 'years_experience', label: '경력 (년)', type: 'number', group: '경력 / 자격',
        help: '예: 15. 외국 환자가 가장 보는 숫자.' },
      { name: 'specialties', label: '전문 분야', type: 'tags', help: '예: rhinoplasty, revision_rhinoplasty, double_eyelid' },
      { name: 'education', label: '학력 (JSON)', type: 'json',
        help: 'JSON 배열. 예: [{"year":2008,"school":"서울대학교 의과대학","degree":"MD"}]' },
      { name: 'certifications', label: '자격증 (JSON)', type: 'json',
        help: '예: [{"name":"성형외과 전문의","issuer":"대한성형외과학회","year":2014}]' },
      { name: 'memberships', label: '학회/협회 (JSON)', type: 'json',
        help: '예: [{"society":"ISAPS","role":"member"}]' },
      { name: 'languages_spoken', label: '구사 언어', type: 'tags', help: '의사 본인 직접 구사. 예: ko, en, zh' },
      { name: 'bio_ko', label: '소개 (한국어)', type: 'textarea', group: '의사 소개', help: '3-5 문장. 환자에게 들려주듯이.' },
      { name: 'bio_en', label: '소개 (영어)',  type: 'textarea' },
      { name: 'bio_zh', label: '소개 (중국어)', type: 'textarea' },
      { name: 'bio_ja', label: '소개 (일본어)', type: 'textarea' },
      { name: 'display_order', label: '노출 순서', type: 'number', default: 0, group: '플래그', help: '병원 페이지 내 의사 표시 순서.' },
      { name: 'is_featured', label: '대표 의사', type: 'bool', help: '병원 카드 / 메인에 \"대표 의사\" 로 노출.' },
      ACTIVE,
    ],
  },

  // ===================================================================
  // ba_photos
  // ===================================================================
  ba_photos: {
    titleField: 'case_title_ko',
    listLabel: 'B&A (전후사진)',
    listIntro: '동의받은 시술 전/후 사진. PIPA 준수 — 반드시 환자 서면 동의 보유 + visibility 신중.',
    list: ['id', 'hospital_id', 'procedure_id', 'doctor_id', 'visibility', 'is_active'],
    cols: [
      { name: 'hospital_id',  label: '병원', type: 'fk', table: 'hospitals',  required: true, group: '연결' },
      { name: 'procedure_id', label: '시술', type: 'fk', table: 'procedures' },
      { name: 'doctor_id',    label: '담당 의사', type: 'fk', table: 'doctors' },
      { name: 'before_url', label: '시술 전 사진', type: 'image', required: true, upload: { kind: 'ba', slot: 'before' }, group: '사진',
        help: '필수. 동일 각도 / 동일 조명으로 after 와 짝.' },
      { name: 'after_url',  label: '시술 후 사진', type: 'image', required: true, upload: { kind: 'ba', slot: 'after' },
        help: '필수. before 와 같은 각도.' },
      { name: 'followup_urls', label: '추가 사진 (D+) (JSON)', type: 'json',
        help: '예: [{"label":"2w","url":"..."}, {"label":"3m","url":"..."}]' },
      { name: 'case_title_ko', label: '케이스 제목 (한국어)', type: 'text', group: '케이스 정보', help: '예: "30대 여성 · 하안검 + 미드페이스"' },
      { name: 'case_title_en', label: '케이스 제목 (영어)',  type: 'text' },
      { name: 'patient_age_range', label: '환자 연령대', type: 'text', help: '예: 20s, 30s, 40s' },
      { name: 'patient_gender', label: '환자 성별', type: 'text', help: 'f / m / nb' },
      { name: 'patient_country', label: '환자 국가', type: 'text', help: 'ISO-2. 예: KR, CN, SG' },
      { name: 'weeks_after', label: '시술 후 (주)', type: 'number', help: 'after 사진 촬영 시점. 예: 2 = 2주 후' },
      { name: 'device_brands', label: '사용 장비', type: 'tags' },
      { name: 'notes_ko', label: '메모 (한국어)', type: 'textarea' },
      { name: 'notes_en', label: '메모 (영어)',  type: 'textarea' },
      { name: 'consent_signed', label: '서면 동의 보유', type: 'bool', group: '동의 · 공개 범위',
        help: '⚠ 필수. 환자 서면 동의 없으면 절대 등록 X.' },
      { name: 'consent_date', label: '동의서 서명일', type: 'date' },
      { name: 'is_anonymized', label: '익명 처리됨', type: 'bool', default: true, help: '눈/얼굴 마스킹 또는 식별 불가 처리 여부.' },
      { name: 'visibility', label: '공개 범위', type: 'select', options: VIS_OPTS, optionLabels: VIS_LABELS, default: 'logged_in',
        help: '"public" 은 신중히. 보통 "logged_in" 으로.' },
      { name: 'display_order', label: '노출 순서', type: 'number', default: 0 },
      ACTIVE,
    ],
  },

  // ===================================================================
  // public_feed_entries
  // ===================================================================
  public_feed_entries: {
    titleField: 'display_initial',
    listLabel: '실시간 피드 (메인 ticker)',
    listIntro: '메인 페이지에 흐르는 \"M. in Singapore — HIFU\" 항목들. 익명화 표기. 운영자 시드 가능.',
    list: ['id', 'display_initial', 'country_code', 'treatment_label_en', 'outcome', 'is_visible', 'is_seed'],
    cols: [
      { name: 'source_type', label: '출처', type: 'select', options: FEED_SRC_OPTS, optionLabels: FEED_SRC_LABELS, default: 'seed', required: true, group: '출처',
        help: '\"seed\" = 운영자가 직접 만든 시드. 실 사용자는 자동으로 \"inquiry\"/\"match_request\".' },
      { name: 'display_initial', label: '이니셜 표기', type: 'text', required: true, group: '익명화 표기',
        help: '1자 + 점. 예: "M.", "J.". 절대 풀네임 사용 X.' },
      { name: 'country_code', label: '국가 코드', type: 'text', help: 'ISO-2. 예: SG, CN, US, JP' },
      { name: 'country_label_en', label: '국가 표기 (영어)', type: 'text', help: '예: Singapore, China, United States' },
      { name: 'country_label_zh', label: '국가 표기 (중국어)', type: 'text' },
      { name: 'procedure_id', label: '시술', type: 'fk', table: 'procedures' },
      { name: 'concern_id', label: '고민', type: 'fk', table: 'concerns' },
      { name: 'treatment_label_en', label: '시술 표기 (영어)', type: 'text', help: '예: "HIFU Lifting", "Acne Scar Consultation"' },
      { name: 'treatment_label_zh', label: '시술 표기 (중국어)', type: 'text' },
      { name: 'outcome', label: '결과', type: 'select', options: FEED_OUT_OPTS, optionLabels: FEED_OUT_LABELS,
        help: '진행 단계. \"matched\" 가 가장 흔함.' },
      { name: 'outcome_note_en', label: '결과 메모 (영어)', type: 'text', help: '예: "matched with 3 clinics"' },
      { name: 'outcome_note_zh', label: '결과 메모 (중국어)', type: 'text' },
      { name: 'is_visible', label: '노출', type: 'bool', default: true, group: '플래그',
        help: '체크 해제하면 메인 ticker 에서 즉시 숨김.' },
      { name: 'is_seed', label: '운영자 시드', type: 'bool', default: true, help: '운영자가 직접 만든 entry 면 체크.' },
      { name: 'priority', label: '우선순위', type: 'number', default: 0, help: '높을수록 먼저 노출. 보통 0.' },
      { name: 'displayed_at', label: '노출 시각', type: 'datetime', help: '"N분 전" 계산 기준.' },
      { name: 'expires_at', label: '만료 시각', type: 'datetime', help: '비워두면 영구. 시간 지나면 자동 숨김.' },
    ],
  },

  // ===================================================================
  // concern_procedures
  // ===================================================================
  concern_procedures: {
    titleField: 'concern_id',
    listLabel: '고민↔시술 매트릭스',
    listIntro: '\"이 고민에는 이 시술이 잘 맞는다\" 매핑. 수기 큐레이션 — 매칭 품질이 여기서 결정됩니다.',
    pkFields: ['concern_id', 'procedure_id'],
    list: ['concern_id', 'procedure_id', 'relevance'],
    cols: [
      { name: 'concern_id', label: '고민', type: 'fk', table: 'concerns', required: true },
      { name: 'procedure_id', label: '시술', type: 'fk', table: 'procedures', required: true },
      { name: 'relevance', label: '관련도', type: 'select', options: RELEV_OPTS, optionLabels: RELEV_LABELS, required: true, default: 'primary' },
      { name: 'rationale_ko', label: '추천 이유 (한국어)', type: 'textarea', help: '왜 이 시술이 이 고민에 맞는지 한 줄. 매칭 결과 카드에 노출될 수 있음.' },
      { name: 'rationale_en', label: '추천 이유 (영어)',  type: 'textarea' },
    ],
  },
};

export function getSpec(kind) {
  return SPECS[kind] || null;
}

export function getKindLabel(kind) {
  return KINDS.find((k) => k.kind === kind)?.label || kind;
}

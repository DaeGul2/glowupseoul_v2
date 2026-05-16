// 운영 매뉴얼 — 처음부터 DB 채울 때 순서. xlsx 로 저장해서 운영팀 공유.
// 출력: docs/data_seeding_order.xlsx
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'docs', 'data_seeding_order.xlsx');

// ─────────────────────────────────────────────────────────────────────
// Sheet 1: 단계별 순서 (요약)
// ─────────────────────────────────────────────────────────────────────
const STEPS = [
  // Phase 0 · 인프라
  { phase: 'Phase 0 · 인프라', step: 0,  task: 'AWS RDS MySQL 인스턴스 생성 (서울 ap-northeast-2)', who: '운영팀',  depends_on: '—',                 admin_menu: '—',              command_or_url: 'AWS 콘솔 → RDS', notes: 'MySQL 8.x, 마스터 비번 정함, 퍼블릭 액세스 ON' },
  { phase: 'Phase 0 · 인프라', step: 0,  task: 'Security Group inbound: 3306 / 0.0.0.0/0',          who: '운영팀',  depends_on: 'RDS',               admin_menu: '—',              command_or_url: 'AWS 콘솔 → EC2 → SG', notes: 'dev 만. 운영 진입 전 IP 좁히기.' },
  { phase: 'Phase 0 · 인프라', step: 0,  task: 'server/.env 채움',                                   who: '개발팀',  depends_on: 'RDS endpoint',      admin_menu: '—',              command_or_url: 'server/.env',          notes: 'DB_HOST · DB_PASSWORD · ADMIN_KEY · AWS_* · OPENAI_API_KEY' },
  { phase: 'Phase 0 · 인프라', step: 0,  task: 'DB 연결 확인',                                       who: '개발팀',  depends_on: '.env',              admin_menu: '—',              command_or_url: 'node scripts/db-ping.js', notes: '✓ TCP+TLS+auth ok 메시지 확인' },
  { phase: 'Phase 0 · 인프라', step: 0,  task: '스키마 + lookup 시드 적용',                          who: '개발팀',  depends_on: 'DB 연결',           admin_menu: '—',              command_or_url: 'npm run db:migrate',   notes: 'mechanisms 30 + procedure_categories 8 자동 시드' },
  { phase: 'Phase 0 · 인프라', step: 0,  task: 'doctors / ba_photos 테이블 확장',                    who: '개발팀',  depends_on: '스키마',            admin_menu: '—',              command_or_url: 'npm run db:extend',    notes: 'idempotent. 재실행 안전.' },
  { phase: 'Phase 0 · 인프라', step: 0,  task: '서버 시작',                                          who: '개발팀',  depends_on: '스키마',            admin_menu: '—',              command_or_url: 'npm run dev (server)', notes: '부팅 로그에 라우트 + db.ok=true 확인' },
  { phase: 'Phase 0 · 인프라', step: 0,  task: '/admin 로그인',                                      who: '운영팀',  depends_on: '서버',              admin_menu: '/admin/login',  command_or_url: 'ADMIN_KEY 입력',      notes: '대시보드 진입. counts 전부 0 이 정상.' },

  // Phase 1 · 카탈로그 토대
  { phase: 'Phase 1 · 카탈로그 토대', step: 1, task: '고민 (concerns)',         who: '운영팀', depends_on: '—',                       admin_menu: '/admin/concerns',           command_or_url: '+ 새로 만들기', notes: '외국 환자 키워드 (sagging / wrinkles / acne_scars …). 권장 20~30개.' },
  { phase: 'Phase 1 · 카탈로그 토대', step: 2, task: '카테고리 이미지',          who: '운영팀', depends_on: 'migrate(시드됨)',          admin_menu: '/admin/procedure_categories', command_or_url: '8개 행 클릭 → thumbnail_url + hero_image_url 업로드', notes: '홈 카테고리 카드가 비어보이지 않게.' },
  { phase: 'Phase 1 · 카탈로그 토대', step: 3, task: '시술 (procedures)',        who: '운영팀', depends_on: 'categories',              admin_menu: '/admin/procedures',         command_or_url: '+ 새로 만들기', notes: 'category 선택, mechanism / body_area / domain 필수. 인기 10개 먼저.' },
  { phase: 'Phase 1 · 카탈로그 토대', step: 4, task: '고민 ↔ 시술 매트릭스',     who: '운영팀', depends_on: 'concerns + procedures',   admin_menu: '/admin/concern_procedures', command_or_url: '고민 카드 → + 시술 추가', notes: '매칭 품질이 여기 달려있음. 한 고민당 2~3개 매핑. 90~150건.' },

  // Phase 2 · 병원 + 부속
  { phase: 'Phase 2 · 병원',         step: 5, task: '병원 (hospitals) + 브랜드 정보', who: '운영팀', depends_on: '—',                  admin_menu: '/admin/hospitals',          command_or_url: '+ 새로 만들기',  notes: '브랜드 필드 자동 upsert. contract_status = active 로 설정해야 사이트 노출.' },
  { phase: 'Phase 2 · 병원',         step: 6, task: '의사 (doctors)',                 who: '운영팀', depends_on: 'hospital 저장됨',     admin_menu: '병원 편집 내 패널',          command_or_url: '+ 의사 추가',     notes: 'portrait 클릭 업로드. 대표 의사 토글.' },
  { phase: 'Phase 2 · 병원',         step: 7, task: '병원×시술 가격표',                who: '운영팀', depends_on: 'procedures + hospital', admin_menu: '병원 편집 내 패널',          command_or_url: '+ 시술 추가',     notes: '시술 선택 + 시작 가격 + 장비. 한 병원당 보통 10~30개.' },
  { phase: 'Phase 2 · 병원',         step: 8, task: 'B&A (전후사진)',                 who: '운영팀', depends_on: 'hospital(+procedure)', admin_menu: '병원 편집 내 패널',          command_or_url: '+ B&A 추가',      notes: 'before/after 동시 업로드. ⚠ 환자 서면 동의 체크 필수.' },

  // Phase 3 · 메인 페이지 활성화
  { phase: 'Phase 3 · 메인 활성화',  step: 9,  task: '실시간 피드 시드',  who: '운영팀', depends_on: 'procedures',                admin_menu: '/admin/public_feed_entries', command_or_url: '+ 새로 만들기',   notes: '운영자 시드 5~10건. 메인 ticker 부트스트랩. is_seed=true.' },
  { phase: 'Phase 3 · 메인 활성화',  step: 10, task: 'SEO 자산 (이미지)', who: '개발팀', depends_on: '—',                         admin_menu: '—',                          command_or_url: 'client/public/{og-cover.jpg, favicon.svg, apple-touch-icon.png}', notes: '1200×630 / 180×180. 운영 도메인 + Search Console 제출 전 준비.' },

  // Phase 4 · 운영
  { phase: 'Phase 4 · 운영',         step: 11, task: 'users / match_requests / public_feed (실 환자)', who: '자동',   depends_on: '환자 스캔', admin_menu: '—', command_or_url: '/api/match-requests', notes: '스캔 완료 시 자동. 옵트인 시 public_feed_entries 자동 append.' },
  { phase: 'Phase 4 · 운영',         step: 12, task: '파트너 신청서 처리',          who: '운영팀', depends_on: '신청 들어옴',        admin_menu: '/admin/partners',  command_or_url: '신청서 열기 → 승인',  notes: '승인 시 brand + hospital + hospital_procedures 자동 INSERT. contract_status=pending 으로. active 로 별도 변경 필요.' },
];

// ─────────────────────────────────────────────────────────────────────
// Sheet 2: 컬럼 의존성 그래프
// ─────────────────────────────────────────────────────────────────────
const DEPENDENCIES = [
  { table: 'mechanisms',           depends_on: '(없음)',                                                          seeded_by: 'migrate (자동)' },
  { table: 'procedure_categories', depends_on: '(self) parent_id (옵션)',                                          seeded_by: 'migrate (자동)' },
  { table: 'brands',               depends_on: '(없음)',                                                          seeded_by: 'hospitals 저장 시 자동 upsert' },
  { table: 'hospitals',            depends_on: 'brands(brand_id)',                                                 seeded_by: 'admin/hospitals (수기)' },
  { table: 'procedures',           depends_on: 'procedure_categories(category_id)',                                seeded_by: 'admin/procedures (수기)' },
  { table: 'concerns',             depends_on: '(없음)',                                                          seeded_by: 'admin/concerns (수기)' },
  { table: 'concern_procedures',   depends_on: 'concerns(concern_id) + procedures(procedure_id)',                  seeded_by: 'admin/concern_procedures (수기)' },
  { table: 'doctors',              depends_on: 'hospitals(hospital_id) + brands(brand_id 옵션)',                   seeded_by: '병원 편집 내 패널' },
  { table: 'hospital_procedures',  depends_on: 'hospitals + procedures',                                            seeded_by: '병원 편집 내 패널' },
  { table: 'ba_photos',            depends_on: 'hospitals + procedures(옵션) + doctors(옵션)',                       seeded_by: '병원 편집 내 패널' },
  { table: 'public_feed_entries',  depends_on: 'procedures(옵션) + concerns(옵션)',                                  seeded_by: 'admin/public_feed_entries + 실 환자 자동' },
  { table: 'users',                depends_on: '(없음)',                                                          seeded_by: '환자 로그인 (현재 미구현)' },
  { table: 'match_requests',       depends_on: 'users(옵션)',                                                       seeded_by: '환자 스캔 자동' },
  { table: 'inquiries',            depends_on: 'match_requests + hospitals + procedures + users',                   seeded_by: 'WhatsApp 핸드오프 후 운영자 수기 (Phase 2)' },
  { table: 'quotes',               depends_on: 'inquiries',                                                         seeded_by: '병원 견적 후 운영자 수기' },
  { table: 'trips',                depends_on: 'users',                                                             seeded_by: '예약 확정 시' },
  { table: 'consultations',        depends_on: 'users + trips(옵션)',                                                seeded_by: '예약 후' },
  { table: 'post_op_checkins',     depends_on: 'trips',                                                             seeded_by: 'D+1/D+7/D+30 자동 스케줄' },
];

// ─────────────────────────────────────────────────────────────────────
// Sheet 3: 모델별 필수 입력 필드 (운영자 체크리스트)
// ─────────────────────────────────────────────────────────────────────
const REQUIRED_FIELDS = [
  // concerns
  { table: 'concerns', field: 'slug',          required: '필수', example: 'sagging',       note: 'URL 식별자. 영문 + _' },
  { table: 'concerns', field: 'name_ko',       required: '필수', example: '처짐',          note: '' },
  { table: 'concerns', field: 'name_en',       required: '필수', example: 'sagging',       note: '' },
  { table: 'concerns', field: 'body_area',     required: '필수', example: 'face',          note: 'face/body/skin/hair/dental' },

  // procedure_categories (시드됨 — 이미지만)
  { table: 'procedure_categories', field: 'thumbnail_url',  required: '권장', example: 'S3 자동',      note: '홈 카테고리 카드' },
  { table: 'procedure_categories', field: 'hero_image_url', required: '권장', example: 'S3 자동',      note: '/category/face 페이지 hero' },

  // procedures
  { table: 'procedures', field: 'slug',          required: '필수', example: 'hifu_face',           note: '한 번 정하면 변경 X' },
  { table: 'procedures', field: 'name_ko',       required: '필수', example: 'HIFU 얼굴 리프팅',    note: '' },
  { table: 'procedures', field: 'name_en',       required: '권장', example: 'HIFU Face Lifting',  note: '영문 SEO 키워드' },
  { table: 'procedures', field: 'category_id',   required: '필수', example: '얼굴 (콤보박스)',     note: 'FkPicker' },
  { table: 'procedures', field: 'mechanism',     required: '필수', example: 'hifu, rf',            note: '작용 기전 슬러그 콤마' },
  { table: 'procedures', field: 'domain',        required: '필수', example: 'face_aesthetic',     note: '6가지 enum' },
  { table: 'procedures', field: 'body_area',     required: '필수', example: 'face, neck',          note: '부위 슬러그 콤마' },
  { table: 'procedures', field: 'description_*', required: '권장', example: '시술 원리 2~3문장',   note: '4개국어 동시 권장' },
  { table: 'procedures', field: 'pain_level',    required: '권장', example: '3',                   note: '1~5' },
  { table: 'procedures', field: 'downtime_days', required: '권장', example: '0~21',                note: '평균 회복일' },
  { table: 'procedures', field: 'thumbnail_url', required: '권장', example: 'S3 자동',             note: '카테고리 카드' },
  { table: 'procedures', field: 'hero_image_url',required: '권장', example: 'S3 자동',             note: '시술 상세 hero' },

  // concern_procedures
  { table: 'concern_procedures', field: 'concern_id',   required: '필수', example: '처짐 (콤보)',     note: 'FkPicker' },
  { table: 'concern_procedures', field: 'procedure_id', required: '필수', example: 'HIFU (콤보)',     note: 'FkPicker' },
  { table: 'concern_procedures', field: 'relevance',    required: '필수', example: 'primary',         note: 'primary/secondary/adjunct' },
  { table: 'concern_procedures', field: 'rationale_ko', required: '권장', example: '왜 이 시술이 잘 맞는지 한 줄', note: '' },

  // hospitals
  { table: 'hospitals', field: 'slug',                       required: '필수', example: 'hershe_청담점',           note: '한 번 정하면 변경 X' },
  { table: 'hospitals', field: 'name_ko',                    required: '필수', example: 'Hershe 성형외과',          note: '간판명' },
  { table: 'hospitals', field: 'city / district',            required: '필수', example: '서울 / 강남구',            note: '' },
  { table: 'hospitals', field: 'brand_name_ko',              required: '권장', example: 'Hershe',                  note: '자동 brand upsert' },
  { table: 'hospitals', field: 'brand_logo_url',             required: '권장', example: 'S3 자동',                  note: '로고 PNG' },
  { table: 'hospitals', field: 'languages_supported',        required: '필수', example: 'ko, en, zh',              note: '' },
  { table: 'hospitals', field: 'contract_status',            required: '필수', example: 'active',                   note: '⚠ active 가 아니면 사이트 미노출' },
  { table: 'hospitals', field: 'thumbnail_url',              required: '권장', example: 'S3 자동',                  note: '비교 카드' },
  { table: 'hospitals', field: 'hero_image_url',             required: '권장', example: 'S3 자동',                  note: '상세 페이지 hero' },
  { table: 'hospitals', field: 'gallery_urls',               required: '선택', example: '시설 5~10장',              note: '외관/대기실/진료실' },
  { table: 'hospitals', field: 'phone / wechat / whatsapp',  required: '권장', example: '02-3445-1331',            note: '연락 채널 최소 1개' },
  { table: 'hospitals', field: 'safety_claim',               required: '권장', example: '50개국 4만명 무사고',      note: '외국 환자 신뢰 시그널' },

  // doctors
  { table: 'doctors', field: 'slug',             required: '필수', example: 'dr_3_kim_mintae', note: '자동 생성됨' },
  { table: 'doctors', field: 'hospital_id',      required: '필수', example: '병원 (콤보)',     note: 'FkPicker' },
  { table: 'doctors', field: 'name_ko',          required: '필수', example: '김민태',           note: '' },
  { table: 'doctors', field: 'title_ko',         required: '권장', example: '원장',             note: '직책' },
  { table: 'doctors', field: 'years_experience', required: '권장', example: '15',               note: '경력 (년)' },
  { table: 'doctors', field: 'portrait_url',     required: '권장', example: 'S3 자동',          note: '정면 사진' },
  { table: 'doctors', field: 'specialties',      required: '권장', example: 'rhinoplasty, …',   note: '' },
  { table: 'doctors', field: 'is_featured',      required: '선택', example: 'true',             note: '대표 의사 (병원당 1)' },

  // hospital_procedures
  { table: 'hospital_procedures', field: 'hospital_id',         required: '필수', example: '병원 (콤보)',  note: '' },
  { table: 'hospital_procedures', field: 'procedure_id',        required: '필수', example: '시술 (콤보)',  note: '' },
  { table: 'hospital_procedures', field: 'starting_price_krw',  required: '권장', example: '390000',       note: '비공개면 비워둠 + price_disclosed=false' },
  { table: 'hospital_procedures', field: 'device_brands',       required: '권장', example: 'Shurink, Ulthera', note: '' },
  { table: 'hospital_procedures', field: 'is_signature',        required: '선택', example: 'true',         note: '병원이 대표로 미는 시술' },

  // ba_photos
  { table: 'ba_photos', field: 'hospital_id',     required: '필수', example: '병원 (콤보)',     note: '' },
  { table: 'ba_photos', field: 'procedure_id',    required: '권장', example: '시술 (콤보)',     note: '미지정 가능' },
  { table: 'ba_photos', field: 'before_url',      required: '필수', example: 'S3 자동',          note: '' },
  { table: 'ba_photos', field: 'after_url',       required: '필수', example: 'S3 자동',          note: 'before 와 같은 각도/조명' },
  { table: 'ba_photos', field: 'consent_signed',  required: '필수', example: 'true',             note: '⚠ 동의서 없으면 절대 X' },
  { table: 'ba_photos', field: 'visibility',      required: '필수', example: 'logged_in',        note: 'public 은 신중히' },

  // public_feed_entries
  { table: 'public_feed_entries', field: 'source_type',         required: '필수', example: 'seed',           note: '운영자 시드' },
  { table: 'public_feed_entries', field: 'display_initial',     required: '필수', example: 'M.',             note: '1자 + 점' },
  { table: 'public_feed_entries', field: 'country_code',        required: '권장', example: 'SG',             note: 'ISO-2' },
  { table: 'public_feed_entries', field: 'treatment_label_en',  required: '권장', example: 'HIFU Lifting',   note: 'ticker 표기' },
  { table: 'public_feed_entries', field: 'outcome',             required: '권장', example: 'matched',        note: '' },
  { table: 'public_feed_entries', field: 'is_visible',          required: '필수', example: 'true',           note: '체크 해제하면 즉시 숨김' },
];

// ─────────────────────────────────────────────────────────────────────
// Sheet 4: 핵심 룰 (자주 빠뜨리는 함정)
// ─────────────────────────────────────────────────────────────────────
const RULES = [
  { rule: '순서 절대 어기지 마세요',                       why: 'concerns/procedures/hospitals 가 후속 작업의 전제. 매트릭스/병원 편집 패널 못 씀.' },
  { rule: 'slug 는 한 번 정하면 변경 X',                    why: 'URL · S3 폴더 · 외부 링크 모두 깨짐.' },
  { rule: '병원 contract_status = "active" 강제 확인',      why: 'active 아니면 사이트/매칭 모두 미노출. 가장 흔한 함정 1순위.' },
  { rule: 'B&A 환자 서면 동의 없이는 절대 등록 X',          why: 'PIPA 위반 위험. 플랫폼 신뢰성 파괴.' },
  { rule: '사진은 권장이지만 최소 thumbnail 은 채울 것',    why: '비어있으면 카드가 회색 박스. 사용자 이탈.' },
  { rule: '파트너 신청 승인 후 contract_status 수동 변경', why: '자동 등록은 항상 pending. active 로 안 바꾸면 매칭 노출 안 됨.' },
  { rule: '매트릭스는 운영 품질의 핵심',                    why: '추천 결과의 80%가 concern_procedures 에 달려있음. 수기 큐레이션.' },
];

// ─────────────────────────────────────────────────────────────────────
// Write workbook
// ─────────────────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

function addSheet(name, rows, colWidths) {
  const ws = XLSX.utils.json_to_sheet(rows);
  if (colWidths) ws['!cols'] = colWidths.map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, name);
}

addSheet('1. 단계별 순서',     STEPS,           [20, 6, 32, 8, 28, 28, 32, 50]);
addSheet('2. 테이블 의존성',   DEPENDENCIES,    [22, 56, 40]);
addSheet('3. 필수 입력 필드',  REQUIRED_FIELDS, [22, 26, 8, 28, 50]);
addSheet('4. 핵심 룰',         RULES,           [40, 70]);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
XLSX.writeFile(wb, OUT);
console.log(`✓ wrote ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);

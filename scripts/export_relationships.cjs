// 메커니즘 · 기기 · 시술 의 관계를 비개발자(운영자)도 알아볼 수 있게 정리한 xlsx.
// 출력: docs/db_relationships.xlsx
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'docs', 'db_relationships.xlsx');

// ────────────────────────────────────────────────────────────────────
// 공통 — AOA 시트 생성기
// ────────────────────────────────────────────────────────────────────
function makeSheet({ title, intro, columns, rows, colWidths, rowHeights }) {
  const cols = columns.length;
  const aoa = [];

  aoa.push([title, ...Array(cols - 1).fill('')]);
  aoa.push([intro,  ...Array(cols - 1).fill('')]);
  aoa.push(Array(cols).fill(''));
  aoa.push(columns);
  for (const r of rows) aoa.push(r);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: cols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: cols - 1 } },
  ];
  ws['!cols'] = (colWidths || []).map((w) => ({ wch: w }));
  ws['!rows'] = [{ hpt: 22 }, { hpt: 50 }, { hpt: 6 }, { hpt: 22 }, ...(rowHeights || [])];
  return ws;
}

// ────────────────────────────────────────────────────────────────────
// Sheet 0 · 📘 한 줄 핵심
// ────────────────────────────────────────────────────────────────────
const GUIDE_ROWS = [
  ['📘 메커니즘 · 기기 · 시술 — 한 화면에 정리'],
  [''],
  ['셋의 차이 한 줄'],
  ['  · 메커니즘 = 작용 원리 (의사 용어).   예: hifu (집속초음파), rf (고주파), botox (근육 마비)'],
  ['  · 기기     = 상품 브랜드 (환자가 부름). 예: Ulthera, Shurink, Thermage FLX, 쥬비덤'],
  ['  · 시술     = 환자가 예약하는 서비스.   예: HIFU 얼굴 리프팅 (부위·횟수·가격이 붙음)'],
  [''],
  ['비유로 외우기'],
  ['  · 음악 장르 (메커니즘) — 가수 (기기) — 노래 (시술)'],
  ['  · "발라드 듣고싶어" → "아이유 노래로" → "Through the Night 들어볼게"'],
  ['  · "HIFU 받고싶어"   → "Ulthera 가 좋다더라" → "Ulthera 600샷 HIFU 얼굴 리프팅 어디서 가장 싸?"'],
  [''],
  ['관계 한 그림'],
  ['     메커니즘 (hifu)                                                  '],
  ['        │                                                             '],
  ['        ├─ 기기   Ulthera ─┐                                          '],
  ['        │       Shurink   │ ─── 같은 원리, 다른 브랜드                '],
  ['        │       Liftera   │                                           '],
  ['        │       Doublo   ─┘                                           '],
  ['        │                                                             '],
  ['        └─ 시술   HIFU 얼굴 리프팅 ─┐                                 '],
  ['              HIFU 목 리프팅   │ ── 같은 원리, 다른 부위               '],
  ['              HIFU 바디        ─┘                                     '],
  ['                                  │                                   '],
  ['                                  └─ 이 시술을 어느 기기로 하는지는    '],
  ['                                     병원이 선택 (Hershe = Ulthera,    '],
  ['                                     우아 = Shurink ...)               '],
  [''],
  ['DB 테이블'],
  ['  · mechanisms          — 메커니즘 lookup. PK = slug. 이미 시드됨.'],
  ['  · devices             — 기기. PK = id, UNIQUE = slug. 메커니즘 1개를 FK 로 참조.'],
  ['  · procedures          — 시술 본질. PK = id, UNIQUE = slug. 메커니즘은 JSON 배열로 들고있음.'],
  ['  · procedure_devices   — 시술 ↔ 기기 매트릭스 (M:N).'],
  ['  · hospital_procedures — 병원 ↔ 시술 매트릭스 (M:N). 가격·장비 여기서.'],
  [''],
  ['이 파일 시트 안내'],
  ['  · 1. 세 개의 차이      — 메커니즘 / 기기 / 시술 비교표'],
  ['  · 2. 실제 묶임 예시    — HIFU 한 케이스로 셋이 어떻게 연결되는지'],
  ['  · 3. 카디널리티 + FK   — 어떤 관계를 1:N / M:N / JSON / 조인 테이블 중 무엇으로 풀었나'],
  ['  · 4. 환자 흐름         — 환자 머릿속에서 셋이 어떻게 진행되는지'],
  ['  · 5. 결정 휴리스틱     — 다음번 새 관계 만들 때 어느 패턴 쓸지'],
];

function makeGuideSheet() {
  const ws = XLSX.utils.aoa_to_sheet(GUIDE_ROWS);
  ws['!cols'] = [{ wch: 90 }];
  ws['!rows'] = GUIDE_ROWS.map((_, i) => ({ hpt: i === 0 ? 26 : 18 }));
  return ws;
}

// ────────────────────────────────────────────────────────────────────
// Sheet 1 · 세 개의 차이 (비교표)
// ────────────────────────────────────────────────────────────────────
const DIFF_SHEET = makeSheet({
  title:    '1. 메커니즘 · 기기 · 시술 — 비교표',
  intro:    '세 단어가 헷갈릴 때 이 표 한 장 보세요. 각 항목이 셋 중 어디에 속하는지 알면 데이터 입력할 때 혼동 안 합니다.',
  columns:  ['질문', '메커니즘', '기기', '시술'],
  colWidths: [30, 26, 30, 36],
  rows: [
    ['무엇이냐?',                   '작용 원리 (어떻게 작동하는지)', '상품 브랜드 (그 원리를 구현한 장비)', '환자가 예약하는 서비스 (부위·횟수·가격이 붙는 단위)'],
    ['누가 부르는 이름이냐?',         '의사 / 논문',                  '환자 / 마케팅',                       '병원 메뉴판'],
    ['예 1',                         'hifu',                          'Ulthera (울쎄라)',                    'HIFU 얼굴 리프팅'],
    ['예 2',                         'rf',                            'Thermage FLX (써마지)',               '써마지 FLX'],
    ['예 3',                         'botox',                         'Botox (Allergan), 나보타',            '사각턱 보톡스 / 주름 보톡스'],
    ['예 4',                         'filler_ha',                     'Juvederm (쥬비덤), Restylane',        '볼 필러 / 입술 필러'],
    ['DB 테이블',                    'mechanisms',                    'devices',                             'procedures'],
    ['PK',                           'slug (영문 ID)',                'id (자동 증가) + slug',                'id + slug'],
    ['보통 몇 개?',                  '약 30개 (고정)',                '약 20~40개 (브랜드 추가될 때마다)',    '약 30~100개 (시술 라인업 늘 때마다)'],
    ['가격 정보 있나?',              '없음',                          '없음 (장비 자체 가격은 운영 메타)',     '시세 범위만 (실 가격은 hospital_procedures)'],
    ['부위 정보 있나?',              '없음',                          '없음',                                 '있음 (body_area JSON 배열)'],
    ['병원이 직접 보유하나?',        '아니오',                        '간접 (병원이 그 장비를 들여놓음)',     '간접 (병원 메뉴에 등록 = hospital_procedures)'],
    ['환자가 검색하는 단위?',        '드물게',                        '자주 ("울쎄라 받고싶어")',              '가장 자주 ("얼굴 리프팅 해줘")'],
    ['관리 주체',                    '플랫폼 (시드, 안 바뀜)',         '플랫폼 (브랜드 메타 관리)',           '플랫폼 (시술 정의) + 병원 (제공 여부·가격)'],
  ],
  rowHeights: Array(14).fill({ hpt: 34 }),
});

// ────────────────────────────────────────────────────────────────────
// Sheet 2 · 실제 묶임 예시 (HIFU 한 케이스)
// ────────────────────────────────────────────────────────────────────
const LINK_SHEET = makeSheet({
  title:    '2. 한 케이스로 보는 셋의 연결 — HIFU',
  intro:    '"HIFU" 메커니즘 하나가 어떻게 여러 기기·시술·병원으로 펼쳐지는지. 같은 색의 행이 같은 그룹(메커니즘 1개 → 기기 N → 시술 N → 병원 N).',
  columns:  ['메커니즘 (mechanisms.slug)', '기기 (devices.slug)', '시술 (procedures.slug)', '병원 (hospitals.slug)', '병원 가격표 (hospital_procedures)'],
  colWidths: [22, 22, 30, 28, 42],
  rows: [
    ['hifu (집속초음파)', 'ulthera (울쎄라)',    'hifu_face (HIFU 얼굴 리프팅)', 'hershe_청담점',        'Ulthera 600샷 · ₩390,000'],
    ['hifu',              'ulthera',             'hifu_face',                    'woona_강남점',         'Ulthera Prime 600샷 · ₩520,000'],
    ['hifu',              'shurink (슈링크)',    'hifu_face',                    'sooyeon_강남점',       'Shurink 900샷 · ₩290,000 (이벤트)'],
    ['hifu',              'shurink',             'hifu_face',                    'noselip_강남점',       'Shurink Universe 600샷 · ₩320,000'],
    ['hifu',              'liftera (리프테라)',  'hifu_face',                    'riencheong_강남점',    'Liftera A 1500샷 · ₩410,000'],
    ['hifu',              'doublo (더블로)',     'hifu_face',                    'jokin_부산점',         'Doublo Gold 600샷 · ₩250,000'],
    ['hifu',              'ulthera',             'hifu_neck (HIFU 목 리프팅)',    'hershe_청담점',        'Ulthera 300샷 · ₩290,000'],
    ['hifu',              'shurink',             'hifu_body (HIFU 바디)',         'celora_강남점',        'Shurink Universe 바디 · ₩590,000'],
    ['', '', '', '', ''],
    ['─ 이 표가 보여주는 것 ─', '', '', '', ''],
    ['• 같은 메커니즘(hifu)에 4개 기기 (Ulthera/Shurink/Liftera/Doublo)', '', '', '', ''],
    ['• 같은 기기(Ulthera)가 여러 시술(hifu_face, hifu_neck)에 쓰임', '', '', '', ''],
    ['• 같은 시술(hifu_face)을 여러 병원이 — 각자 다른 기기로 — 다른 가격에 제공', '', '', '', ''],
    ['• 그래서 매트릭스 두 개가 필요함:', '', '', '', ''],
    ['    · procedure_devices   = "이 시술은 어느 기기로 가능?" (= 카탈로그 본질)', '', '', '', ''],
    ['    · hospital_procedures = "이 병원이 이 시술을 이 기기로 이 가격에" (= 실 운영)', '', '', '', ''],
  ],
  rowHeights: Array(16).fill({ hpt: 22 }),
});

// ────────────────────────────────────────────────────────────────────
// Sheet 3 · 카디널리티 + FK 패턴
// ────────────────────────────────────────────────────────────────────
const CARD_SHEET = makeSheet({
  title:    '3. 누가 누구를 몇 개 가질 수 있나 (카디널리티) + 어떻게 FK 로 풀었나',
  intro:    '관계마다 푸는 패턴이 다릅니다. 1:N 은 단순 FK 컬럼. M:N 인데 작으면 JSON. M:N 인데 부가 정보 있으면 조인 테이블. 우리 스키마 세 가지 다 씀.',
  columns:  ['관계', '카디널리티', '왜 그런가', '우리가 푼 방법', 'DB 객체', 'FK 강제 누가?'],
  colWidths: [22, 14, 38, 28, 30, 14],
  rows: [
    ['메커니즘 → 기기',        '1 : N',
      '기기 1개 = 메커니즘 1개를 구현 (Ulthera 는 HIFU 만). 같은 메커니즘에 여러 기기 가능.',
      'FK 컬럼',
      'devices.mechanism_slug → mechanisms.slug, ON DELETE SET NULL',
      'DB'],
    ['메커니즘 ↔ 시술',        'M : N',
      '한 시술이 여러 메커니즘 사용 가능 (InMode = RF + EM). 한 메커니즘이 여러 시술에 쓰임.',
      'JSON 배열',
      'procedures.mechanism (JSON, slug 들 모음). 별도 조인 테이블 없음.',
      'app'],
    ['시술 ↔ 기기',             'M : N + 의미 풍부',
      '같은 시술 여러 기기 옵션 (HIFU 얼굴 = Ulthera or Shurink). 쌍마다 관계 정보 (primary/alternative/compatible).',
      '조인 테이블',
      'procedure_devices (PK: procedure_id+device_id, FK 양쪽, CASCADE)',
      'DB'],
    ['병원 ↔ 시술',             'M : N + 의미 풍부',
      '같은 시술 여러 병원, 한 병원 여러 시술. 쌍마다 가격·이벤트·장비 다름.',
      '조인 테이블',
      'hospital_procedures (PK: id, UNIQUE: hospital_id+procedure_id, FK 양쪽)',
      'DB'],
    ['(병원 × 시술) ↔ 기기',     '3-way M:N',
      '"Hershe 가 HIFU 얼굴 할 때 쓰는 장비" — Hershe 에선 Ulthera, 우아에선 Shurink.',
      'JSON 배열 (Phase 1 단순화)',
      'hospital_procedures.device_brands (JSON 문자열 배열). Phase 2 에서 정규화 후보.',
      'app'],
  ],
  rowHeights: Array(5).fill({ hpt: 48 }),
});

// ────────────────────────────────────────────────────────────────────
// Sheet 4 · 환자 흐름
// ────────────────────────────────────────────────────────────────────
const FLOW_SHEET = makeSheet({
  title:    '4. 환자 흐름 — 셋이 어떻게 연쇄적으로 좁혀지는지',
  intro:    '환자가 검색·진입할 때 셋 중 하나로 들어와서, 자연스럽게 다른 두 축으로 좁혀집니다. 우리 사이트는 모든 진입 축을 지원해야 함.',
  columns:  ['단계', '환자가 머릿속에 가진 단어', '축', '우리 사이트의 진입점', '다음으로 좁혀지는 것'],
  colWidths: [6, 36, 16, 30, 36],
  rows: [
    ['①', '"내 얼굴이 처져 보여" / "주름 있어"',                  '고민 (concern)',    '/category/face · 스캔 모달',          '관련 시술 추천 (concern_procedures 매트릭스)'],
    ['②', '"HIFU 받고싶어" / "리프팅"',                           '메커니즘',          '(시술 페이지 필터)',                   '그 메커니즘의 시술 + 기기 옵션'],
    ['③', '"Ulthera 가 검증됐다더라" / "슈링크 가성비"',          '기기',              '/device/ulthera',                      '그 기기로 가능한 시술 + 쓰는 병원'],
    ['④', '"HIFU 얼굴 리프팅 어디서?"',                            '시술',              '/treatment/hifu_face',                 '시술 제공 병원 비교 (가격·장비·이벤트)'],
    ['⑤', '"Hershe 가 좋아 보여"',                                  '병원',              '/clinic/hershe_청담점',                '병원 상세 + WhatsApp 상담'],
    ['', '', '', '', ''],
    ['─ 우리 사이트가 모든 축을 받아주는 이유 ─', '', '', '', ''],
    ['• 외국 환자는 다양한 인지 수준으로 들어옴.', '', '', '', ''],
    ['• 강남언니식 "써마지 vs 슈링크" 비교는 한국인 가정.', '', '', '', ''],
    ['• 우리는 고민 → 메커니즘 → 기기 → 시술 → 병원 → 상담 어디로든 진입 가능해야.', '', '', '', ''],
  ],
  rowHeights: [...Array(5).fill({ hpt: 32 }), ...Array(5).fill({ hpt: 18 })],
});

// ────────────────────────────────────────────────────────────────────
// Sheet 5 · 결정 휴리스틱
// ────────────────────────────────────────────────────────────────────
const HEUR_SHEET = makeSheet({
  title:    '5. 결정 휴리스틱 — 새 관계 만들 때 어느 패턴 쓸까',
  intro:    '다음에 새 엔티티 추가할 때 (예: 의사 ↔ 전문 시술), 이 표 보고 결정하세요. 우리 스키마는 세 가지 패턴 다 씁니다.',
  columns:  ['이런 상황이면', '쓰는 패턴', '구체적 모양', '왜', '우리 스키마에서의 예'],
  colWidths: [40, 16, 36, 38, 30],
  rows: [
    ['1:N 이고 자식에서 부모만 lookup',
      'FK 컬럼',
      '자식 테이블에 부모 PK 를 외래키 컬럼으로 박음',
      '가장 단순. JOIN 인덱스 충분. 추가 메타 없음.',
      'devices.mechanism_slug → mechanisms.slug'],
    ['M:N 인데 보통 작은 배열 + 쌍에 부가 속성 없음',
      'JSON 배열',
      '한쪽 테이블에 JSON 컬럼으로 상대 slug 들 모음',
      '조인 테이블 오버헤드 회피. 한 방향 조회 압도적일 때 유리.',
      'procedures.mechanism JSON · hospitals.languages_supported JSON'],
    ['M:N + 쌍마다 속성 있음 (관련도·노트·순서 등)',
      '조인 테이블',
      '두 FK 로 composite PK 만들고 부가 컬럼 추가',
      '정규화 + 양방향 조회 효율 + 매트릭스 UI 자연스러움.',
      'procedure_devices · concern_procedures · hospital_procedures'],
    ['M:N 이고 양쪽 추가 메타가 양쪽 어디에도 안 어울리는 경우',
      '독립 엔티티 (조인 + ID PK)',
      'PK 를 자체 id 로 두고 두 FK 는 unique 인덱스',
      'hp 자체에 더 많은 관계(quotes, inquiries)가 붙을 때.',
      'hospital_procedures (id PK, hospital_id+procedure_id UNIQUE)'],
    ['3-way 관계 (A × B × C)',
      '우선 JSON, 트래픽 커지면 정규화',
      'B-side 의 JSON 배열로 C 의 식별자 담아두기',
      'Phase 1 단순화. 양방향 빠른 조회 필요해지면 3-way 조인.',
      'hospital_procedures.device_brands JSON → 향후 hospital_procedure_devices'],
    ['이미 시드된 lookup (잘 안 바뀜)',
      '슬러그 PK',
      'PK 를 자동증가 id 가 아니라 문자열 slug 로',
      'URL 안정성. SQL 에서 의미 가독성.',
      'mechanisms (PK = slug)'],
    ['', '', '', '', ''],
    ['─ 안 권장 ─', '', '', '', ''],
    ['M:N 을 JSON 양쪽에 중복 저장 (양쪽 다 상대 slug 배열)',
      '❌',
      'A.b_slugs JSON + B.a_slugs JSON',
      '동기화 책임이 app 으로 옴 → 깨지기 쉬움. 한쪽만 JSON 이거나 조인 테이블로.',
      '(우린 안 함)'],
    ['1:N 인데 부모를 자식 안에 JSON 으로 박음',
      '❌',
      'child.parent_obj JSON',
      'FK 강제 불가, 부모 update 시 동기화 X. 그냥 parent_id 컬럼 쓰세요.',
      '(우린 안 함)'],
  ],
  rowHeights: [
    { hpt: 40 }, { hpt: 40 }, { hpt: 40 }, { hpt: 40 }, { hpt: 40 },
    { hpt: 32 }, { hpt: 6 }, { hpt: 18 }, { hpt: 40 }, { hpt: 40 },
  ],
});

// ────────────────────────────────────────────────────────────────────
// Write workbook
// ────────────────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, makeGuideSheet(), '📘 핵심');
XLSX.utils.book_append_sheet(wb, DIFF_SHEET,       '1. 세 개의 차이');
XLSX.utils.book_append_sheet(wb, LINK_SHEET,       '2. HIFU 케이스');
XLSX.utils.book_append_sheet(wb, CARD_SHEET,       '3. 카디널리티 + FK');
XLSX.utils.book_append_sheet(wb, FLOW_SHEET,       '4. 환자 흐름');
XLSX.utils.book_append_sheet(wb, HEUR_SHEET,       '5. 결정 휴리스틱');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
XLSX.writeFile(wb, OUT);
console.log(`✓ wrote ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
console.log('  sheets: 📘 핵심 / 1. 세 개의 차이 / 2. HIFU 케이스 / 3. 카디널리티 + FK / 4. 환자 흐름 / 5. 결정 휴리스틱');

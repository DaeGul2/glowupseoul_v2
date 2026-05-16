// 비개발자(운영자)용 — 병원 빼고 미리 채워둘 수 있는 씨드 예시.
// 컬럼명은 한국어 + 각 시트 상단에 가이드. 두루뭉술한 예시 몇 개씩만.
// 출력: docs/seed_examples.xlsx
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'docs', 'seed_examples.xlsx');

// ────────────────────────────────────────────────────────────────────
// 공통 유틸 — AOA(2차원 배열) 로 시트 만들기. 다중 헤더 + merge + 색 가능.
// ────────────────────────────────────────────────────────────────────
function makeSheet({ title, intro, columns, examples }) {
  // 구조:
  //   row 1: 시트 제목 (merge)
  //   row 2: 안내 (merge)
  //   row 3: (빈 줄)
  //   row 4: 한국어 컬럼명
  //   row 5: 입력 가이드/타입 (예: "필수 · 영문 + _", "1~5 정수", "콤마로 여러 개")
  //   row 6+: 예시 데이터
  const colCount = columns.length;
  const aoa = [];

  // 1. 제목
  aoa.push([title, ...Array(colCount - 1).fill('')]);
  // 2. 안내
  aoa.push([intro, ...Array(colCount - 1).fill('')]);
  // 3. 빈 줄
  aoa.push(Array(colCount).fill(''));
  // 4. 한국어 컬럼명
  aoa.push(columns.map((c) => c.label));
  // 5. 가이드
  aoa.push(columns.map((c) => c.hint));
  // 6+ 예시
  for (const ex of examples) {
    aoa.push(columns.map((c) => (ex[c.key] === undefined || ex[c.key] === null ? '' : String(ex[c.key]))));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // merge 제목·안내 한 줄씩
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
  ];

  // 열 너비
  ws['!cols'] = columns.map((c) => ({ wch: c.width || 16 }));

  // 행 높이 (안내 행 좀 더 높게)
  ws['!rows'] = [
    { hpt: 22 }, // 제목
    { hpt: 60 }, // 안내 (줄바꿈 표시되게)
    { hpt: 6 },  // 빈 줄
    { hpt: 22 }, // 컬럼명
    { hpt: 36 }, // 가이드
  ];

  // 셀 스타일 (XLSX 의 cellStyles 는 community build 제한 — 그냥 wrapText 만 시도)
  // 줄바꿈을 위해 안내·가이드 셀에 alignment 지정
  const wrap = { alignment: { wrapText: true, vertical: 'top' } };
  for (let c = 0; c < colCount; c += 1) {
    const headerHint = XLSX.utils.encode_cell({ r: 4, c });
    if (ws[headerHint]) ws[headerHint].s = wrap;
  }
  const introCell = XLSX.utils.encode_cell({ r: 1, c: 0 });
  if (ws[introCell]) ws[introCell].s = wrap;

  return ws;
}

// ────────────────────────────────────────────────────────────────────
// Sheet 0 · 📘 가이드
// ────────────────────────────────────────────────────────────────────
const GUIDE_ROWS = [
  ['📘 시드 입력 가이드 — 병원 제외'],
  [''],
  ['이 파일은 무엇인가?'],
  ['  · 실제 병원 데이터를 채우기 전에, 카탈로그 토대(고민·시술·매트릭스)를 먼저 두루뭉술하게 채워두기 위한 양식입니다.'],
  ['  · 나중에 병원이 결정되면 hospital ↔ procedure 로 자연스럽게 join 됩니다.'],
  [''],
  ['입력 순서 (의존성 그래프)'],
  ['  ① 시술 카테고리   ← 이미 8개 시드됨. 이미지(thumbnail) 채우기만.'],
  ['  ② 메커니즘        ← 이미 30개 시드됨. 추가하려면 여기에.'],
  ['  ③ 고민(concern)   ← 외국 환자 검색 키워드. 20~30개.'],
  ['  ④ 시술(procedure) ← 30~50개. ②③ 가 있어야 매끄럽게 작성.'],
  ['  ⑤ 고민 ↔ 시술 매트릭스 ← ③④ 끝난 뒤. 매칭 품질의 80% 가 여기에 달림.'],
  [''],
  ['컬럼 읽는 법'],
  ['  · 4번째 행 = 한국어 컬럼명'],
  ['  · 5번째 행 = 입력 가이드 (필수/권장/선택 · 타입 · 예시)'],
  ['  · 6번째 행부터 = 예시 데이터'],
  [''],
  ['공통 룰'],
  ['  · "URL 식별자(slug)" 는 영문 소문자 + 숫자 + _ 만. 한 번 정하면 절대 변경 X.'],
  ['  · 콤마로 여러 개 = 쉼표(,) 로 구분. 따옴표 X. 예: "face, neck"'],
  ['  · 영문/중문/일문 이름은 권장이지만, 한국어만 있어도 일단 등록 가능.'],
  ['  · 가격은 모두 KRW(원). 만원 단위 X. 100,000 = 10만원.'],
  ['  · 모르는 컬럼은 비워두세요. 나중에 admin 페이지에서 추가 입력 가능.'],
  [''],
  ['이 파일을 어디에 쓰나'],
  ['  · 이 양식 그대로 한 행씩 채워서, /admin/<해당 메뉴> 에서 "+ 새로 만들기" 로 옮겨 적습니다.'],
  ['  · 추후 일괄 import 스크립트가 추가될 수 있습니다 (server/scripts/seed-from-xlsx.js).'],
  [''],
  ['시트 목록'],
  ['  · 1. 시술 카테고리 — 8개 (이미 DB 에 있음, 이미지만)'],
  ['  · 2. 메커니즘      — 시술 작용 원리 (이미 30개 시드, 추가 양식)'],
  ['  · 3. 고민          — 환자 검색 키워드 20개 예시'],
  ['  · 4. 시술          — 다양한 시술 30개 예시'],
  ['  · 5. 고민↔시술     — 매칭 매트릭스 매핑 50+ 예시'],
  ['  · 6. 기기          — 장비 브랜드 (Ulthera·Shurink 등) — ⚠ DB 테이블 아직 없음, 추가 예정'],
  ['  · 7. 시술↔기기     — 같은 시술도 여러 장비 선택지가 있음 (HIFU = Ulthera or Shurink …)'],
  [''],
  ['"메커니즘 vs 기기 vs 시술" 헷갈리지 마세요'],
  ['  · 메커니즘 = 작용 원리 (의사 용어).        예: hifu (집속초음파), rf (고주파)'],
  ['  · 기기     = 그 원리를 구현한 상품 브랜드. 예: Ulthera, Shurink, Thermage FLX'],
  ['  · 시술     = 환자가 예약하는 서비스 단위.  예: "HIFU 얼굴 리프팅" (부위·횟수·가격이 붙음)'],
  ['  · 관계: 메커니즘 1 ─ 기기 N · 메커니즘 1 ─ 시술 N · 시술 1 ─ 기기 N (같은 시술도 장비 선택지가 여러 개)'],
];

function makeGuideSheet() {
  const ws = XLSX.utils.aoa_to_sheet(GUIDE_ROWS);
  ws['!cols'] = [{ wch: 90 }];
  ws['!rows'] = GUIDE_ROWS.map((_, i) => ({ hpt: i === 0 ? 26 : 18 }));
  return ws;
}

// ────────────────────────────────────────────────────────────────────
// Sheet 1 · 시술 카테고리 (procedure_categories)
// ────────────────────────────────────────────────────────────────────
const CATEGORY_COLUMNS = [
  { key: 'slug',          label: 'URL 식별자',      hint: '필수 · 영문 소문자 + _ · 변경 X · 예: face',           width: 14 },
  { key: 'name_ko',       label: '카테고리명 (한국어)', hint: '필수 · 홈/카테고리 페이지에 표시',                    width: 16 },
  { key: 'name_en',       label: '카테고리명 (영어)',   hint: '필수 · 외국 환자 1순위 UI',                          width: 18 },
  { key: 'name_zh',       label: '카테고리명 (중국어)', hint: '권장 · 중국 80% 타깃',                              width: 16 },
  { key: 'name_ja',       label: '카테고리명 (일본어)', hint: '선택 · 일본 시장 진입 시',                          width: 16 },
  { key: 'domain',        label: '도메인',          hint: '필수 · face_aesthetic / body_contouring / regenerative / surgical / derm_medical / dental', width: 18 },
  { key: 'display_order', label: '표시 순서',       hint: '권장 · 작은 숫자가 먼저. 빈 칸이면 알아서 정렬.',         width: 10 },
  { key: 'thumbnail_url', label: '썸네일 이미지 URL', hint: '권장 · 비어있으면 회색 박스. S3 자동 업로드 후 채워짐.', width: 26 },
  { key: 'hero_image_url',label: 'hero 이미지 URL',  hint: '권장 · 카테고리 페이지 상단 큰 배경.',                   width: 26 },
];
const CATEGORY_EXAMPLES = [
  { slug: 'face',     name_ko: '얼굴',     name_en: 'Face',                    name_zh: '面部',     name_ja: 'フェイス', domain: 'face_aesthetic',  display_order: 1 },
  { slug: 'eyes',     name_ko: '눈',       name_en: 'Eyes',                    name_zh: '眼部',     name_ja: '目',       domain: 'surgical',        display_order: 2 },
  { slug: 'nose',     name_ko: '코',       name_en: 'Nose',                    name_zh: '鼻部',     name_ja: '鼻',       domain: 'surgical',        display_order: 3 },
  { slug: 'body',     name_ko: '바디',     name_en: 'Body',                    name_zh: '身体',     name_ja: 'ボディ',   domain: 'body_contouring', display_order: 4 },
  { slug: 'skin',     name_ko: '피부',     name_en: 'Skin',                    name_zh: '皮肤',     name_ja: '肌',       domain: 'derm_medical',    display_order: 5 },
  { slug: 'hair',     name_ko: '헤어·두피', name_en: 'Hair & Scalp',            name_zh: '头发与头皮', name_ja: '髪・頭皮', domain: 'surgical',        display_order: 6 },
  { slug: 'wellness', name_ko: '재생·웰니스', name_en: 'Wellness & Regenerative', name_zh: '健康再生', name_ja: 'ウェルネス', domain: 'regenerative',    display_order: 7 },
  { slug: 'dental',   name_ko: '치과',     name_en: 'Dental',                  name_zh: '牙科',     name_ja: '歯科',     domain: 'dental',          display_order: 8 },
];

// ────────────────────────────────────────────────────────────────────
// Sheet 2 · 메커니즘 (mechanisms)
// ────────────────────────────────────────────────────────────────────
const MECHANISM_COLUMNS = [
  { key: 'slug',           label: 'URL 식별자',     hint: '필수 · 영문 + _ · 변경 X · 예: hifu',                       width: 14 },
  { key: 'label_ko',       label: '메커니즘명 (한국어)', hint: '필수 · 환자에게 보이는 이름. 예: HIFU 초음파',           width: 18 },
  { key: 'label_en',       label: '메커니즘명 (영어)',   hint: '필수 · 예: HIFU',                                       width: 16 },
  { key: 'label_zh',       label: '메커니즘명 (중국어)', hint: '권장',                                                  width: 16 },
  { key: 'label_ja',       label: '메커니즘명 (일본어)', hint: '선택',                                                  width: 16 },
  { key: 'description_ko', label: '작용 원리 (한국어)', hint: '권장 · 한 줄. 환자가 읽고 "아 이런 원리구나" 정도.',     width: 36 },
  { key: 'domain',         label: '도메인',         hint: '필수 · face_aesthetic / body_contouring / regenerative / surgical / derm_medical / dental', width: 18 },
  { key: 'display_order',  label: '표시 순서',      hint: '권장 · 작은 숫자가 먼저',                                  width: 10 },
];
const MECHANISM_EXAMPLES = [
  { slug: 'hifu',         label_ko: 'HIFU 초음파',      label_en: 'HIFU',                  label_zh: 'HIFU超声',  label_ja: 'HIFU超音波',         description_ko: '집속초음파로 SMAS 층 자극',         domain: 'face_aesthetic',  display_order: 1 },
  { slug: 'rf',           label_ko: '고주파 RF',        label_en: 'Radiofrequency',        label_zh: '射频',      label_ja: 'ラジオ波',           description_ko: '진피층 가열로 콜라겐 수축',         domain: 'face_aesthetic',  display_order: 2 },
  { slug: 'laser_pico',   label_ko: '피코 레이저',       label_en: 'Pico Laser',           label_zh: '皮秒激光',   label_ja: 'ピコレーザー',       description_ko: '색소 분해용 초단펄스 레이저',       domain: 'derm_medical',    display_order: 3 },
  { slug: 'laser_co2',    label_ko: 'CO2 프락셔널',     label_en: 'CO2 Fractional',        label_zh: 'CO2点阵',   label_ja: 'CO2フラクショナル',   description_ko: '피부 재생용 분획 레이저',           domain: 'derm_medical',    display_order: 4 },
  { slug: 'botox',        label_ko: '보톡스',           label_en: 'Botulinum Toxin',       label_zh: '肉毒素',     label_ja: 'ボトックス',         description_ko: '근육 수축 차단',                    domain: 'face_aesthetic',  display_order: 5 },
  { slug: 'filler_ha',    label_ko: '히알루론산 필러',   label_en: 'HA Filler',             label_zh: '玻尿酸',     label_ja: 'ヒアルロン酸',       description_ko: '볼륨 보충',                         domain: 'face_aesthetic',  display_order: 6 },
  { slug: 'thread_lift',  label_ko: '실리프팅',         label_en: 'Thread Lift',           label_zh: '埋线提升',   label_ja: 'スレッドリフト',     description_ko: 'PDO/PLLA 실 삽입 리프팅',           domain: 'face_aesthetic',  display_order: 7 },
  { slug: 'skinbooster',  label_ko: '스킨부스터',       label_en: 'Skinbooster',           label_zh: '水光针',     label_ja: 'スキンブースター',   description_ko: '진피 보습/재생 주사',               domain: 'face_aesthetic',  display_order: 8 },
  { slug: 'stem_cell',    label_ko: '줄기세포',         label_en: 'Stem Cell',             label_zh: '干细胞',     label_ja: '幹細胞',             description_ko: '재생 세포 치료',                    domain: 'regenerative',    display_order: 9 },
  { slug: 'exosome',      label_ko: '엑소좀',           label_en: 'Exosome',               label_zh: '外泌体',     label_ja: 'エクソソーム',       description_ko: '세포외 소포 재생',                  domain: 'regenerative',    display_order: 10 },
  { slug: 'surgery',      label_ko: '수술',             label_en: 'Surgery',               label_zh: '手术',       label_ja: '手術',               description_ko: '절개/봉합 외과 시술',               domain: 'surgical',        display_order: 11 },
  { slug: 'em_muscle',    label_ko: '근육 자극',        label_en: 'EM Stimulation',        label_zh: '电磁刺激',   label_ja: '筋肉刺激',           description_ko: '전자기 근육 수축',                  domain: 'body_contouring', display_order: 12 },
  { slug: 'cryolipo',     label_ko: '냉동 지방분해',    label_en: 'Cryolipolysis',         label_zh: '冷冻溶脂',   label_ja: '冷却脂肪溶解',       description_ko: '냉각으로 지방세포 사멸',            domain: 'body_contouring', display_order: 13 },
  { slug: 'implant',      label_ko: '치과 임플란트',    label_en: 'Implant',               label_zh: '种植',       label_ja: 'インプラント',       description_ko: '치아 인공 식립',                    domain: 'dental',          display_order: 14 },
  { slug: 'orthodontic',  label_ko: '치아 교정',        label_en: 'Orthodontic',           label_zh: '正畸',       label_ja: '矯正',               description_ko: '치열 교정 (브라켓/투명)',            domain: 'dental',          display_order: 15 },
];

// ────────────────────────────────────────────────────────────────────
// Sheet 3 · 고민 (concerns)
// ────────────────────────────────────────────────────────────────────
const CONCERN_COLUMNS = [
  { key: 'slug',           label: 'URL 식별자',          hint: '필수 · 영문 + _ · 변경 X · 예: sagging',                  width: 16 },
  { key: 'name_ko',        label: '고민명 (한국어)',     hint: '필수 · 환자 톤 (의학 용어 X). 예: 처짐·리프팅',          width: 18 },
  { key: 'name_en',        label: '고민명 (영어)',       hint: '필수 · 검색 키워드 톤. 예: Sagging / Lifting',           width: 22 },
  { key: 'name_zh',        label: '고민명 (중국어)',     hint: '권장 · 예: 松弛',                                       width: 14 },
  { key: 'name_ja',        label: '고민명 (일본어)',     hint: '선택',                                                   width: 14 },
  { key: 'body_area',      label: '관련 부위',           hint: '필수 · face / body / skin / hair / dental 중 하나',     width: 12 },
  { key: 'description_ko', label: '설명 (한국어, 환자 톤)', hint: '권장 · 한 줄. "이런 증상이라면 이 고민" 정도.',         width: 36 },
  { key: 'description_en', label: '설명 (영어)',         hint: '권장 · 외국 환자 mental model 맞게',                     width: 36 },
  { key: 'display_order',  label: '표시 순서',           hint: '권장 · 인기 고민 먼저 (작은 숫자)',                       width: 10 },
];
const CONCERN_EXAMPLES = [
  { slug: 'sagging',       name_ko: '처짐·리프팅',     name_en: 'Sagging / Lifting',   name_zh: '松弛',       name_ja: 'たるみ',        body_area: 'face',   description_ko: '얼굴 윤곽이 처지고 탄력이 떨어졌다고 느낄 때',                      description_en: 'Loss of facial contour and elasticity',                  display_order: 1 },
  { slug: 'wrinkles',      name_ko: '주름',           name_en: 'Wrinkles',            name_zh: '皱纹',       name_ja: 'シワ',          body_area: 'face',   description_ko: '눈가·이마·미간 등 주름이 신경 쓰일 때',                            description_en: 'Lines around eyes, forehead, glabella',                  display_order: 2 },
  { slug: 'volume_loss',   name_ko: '볼륨 손실',      name_en: 'Volume Loss',         name_zh: '凹陷',       name_ja: 'ボリューム不足', body_area: 'face',   description_ko: '볼이 꺼지고 푸석해진 느낌',                                       description_en: 'Hollow cheeks, gaunt look',                              display_order: 3 },
  { slug: 'jawline',       name_ko: '턱선',           name_en: 'Jawline Definition',  name_zh: '下颌线',     name_ja: 'フェイスライン', body_area: 'face',   description_ko: '턱 아래 살이 늘어져 V라인이 무너졌을 때',                          description_en: 'Loss of sharp jawline contour',                          display_order: 4 },
  { slug: 'face_size',     name_ko: '얼굴 축소',      name_en: 'Face Slimming',       name_zh: '瘦脸',       name_ja: '小顔',          body_area: 'face',   description_ko: '얼굴이 크거나 사각턱이 도드라질 때',                              description_en: 'Wide/square face, prominent masseter',                   display_order: 5 },
  { slug: 'cheekbones',    name_ko: '광대',           name_en: 'Cheekbone Reduction', name_zh: '颧骨',       name_ja: '頬骨',          body_area: 'face',   description_ko: '광대가 도드라져 인상이 강해 보일 때',                              description_en: 'Prominent zygomatic bones',                              display_order: 6 },
  { slug: 'pores',         name_ko: '모공',           name_en: 'Pores',               name_zh: '毛孔',       name_ja: '毛穴',          body_area: 'skin',   description_ko: '모공이 크고 눈에 띌 때',                                          description_en: 'Enlarged or visible pores',                              display_order: 7 },
  { slug: 'skin_tone',     name_ko: '피부톤',         name_en: 'Skin Tone',           name_zh: '肤色',       name_ja: '肌トーン',      body_area: 'skin',   description_ko: '피부가 칙칙하거나 톤이 고르지 않을 때',                            description_en: 'Dull or uneven complexion',                              display_order: 8 },
  { slug: 'pigmentation',  name_ko: '잡티·색소',      name_en: 'Pigmentation',        name_zh: '色斑',       name_ja: 'シミ',          body_area: 'skin',   description_ko: '기미·잡티·점이 신경 쓰일 때',                                     description_en: 'Melasma, sun spots, freckles',                           display_order: 9 },
  { slug: 'acne_scars',    name_ko: '여드름 흉터',    name_en: 'Acne Scars',          name_zh: '痘印',       name_ja: 'ニキビ跡',      body_area: 'skin',   description_ko: '여드름 자국·움푹 팬 흉터',                                       description_en: 'Pitted scars, post-acne marks',                          display_order: 10 },
  { slug: 'acne_active',   name_ko: '여드름 (현재)',  name_en: 'Active Acne',         name_zh: '痘痘',       name_ja: 'ニキビ',        body_area: 'skin',   description_ko: '지금 트러블이 올라오고 있을 때',                                  description_en: 'Currently breaking out',                                 display_order: 11 },
  { slug: 'dark_circles',  name_ko: '다크서클',       name_en: 'Dark Circles',        name_zh: '黑眼圈',     name_ja: 'クマ',          body_area: 'face',   description_ko: '눈 밑이 어둡거나 꺼졌을 때',                                      description_en: 'Dark or hollow under-eye area',                          display_order: 12 },
  { slug: 'eye_shape',     name_ko: '쌍커풀·눈매',    name_en: 'Eyelid / Eye Shape',  name_zh: '双眼皮',     name_ja: '二重',          body_area: 'face',   description_ko: '쌍커풀·앞트임·뒤트임 등 눈매 자체를 바꾸고 싶을 때',                 description_en: 'Wanting to reshape eyelids (double, canthoplasty)',     display_order: 13 },
  { slug: 'nose_shape',    name_ko: '코 모양',        name_en: 'Nose Shape',          name_zh: '鼻形',       name_ja: '鼻の形',        body_area: 'face',   description_ko: '낮은 코·휜 코·매부리코 등',                                      description_en: 'Low bridge, deviated, hump',                             display_order: 14 },
  { slug: 'lip_shape',     name_ko: '입술 모양',      name_en: 'Lip Shape',           name_zh: '唇形',       name_ja: '唇の形',        body_area: 'face',   description_ko: '입술 볼륨·라인 보강',                                            description_en: 'Lip volume or shape enhancement',                        display_order: 15 },
  { slug: 'body_contour',  name_ko: '바디라인',       name_en: 'Body Contour',        name_zh: '身材',       name_ja: 'ボディライン',  body_area: 'body',   description_ko: '전반적인 몸매 라인 정리',                                        description_en: 'Overall body contour',                                   display_order: 16 },
  { slug: 'fat_local',     name_ko: '부분 지방',      name_en: 'Localized Fat',       name_zh: '局部脂肪',   name_ja: '部分痩せ',      body_area: 'body',   description_ko: '복부·허벅지 등 부분 지방',                                        description_en: 'Stubborn local fat pockets',                             display_order: 17 },
  { slug: 'hair_loss',     name_ko: '탈모',           name_en: 'Hair Loss',           name_zh: '脱发',       name_ja: '薄毛',          body_area: 'hair',   description_ko: '머리숱이 줄거나 정수리/M자 라인이 신경 쓰일 때',                     description_en: 'Thinning hair, receding line',                           display_order: 18 },
  { slug: 'aging_overall', name_ko: '전반 노화',      name_en: 'Overall Aging',       name_zh: '整体衰老',   name_ja: '全体エイジング', body_area: 'face',   description_ko: '특정 부위보다 전반적인 노화 사인이 신경 쓰일 때',                    description_en: 'General signs of aging',                                 display_order: 19 },
  { slug: 'dental_align',  name_ko: '치아 정렬',      name_en: 'Teeth Alignment',     name_zh: '牙齿矫正',   name_ja: '歯列矯正',      body_area: 'dental', description_ko: '치아가 고르지 않을 때',                                          description_en: 'Crooked or misaligned teeth',                            display_order: 20 },
];

// ────────────────────────────────────────────────────────────────────
// Sheet 4 · 시술 (procedures)
// ────────────────────────────────────────────────────────────────────
const PROCEDURE_COLUMNS = [
  { key: 'slug',                label: 'URL 식별자',         hint: '필수 · 영문 + _ · 변경 X · 예: hifu_face',                                                width: 18 },
  { key: 'name_ko',             label: '시술명 (한국어)',     hint: '필수 · 예: HIFU 얼굴 리프팅',                                                            width: 22 },
  { key: 'name_en',             label: '시술명 (영어)',       hint: '권장 · 외국 환자 SEO 키워드',                                                            width: 22 },
  { key: 'name_zh',             label: '시술명 (중국어)',     hint: '권장',                                                                                   width: 16 },
  { key: 'name_ja',             label: '시술명 (일본어)',     hint: '선택',                                                                                   width: 16 },
  { key: 'category_slug',       label: '카테고리',            hint: '필수 · 카테고리 시트의 slug 하나. 예: face',                                             width: 12 },
  { key: 'mechanism',           label: '작용 기전',          hint: '필수 · 메커니즘 시트의 slug. 복수 가능 (콤마). 예: hifu, rf',                            width: 18 },
  { key: 'domain',              label: '도메인',             hint: '필수 · face_aesthetic / body_contouring / regenerative / surgical / derm_medical / dental', width: 18 },
  { key: 'body_area',           label: '부위 (콤마)',         hint: '필수 · face, neck, body, skin, hair, dental, eye, nose, lip, jaw 등',                   width: 18 },
  { key: 'description_ko',      label: '설명 (한국어)',       hint: '권장 · 시술 원리 2~3문장. 환자가 읽기 쉽게.',                                            width: 40 },
  { key: 'description_en',      label: '설명 (영어)',         hint: '권장',                                                                                   width: 40 },
  { key: 'pain_level',          label: '통증 (1~5)',          hint: '권장 · 1=거의 없음, 5=강한 통증',                                                       width: 10 },
  { key: 'intensity',           label: '강도',               hint: '권장 · subtle / moderate / dramatic',                                                    width: 12 },
  { key: 'downtime_days',       label: '다운타임 (일)',      hint: '권장 · 평균 회복일. 0 = 당일 일상 복귀',                                                 width: 12 },
  { key: 'result_onset',        label: '효과 시점',          hint: '권장 · immediate (즉시) / gradual (점진적)',                                            width: 12 },
  { key: 'result_duration',     label: '효과 지속',          hint: '권장 · temporary / months / years / permanent',                                          width: 12 },
  { key: 'typical_sessions',    label: '일반 세션 수',       hint: '권장 · 보통 몇 회 필요한지. 예: 1',                                                     width: 10 },
  { key: 'is_surgical',         label: '수술 여부',          hint: '필수 · TRUE / FALSE',                                                                    width: 10 },
  { key: 'anesthesia_typical',  label: '마취',              hint: '선택 · topical / local / sedation / general / none',                                     width: 12 },
  { key: 'market_price_min',    label: '시세 최소 (원)',     hint: '권장 · KRW 정수. 예: 350000 = 35만원',                                                   width: 14 },
  { key: 'market_price_max',    label: '시세 최대 (원)',     hint: '권장 · KRW 정수',                                                                       width: 14 },
  { key: 'price_unit',          label: '가격 단위 (텍스트)',  hint: '선택 · 예: 회당, 1cc, 1세션',                                                            width: 12 },
  { key: 'unit_type',           label: '단위 종류',          hint: '선택 · shots / cc / sessions / area / flat',                                            width: 10 },
  { key: 'common_units',        label: '일반 단위 (콤마)',   hint: '선택 · 자주 묶이는 회수/cc. 예: 300, 600, 900',                                          width: 14 },
  { key: 'device_examples',     label: '예시 장비 (콤마)',   hint: '권장 · 자주 쓰이는 장비 브랜드. 예: Ulthera, Shurink',                                   width: 22 },
  { key: 'tags',                label: '태그 (콤마)',        hint: '선택 · 검색용. 예: 리프팅, 노화, SMAS',                                                  width: 22 },
];
const PROCEDURE_EXAMPLES = [
  // FACE / 리프팅
  { slug: 'hifu_face',          name_ko: 'HIFU 얼굴 리프팅',         name_en: 'HIFU Face Lifting',      name_zh: 'HIFU面部提升', name_ja: 'HIFU顔リフト',
    category_slug: 'face', mechanism: 'hifu', domain: 'face_aesthetic', body_area: 'face, neck',
    description_ko: '집속초음파로 SMAS 층까지 자극해 콜라겐 재생을 유도하는 비절개 리프팅.',
    description_en: 'Non-invasive lifting via focused ultrasound targeting the SMAS layer.',
    pain_level: 3, intensity: 'moderate', downtime_days: 0, result_onset: 'gradual', result_duration: 'months', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'topical',
    market_price_min: 350000, market_price_max: 2500000, price_unit: '회당', unit_type: 'shots', common_units: '300, 600, 900',
    device_examples: 'Ulthera, Shurink, Liftera', tags: '리프팅, 노화, SMAS, 비절개' },
  { slug: 'rf_thermage',        name_ko: '써마지 FLX',              name_en: 'Thermage FLX',           name_zh: 'Thermage FLX', name_ja: 'サーマクール FLX',
    category_slug: 'face', mechanism: 'rf', domain: 'face_aesthetic', body_area: 'face, neck',
    description_ko: '단극성 고주파로 진피층을 가열, 콜라겐 수축으로 탄력 회복.',
    description_en: 'Monopolar RF heats the dermis to contract collagen and restore elasticity.',
    pain_level: 4, intensity: 'moderate', downtime_days: 0, result_onset: 'gradual', result_duration: 'years', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'topical',
    market_price_min: 800000, market_price_max: 3500000, price_unit: '회당', unit_type: 'shots', common_units: '600, 900, 1200',
    device_examples: 'Thermage FLX, Thermage CPT', tags: '리프팅, 탄력, RF' },
  { slug: 'inmode_face',        name_ko: '인모드 (얼굴)',           name_en: 'InMode Face',            name_zh: 'InMode面部',   name_ja: 'インモード顔',
    category_slug: 'face', mechanism: 'rf, em_muscle', domain: 'face_aesthetic', body_area: 'face',
    description_ko: 'RF + 근육 자극 복합 — 지방 감소·탄력·근육 수축 동시.',
    description_en: 'Combined RF + muscle stimulation for fat reduction, tightening, and toning.',
    pain_level: 2, intensity: 'subtle', downtime_days: 0, result_onset: 'gradual', result_duration: 'months', typical_sessions: 4,
    is_surgical: 'FALSE', anesthesia_typical: 'none',
    market_price_min: 200000, market_price_max: 600000, price_unit: '회당', unit_type: 'sessions', common_units: '1, 4, 6',
    device_examples: 'InMode Forma, Morpheus8', tags: '리프팅, 탄력, 지방감소' },
  { slug: 'thread_lift_pdo',    name_ko: '실리프팅 (PDO)',          name_en: 'PDO Thread Lift',        name_zh: 'PDO埋线提升',  name_ja: 'PDOスレッドリフト',
    category_slug: 'face', mechanism: 'thread_lift', domain: 'face_aesthetic', body_area: 'face, neck',
    description_ko: 'PDO 실 삽입으로 즉각 리프팅 + 콜라겐 자극.',
    description_en: 'PDO thread insertion for immediate lift and collagen stimulation.',
    pain_level: 3, intensity: 'moderate', downtime_days: 3, result_onset: 'immediate', result_duration: 'months', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'local',
    market_price_min: 500000, market_price_max: 4000000, price_unit: '회당', unit_type: 'area', common_units: '10, 20, 40',
    device_examples: 'Mint Lift, Ultra V Lift', tags: '리프팅, 실, 즉각' },

  // FACE / 보톡스·필러·부스터
  { slug: 'botox_jaw',          name_ko: '사각턱 보톡스',           name_en: 'Jaw Botox',              name_zh: '瘦脸针',       name_ja: 'エラボトックス',
    category_slug: 'face', mechanism: 'botox', domain: 'face_aesthetic', body_area: 'face',
    description_ko: '교근에 보톡스 주사로 턱 크기 감소.',
    description_en: 'Masseter botox for jaw slimming.',
    pain_level: 2, intensity: 'moderate', downtime_days: 0, result_onset: 'gradual', result_duration: 'months', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'topical',
    market_price_min: 80000, market_price_max: 350000, price_unit: '회당', unit_type: 'flat', common_units: '1',
    device_examples: 'Botox, Dysport, Nabota', tags: '얼굴축소, 사각턱, 보톡스' },
  { slug: 'botox_wrinkle',      name_ko: '주름 보톡스',             name_en: 'Wrinkle Botox',          name_zh: '皱纹肉毒',     name_ja: 'シワボトックス',
    category_slug: 'face', mechanism: 'botox', domain: 'face_aesthetic', body_area: 'face',
    description_ko: '눈가·이마·미간 표정 주름 완화.',
    description_en: 'Smooths dynamic wrinkles on forehead, glabella, and crow\'s feet.',
    pain_level: 1, intensity: 'subtle', downtime_days: 0, result_onset: 'gradual', result_duration: 'months', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'none',
    market_price_min: 50000, market_price_max: 250000, price_unit: '부위당', unit_type: 'area', common_units: '1, 2, 3',
    device_examples: 'Botox, Xeomin', tags: '주름, 보톡스' },
  { slug: 'filler_ha_cheek',    name_ko: '볼 히알루론산 필러',      name_en: 'HA Cheek Filler',        name_zh: '面颊玻尿酸',   name_ja: '頬ヒアルロン酸',
    category_slug: 'face', mechanism: 'filler_ha', domain: 'face_aesthetic', body_area: 'face',
    description_ko: '꺼진 볼·관자놀이에 히알루론산 주입으로 볼륨 회복.',
    description_en: 'HA injection for cheek/temple volume restoration.',
    pain_level: 2, intensity: 'moderate', downtime_days: 1, result_onset: 'immediate', result_duration: 'months', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'topical',
    market_price_min: 300000, market_price_max: 1200000, price_unit: '1cc', unit_type: 'cc', common_units: '1, 2, 3',
    device_examples: 'Juvederm, Restylane, Belotero', tags: '볼륨, 필러' },
  { slug: 'filler_ha_lip',      name_ko: '입술 히알루론산 필러',    name_en: 'HA Lip Filler',          name_zh: '唇玻尿酸',     name_ja: '唇ヒアルロン酸',
    category_slug: 'face', mechanism: 'filler_ha', domain: 'face_aesthetic', body_area: 'lip',
    description_ko: '입술 볼륨·라인 보강.',
    description_en: 'Lip volume and outline enhancement.',
    pain_level: 3, intensity: 'moderate', downtime_days: 2, result_onset: 'immediate', result_duration: 'months', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'topical',
    market_price_min: 250000, market_price_max: 800000, price_unit: '1cc', unit_type: 'cc', common_units: '0.5, 1',
    device_examples: 'Juvederm Volbella, Restylane Kysse', tags: '입술, 볼륨' },
  { slug: 'skinbooster_juvelook', name_ko: '스킨부스터 (쥬베룩)',   name_en: 'Skinbooster (Juvelook)', name_zh: '少女针水光',   name_ja: 'ジュベルック',
    category_slug: 'face', mechanism: 'skinbooster', domain: 'face_aesthetic', body_area: 'face',
    description_ko: 'PDLA + HA 복합 — 진피 재생 + 보습.',
    description_en: 'PDLA + HA blend for dermal regeneration and hydration.',
    pain_level: 3, intensity: 'subtle', downtime_days: 1, result_onset: 'gradual', result_duration: 'months', typical_sessions: 3,
    is_surgical: 'FALSE', anesthesia_typical: 'topical',
    market_price_min: 250000, market_price_max: 600000, price_unit: '회당', unit_type: 'sessions', common_units: '1, 3',
    device_examples: 'Juvelook, Lenisna', tags: '스킨부스터, 재생' },
  { slug: 'skinbooster_rejuran',  name_ko: '스킨부스터 (리쥬란)',   name_en: 'Skinbooster (Rejuran)',  name_zh: '婴儿针',       name_ja: 'リジュラン',
    category_slug: 'face', mechanism: 'skinbooster', domain: 'face_aesthetic', body_area: 'face',
    description_ko: 'PN (연어 DNA) 진피 재생 — 잔주름·모공·탄력.',
    description_en: 'PN (salmon DNA) for fine lines, pores, and elasticity.',
    pain_level: 3, intensity: 'subtle', downtime_days: 1, result_onset: 'gradual', result_duration: 'months', typical_sessions: 3,
    is_surgical: 'FALSE', anesthesia_typical: 'topical',
    market_price_min: 250000, market_price_max: 500000, price_unit: '회당', unit_type: 'sessions', common_units: '1, 3, 5',
    device_examples: 'Rejuran Healer, Rejuran HB', tags: '스킨부스터, 재생, 잔주름' },

  // EYES
  { slug: 'double_eyelid',      name_ko: '쌍커풀 수술',            name_en: 'Double Eyelid Surgery',  name_zh: '双眼皮手术',   name_ja: '二重まぶた手術',
    category_slug: 'eyes', mechanism: 'surgery', domain: 'surgical', body_area: 'eye',
    description_ko: '비절개·부분절개·절개 중 선택. 눈매 형태 영구 변경.',
    description_en: 'Non-incisional, partial, or full incision methods.',
    pain_level: 3, intensity: 'dramatic', downtime_days: 7, result_onset: 'immediate', result_duration: 'permanent', typical_sessions: 1,
    is_surgical: 'TRUE', anesthesia_typical: 'sedation',
    market_price_min: 1500000, market_price_max: 4500000, price_unit: '회당', unit_type: 'flat', common_units: '1',
    device_examples: '', tags: '쌍커풀, 눈, 수술' },
  { slug: 'canthoplasty',       name_ko: '앞·뒤트임',              name_en: 'Canthoplasty',           name_zh: '开眼角',       name_ja: '目頭・目尻切開',
    category_slug: 'eyes', mechanism: 'surgery', domain: 'surgical', body_area: 'eye',
    description_ko: '눈 앞쪽/뒤쪽을 절개해 눈 가로 길이 확장.',
    description_en: 'Incision to widen eye horizontally.',
    pain_level: 3, intensity: 'dramatic', downtime_days: 7, result_onset: 'immediate', result_duration: 'permanent', typical_sessions: 1,
    is_surgical: 'TRUE', anesthesia_typical: 'sedation',
    market_price_min: 1000000, market_price_max: 3000000, price_unit: '회당', unit_type: 'flat', common_units: '1',
    device_examples: '', tags: '트임, 눈, 수술' },
  { slug: 'under_eye_fat',      name_ko: '눈밑 지방 재배치',       name_en: 'Under-eye Fat Reposition', name_zh: '眼袋脂肪重置', name_ja: '目の下脂肪移動',
    category_slug: 'eyes', mechanism: 'surgery', domain: 'surgical', body_area: 'eye',
    description_ko: '눈 밑 지방을 제거·재배치해 다크서클·꺼짐 개선.',
    description_en: 'Removes or repositions under-eye fat to fix bags/hollowing.',
    pain_level: 3, intensity: 'moderate', downtime_days: 7, result_onset: 'immediate', result_duration: 'years', typical_sessions: 1,
    is_surgical: 'TRUE', anesthesia_typical: 'sedation',
    market_price_min: 1500000, market_price_max: 3500000, price_unit: '회당', unit_type: 'flat', common_units: '1',
    device_examples: '', tags: '다크서클, 눈밑, 수술' },

  // NOSE
  { slug: 'rhinoplasty_bridge', name_ko: '코 융비술 (콧대)',       name_en: 'Bridge Rhinoplasty',     name_zh: '隆鼻',         name_ja: '隆鼻術',
    category_slug: 'nose', mechanism: 'surgery', domain: 'surgical', body_area: 'nose',
    description_ko: '콧대 높이·라인 보강. 보형물 또는 자가 연골.',
    description_en: 'Bridge augmentation via implant or autologous cartilage.',
    pain_level: 3, intensity: 'dramatic', downtime_days: 14, result_onset: 'immediate', result_duration: 'permanent', typical_sessions: 1,
    is_surgical: 'TRUE', anesthesia_typical: 'sedation',
    market_price_min: 3000000, market_price_max: 9000000, price_unit: '회당', unit_type: 'flat', common_units: '1',
    device_examples: '실리콘 보형물, 자가 늑연골', tags: '코, 수술' },
  { slug: 'rhinoplasty_tip',    name_ko: '코 끝 성형',             name_en: 'Tip Rhinoplasty',        name_zh: '鼻尖整形',     name_ja: '鼻尖形成',
    category_slug: 'nose', mechanism: 'surgery', domain: 'surgical', body_area: 'nose',
    description_ko: '코끝 모양·각도 정리. 비중격·귀연골 사용.',
    description_en: 'Refines tip shape using septal or ear cartilage.',
    pain_level: 3, intensity: 'moderate', downtime_days: 10, result_onset: 'immediate', result_duration: 'permanent', typical_sessions: 1,
    is_surgical: 'TRUE', anesthesia_typical: 'sedation',
    market_price_min: 2000000, market_price_max: 5500000, price_unit: '회당', unit_type: 'flat', common_units: '1',
    device_examples: '', tags: '코, 수술' },

  // SKIN
  { slug: 'pico_toning',        name_ko: '피코 토닝',              name_en: 'Pico Toning',            name_zh: '皮秒调理',     name_ja: 'ピコトーニング',
    category_slug: 'skin', mechanism: 'laser_pico', domain: 'derm_medical', body_area: 'skin',
    description_ko: '초단펄스로 색소 분해 — 잡티·기미·톤 개선.',
    description_en: 'Ultra-short pulse for pigment fragmentation.',
    pain_level: 2, intensity: 'subtle', downtime_days: 0, result_onset: 'gradual', result_duration: 'months', typical_sessions: 5,
    is_surgical: 'FALSE', anesthesia_typical: 'none',
    market_price_min: 150000, market_price_max: 450000, price_unit: '회당', unit_type: 'sessions', common_units: '1, 5, 10',
    device_examples: 'PicoSure, PicoWay, Discovery Pico', tags: '색소, 톤, 모공' },
  { slug: 'co2_fractional',     name_ko: 'CO2 프락셔널',           name_en: 'CO2 Fractional',         name_zh: 'CO2点阵',      name_ja: 'CO2フラクショナル',
    category_slug: 'skin', mechanism: 'laser_co2', domain: 'derm_medical', body_area: 'skin',
    description_ko: '분획 박피 — 흉터·모공·재생.',
    description_en: 'Fractional ablative resurfacing for scars, pores, regeneration.',
    pain_level: 4, intensity: 'moderate', downtime_days: 5, result_onset: 'gradual', result_duration: 'years', typical_sessions: 2,
    is_surgical: 'FALSE', anesthesia_typical: 'topical',
    market_price_min: 300000, market_price_max: 900000, price_unit: '회당', unit_type: 'sessions', common_units: '1, 3',
    device_examples: 'Lutronic eCO2, Lumenis UltraPulse', tags: '흉터, 모공, 재생' },
  { slug: 'subcision',          label: '서브시전 (흉터)',          name_ko: '서브시전 (흉터 박리)',   name_en: 'Subcision',     name_zh: '皮下分离',     name_ja: 'サブシジョン',
    category_slug: 'skin', mechanism: 'laser_co2', domain: 'derm_medical', body_area: 'skin',
    description_ko: '여드름 흉터의 섬유 유착을 박리해 함몰 흉터 완화.',
    description_en: 'Releases fibrous bands beneath atrophic acne scars.',
    pain_level: 3, intensity: 'moderate', downtime_days: 3, result_onset: 'gradual', result_duration: 'years', typical_sessions: 2,
    is_surgical: 'FALSE', anesthesia_typical: 'local',
    market_price_min: 250000, market_price_max: 700000, price_unit: '회당', unit_type: 'sessions', common_units: '1, 2, 3',
    device_examples: '', tags: '흉터, 여드름' },
  { slug: 'hydra_facial',       name_ko: '하이드라 페이셜',        name_en: 'HydraFacial',            name_zh: '海菲秀',       name_ja: 'ハイドラフェイシャル',
    category_slug: 'skin', mechanism: 'skinbooster', domain: 'derm_medical', body_area: 'skin',
    description_ko: '클렌징·각질·보습 3단계 — 트러블 케어.',
    description_en: '3-step deep cleanse, exfoliation, and hydration.',
    pain_level: 1, intensity: 'subtle', downtime_days: 0, result_onset: 'immediate', result_duration: 'temporary', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'none',
    market_price_min: 100000, market_price_max: 300000, price_unit: '회당', unit_type: 'sessions', common_units: '1',
    device_examples: 'HydraFacial MD', tags: '클렌징, 보습' },

  // BODY
  { slug: 'liposuction_abdomen',name_ko: '복부 지방흡입',          name_en: 'Abdomen Liposuction',    name_zh: '腹部抽脂',     name_ja: '腹部脂肪吸引',
    category_slug: 'body', mechanism: 'surgery', domain: 'body_contouring', body_area: 'body',
    description_ko: '복부 지방을 캐뉼라로 흡입해 라인 정리.',
    description_en: 'Suction-assisted abdominal fat removal.',
    pain_level: 4, intensity: 'dramatic', downtime_days: 14, result_onset: 'immediate', result_duration: 'permanent', typical_sessions: 1,
    is_surgical: 'TRUE', anesthesia_typical: 'general',
    market_price_min: 3000000, market_price_max: 7000000, price_unit: '회당', unit_type: 'flat', common_units: '1',
    device_examples: 'Vaser, MicroAire', tags: '바디, 지방흡입, 수술' },
  { slug: 'coolsculpting',      name_ko: '쿨스컬프팅 (냉동 지방분해)', name_en: 'CoolSculpting',      name_zh: '酷塑',         name_ja: 'クールスカルプティング',
    category_slug: 'body', mechanism: 'cryolipo', domain: 'body_contouring', body_area: 'body',
    description_ko: '냉각으로 지방세포 사멸 — 비절개 부분 지방 감소.',
    description_en: 'Non-invasive fat reduction via controlled cooling.',
    pain_level: 2, intensity: 'moderate', downtime_days: 0, result_onset: 'gradual', result_duration: 'years', typical_sessions: 2,
    is_surgical: 'FALSE', anesthesia_typical: 'none',
    market_price_min: 400000, market_price_max: 1500000, price_unit: '회당', unit_type: 'area', common_units: '1, 2',
    device_examples: 'CoolSculpting Elite', tags: '바디, 지방, 비절개' },
  { slug: 'emsculpt',           name_ko: '엠스컬프트 (근육 자극)',  name_en: 'EMSCULPT',               name_zh: '电磁塑形',     name_ja: 'EMSCULPT',
    category_slug: 'body', mechanism: 'em_muscle', domain: 'body_contouring', body_area: 'body',
    description_ko: '전자기 자극으로 근육 수축 — 톤업·코어 강화.',
    description_en: 'HIFEM-induced muscle contractions for toning and core.',
    pain_level: 2, intensity: 'moderate', downtime_days: 0, result_onset: 'gradual', result_duration: 'months', typical_sessions: 4,
    is_surgical: 'FALSE', anesthesia_typical: 'none',
    market_price_min: 300000, market_price_max: 800000, price_unit: '회당', unit_type: 'sessions', common_units: '4, 6, 8',
    device_examples: 'EMSCULPT NEO', tags: '바디, 근육, 톤업' },

  // HAIR
  { slug: 'hair_transplant',    name_ko: '모발 이식',              name_en: 'Hair Transplant',        name_zh: '植发',         name_ja: '植毛',
    category_slug: 'hair', mechanism: 'surgery', domain: 'surgical', body_area: 'hair, scalp',
    description_ko: 'FUE/FUT 모낭 단위 이식 — M자/정수리/이마 라인.',
    description_en: 'FUE/FUT follicular unit transplantation.',
    pain_level: 3, intensity: 'dramatic', downtime_days: 7, result_onset: 'gradual', result_duration: 'permanent', typical_sessions: 1,
    is_surgical: 'TRUE', anesthesia_typical: 'local',
    market_price_min: 2000000, market_price_max: 12000000, price_unit: '모낭당', unit_type: 'area', common_units: '1000, 2000, 3000',
    device_examples: 'FUE Punch, Choi Implanter', tags: '탈모, 모발이식, 수술' },

  // WELLNESS
  { slug: 'stem_cell_iv',       name_ko: '줄기세포 IV',            name_en: 'Stem Cell IV Therapy',   name_zh: '干细胞静脉',   name_ja: '幹細胞点滴',
    category_slug: 'wellness', mechanism: 'stem_cell', domain: 'regenerative', body_area: 'systemic',
    description_ko: '자가 또는 동종 줄기세포 IV — 항노화/회복.',
    description_en: 'Autologous or allogeneic stem cell IV — antiaging and recovery.',
    pain_level: 2, intensity: 'subtle', downtime_days: 0, result_onset: 'gradual', result_duration: 'months', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'none',
    market_price_min: 1500000, market_price_max: 10000000, price_unit: '회당', unit_type: 'sessions', common_units: '1',
    device_examples: '', tags: '줄기세포, 항노화, 웰니스' },
  { slug: 'exosome_facial',     name_ko: '엑소좀 페이셜',          name_en: 'Exosome Facial',         name_zh: '外泌体面部',   name_ja: 'エクソソーム顔',
    category_slug: 'wellness', mechanism: 'exosome', domain: 'regenerative', body_area: 'face, skin',
    description_ko: '엑소좀 도포·주입으로 진피 재생 — 톤·결·잔주름.',
    description_en: 'Exosome topical/injection for dermal regeneration.',
    pain_level: 2, intensity: 'subtle', downtime_days: 1, result_onset: 'gradual', result_duration: 'months', typical_sessions: 3,
    is_surgical: 'FALSE', anesthesia_typical: 'topical',
    market_price_min: 300000, market_price_max: 900000, price_unit: '회당', unit_type: 'sessions', common_units: '1, 3',
    device_examples: 'ExoCoBio ASCE+, Benev', tags: '엑소좀, 재생, 웰니스' },

  // DENTAL
  { slug: 'dental_implant',     name_ko: '치과 임플란트',          name_en: 'Dental Implant',         name_zh: '种植牙',       name_ja: 'インプラント',
    category_slug: 'dental', mechanism: 'implant', domain: 'dental', body_area: 'dental',
    description_ko: '치조골에 인공 치근 식립 후 보철.',
    description_en: 'Titanium fixture into jawbone, then prosthetic crown.',
    pain_level: 3, intensity: 'dramatic', downtime_days: 7, result_onset: 'gradual', result_duration: 'permanent', typical_sessions: 3,
    is_surgical: 'TRUE', anesthesia_typical: 'local',
    market_price_min: 800000, market_price_max: 3000000, price_unit: '개당', unit_type: 'flat', common_units: '1, 2',
    device_examples: 'Straumann, Osstem, Dentium', tags: '치과, 임플란트' },
  { slug: 'invisalign',         name_ko: '투명 교정',              name_en: 'Clear Aligner',          name_zh: '隐形矫正',     name_ja: 'マウスピース矯正',
    category_slug: 'dental', mechanism: 'orthodontic', domain: 'dental', body_area: 'dental',
    description_ko: '투명 장치로 치아 정렬 — 브라켓 없이.',
    description_en: 'Removable clear aligners for tooth alignment.',
    pain_level: 2, intensity: 'moderate', downtime_days: 0, result_onset: 'gradual', result_duration: 'permanent', typical_sessions: 1,
    is_surgical: 'FALSE', anesthesia_typical: 'none',
    market_price_min: 4000000, market_price_max: 9000000, price_unit: '전체', unit_type: 'flat', common_units: '1',
    device_examples: 'Invisalign, ClearCorrect', tags: '치과, 교정, 투명' },
  { slug: 'dental_veneer',      name_ko: '치아 라미네이트',        name_en: 'Dental Veneer',          name_zh: '牙齿贴面',     name_ja: '歯のラミネート',
    category_slug: 'dental', mechanism: 'implant', domain: 'dental', body_area: 'dental',
    description_ko: '치아 앞면에 얇은 세라믹 부착 — 색·모양 보정.',
    description_en: 'Thin ceramic shells bonded to tooth surface.',
    pain_level: 2, intensity: 'moderate', downtime_days: 0, result_onset: 'immediate', result_duration: 'years', typical_sessions: 2,
    is_surgical: 'FALSE', anesthesia_typical: 'local',
    market_price_min: 700000, market_price_max: 1500000, price_unit: '개당', unit_type: 'flat', common_units: '1',
    device_examples: 'EMAX', tags: '치과, 라미네이트, 미백' },
];

// ────────────────────────────────────────────────────────────────────
// Sheet 5 · 고민 ↔ 시술 매트릭스 (concern_procedures)
// ────────────────────────────────────────────────────────────────────
const MATRIX_COLUMNS = [
  { key: 'concern_slug',   label: '고민 (slug)',         hint: '필수 · 고민 시트의 slug. 예: sagging',                                width: 18 },
  { key: 'procedure_slug', label: '시술 (slug)',         hint: '필수 · 시술 시트의 slug. 예: hifu_face',                              width: 22 },
  { key: 'relevance',      label: '관련도',              hint: '필수 · primary (1순위) / secondary (보조) / adjunct (부수적)',         width: 12 },
  { key: 'rationale_ko',   label: '추천 이유 (한국어)',   hint: '권장 · 한 줄. 왜 이 고민에 이 시술이 맞는지.',                          width: 40 },
  { key: 'rationale_en',   label: '추천 이유 (영어)',    hint: '권장 · 영어 합성 시 Romie 멘트에 그대로 쓰임.',                         width: 40 },
];
const MATRIX_EXAMPLES = [
  // sagging
  { concern_slug: 'sagging',      procedure_slug: 'hifu_face',           relevance: 'primary',   rationale_ko: 'SMAS 직접 자극으로 비절개 리프팅 1순위', rationale_en: 'SMAS-targeted lift, no incision' },
  { concern_slug: 'sagging',      procedure_slug: 'rf_thermage',         relevance: 'primary',   rationale_ko: '콜라겐 수축 — 탄력 + 처짐 동시 개선',     rationale_en: 'Collagen contraction tightens skin' },
  { concern_slug: 'sagging',      procedure_slug: 'thread_lift_pdo',     relevance: 'primary',   rationale_ko: '즉각 리프팅이 필요한 경우 최우선',         rationale_en: 'Best when immediate lift is desired' },
  { concern_slug: 'sagging',      procedure_slug: 'inmode_face',         relevance: 'secondary', rationale_ko: '초경증 리프팅·홈케어 보조',                rationale_en: 'Light tightening for early signs' },
  // wrinkles
  { concern_slug: 'wrinkles',     procedure_slug: 'botox_wrinkle',       relevance: 'primary',   rationale_ko: '표정 주름 1순위',                          rationale_en: 'Top choice for dynamic wrinkles' },
  { concern_slug: 'wrinkles',     procedure_slug: 'rf_thermage',         relevance: 'primary',   rationale_ko: '잔주름·탄력 동시 개선',                    rationale_en: 'Fine lines + elasticity together' },
  { concern_slug: 'wrinkles',     procedure_slug: 'skinbooster_juvelook',relevance: 'secondary', rationale_ko: '얕은 잔주름 보강',                          rationale_en: 'Supports shallow fine lines' },
  // volume_loss
  { concern_slug: 'volume_loss',  procedure_slug: 'filler_ha_cheek',     relevance: 'primary',   rationale_ko: '꺼진 볼·관자놀이 표준 솔루션',              rationale_en: 'Standard for hollow cheeks/temples' },
  { concern_slug: 'volume_loss',  procedure_slug: 'thread_lift_pdo',     relevance: 'secondary', rationale_ko: '경증 처짐 동반 시',                         rationale_en: 'When mild sagging is also present' },
  // jawline
  { concern_slug: 'jawline',      procedure_slug: 'hifu_face',           relevance: 'primary',   rationale_ko: '턱밑 SMAS 강화',                            rationale_en: 'Strengthens sub-mandibular SMAS' },
  { concern_slug: 'jawline',      procedure_slug: 'thread_lift_pdo',     relevance: 'primary',   rationale_ko: '턱선 즉각 정리',                            rationale_en: 'Immediate jawline contouring' },
  { concern_slug: 'jawline',      procedure_slug: 'rf_thermage',         relevance: 'secondary', rationale_ko: '경증 턱선 정리',                            rationale_en: 'For mild jawline softness' },
  // face_size
  { concern_slug: 'face_size',    procedure_slug: 'botox_jaw',           relevance: 'primary',   rationale_ko: '교근 축소 1순위',                            rationale_en: 'Masseter reduction, top choice' },
  { concern_slug: 'face_size',    procedure_slug: 'inmode_face',         relevance: 'secondary', rationale_ko: '얼굴 RF + 근육 자극 보조',                  rationale_en: 'Adjunct RF + EM toning' },
  // pores
  { concern_slug: 'pores',        procedure_slug: 'co2_fractional',      relevance: 'primary',   rationale_ko: '분획 레이저 — 모공 표준',                   rationale_en: 'Fractional laser is pore standard' },
  { concern_slug: 'pores',        procedure_slug: 'pico_toning',         relevance: 'secondary', rationale_ko: '색소 + 모공 동시 개선',                      rationale_en: 'Pigment + pore together' },
  { concern_slug: 'pores',        procedure_slug: 'skinbooster_rejuran', relevance: 'secondary', rationale_ko: '진피 재생으로 모공 탄력',                    rationale_en: 'Dermal regen tightens pores' },
  // skin_tone
  { concern_slug: 'skin_tone',    procedure_slug: 'pico_toning',         relevance: 'primary',   rationale_ko: '톤·색소 통합 케어 표준',                    rationale_en: 'Standard tone-and-pigment regimen' },
  { concern_slug: 'skin_tone',    procedure_slug: 'hydra_facial',        relevance: 'adjunct',   rationale_ko: '클렌징/보습으로 즉시 밝은 톤',              rationale_en: 'Cleanse + hydrate for instant glow' },
  // pigmentation
  { concern_slug: 'pigmentation', procedure_slug: 'pico_toning',         relevance: 'primary',   rationale_ko: '잡티·기미 분해 1순위',                       rationale_en: 'Top pigment fragmentation' },
  // acne_scars
  { concern_slug: 'acne_scars',   procedure_slug: 'co2_fractional',      relevance: 'primary',   rationale_ko: '함몰 흉터 재생 1순위',                       rationale_en: 'Top for atrophic acne scars' },
  { concern_slug: 'acne_scars',   procedure_slug: 'subcision',           relevance: 'primary',   rationale_ko: '깊은 흉터 박리 — 레이저와 병행 권장',         rationale_en: 'Releases tethered scars; combine with laser' },
  { concern_slug: 'acne_scars',   procedure_slug: 'skinbooster_rejuran', relevance: 'secondary', rationale_ko: '재생 보조로 시너지',                          rationale_en: 'Synergy via dermal regen' },
  // acne_active
  { concern_slug: 'acne_active',  procedure_slug: 'hydra_facial',        relevance: 'primary',   rationale_ko: '클렌징·각질·진정 케어',                      rationale_en: 'Cleanse, exfoliate, soothe' },
  // dark_circles
  { concern_slug: 'dark_circles', procedure_slug: 'under_eye_fat',       relevance: 'primary',   rationale_ko: '눈밑 지방 재배치로 그림자 제거',              rationale_en: 'Fat reposition removes hollow shadow' },
  { concern_slug: 'dark_circles', procedure_slug: 'skinbooster_rejuran', relevance: 'secondary', rationale_ko: '진피 재생으로 옅은 색소 완화',                rationale_en: 'Dermal regen for shallow pigment' },
  // eye_shape
  { concern_slug: 'eye_shape',    procedure_slug: 'double_eyelid',       relevance: 'primary',   rationale_ko: '쌍커풀 형성 — 영구',                         rationale_en: 'Permanent double eyelid' },
  { concern_slug: 'eye_shape',    procedure_slug: 'canthoplasty',        relevance: 'secondary', rationale_ko: '눈 가로 확장 보강',                          rationale_en: 'Widens horizontal eye length' },
  // nose_shape
  { concern_slug: 'nose_shape',   procedure_slug: 'rhinoplasty_bridge',  relevance: 'primary',   rationale_ko: '낮은 콧대 보강 1순위',                       rationale_en: 'Top for low bridge augmentation' },
  { concern_slug: 'nose_shape',   procedure_slug: 'rhinoplasty_tip',     relevance: 'primary',   rationale_ko: '코끝 모양 정리',                              rationale_en: 'Refines tip projection/angle' },
  // lip_shape
  { concern_slug: 'lip_shape',    procedure_slug: 'filler_ha_lip',       relevance: 'primary',   rationale_ko: '볼륨·라인 즉시 보강',                        rationale_en: 'Immediate volume + outline' },
  // body_contour / fat_local
  { concern_slug: 'body_contour', procedure_slug: 'emsculpt',            relevance: 'primary',   rationale_ko: '근육 톤업 + 코어 강화',                       rationale_en: 'Toning + core strengthening' },
  { concern_slug: 'body_contour', procedure_slug: 'liposuction_abdomen', relevance: 'secondary', rationale_ko: '비절개로 안 빠지는 부위만',                   rationale_en: 'For stubborn fat resistant to non-invasive' },
  { concern_slug: 'fat_local',    procedure_slug: 'coolsculpting',       relevance: 'primary',   rationale_ko: '비절개 부분 지방 표준',                       rationale_en: 'Non-invasive standard for local fat' },
  { concern_slug: 'fat_local',    procedure_slug: 'liposuction_abdomen', relevance: 'secondary', rationale_ko: '큰 부피 정리 필요 시',                        rationale_en: 'When larger reduction is needed' },
  // hair_loss
  { concern_slug: 'hair_loss',    procedure_slug: 'hair_transplant',     relevance: 'primary',   rationale_ko: '영구 결과 — M자/정수리/이마 라인',            rationale_en: 'Permanent for receding/crown/hairline' },
  { concern_slug: 'hair_loss',    procedure_slug: 'exosome_facial',      relevance: 'adjunct',   rationale_ko: '두피 적용 시 보조 시너지',                    rationale_en: 'Scalp application as adjunct' },
  // aging_overall
  { concern_slug: 'aging_overall',procedure_slug: 'hifu_face',           relevance: 'primary',   rationale_ko: '비절개 종합 리프팅 1순위',                    rationale_en: 'Top non-invasive overall lift' },
  { concern_slug: 'aging_overall',procedure_slug: 'stem_cell_iv',        relevance: 'adjunct',   rationale_ko: '전신 항노화 보조',                            rationale_en: 'Systemic anti-aging adjunct' },
  { concern_slug: 'aging_overall',procedure_slug: 'exosome_facial',      relevance: 'secondary', rationale_ko: '진피 재생 — 잔주름·톤',                       rationale_en: 'Dermal regen for fine lines + tone' },
  // dental_align
  { concern_slug: 'dental_align', procedure_slug: 'invisalign',          relevance: 'primary',   rationale_ko: '투명 교정 1순위',                             rationale_en: 'Top clear-aligner choice' },
  { concern_slug: 'dental_align', procedure_slug: 'dental_veneer',       relevance: 'secondary', rationale_ko: '경증·미적 보정 위주일 때',                   rationale_en: 'For mild cases focused on aesthetics' },
];

// ────────────────────────────────────────────────────────────────────
// Sheet 6 · 기기 (devices) — ⚠ 신규 테이블 (현재 DB 미존재)
// ────────────────────────────────────────────────────────────────────
const DEVICE_COLUMNS = [
  { key: 'slug',              label: 'URL 식별자',         hint: '필수 · 영문 소문자 + _ · 변경 X · 예: ulthera',                                  width: 16 },
  { key: 'name_ko',           label: '기기명 (한국어)',     hint: '필수 · 환자에게 보이는 이름. 예: 울쎄라',                                       width: 16 },
  { key: 'name_en',           label: '기기명 (영어)',       hint: '필수 · 원래 브랜드명. 예: Ulthera',                                            width: 18 },
  { key: 'name_zh',           label: '기기명 (중국어)',     hint: '권장 · 예: 超声刀',                                                            width: 14 },
  { key: 'name_ja',           label: '기기명 (일본어)',     hint: '선택',                                                                          width: 14 },
  { key: 'mechanism_slug',    label: '메커니즘',           hint: '필수 · 메커니즘 시트의 slug. 1개. 예: hifu',                                    width: 14 },
  { key: 'manufacturer',      label: '제조사',             hint: '권장 · 예: Merz, Classys, Solta, Allergan',                                    width: 16 },
  { key: 'country_of_origin', label: '원산지',             hint: '권장 · ISO-2 코드 또는 영문명. 예: US, KR, IL',                                width: 10 },
  { key: 'description_ko',    label: '설명 (한국어)',       hint: '권장 · 한 줄. "이 기기의 특징/평판" 정도.',                                    width: 36 },
  { key: 'description_en',    label: '설명 (영어)',         hint: '권장',                                                                          width: 36 },
  { key: 'badge',             label: '배지',               hint: '선택 · iconic / premium / k-favorite / classic. UI 카드에 작게 표시',           width: 14 },
  { key: 'thumbnail_url',     label: '썸네일 이미지 URL',   hint: '권장 · 카드 노출용. S3 자동 업로드 시 채워짐.',                                width: 26 },
  { key: 'hero_image_url',    label: 'hero 이미지 URL',    hint: '권장 · /device/:slug 상단 배경.',                                              width: 26 },
  { key: 'display_order',     label: '표시 순서',          hint: '권장 · 작은 숫자 먼저. 인기 기기 위에.',                                        width: 10 },
];
const DEVICE_EXAMPLES = [
  // HIFU
  { slug: 'ulthera',       name_ko: '울쎄라',        name_en: 'Ulthera',         name_zh: '超声刀',     name_ja: 'ウルセラ',          mechanism_slug: 'hifu',         manufacturer: 'Merz',       country_of_origin: 'US', description_ko: 'FDA 1호 집속초음파 리프팅. SMAS 층 직접 자극.',          description_en: 'First FDA-cleared focused ultrasound lift, targets SMAS.',     badge: 'iconic',     display_order: 1 },
  { slug: 'shurink',       name_ko: '슈링크',        name_en: 'Shurink',         name_zh: '舒立金',     name_ja: 'シュリンク',        mechanism_slug: 'hifu',         manufacturer: 'Classys',    country_of_origin: 'KR', description_ko: '한국형 HIFU. 적은 부작용 + 빠른 회복으로 인기.',         description_en: 'Korean HIFU favored for fewer side effects and quick recovery.', badge: 'k-favorite', display_order: 2 },
  { slug: 'liftera',       name_ko: '리프테라',      name_en: 'Liftera',         name_zh: '丽芙特拉',   name_ja: 'リフテラ',          mechanism_slug: 'hifu',         manufacturer: 'Classys',    country_of_origin: 'KR', description_ko: '리니어 HIFU — 안면 윤곽 정밀 리프팅.',                    description_en: 'Linear HIFU for precise facial contour lifting.',                badge: '',           display_order: 3 },
  { slug: 'doublo',        name_ko: '더블로',        name_en: 'Doublo',          name_zh: '杜博洛',     name_ja: 'ダブロ',            mechanism_slug: 'hifu',         manufacturer: 'Hironic',    country_of_origin: 'KR', description_ko: '두 가지 깊이 HIFU 동시 조사.',                            description_en: 'Dual-depth HIFU in one session.',                                 badge: '',           display_order: 4 },
  // RF
  { slug: 'thermage_flx',  name_ko: '써마지 FLX',    name_en: 'Thermage FLX',    name_zh: 'Thermage',   name_ja: 'サーマクール FLX',  mechanism_slug: 'rf',           manufacturer: 'Solta Medical', country_of_origin: 'US', description_ko: '단극성 RF 단일 세션 리프팅 — 콜라겐 수축.',              description_en: 'Single-session monopolar RF — collagen contraction.',           badge: 'premium',    display_order: 5 },
  { slug: 'inmode',        name_ko: '인모드',        name_en: 'InMode',          name_zh: 'InMode',     name_ja: 'インモード',        mechanism_slug: 'rf',           manufacturer: 'InMode',     country_of_origin: 'IL', description_ko: '바이폴라 RF + 근육자극 — 지방·탄력·톤 동시.',             description_en: 'Bipolar RF + EM stim — fat, tightening, toning combined.',       badge: '',           display_order: 6 },
  { slug: 'oligio',        name_ko: '올리지오',      name_en: 'Oligio',          name_zh: '欧拉久',     name_ja: 'オリジオ',          mechanism_slug: 'rf',           manufacturer: 'Jeisys',     country_of_origin: 'KR', description_ko: '한국형 모노폴라 RF — 써마지 대체 인기.',                  description_en: 'Korean monopolar RF — popular Thermage alternative.',            badge: 'k-favorite', display_order: 7 },
  // Pico
  { slug: 'picosure',      name_ko: '피코슈어',      name_en: 'PicoSure',        name_zh: '皮秒激光',   name_ja: 'ピコシュア',        mechanism_slug: 'laser_pico',   manufacturer: 'Cynosure',   country_of_origin: 'US', description_ko: '초단펄스 — 색소·문신·톤.',                                description_en: 'Ultra-short pulse for pigment, tattoo, tone.',                  badge: '',           display_order: 8 },
  { slug: 'picoway',       name_ko: '피코웨이',      name_en: 'PicoWay',         name_zh: '皮秒之星',   name_ja: 'ピコウェイ',        mechanism_slug: 'laser_pico',   manufacturer: 'Candela',    country_of_origin: 'US', description_ko: '3파장 피코 — 색소 세분화.',                               description_en: 'Triple-wavelength Pico for varied pigment.',                    badge: '',           display_order: 9 },
  // CO2
  { slug: 'lutronic_eco2', name_ko: '루트로닉 eCO2', name_en: 'Lutronic eCO2',   name_zh: 'eCO2',       name_ja: 'eCO2',              mechanism_slug: 'laser_co2',    manufacturer: 'Lutronic',   country_of_origin: 'KR', description_ko: '국산 분획 CO2 — 흉터·모공.',                              description_en: 'Korean fractional CO2 — scars and pores.',                       badge: '',           display_order: 10 },
  // Botox
  { slug: 'botox',         name_ko: '보톡스',        name_en: 'Botox',           name_zh: '保妥适',     name_ja: 'ボトックス',        mechanism_slug: 'botox',        manufacturer: 'Allergan',   country_of_origin: 'US', description_ko: 'A형 보툴리눔 — 1세대 오리지널.',                          description_en: 'Type-A botulinum — original brand.',                            badge: 'iconic',     display_order: 11 },
  { slug: 'nabota',        name_ko: '나보타',        name_en: 'Nabota',          name_zh: '纳保塔',     name_ja: 'ナボタ',            mechanism_slug: 'botox',        manufacturer: 'Daewoong',   country_of_origin: 'KR', description_ko: '국산 보톡스 — 효과·가성비 인기.',                         description_en: 'Korean botulinum — popular for value.',                         badge: 'k-favorite', display_order: 12 },
  { slug: 'dysport',       name_ko: '디스포트',      name_en: 'Dysport',         name_zh: '丽舒妥',     name_ja: 'ディスポート',      mechanism_slug: 'botox',        manufacturer: 'Ipsen',      country_of_origin: 'FR', description_ko: '확산력 강한 보툴리눔 — 넓은 범위.',                       description_en: 'High-diffusion botulinum for wide areas.',                       badge: '',           display_order: 13 },
  // Filler
  { slug: 'juvederm',      name_ko: '쥬비덤',        name_en: 'Juvederm',        name_zh: '乔雅登',     name_ja: 'ジュビダーム',      mechanism_slug: 'filler_ha',    manufacturer: 'Allergan',   country_of_origin: 'US', description_ko: 'HA 필러 — 부드러운 입자감 인기.',                         description_en: 'HA filler with smooth particle profile.',                         badge: 'iconic',     display_order: 14 },
  { slug: 'restylane',     name_ko: '레스틸렌',      name_en: 'Restylane',       name_zh: '瑞蓝',       name_ja: 'レスチレン',        mechanism_slug: 'filler_ha',    manufacturer: 'Galderma',   country_of_origin: 'SE', description_ko: 'HA 필러 — 유지력 안정적.',                                description_en: 'HA filler with stable longevity.',                              badge: '',           display_order: 15 },
  // Skinbooster
  { slug: 'rejuran',       name_ko: '리쥬란',        name_en: 'Rejuran',         name_zh: '婴儿针',     name_ja: 'リジュラン',        mechanism_slug: 'skinbooster',  manufacturer: 'Pharma Research', country_of_origin: 'KR', description_ko: '연어 DNA(PN) 진피 재생 주사.',                            description_en: 'Salmon PN dermal regeneration injection.',                       badge: 'k-favorite', display_order: 16 },
  { slug: 'juvelook',      name_ko: '쥬베룩',        name_en: 'Juvelook',        name_zh: '少女针',     name_ja: 'ジュベルック',      mechanism_slug: 'skinbooster',  manufacturer: 'VAIM',       country_of_origin: 'KR', description_ko: 'PDLA + HA — 콜라겐 생성 + 보습.',                         description_en: 'PDLA + HA — collagen + hydration.',                            badge: 'k-favorite', display_order: 17 },
  // Body / cryolipo
  { slug: 'coolsculpting', name_ko: '쿨스컬프팅',    name_en: 'CoolSculpting',   name_zh: '酷塑',       name_ja: 'クールスカルプティング', mechanism_slug: 'cryolipo', manufacturer: 'Allergan',   country_of_origin: 'US', description_ko: '냉각으로 지방세포 사멸 — 비절개 부분 지방.',              description_en: 'Non-invasive fat reduction via cooling.',                       badge: 'iconic',     display_order: 18 },
  // EM
  { slug: 'emsculpt_neo',  name_ko: '엠스컬프트 NEO', name_en: 'EMSCULPT NEO',    name_zh: 'EMSCULPT',   name_ja: 'EMSCULPT',          mechanism_slug: 'em_muscle',    manufacturer: 'BTL',        country_of_origin: 'CZ', description_ko: 'HIFEM 근육 자극 + RF — 톤업 + 지방 감소.',                description_en: 'HIFEM muscle stim + RF — toning + fat reduction.',              badge: '',           display_order: 19 },
  // Facial
  { slug: 'hydrafacial',   name_ko: '하이드라페이셜', name_en: 'HydraFacial',     name_zh: '海菲秀',     name_ja: 'ハイドラフェイシャル', mechanism_slug: 'skinbooster', manufacturer: 'HydraFacial', country_of_origin: 'US', description_ko: '클렌징·각질·보습 3단계 메디컬 페이셜.',                description_en: '3-step deep cleanse, exfoliation, hydration.',                  badge: '',           display_order: 20 },
];

// ────────────────────────────────────────────────────────────────────
// Sheet 7 · 시술 ↔ 기기 매트릭스 (procedure_devices)
// ────────────────────────────────────────────────────────────────────
const PROC_DEVICE_COLUMNS = [
  { key: 'procedure_slug', label: '시술 (slug)',         hint: '필수 · 시술 시트의 slug. 예: hifu_face',                                    width: 22 },
  { key: 'device_slug',    label: '기기 (slug)',         hint: '필수 · 기기 시트의 slug. 예: ulthera',                                      width: 18 },
  { key: 'relevance',      label: '관계',                hint: '필수 · primary (이 시술의 대표 장비) / alternative (대체 가능) / compatible (호환은 됨)', width: 14 },
  { key: 'notes_ko',       label: '비고 (한국어)',       hint: '선택 · 한 줄. "특정 부위에만 권장" 등.',                                     width: 36 },
  { key: 'notes_en',       label: '비고 (영어)',         hint: '선택',                                                                       width: 36 },
];
const PROC_DEVICE_EXAMPLES = [
  // HIFU 얼굴 리프팅
  { procedure_slug: 'hifu_face',          device_slug: 'ulthera',      relevance: 'primary',     notes_ko: 'FDA 1호 — 가장 검증된 옵션',     notes_en: 'First FDA-cleared, most validated' },
  { procedure_slug: 'hifu_face',          device_slug: 'shurink',      relevance: 'alternative', notes_ko: '한국 인기 — 통증 적고 회복 빠름',  notes_en: 'Korean favorite, less pain' },
  { procedure_slug: 'hifu_face',          device_slug: 'liftera',      relevance: 'alternative', notes_ko: '리니어 — 윤곽 정밀',              notes_en: 'Linear for precise contour' },
  { procedure_slug: 'hifu_face',          device_slug: 'doublo',       relevance: 'alternative', notes_ko: '듀얼 깊이 — 가성비',              notes_en: 'Dual-depth, value' },
  // 써마지
  { procedure_slug: 'rf_thermage',        device_slug: 'thermage_flx', relevance: 'primary',     notes_ko: '브랜드 = 시술명',                  notes_en: 'Brand = procedure name' },
  // 인모드
  { procedure_slug: 'inmode_face',        device_slug: 'inmode',       relevance: 'primary',     notes_ko: '',                                 notes_en: '' },
  { procedure_slug: 'inmode_face',        device_slug: 'oligio',       relevance: 'alternative', notes_ko: '국산 모노폴라 RF 대체',           notes_en: 'Korean monopolar alternative' },
  // 보톡스
  { procedure_slug: 'botox_jaw',          device_slug: 'botox',        relevance: 'primary',     notes_ko: '오리지널 1세대',                   notes_en: 'Original 1st-gen' },
  { procedure_slug: 'botox_jaw',          device_slug: 'nabota',       relevance: 'alternative', notes_ko: '가성비 인기',                      notes_en: 'Value pick' },
  { procedure_slug: 'botox_jaw',          device_slug: 'dysport',      relevance: 'alternative', notes_ko: '확산력 좋음',                      notes_en: 'High diffusion' },
  { procedure_slug: 'botox_wrinkle',      device_slug: 'botox',        relevance: 'primary',     notes_ko: '',                                 notes_en: '' },
  { procedure_slug: 'botox_wrinkle',      device_slug: 'nabota',       relevance: 'alternative', notes_ko: '',                                 notes_en: '' },
  { procedure_slug: 'botox_wrinkle',      device_slug: 'dysport',      relevance: 'alternative', notes_ko: '눈가 등 넓은 부위',                notes_en: 'Wide areas like crow\'s feet' },
  // 필러
  { procedure_slug: 'filler_ha_cheek',    device_slug: 'juvederm',     relevance: 'primary',     notes_ko: 'Voluma 라인 — 볼 표준',           notes_en: 'Voluma standard for cheeks' },
  { procedure_slug: 'filler_ha_cheek',    device_slug: 'restylane',    relevance: 'alternative', notes_ko: 'Lyft — 유지력 강',                 notes_en: 'Lyft, strong longevity' },
  { procedure_slug: 'filler_ha_lip',      device_slug: 'juvederm',     relevance: 'primary',     notes_ko: 'Volbella — 입술 전용',            notes_en: 'Volbella for lips' },
  { procedure_slug: 'filler_ha_lip',      device_slug: 'restylane',    relevance: 'alternative', notes_ko: 'Kysse — 입술 전용',                notes_en: 'Kysse for lips' },
  // 스킨부스터
  { procedure_slug: 'skinbooster_juvelook', device_slug: 'juvelook',   relevance: 'primary',     notes_ko: '브랜드 = 시술명',                  notes_en: 'Brand = procedure name' },
  { procedure_slug: 'skinbooster_rejuran',  device_slug: 'rejuran',    relevance: 'primary',     notes_ko: '브랜드 = 시술명',                  notes_en: 'Brand = procedure name' },
  // 피코
  { procedure_slug: 'pico_toning',        device_slug: 'picosure',     relevance: 'primary',     notes_ko: '',                                 notes_en: '' },
  { procedure_slug: 'pico_toning',        device_slug: 'picoway',      relevance: 'alternative', notes_ko: '3파장 — 다양한 색소',              notes_en: 'Triple-wavelength' },
  // CO2
  { procedure_slug: 'co2_fractional',     device_slug: 'lutronic_eco2',relevance: 'primary',     notes_ko: '',                                 notes_en: '' },
  { procedure_slug: 'subcision',          device_slug: 'lutronic_eco2',relevance: 'compatible',  notes_ko: '서브시전 후 CO2 마감',             notes_en: 'CO2 after subcision' },
  // Body
  { procedure_slug: 'coolsculpting',      device_slug: 'coolsculpting',relevance: 'primary',     notes_ko: '브랜드 = 시술명',                  notes_en: 'Brand = procedure name' },
  { procedure_slug: 'emsculpt',           device_slug: 'emsculpt_neo', relevance: 'primary',     notes_ko: '브랜드 = 시술명',                  notes_en: 'Brand = procedure name' },
  // Hydra
  { procedure_slug: 'hydra_facial',       device_slug: 'hydrafacial',  relevance: 'primary',     notes_ko: '브랜드 = 시술명',                  notes_en: 'Brand = procedure name' },
];

// ────────────────────────────────────────────────────────────────────
// Write workbook
// ────────────────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, makeGuideSheet(),                                     '📘 가이드');
XLSX.utils.book_append_sheet(wb, makeSheet({
  title:    '1. 시술 카테고리 (procedure_categories)',
  intro:    '8개는 이미 시드되어 있습니다. 운영자가 추가할 일은 거의 없고, 이미지(thumbnail/hero) 만 채우면 됩니다. /admin/procedure_categories 에서 행을 클릭해 이미지 업로드.',
  columns:  CATEGORY_COLUMNS,
  examples: CATEGORY_EXAMPLES,
}), '1. 시술 카테고리');
XLSX.utils.book_append_sheet(wb, makeSheet({
  title:    '2. 메커니즘 (mechanisms)',
  intro:    '15개가 이미 시드되어 있습니다. 새 시술이 새 작용원리를 쓴다면 여기에 먼저 추가해야 합니다. 시술 시트의 "작용 기전" 컬럼이 이 slug 를 참조합니다.',
  columns:  MECHANISM_COLUMNS,
  examples: MECHANISM_EXAMPLES,
}), '2. 메커니즘');
XLSX.utils.book_append_sheet(wb, makeSheet({
  title:    '3. 고민 (concerns)',
  intro:    '환자가 "이런 고민이 있다" 고 검색·진입하는 키워드. 의학 용어가 아니라 환자 톤으로. 20~30개 권장. 5번 시트(매트릭스)의 출발점이라 먼저 채워야 합니다.',
  columns:  CONCERN_COLUMNS,
  examples: CONCERN_EXAMPLES,
}), '3. 고민');
XLSX.utils.book_append_sheet(wb, makeSheet({
  title:    '4. 시술 (procedures)',
  intro:    '병원과 무관한 "시술 본질" 만. 가격은 시세 범위(시장 평균) 만 적습니다. 병원별 실제 가격·장비는 나중에 병원 편집 화면의 "시술 가격표" 패널에서 따로 등록합니다. 인기 30~50개부터.',
  columns:  PROCEDURE_COLUMNS,
  examples: PROCEDURE_EXAMPLES,
}), '4. 시술');
XLSX.utils.book_append_sheet(wb, makeSheet({
  title:    '5. 고민 ↔ 시술 매트릭스 (concern_procedures)',
  intro:    '"이 고민에는 이 시술" 매핑. 매칭 결과 품질의 80% 가 여기 달려 있습니다. 한 고민당 2~3개 시술 매핑 권장. relevance 는 primary(1순위) / secondary(보조) / adjunct(부수적) 중 하나.',
  columns:  MATRIX_COLUMNS,
  examples: MATRIX_EXAMPLES,
}), '5. 고민↔시술');
XLSX.utils.book_append_sheet(wb, makeSheet({
  title:    '6. 기기 (devices) — ⚠ 신규 테이블',
  intro:    '장비 브랜드(Ulthera·Shurink·Thermage 등). 외국 환자가 "Ulthera 받고 싶다" 처럼 기기 이름으로 검색하는 흐름 때문에 카탈로그 1급 시민. 한 메커니즘(예: HIFU)에 여러 기기가 묶임. ⚠ 현재 DB 에 devices 테이블 없음 — 별도 스키마 확장 후 import.',
  columns:  DEVICE_COLUMNS,
  examples: DEVICE_EXAMPLES,
}), '6. 기기');
XLSX.utils.book_append_sheet(wb, makeSheet({
  title:    '7. 시술 ↔ 기기 매트릭스 (procedure_devices)',
  intro:    '"이 시술은 어떤 장비로 가능한가" 매핑. 같은 HIFU 얼굴 리프팅이라도 Ulthera/Shurink/Liftera 셋 다 가능 — 환자가 기기 단위로도 진입할 수 있도록. relevance 는 primary(이 시술의 대표 장비) / alternative(대체 가능) / compatible(호환은 됨) 중 하나.',
  columns:  PROC_DEVICE_COLUMNS,
  examples: PROC_DEVICE_EXAMPLES,
}), '7. 시술↔기기');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
XLSX.writeFile(wb, OUT);
console.log(`✓ wrote ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
console.log(`  - sheets: 📘 가이드 / 1. 시술 카테고리 / 2. 메커니즘 / 3. 고민 / 4. 시술 / 5. 고민↔시술 / 6. 기기 / 7. 시술↔기기`);
console.log(`  - 카테고리 ${CATEGORY_EXAMPLES.length} · 메커니즘 ${MECHANISM_EXAMPLES.length} · 고민 ${CONCERN_EXAMPLES.length} · 시술 ${PROCEDURE_EXAMPLES.length} · 고민매트릭스 ${MATRIX_EXAMPLES.length} · 기기 ${DEVICE_EXAMPLES.length} · 시술기기매트릭스 ${PROC_DEVICE_EXAMPLES.length}`);

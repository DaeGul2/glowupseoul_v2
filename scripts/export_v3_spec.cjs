/* eslint-disable */
// Generates two client-facing Excel workbooks for v3:
//   docs/v3_클라이언트_명세서.xlsx   — per-route text review (현재→수정, 체크, 비고)
//   docs/v3_admin_사용가이드.xlsx     — non-technical admin manual w/ real DB examples
//
// DB values below are a SNAPSHOT (read-only dump on 2026-06-14). Re-run
// server/scripts/dump-v3-catalog.mjs to refresh, then update SNAP if needed.
// Run:  node scripts/export_v3_spec.cjs
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs');
const TODAY = '2026-06-14';

/* ============================ helpers ============================ */
function sheetFromRows(rows, cols) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  if (cols) ws['!cols'] = cols.map((w) => ({ wch: w }));
  return ws;
}
function writeBook(sheets, filename) {
  const wb = XLSX.utils.book_new();
  for (const [name, ws] of sheets) XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  const target = path.join(OUT_DIR, filename);
  try {
    XLSX.writeFile(wb, target);
    return target;
  } catch (e) {
    // file open in Excel → write a _new copy
    const alt = target.replace(/\.xlsx$/, '_new.xlsx');
    XLSX.writeFile(wb, alt);
    return alt;
  }
}

// Client review columns
const REVIEW_HDR = ['구역 / 섹션', '어디에 보이나요 (설명)', '현재 텍스트 (영문)', '수정 원하는 텍스트 (여기에 적어주세요)', '그대로 O / 수정 X', '비고'];
const REVIEW_COLS = [22, 30, 52, 46, 14, 26];

// Build a route sheet: title + how + header + rows. `rows` = [구역, 설명, 현재텍스트] (last 3 cols blank for client)
function reviewSheet(title, intro, rows) {
  const aoa = [];
  aoa.push([title]);
  aoa.push([intro]);
  aoa.push([]);
  aoa.push(REVIEW_HDR);
  for (const r of rows) aoa.push([r[0], r[1], r[2], '', '', '']);
  return sheetFromRows(aoa, REVIEW_COLS);
}

/* ============================ DB SNAPSHOT ============================ */
const SNAP = {
  treatments: [
    ['Ulthera', 'Non-invasive HIFU lifting that targets the SMAS layer.', 700000, 'from 300 shots (reference)', 'year_1_2', 'mild', 'immediate', ['Lifting', 'Non-invasive', 'HIFU']],
    ['Thermage', 'Monopolar RF that heats the dermis to restore firmness.', 1200000, 'from 600 shots (reference)', 'year_1_2', 'mild', 'immediate', ['Non-invasive', 'Firming', 'RF']],
    ['Rejuran', 'Salmon-PN skin-regeneration injection.', 250000, 'per session (reference)', 'months_3_6', 'mild', '1_2_days', ['Skinbooster', 'Regeneration', 'Pores']],
    ['Shurink Universe', "Korea's favourite HIFU lift — comfortable and quick.", 450000, 'from 300 lines (reference)', 'year_1_2', 'mild', 'immediate', ['Lifting', 'Non-invasive', 'HIFU']],
    ['InMode (FX + Forma)', 'RF micro-needling + skin tightening for the lower face.', 350000, 'per session (reference)', 'months_6_12', 'mild', '1_2_days', ['RF', 'Contour', 'Tightening']],
    ['Botox', 'Relaxes muscles for a slimmer jaw or smoother lines.', 90000, 'per area (reference)', 'months_3_6', 'soft', 'immediate', ['Injectable', 'Slimming', 'Wrinkles']],
    ['Filler', 'Hyaluronic-acid filler to restore volume and contour.', 350000, 'per syringe (reference)', 'year_1_2', 'mild', '1_2_days', ['Injectable', 'Volume']],
    ['Juvelook', 'PDLA collagen booster for firmness and fine texture.', 400000, 'per session (reference)', 'year_1_2', 'mild', '1_2_days', ['Skinbooster', 'Regeneration', 'Collagen']],
    ['Pico Laser', 'Picosecond laser for pigment, pores and tone.', 150000, 'per session (reference)', 'months_6_12', 'mild', 'immediate', ['Laser', 'Pigmentation', 'Tone']],
    ['CO2 Fractional Laser', 'Resurfacing for acne scars and rough texture.', 200000, 'per session (reference)', 'years_2_plus', 'hard', '1_week_plus', ['Laser', 'Resurfacing', 'Scars']],
    ['Aqua Peel', 'Gentle deep-cleanse and hydration facial.', 80000, 'per session (reference)', 'temporary', 'soft', 'immediate', ['Pores', 'Facial', 'Hydration']],
    ['Thread Lift', 'Dissolvable threads for an immediate lift.', 900000, 'from 10 threads (reference)', 'year_1_2', 'mild', '1_2_days', ['Lifting', 'Threads']],
    ['Glow IV Drip', 'Glutathione + vitamin IV for brightness and recovery.', 120000, 'per drip (reference)', 'temporary', 'soft', 'immediate', ['IV', 'Brightening', 'Wellness']],
    ['Tear-trough Filler', 'Under-eye filler to soften hollows and shadows.', 450000, 'per session (reference)', 'year_1_2', 'mild', '1_2_days', ['Injectable', 'Under-eye']],
  ],
  surgeries: [
    ['Rhinoplasty', 'Surgical reshaping of the nose.', 4000000, 'basic rhinoplasty (reference)', 'semi_permanent', 'hard', '1_week_plus', ['Nose', 'Contour']],
    ['Cleft Lip / Palate', 'Cleft lip and palate correction.', null, 'consultation per case', 'permanent', 'hard', '1_week_plus', ['Reconstructive', 'Special']],
    ['Double Eyelid Surgery', 'Creates a natural double-eyelid crease.', 1500000, 'non-incisional ~ incisional (reference)', 'permanent', 'mild', '1_week_plus', ['Eyes', 'Signature']],
    ['Ptosis Correction', 'Tightens the muscle that lifts a droopy eyelid.', 2000000, 'reference', 'permanent', 'mild', '1_week_plus', ['Eyes', 'Functional']],
    ['Liposuction', 'Removes stubborn localized fat for a smoother line.', 3000000, 'per area (reference)', 'permanent', 'hard', '1_week_plus', ['Contour', 'Body']],
    ['Facelift', 'Surgically lifts deeper sagging for lasting rejuvenation.', 12000000, 'SMAS lift (reference)', 'years_2_plus', 'hard', '1_week_plus', ['Lifting', 'Signature']],
  ],
  areas: {
    non_surgical: ['Skin', 'Eye area', 'Neck', 'Face & contour'],
    surgical: ['Eyes', 'Nose', 'Face lift', 'Body & liposuction', 'Cleft lip / palate'],
  },
  concernsByArea: {
    'Skin': ['Pores', 'Rough texture', 'Pigmentation', 'Redness', 'Acne', 'Fine lines'],
    'Eye area': ['Dark circles', 'Under-eye hollows'],
    'Neck': ['Neck wrinkles'],
    'Face & contour': ['Sagging & firmness', 'Volume loss', 'Face slimming'],
    'Eyes': ['Double eyelid', 'Droopy eyelid'],
    'Nose': ['Nose shape'],
    'Face lift': ['Deep facial sagging'],
    'Body & liposuction': ['Localized fat'],
    'Cleft lip / palate': ['Cleft lip / palate'],
  },
  tags: ['Lifting', 'Non-invasive', 'HIFU', 'Firming', 'RF', 'Skinbooster', 'Regeneration', 'Pores', 'Nose', 'Contour', 'Reconstructive', 'Special', 'Tightening', 'Injectable', 'Slimming', 'Wrinkles', 'Volume', 'Collagen', 'Laser', 'Pigmentation', 'Tone', 'Resurfacing', 'Scars', 'Facial', 'Hydration', 'Threads', 'IV', 'Brightening', 'Wellness', 'Under-eye', 'Eyes', 'Signature', 'Functional', 'Body'],
  // a real reason example (Ulthera → Sagging & firmness)
  reasonExample: "Ulthera is the only HIFU device cleared to target the SMAS, the exact connective layer a surgeon lifts in a facelift. By heating that layer it produces a genuine, non-surgical lift of the jaw and cheeks over 2–3 months.",
};

const DURATION_MAP = [
  ['temporary', 'Temporary (효과 일시적)'],
  ['months_3_6', '~3–6 months (3~6개월)'],
  ['months_6_12', '~6–12 months (6~12개월)'],
  ['year_1_2', '~1–2 years (1~2년)'],
  ['years_2_plus', '2+ years (2년 이상)'],
  ['semi_permanent', 'Semi-permanent (반영구)'],
  ['permanent', 'Permanent (영구)'],
];
const PAIN_MAP = [['soft', 'Soft 🙂 (거의 없음)'], ['mild', 'Mild 😐 (약간)'], ['hard', 'Hard 😣 (있음)']];
const RECOVERY_MAP = [['immediate', 'Back to normal right away ⚡ (바로 일상)'], ['1_2_days', '1–2 days 🌙 (1~2일)'], ['1_week_plus', '1 week or more 🗓️ (1주 이상)']];

/* ====================================================================== */
/* ===================  WORKBOOK A — 클라이언트 명세서  ================== */
/* ====================================================================== */
function buildClientSpec() {
  const sheets = [];

  // ---- 0. 안내 ----
  sheets.push(['0. 사용 안내', sheetFromRows([
    ['Glow Up Seoul — 웹사이트 문구 검수 시트'],
    [`스냅샷 기준일: ${TODAY}`],
    [],
    ['이 파일은 무엇인가요?'],
    ['고객이 보는 웹사이트(영문)의 모든 고정 문구를 페이지별로 정리한 검수표입니다.'],
    ['시트 탭(아래쪽)이 각 페이지(주소)에 해당합니다. 페이지를 눌러 이동하세요.'],
    [],
    ['어떻게 사용하나요?'],
    ['1) "현재 텍스트" 칸이 지금 사이트에 나오는 실제 문구입니다.'],
    ['2) 바꾸고 싶으면 "수정 원하는 텍스트" 칸에 새 문구를 적어주세요. (한글로 적어주셔도 됩니다 — 저희가 영문으로 다듬습니다)'],
    ['3) 그대로 두려면 "그대로 O / 수정 X" 칸에 O 를 적어주세요.'],
    ['4) 더 하고 싶은 말은 "비고" 칸에 자유롭게 적어주세요.'],
    [],
    ['참고'],
    ['· 시술/수술 "목록"과 "상세 페이지"의 내용(이름·설명·가격·효능 등)은 관리자 페이지에서 직접 수정합니다. (별도 파일: v3_admin_사용가이드.xlsx)'],
    ['· 이 시트는 관리자에서 못 바꾸는 "디자인에 박힌 고정 문구"를 검수하기 위한 것입니다.'],
    ['· 메인 상단 영상(hero.mp4)은 교체 대상이 아닙니다.'],
    [],
    ['페이지(시트) 목록'],
    ['홈 (/)'],
    ['시술 목록 (/treatments)'],
    ['수술 목록 (/surgeries)'],
    ['상세 페이지 공통 (/treatments/:이름, /surgeries/:이름)'],
    ['이용 방법 (/how-it-works)'],
    ['소개 (/about)'],
    ['공통 — 메뉴 / 푸터 / 하단 배너'],
    ['챗봇 (Romie 대화)'],
    ['사진 스캔 (팝업)'],
  ], [110])]);

  // ---- 홈 ----
  sheets.push(['홈 (·)', reviewSheet(
    '홈 페이지  ·  주소: /',
    '맨 위 영상 + 소개 + "두 갈래 길" 카드 + 한 줄 선언 + 하단 배너 순서입니다.',
    [
      ['상단 영상 위 — 작은 라벨', '큰 영상 위 작은 글씨', 'Seoul · medical concierge'],
      ['상단 영상 — 큰 제목', '가장 큰 헤드라인 (done right. 는 기울임 강조)', 'Your glow, done right.'],
      ['상단 영상 — 소개 문장', '제목 아래 설명', 'From skin treatments to surgery, one coordinator matches you to the best Seoul clinics and carries the whole journey — so you can skip the research.'],
      ['상단 영상 — 버튼 1', '채팅 여는 버튼', 'Start with Romie →'],
      ['상단 영상 — 버튼 2', '왓츠앱 버튼', 'Message on WhatsApp'],
      ['흐르는 띠 — 1', '숫자 + 설명이 가로로 흐름', '500+ patients matched'],
      ['흐르는 띠 — 2', '', '25+ countries'],
      ['흐르는 띠 — 3', '', '98% satisfaction'],
      ['흐르는 띠 — 4', '', '24h reply'],
      ['흐르는 띠 — 5', '', 'Hand-picked clinics only'],
      ['흐르는 띠 — 6', '', 'Ministry of Health registered'],
      ['두 갈래 섹션 — 라벨', '작은 라벨', 'Where to begin'],
      ['두 갈래 섹션 — 제목', '큰 제목 (One hand 기울임)', 'Two paths. One hand to guide you.'],
      ['카드 01 — 작은 글씨', '왼쪽 카드(피부) 상단', 'No scalpel · 1–3 days'],
      ['카드 01 — 제목', '', 'Skin & glow'],
      ['카드 01 — 설명', '', 'Lasers, lifting, boosters, contour — the quiet glow-up, then back to your trip.'],
      ['카드 01 — 링크', '', 'Explore treatments →'],
      ['카드 02 — 작은 글씨', '오른쪽 카드(수술) 상단', 'Surgical · escorted'],
      ['카드 02 — 제목', '', 'A real change'],
      ['카드 02 — 설명', '', 'Eyes, nose, contour, lift — planned, escorted on the day, recovered with care.'],
      ['카드 02 — 링크', '', 'Explore surgery →'],
      ['선언 문구', '배경색 위 큰 한 줄', 'Not a booking app. A personal concierge — just for you.'],
      ['선언 — 하단 3개', '작은 항목 3개', 'Founded 2022  /  Hand-picked clinics  /  One coordinator, start to finish'],
      ['(이미지) 카드 01 사진', '파일: home-path-skin.png', '피부/글로우 이미지'],
      ['(이미지) 카드 02 사진', '파일: home-path-change.png', '변화/인물 이미지'],
      ['(영상) 상단 배경', '파일: hero.mp4 — ※ 교체 안 함', '메인 영상'],
    ]
  )]);

  // ---- /treatments ----
  sheets.push(['시술목록 (treatments)', reviewSheet(
    '시술 목록 페이지  ·  주소: /treatments',
    '맨 위 큰 사진 + 제목 + 설명 아래로, 등록된 시술 카드가 자동으로 깔립니다. (카드 내용은 관리자에서 수정)',
    [
      ['상단 사진', '파일: treatments-hero.png', '흰 정장 여성 이미지'],
      ['작은 라벨', '제목 위', 'Non-surgical · 1–3 day trip'],
      ['큰 제목', 'glow. 는 기울임 강조', 'Skin & glow.'],
      ['설명 문장', '제목 아래', 'Lasers, lifting, boosters, contour — the quiet glow-up. Tap any to see how it works, what to expect, and what it costs.'],
      ['목록 로딩 안내', '카탈로그 못 불러올 때만 표시', "Catalog is loading — message Romie any time and she'll send a hand-picked shortlist."],
      ['카드 가격 표기', '가격 있을 때 / 없을 때', 'from ₩700,000  /  On consultation'],
      ['(자동) 시술 카드들', '관리자에 등록된 시술이 자동 노출 (현재 14개: Ulthera, Thermage, Rejuran, Shurink Universe …)', '카드 = 사진 + 이름 + 한줄설명 + 태그 + 가격'],
    ]
  )]);

  // ---- /surgeries ----
  sheets.push(['수술목록 (surgeries)', reviewSheet(
    '수술 목록 페이지  ·  주소: /surgeries',
    '제목 + 설명 아래로 등록된 수술 카드가 자동으로 깔립니다. (카드 내용은 관리자에서 수정)',
    [
      ['작은 라벨', '제목 위', 'Surgical · escorted journey'],
      ['큰 제목', 'change. 는 기울임 강조', 'A real change.'],
      ['설명 문장', '제목 아래', 'Eyes, nose, contour, lift. Carried carefully — planned in advance, escorted on the day, recovered with check-ins. Tap any to learn more.'],
      ['(자동) 수술 카드들', '관리자에 등록된 수술이 자동 노출 (현재 6개: Rhinoplasty, Double Eyelid Surgery, Ptosis Correction, Liposuction, Facelift, Cleft Lip / Palate)', '카드 = 사진 + 이름 + 한줄설명 + 태그 + 가격'],
    ]
  )]);

  // ---- 상세 공통 ----
  sheets.push(['상세 공통 (detail)', reviewSheet(
    '시술·수술 상세 페이지 — 고정 라벨  ·  주소: /treatments/이름, /surgeries/이름',
    '시술/수술 하나를 눌렀을 때 나오는 상세 페이지입니다. 이름·설명·가격·효능 등 "내용"은 관리자에서 수정하고, 아래는 디자인에 박힌 "고정 라벨"입니다.',
    [
      ['뒤로가기', '좌상단', '‹ Treatments   /   ‹ Surgery'],
      ['상단 작은 라벨', '시술 종류 + 태그', 'Non-surgical · Lifting · Non-invasive · HIFU  (수술은 Surgical)'],
      ['버튼 1', '상담 시작', 'Start a consultation →'],
      ['버튼 2', '왓츠앱', 'Ask on WhatsApp'],
      ['사진 위 작은 카드 A', '효과 지속', 'Results last'],
      ['사진 위 작은 카드 B', '회복 기간', 'Downtime'],
      ['요약 박스 제목', '오른쪽 고정 박스', 'At a glance'],
      ['요약 박스 항목', '4개 항목 라벨', 'Price  /  Results last  /  Comfort  /  Downtime'],
      ['"Helps with" 제목', '연결된 고민 표시', 'Helps with'],
      ['요약 박스 하단 CTA 제목', '({이름} 자리에 시술명)', 'Considering Ulthera?'],
      ['요약 박스 하단 CTA 문장', '', "Tell Romie and we'll arrange the right clinic, in your language."],
      ['요약 박스 하단 버튼', '', 'Start with Romie →'],
      ['장점/주의 — 왼쪽 제목', '', 'Good for'],
      ['장점/주의 — 오른쪽 제목', '', 'Things to note'],
      ['"왜 좋은지" 섹션 라벨', '', 'Why it helps'],
      ['"왜 좋은지" 섹션 제목', '({이름} 자리에 시술명)', 'Why Ulthera works for these concerns'],
      ['마지막 요약 라벨', '', 'In summary'],
      ['없는 페이지', '주소가 틀렸을 때', 'Not found  /  This page may be coming online. Back to the list.'],
      ['불러오는 중', '', 'Loading…'],
    ]
  )]);

  // ---- how it works ----
  sheets.push(['이용방법 (how-it-works)', reviewSheet(
    '이용 방법 페이지  ·  주소: /how-it-works',
    '상단 영상 + 4단계 설명입니다.',
    [
      ['상단 — 작은 라벨', '', 'How it works'],
      ['상단 — 큰 제목', 'steps. 기울임', 'Four quiet steps.'],
      ['상단 — 설명', '', 'No app to install. No account. Most of it happens on WhatsApp — quietly.'],
      ['1단계 — 제목', '', 'One message'],
      ['1단계 — 설명', '', "Tell Romie your concern on WhatsApp. That's the whole start."],
      ['2단계 — 제목', '', 'A hand-picked shortlist'],
      ['2단계 — 설명', '', 'We send 2–3 clinics that fit your skin, budget and dates — with reasons, not a directory.'],
      ['3단계 — 제목', '', 'Arrive & be guided'],
      ['3단계 — 설명', '', 'Met, interpreted, and walked through every step. You never face the clinic alone.'],
      ['4단계 — 제목', '', 'Aftercare home'],
      ['4단계 — 설명', '', 'Check-ins after you leave. A swelling question at 11pm? The same coordinator answers.'],
      ['(영상) 상단 배경', '파일: seoul-2.mp4 → seoul-1.mp4 (번갈아 재생)', '서울 영상'],
    ]
  )]);

  // ---- about ----
  sheets.push(['소개 (about)', reviewSheet(
    '소개 페이지  ·  주소: /about',
    '회사 소개 한 단락입니다.',
    [
      ['작은 라벨', '', 'About'],
      ['큰 제목', 'One journey. 기울임', 'One coordinator. One journey.'],
      ['본문', '소개 단락', "Glow Up Seoul is a Ministry of Health–registered concierge for foreign patients. We've spent a decade evaluating Korean clinics, and we work with only a hand-picked few — chosen on safety, doctor credentials, English fluency and aftercare. No marketplace. No noise. Just one person who carries your whole journey."],
      ['하단 작은 글씨', '', 'Founded 2022 · Seoul · Gangnam · Busan.'],
    ]
  )]);

  // ---- 공통 ----
  sheets.push(['공통 (메뉴·푸터·배너)', reviewSheet(
    '공통 요소 — 모든 페이지에 나오는 메뉴 / 하단 / 배너',
    '상단 메뉴, 페이지 맨 아래 푸터, 그리고 페이지마다 반복되는 "하단 배너"입니다.',
    [
      ['상단 메뉴 — 항목', '4개 메뉴', 'Treatments  /  Surgery  /  How it works  /  About'],
      ['상단 메뉴 — 버튼', '오른쪽 초록 버튼', 'WhatsApp'],
      ['(이미지) 로고', '파일: glowup-logo.png', '좌상단 로고'],
      ['하단 배너 — 제목', '거의 모든 페이지 맨 아래 (start? 기울임)', 'Not sure where to start?'],
      ['하단 배너 — 문장', '', 'Send one message. We reply within 24 hours — and quietly arrange the rest.'],
      ['하단 배너 — 버튼', '', 'Message Romie on WhatsApp'],
      ['푸터 — 소개', '맨 아래 회사 설명', 'A personal concierge for foreign patients in Seoul. Dermatology, plastic surgery, dental — fully handled, end to end.'],
      ['푸터 — Explore 묶음', '', 'Skin & glow  /  Surgery  /  How it works  /  About'],
      ['푸터 — 연락처', '', 'WhatsApp +82 10 6487 1060  /  glowupinseoul@gmail.com'],
      ['푸터 — 맨 아래줄', '저작권', '© 2026 Glow Up Seoul · Ministry of Health & Welfare registered   /   Seoul · Gangnam · Busan'],
      ['채팅 버튼', '우하단 떠있는 버튼', 'Chat with Romie'],
    ]
  )]);

  // ---- 챗봇 ----
  sheets.push(['챗봇 (Romie)', reviewSheet(
    '챗봇 대화 — Romie  ·  우하단 "Chat with Romie" 버튼으로 열림',
    '대화 흐름: 인사 → (사진보기/건너뛰기) → 목적 선택 → 부위 → 고민 → 추천 → 왓츠앱 전송. "부위/고민/추천 시술"은 관리자 데이터에서 자동으로 나옵니다.',
    [
      ['인사 1', '챗봇 첫 메시지', "Hi — I'm Romie, your Seoul beauty concierge."],
      ['인사 2', '', "Want me to take a quick look first? Share a photo and I'll suggest where to start — or we can just talk."],
      ['사진 보기 버튼', '인사 직후', 'Take a quick look  /  A photo → a starting point in seconds'],
      ['건너뛰기 버튼', '', "Skip — I'll answer a few questions"],
      ['건너뛰면 — 사용자 말풍선', '', "Let's just talk"],
      ['건너뛰면 — Romie', '', 'No problem. First, what brings you to Seoul?'],
      ['목적 선택 1', '버튼 (제목 / 부제)', 'A quiet glow-up  /  Skin · lifting · glow — no surgery'],
      ['목적 선택 2', '', 'A real change  /  Eyes · nose · contour — surgery'],
      ['목적 선택 3', '', 'Just exploring  /  Not sure yet — show me'],
      ['목적 응답 — glow', '선택 후 Romie 답', "A glow-up — lovely choice. Which area shall we focus on?"],
      ['목적 응답 — change', '', "A real change it is — we'll take good care of you. Which area shall we focus on?"],
      ['목적 응답 — explore', '', "Let's explore together. Which area shall we focus on?"],
      ['부위 다음 버튼', '부위 선택 화면', 'Continue  /  Not sure — continue'],
      ['부위→고민 Romie', '', 'Got it. And what would you most love to improve?'],
      ['고민 화면 사진버튼', '', 'Take a quick look  /  Let Romie suggest a starting point'],
      ['고민 다음 버튼', '', 'See my matches →'],
      ['추천 안내 (매칭 있음)', '', "Based on what you told me, here's what I'd explore for you."],
      ['추천 안내 (매칭 없음)', '', 'Thank you — all noted.'],
      ['전송 묻기', '', 'Shall I send your consultation request with these details?'],
      ['추천 카드 — 종류 라벨', '카드 우상단', 'Treatment  /  Surgery'],
      ['추천 카드 — 이유 라벨', '({고민} 자리에 고민명)', 'Why for Sagging & firmness'],
      ['요약 — 라벨 3개', '', 'Goal  /  Focus  /  Concerns'],
      ['전송 버튼', '왓츠앱으로 전송', 'Yes — send my request'],
      ['다시 시작', '', '↺ Start over'],
      ['다시 시작 — Romie', '', "Of course — let's start fresh. Want a quick look, or shall we just talk?"],
      ['왓츠앱 전송 메시지', '상담사에게 가는 자동 메시지 (구역 라벨)', "[Glow Up Seoul · Consultation Request] / WHAT I'M HERE FOR / SUGGESTED FOR ME / ASK · Please send me a hand-picked shortlist and the next steps."],
      ['오류 시 대체 버튼', '데이터 못 불러올 때', 'Message Romie on WhatsApp'],
    ]
  )]);

  // ---- 스캔 ----
  sheets.push(['사진 스캔 (팝업)', reviewSheet(
    '사진 스캔 팝업 — "Take a quick look" 누르면 열림',
    '셀카를 한 장 보고 어떤 고민부터 보면 좋을지 가볍게 제안하는 팝업입니다. (진단 아님 · 사진 저장 안 함)',
    [
      ['작은 라벨', '팝업 상단', 'Quick look'],
      ['제목 — 기본', '', 'Let me take a gentle look'],
      ['제목 — 분석 중', '', 'Looking…'],
      ['제목 — 오류', '', "Let's try that again"],
      ['카메라 준비', '', 'Starting camera…'],
      ['사진 올리기', '카메라 대신 / 카메라 안될 때', 'Upload a clear selfie  /  Camera unavailable — upload a clear selfie'],
      ['오류 안내', '전송 실패 시', "The photo didn't go through. It might be the connection — your photo was not saved."],
      ['버튼 — 촬영', '', 'Take photo →'],
      ['버튼 — 전환', '', 'Upload a photo instead  /  Use camera'],
      ['버튼 — 재시도', '', 'Try again →'],
      ['버튼 — 건너뛰기', '', "Skip — I'll answer a few questions"],
      ['개인정보 안내', '하단 작은 글씨', '◇ Analyzed once · never stored'],
    ]
  )]);

  return writeBook(sheets, 'v3_클라이언트_명세서.xlsx');
}

/* ====================================================================== */
/* ===================  WORKBOOK B — Admin 사용가이드  ================== */
/* ====================================================================== */
function buildAdminGuide() {
  const sheets = [];

  // ---- 0. 시작하기 ----
  sheets.push(['0. 시작하기', sheetFromRows([
    ['Glow Up Seoul — 관리자 페이지 사용 가이드'],
    [`스냅샷 기준일: ${TODAY}  ·  비전공자용`],
    [],
    ['관리자 페이지란?'],
    ['고객이 보는 웹사이트의 "시술 / 수술 / 고민" 내용을 직접 추가·수정하는 곳입니다.'],
    ['여기서 저장하면 고객 사이트에 바로 반영됩니다.'],
    [],
    ['들어가는 법'],
    ['1) 주소창에 우리 사이트 주소 뒤에 /admin 을 붙여 들어갑니다.  (예: glowupseoul.com/admin)'],
    ['2) 관리자 키(비밀번호)를 입력하고 Sign in 을 누릅니다.'],
    ['3) 키는 담당 개발자에게 받으세요. (분실/유출 시 바로 알려주세요)'],
    [],
    ['화면 구성 — 상단 탭 3개'],
    ['· Treatments  : 시술(비수술) 관리 — 울쎄라, 써마지, 필러 등'],
    ['· Surgeries   : 수술 관리 — 코, 눈, 지방흡입 등'],
    ['· 고민 Concerns : 부위와 고민 관리 — 챗봇 질문지와 추천의 바탕'],
    [],
    ['꼭 기억할 5가지 (중요!)'],
    ['① 모든 글자는 영어로 입력합니다. (고객이 외국인입니다)'],
    ['② "Visible on the site" 체크를 꺼두면 고객 사이트에서 사라집니다. 공개하려면 꼭 체크.'],
    ['③ Slug(영문 주소 키)는 한 번 정해지면 바꾸지 마세요. 링크가 깨집니다. (보통 자동 생성 — 건드릴 필요 없음)'],
    ['④ 사진은 필수는 아니지만, 없으면 카드가 밋밋합니다. 가능하면 넣어주세요.'],
    ['⑤ "고민 연결"이 매칭의 핵심입니다. 시술마다 어떤 고민에 좋은지 꼭 연결해 주세요.'],
    [],
    ['이 파일의 다른 시트(아래 탭)'],
    ['1. 시술 등록 따라하기   — 처음부터 끝까지 단계별'],
    ['2. 시술 필드 사전        — 칸마다 무슨 값인지 + 실제 예시 + 고객 화면 어디 보이는지'],
    ['3. 선택지 값 모음        — 통증/회복/지속 등 고를 수 있는 값'],
    ['4. 수술 관리             — 시술과 동일 (현재 등록된 6개)'],
    ['5. 고민 관리             — 부위 → 고민 구조'],
    ['6. 고민 연결 & 이유       — 매칭이 만들어지는 곳'],
    ['7. 태그(Tags)            — 키워드 칩'],
    ['8. 사진 가이드            — 어떤 사진이 어디에'],
    ['9. 자주 묻는 질문 / 주의   — 함정 모음'],
  ], [115])]);

  // ---- 1. 시술 등록 따라하기 ----
  sheets.push(['1. 시술 등록 따라하기', sheetFromRows([
    ['시술 하나를 처음부터 등록하는 순서 (예시: Ulthera)'],
    ['상단 Treatments 탭 → 오른쪽 위 "＋ New Treatment" 버튼으로 시작합니다.'],
    [],
    ['순서', '화면 항목', '무엇을 하나요', '예시로 이렇게 입력'],
    ['1', 'Name', '시술 이름 (영문, 필수)', 'Ulthera'],
    ['2', 'Short summary', '한 문장 설명', 'Non-invasive HIFU lifting that targets the SMAS layer.'],
    ['3', 'Photo', '대표 사진 — 끌어다 놓거나 클릭해서 업로드', '(시술 대표 이미지 1장)'],
    ['4', 'Tags', '키워드 — 입력 후 Enter, × 로 삭제', 'Lifting / Non-invasive / HIFU'],
    ['5', 'Description (Markdown)', '본문 전체. 오른쪽에 미리보기가 그대로 나옴', '## What to expect 같은 제목 + 목록으로 작성'],
    ['6', 'Reference price (KRW)', '참고 가격 (숫자만). 비우면 Consult 표시', '700000'],
    ['7', 'Price note', '가격 옆 작은 단서', 'from 300 shots (reference)'],
    ['8', 'How long it lasts', '효과 지속 — 보기 중 선택', '~1–2 years'],
    ['9', 'Pain level', '통증 — 보기 중 선택 (다시 누르면 해제)', 'Mild'],
    ['10', 'Recovery time', '회복 — 보기 중 선택', 'Back to normal right away'],
    ['11', 'Recovery note', '회복 관련 한 줄', 'Mild swelling can occur right after.'],
    ['12', 'Good for', '추천 대상 — 한 줄씩 추가', 'Tighten and lift without any incision'],
    ['13', 'Things to note', '유의점 — 한 줄씩 추가', 'Mild swelling or tingling can occur afterward'],
    ['14', '이 시술이 해결하는 고민', '고민 연결 + 각 이유 (매칭 핵심!)', 'Sagging & firmness → 왜 좋은지 이유 입력'],
    ['15', 'Advanced (optional)', '평소엔 안 건드려도 됨 (정렬순서/Slug/내부메모)', '비워두기'],
    ['16', 'Visible on the site', '체크되어 있어야 고객에게 보임', '✅ 체크'],
    ['17', 'Save', '맨 아래 Save 버튼으로 저장', '클릭 → 목록으로 돌아감'],
    [],
    ['수정할 때'],
    ['목록에서 해당 카드를 클릭 → 같은 화면이 열림 → 고치고 Save.'],
    ['삭제는 Edit 화면 맨 아래 빨간 Delete. (목록에서 숨겨집니다)'],
  ], [6, 26, 40, 46])]);

  // ---- 2. 시술 필드 사전 ----
  const fieldRows = [
    ['시술 / 수술 — 칸마다 무슨 값인가 (Treatments · Surgeries 공통)'],
    ['"고객 화면 어디에 보이나"를 보면 이 값이 사이트 어디에 나타나는지 알 수 있습니다.'],
    [],
    ['화면 항목', '무슨 값인가요', '실제 예시 (현재 DB)', '고객 화면 어디에 보이나', '필수?'],
    ['Name', '시술/수술 이름 (영문)', 'Ulthera · Shurink Universe · Rhinoplasty', '목록 카드 제목 · 상세 큰 제목 · 챗봇 추천 이름', '필수'],
    ['Short summary', '한 문장 설명', 'Non-invasive HIFU lifting that targets the SMAS layer.', '카드 부제 · 상세 부제 · 챗봇 추천 밑 설명', '권장'],
    ['Photo (thumbnail)', '대표 사진', '(S3에 업로드된 이미지)', '목록 카드 썸네일 · 상세 페이지 큰 사진', '권장'],
    ['Tags', '키워드(칩)', 'Lifting, Non-invasive, HIFU', '카드 하단 작은 칩 · 상세 상단 라벨', '선택'],
    ['Description', '본문 전체 (Markdown)', '제목·목록·굵게 등으로 작성한 긴 설명', '상세 페이지 본문 (가운데 큰 영역)', '권장'],
    ['Reference price (KRW)', '참고 가격(숫자)', '700000 → "₩700,000"', '카드 "from ₩700,000" · 상세 At a glance Price', '선택(비우면 Consult)'],
    ['Price note', '가격 옆 단서', 'from 300 shots (reference)', '상세 Price 옆 작은 글씨', '선택'],
    ['How long it lasts', '효과 지속(선택형)', 'year_1_2 → "~1–2 years"', '상세 "Results last"', '선택'],
    ['Pain level', '통증(선택형)', 'mild → "Mild"', '상세 "Comfort"', '선택'],
    ['Recovery time', '회복(선택형)', 'immediate → "Back to normal right away"', '목록 카드 ⏱ · 상세 "Downtime"', '선택'],
    ['Recovery note', '회복 단서', 'Some redness may appear right after.', '상세 Downtime 옆 작은 글씨', '선택'],
    ['Good for (benefits)', '추천 대상(여러 줄)', 'Tighten and lift without any incision', '상세 "Good for" 목록 · 마지막 요약', '선택'],
    ['Things to note (cautions)', '유의점(여러 줄)', 'Mild swelling can occur afterward', '상세 "Things to note" 목록', '선택'],
    ['이 시술이 해결하는 고민', '고민 + 이유(매칭)', 'Sagging & firmness — "Ulthera is the only HIFU…"', '상세 "Helps with" · "Why it helps" · 챗봇 추천/이유', '매칭 핵심'],
    ['Partner / concierge note', '내부 메모', '(자유 텍스트)', '고객에게 안 보임 (내부 참고용)', '선택'],
    ['Sort order', '정렬 순서(숫자)', '1, 2, 3 … (작을수록 먼저)', '목록/카드 노출 순서', '선택'],
    ['Slug', 'URL 영문 키', 'ulthera → 주소 /treatments/ulthera', '주소창 · 사진 폴더 이름', '자동(건드리지 말 것)'],
    ['Visible on the site', '공개 여부(체크)', '체크=보임 / 해제=숨김', '해제하면 사이트·챗봇 모두에서 사라짐', '중요'],
  ];
  sheets.push(['2. 시술 필드 사전', sheetFromRows(fieldRows, [24, 22, 40, 40, 18])]);

  // ---- 3. 선택지 값 모음 ----
  const choiceRows = [
    ['선택형 항목의 보기 값 (그냥 버튼으로 고르면 됩니다 — 참고용)'],
    [],
    ['효과 지속 (How long it lasts)'],
    ['저장되는 값', '화면 표시'],
    ...DURATION_MAP,
    [],
    ['통증 (Pain level)'],
    ['저장되는 값', '화면 표시'],
    ...PAIN_MAP,
    [],
    ['회복 (Recovery time)'],
    ['저장되는 값', '화면 표시'],
    ...RECOVERY_MAP,
    [],
    ['고민 연결의 관련도 (relevance)'],
    ['저장되는 값', '뜻'],
    ['primary', '주된 해결 (기본값)'],
    ['secondary', '보조적으로 도움'],
  ];
  sheets.push(['3. 선택지 값 모음', sheetFromRows(choiceRows, [22, 34])]);

  // ---- 4. 수술 관리 ----
  const surgRows = [
    ['수술(Surgeries) 관리'],
    ['입력 칸과 방법은 시술(Treatments)과 100% 동일합니다. 상단 Surgeries 탭에서 관리하세요.'],
    ['차이: 수술은 보통 통증/회복이 큼(Hard · 1 week or more), 가격대가 높습니다.'],
    [],
    ['현재 등록된 수술 (6개)', '', '', ''],
    ['이름', '한줄 설명', '참고가격', '연결된 고민'],
    ...SNAP.surgeries.map((s) => [s[0], s[1], s[2] == null ? 'Consult' : `₩${Number(s[2]).toLocaleString()}`, '']),
    [],
    ['연결된 고민 (참고)'],
    ['Rhinoplasty → Nose shape'],
    ['Double Eyelid Surgery → Double eyelid'],
    ['Ptosis Correction → Droopy eyelid'],
    ['Liposuction → Localized fat'],
    ['Facelift → Deep facial sagging'],
    ['Cleft Lip / Palate → Cleft lip / palate'],
    [],
    ['참고: 현재 수술은 "고민 연결"은 되어 있으나 "이유(reason)"가 비어 있습니다.'],
    ['상세 페이지의 "Why it helps"와 챗봇의 "Why for…"를 채우려면 각 수술의 고민 연결에 이유를 적어주세요.'],
  ];
  sheets.push(['4. 수술 관리', sheetFromRows(surgRows, [26, 44, 16, 26])]);

  // ---- 5. 고민 관리 ----
  const concernRows = [
    ['고민(Concerns) 관리 — 챗봇 질문지와 추천의 바탕'],
    ['구조: 부위(Area) → 그 안에 세부 고민(Concern). 부위 카드를 클릭하면 아래에 고민 목록이 펼쳐집니다.'],
    ['상단 "고민 Concerns" 탭 → "시술(비수술)" / "수술" 하위 탭으로 나뉩니다. (track)'],
    [],
    ['이게 고객 화면 어디에 쓰이나요?'],
    ['· 챗봇에서 "어느 부위?" → "어떤 고민?" 질문의 선택지로 나옵니다.'],
    ['· 시술의 "고민 연결"과 만나 추천(매칭)이 됩니다.'],
    [],
    ['현재 등록 — 시술(비수술)용 부위 → 고민', '', ''],
    ['부위(Area)', '세부 고민(Concerns)', ''],
    ...SNAP.areas.non_surgical.map((a) => [a, (SNAP.concernsByArea[a] || []).join(', '), '']),
    [],
    ['현재 등록 — 수술용 부위 → 고민', '', ''],
    ['부위(Area)', '세부 고민(Concerns)', ''],
    ...SNAP.areas.surgical.map((a) => [a, (SNAP.concernsByArea[a] || []).join(', '), '']),
    [],
    ['추가/수정 방법'],
    ['· 새 부위: 상단 입력칸에 이름 적고 "＋ 부위 추가".'],
    ['· 새 고민: 부위 카드 클릭 → 펼쳐진 곳 "＋ 세부 고민 추가".'],
    ['· 이름 클릭하면 바로 수정됩니다. × 로 삭제.'],
    ['· 주의: 부위를 삭제하면 그 안의 고민도 함께 사라집니다.'],
  ];
  sheets.push(['5. 고민 관리', sheetFromRows(concernRows, [22, 52, 8])]);

  // ---- 6. 고민 연결 & 이유 ----
  const linkRows = [
    ['고민 연결 & 이유(reason) — 매칭이 만들어지는 곳'],
    ['시술 편집 화면 아래쪽 "이 시술이 해결하는 고민"에서 연결합니다.'],
    [],
    ['무엇을 하나요?'],
    ['1) 이 시술이 좋은 고민을 골라 연결합니다. (여러 개 가능)'],
    ['2) 각 고민마다 "왜 이 시술이 이 고민에 좋은지" 이유를 영어로 적습니다.'],
    [],
    ['이유(reason)는 고객 화면 어디에 보이나요?'],
    ['· 상세 페이지 "Why it helps" 섹션 (고민별 카드)'],
    ['· 챗봇 추천 카드의 "Why for OOO" 설명'],
    [],
    ['연결만 하고 이유를 비우면?'],
    ['· 추천(매칭)에는 잡히지만, "왜 좋은지" 설명은 안 나옵니다. → 이유를 꼭 채워주세요.'],
    [],
    ['실제 예시 (Ulthera → Sagging & firmness)'],
    ['고민', 'Sagging & firmness'],
    ['이유(reason)', SNAP.reasonExample],
    [],
    ['현재 상태'],
    ['· 시술(비수술) 이유: 32건 입력됨 (대부분 채워짐)'],
    ['· 수술 이유: 비어 있음 → 채우면 더 좋습니다.'],
  ];
  sheets.push(['6. 고민 연결 & 이유', sheetFromRows(linkRows, [18, 80])]);

  // ---- 7. 태그 ----
  const tagRows = [
    ['태그(Tags) — 키워드 칩'],
    ['시술/수술에 붙이는 짧은 키워드입니다. 입력 후 Enter로 추가, × 로 삭제.'],
    ['이미 있는 태그는 자동완성으로 뜨고, 새 단어는 자동으로 새 태그가 됩니다.'],
    [],
    ['고객 화면 어디에 보이나요?'],
    ['· 목록 카드 하단의 작은 칩 (최대 3개)'],
    ['· 상세 페이지 상단 라벨 (예: Non-surgical · Lifting · Non-invasive · HIFU)'],
    [],
    [`현재 등록된 태그 (${SNAP.tags.length}개)`],
    [SNAP.tags.join(', ')],
    [],
    ['팁'],
    ['· 같은 의미는 같은 단어로 통일하세요 (예: "lifting"을 매번 새로 만들지 말고 기존 Lifting 선택).'],
    ['· 너무 많이 달지 마세요. 카드엔 3개까지만 보입니다.'],
  ];
  sheets.push(['7. 태그(Tags)', sheetFromRows(tagRows, [100])]);

  // ---- 8. 사진 가이드 ----
  const photoRows = [
    ['사진 가이드 — 어떤 사진이 어디에 보이나'],
    [],
    ['종류', '어디서 올리나', '고객 화면 위치', '권장'],
    ['시술/수술 대표사진', '시술/수술 편집 화면 "Photo"', '목록 카드 썸네일 · 상세 페이지 큰 사진', '정사각형~세로, 인물/시술 분위기. 밝고 깔끔하게.'],
    ['(코드에 박힌) 홈 카드 01', '개발자에게 파일 전달: home-path-skin.png', '홈 "두 갈래 길" 왼쪽 카드', '피부/글로우 느낌'],
    ['(코드에 박힌) 홈 카드 02', '개발자에게 파일 전달: home-path-change.png', '홈 오른쪽 카드', '변화/인물 느낌'],
    ['(코드에 박힌) 시술목록 상단', '개발자에게 파일 전달: treatments-hero.png', '/treatments 맨 위 큰 사진', '브랜드 톤 인물 컷'],
    ['(코드에 박힌) 로고', '개발자에게 파일 전달: glowup-logo.png', '상단/푸터 로고', '투명 배경 PNG'],
    ['(코드에 박힌) 메인 영상', '교체 안 함', '홈 상단 배경', 'hero.mp4 (고정)'],
    [],
    ['주의'],
    ['· 사진이 없으면 카드에 이름 첫 글자만 회색으로 표시됩니다 (밋밋함).'],
    ['· "코드에 박힌" 이미지는 관리자에서 못 바꿉니다. 교체하려면 개발자에게 파일을 주세요.'],
    ['· 환자 사진(전후 등)은 반드시 서면 동의 후에만 사용하세요.'],
  ];
  sheets.push(['8. 사진 가이드', sheetFromRows(photoRows, [24, 40, 38, 34])]);

  // ---- 9. FAQ / 주의 ----
  const faqRows = [
    ['자주 묻는 질문 / 함정 모음'],
    [],
    ['질문 / 상황', '답 / 해결'],
    ['저장했는데 사이트에 안 보여요', '"Visible on the site" 체크가 꺼져 있는지 확인하세요. 꺼져 있으면 숨겨집니다.'],
    ['가격을 비워도 되나요?', '네. 비우면 고객 화면에 "On consultation / Consult"로 표시됩니다.'],
    ['이름/내용을 한글로 적어도 되나요?', '안 됩니다. 고객이 외국인이라 영어로 적어야 합니다. 한글로 초안을 주시면 저희가 다듬습니다.'],
    ['Slug를 바꿔도 되나요?', '바꾸지 마세요. 주소·링크·사진 폴더가 깨집니다. 보통 자동 생성되니 그대로 두세요.'],
    ['추천(매칭)이 안 떠요', '시술에 "고민 연결"이 되어 있는지, 그 고민이 챗봇 부위/고민과 연결돼 있는지 확인하세요.'],
    ['"Why for…" 설명이 안 나와요', '고민 연결은 했지만 "이유(reason)"가 비어 있는 경우입니다. 이유를 채우면 나옵니다.'],
    ['수술도 같은 방식인가요?', '네, 완전히 동일합니다. 상단 Surgeries 탭에서만 다룹니다.'],
    ['사진은 꼭 넣어야 하나요?', '필수는 아니지만 권장합니다. 없으면 카드가 밋밋합니다.'],
    ['실수로 삭제했어요', '삭제는 "숨김" 처리(soft delete)라 데이터는 남습니다. 복구는 개발자에게 문의하세요.'],
    ['관리자 키를 잊었어요 / 유출됐어요', '바로 개발자에게 알려 키를 재발급/교체하세요.'],
    [],
    ['반영이 안 될 때 (개발자용 참고)'],
    ['· 새 기능(예: 스캔)을 막 추가했다면 서버를 한 번 재시작해야 반영될 수 있습니다.'],
  ];
  sheets.push(['9. 자주 묻는 질문', sheetFromRows(faqRows, [38, 72])]);

  return writeBook(sheets, 'v3_admin_사용가이드.xlsx');
}

/* ============================ run ============================ */
// NOTE: 클라이언트 명세서(v3_클라이언트_명세서.xlsx)는 셀 스타일(배경/테두리)을 위해
// scripts/export_v3_client_spec.py (openpyxl)로 이관됨. 여기선 admin xlsx만 생성.
// 관리자 가이드 발표용 PPTX는 scripts/export_v3_admin_pptx.py.
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
void buildClientSpec; // (legacy, 사용 안 함 — 스타일판은 python으로)
const b = buildAdminGuide();
console.log('생성 완료:');
console.log('  · ' + b);
console.log('  (클라이언트 명세서는 python scripts/export_v3_client_spec.py 로 생성)');

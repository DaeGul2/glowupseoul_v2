/* eslint-disable */
// =====================================================================
// Glow Up Seoul — 운영자(어드민) 사용 설명서 → 예쁜 PPTX 생성기
//
//   node build-admin-ppt.cjs
//   → docs/admin-manual.pptx
//
// 내용 SoT = docs/admin-manual.md (이 스크립트는 그 내용을 슬라이드화).
// 톤 = 브랜드 팔레트 (샴페인골드 / 차콜 / warm white). 한국어 = Malgun Gothic.
// 섹션마다 디바이더 1장 + 내용 N장. 표는 자동 페이지네이션.
// =====================================================================

const path = require('path');
const pptxgen = require('pptxgenjs');

// ── 팔레트 ────────────────────────────────────────────────────────────
const C = {
  warm: 'FAFAF7',   // 배경
  paper: 'FFFFFF',
  char: '18181A',   // 차콜 (제목)
  ink: '3A3A3C',    // 본문
  gold: 'C9A063',   // 골드 (포인트)
  champ: 'B8916A',  // 샴페인
  soft: 'F2ECE1',   // 연한 골드 톤 (행 줄무늬)
  line: 'E6E0D6',
  patient: '2E7D32',
  match: 'B07A1E',
  internal: '9A9A9A',
};
const FONT = 'Malgun Gothic';
const FONT_H = 'Malgun Gothic';

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
pptx.author = 'Glow Up Seoul';
pptx.company = 'Glow Up Seoul';
pptx.subject = '운영자 어드민 사용 설명서';
pptx.title = 'Glow Up Seoul — 운영자 매뉴얼';

const W = 13.33, H = 7.5;
const MX = 0.85; // 좌우 여백

// ── 공용 장식 ─────────────────────────────────────────────────────────
function deco(slide, { footer = true, label = '' } = {}) {
  slide.background = { color: C.warm };
  // 좌측 골드 세로 바
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.16, h: H, fill: { color: C.gold } });
  if (label) {
    slide.addText(label.toUpperCase(), {
      x: MX, y: 0.32, w: 9, h: 0.3, fontFace: FONT, fontSize: 11, color: C.champ,
      charSpacing: 3, bold: true,
    });
  }
  if (footer) {
    slide.addText('Glow Up Seoul · 운영자 매뉴얼', {
      x: MX, y: H - 0.42, w: 6, h: 0.3, fontFace: FONT, fontSize: 9, color: C.internal,
    });
    slide.addText('✦', { x: W - 0.7, y: H - 0.5, w: 0.4, h: 0.4, fontFace: FONT, fontSize: 12, color: C.gold, align: 'center' });
  }
}

// 노출 위치 셀 색
function locCell(kind) {
  if (kind === 'patient') return { text: '환자에게 보임', options: { color: C.patient, bold: true } };
  if (kind === 'match')   return { text: '추천에만 영향', options: { color: C.match, bold: true } };
  if (kind === 'internal')return { text: '내부용',       options: { color: C.internal } };
  return { text: kind || '', options: { color: C.ink } };
}

// ── 제목/표지 ─────────────────────────────────────────────────────────
function titleSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.char };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.16, fill: { color: C.gold } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.16, w: W, h: 0.16, fill: { color: C.gold } });
  s.addText('GLOW UP SEOUL', {
    x: 0, y: 2.0, w: W, h: 0.5, align: 'center', fontFace: FONT_H, fontSize: 16,
    color: C.gold, charSpacing: 6, bold: true,
  });
  s.addText('운영자 어드민 사용 설명서', {
    x: 0, y: 2.7, w: W, h: 1.0, align: 'center', fontFace: FONT_H, fontSize: 40,
    color: C.warm, bold: true,
  });
  s.addText('처음 보는 사람도 이 문서 하나로 어드민과 홈페이지를 운영할 수 있도록', {
    x: 0, y: 3.85, w: W, h: 0.5, align: 'center', fontFace: FONT, fontSize: 15, color: 'CFC8BC',
  });
  s.addText('IT 용어 없이 · 모든 입력 칸 빠짐없이 · 예시와 함께', {
    x: 0, y: 4.35, w: W, h: 0.4, align: 'center', fontFace: FONT, fontSize: 12, color: C.champ, charSpacing: 2,
  });
  s.addText('2026 · Korea Medical Tourism Concierge', {
    x: 0, y: H - 0.95, w: W, h: 0.3, align: 'center', fontFace: FONT, fontSize: 10, color: '8A8378', charSpacing: 2,
  });
}

// ── 목차 ──────────────────────────────────────────────────────────────
function agendaSlide(sections) {
  const s = pptx.addSlide();
  deco(s, { label: 'Contents' });
  s.addText('목차', { x: MX, y: 0.7, w: 8, h: 0.7, fontFace: FONT_H, fontSize: 30, bold: true, color: C.char });
  s.addShape(pptx.ShapeType.line, { x: MX, y: 1.5, w: 2.0, h: 0, line: { color: C.gold, width: 2 } });

  const items = sections.map((sec) => ({ n: sec.n, t: sec.title }));
  const colCount = 2;
  const per = Math.ceil(items.length / colCount);
  const colW = (W - MX * 2 - 0.5) / colCount;
  for (let c = 0; c < colCount; c++) {
    const slice = items.slice(c * per, (c + 1) * per);
    const x = MX + c * (colW + 0.5);
    const rows = slice.map((it) => ([
      { text: String(it.n).padStart(2, '0'), options: { color: C.gold, bold: true, fontFace: FONT_H, fontSize: 13, align: 'center', valign: 'middle' } },
      { text: it.t, options: { color: C.ink, fontFace: FONT, fontSize: 13, valign: 'middle' } },
    ]));
    s.addTable(rows, {
      x, y: 1.8, w: colW, colW: [0.7, colW - 0.7],
      border: { type: 'solid', color: C.line, pt: 0.5 },
      rowH: 0.46, valign: 'middle', margin: [2, 6, 2, 6],
    });
  }
}

// ── 섹션 디바이더 ─────────────────────────────────────────────────────
function dividerSlide(sec) {
  const s = pptx.addSlide();
  s.background = { color: C.char };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.16, h: H, fill: { color: C.gold } });
  s.addText(String(sec.n).padStart(2, '0'), {
    x: MX, y: 1.5, w: 4, h: 1.6, fontFace: FONT_H, fontSize: 96, bold: true, color: C.gold,
  });
  s.addText(sec.title, {
    x: MX, y: 3.25, w: W - MX * 2, h: 1.0, fontFace: FONT_H, fontSize: 38, bold: true, color: C.warm,
  });
  if (sec.subtitle) {
    s.addText(sec.subtitle, {
      x: MX, y: 4.35, w: W - MX * 2, h: 1.2, fontFace: FONT, fontSize: 16, color: 'CFC8BC', lineSpacingMultiple: 1.2,
    });
  }
  if (sec.star) {
    s.addText('★ 가장 중요', { x: MX, y: 5.7, w: 4, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: C.gold, charSpacing: 2 });
  }
}

// ── 내용 슬라이드 헤더 ────────────────────────────────────────────────
function contentHeader(s, sec, suffix) {
  deco(s, { label: `${String(sec.n).padStart(2, '0')} · ${sec.menu || sec.title}` });
  s.addText(sec.title + (suffix ? `  —  ${suffix}` : ''), {
    x: MX, y: 0.62, w: W - MX * 2, h: 0.7, fontFace: FONT_H, fontSize: 24, bold: true, color: C.char,
  });
  s.addShape(pptx.ShapeType.line, { x: MX, y: 1.32, w: 1.6, h: 0, line: { color: C.gold, width: 2 } });
}

// 불릿 박스
function bulletsBlock(s, x, y, w, items, { title } = {}) {
  let cy = y;
  if (title) {
    s.addText(title, { x, y: cy, w, h: 0.34, fontFace: FONT_H, fontSize: 13, bold: true, color: C.champ });
    cy += 0.42;
  }
  const txt = items.map((it) => ({
    text: it, options: { bullet: { code: '2022', indent: 14 }, color: C.ink, fontSize: 12.5, fontFace: FONT, paraSpaceAfter: 6, lineSpacingMultiple: 1.05 },
  }));
  s.addText(txt, { x, y: cy, w, h: y + 5.5 - cy, valign: 'top' });
}

// 필드 표 (칸 / 무엇을 넣나·예시 / 필수 / 노출) — 페이지네이션
function fieldTableSlides(sec, fields, { perPage = 8, intro } = {}) {
  const head = [
    { text: '입력 칸', options: hcell() },
    { text: '무엇을 넣나 · 예시', options: hcell() },
    { text: '필수', options: hcell('center') },
    { text: '노출', options: hcell('center') },
  ];
  const colW = [2.6, 6.45, 0.78, 1.77];
  const pages = Math.ceil(fields.length / perPage);
  for (let p = 0; p < pages; p++) {
    const s = pptx.addSlide();
    contentHeader(s, sec, pages > 1 ? `입력 칸 (${p + 1}/${pages})` : '입력 칸');
    let topY = 1.55;
    if (intro && p === 0) {
      s.addText(intro, { x: MX, y: 1.45, w: W - MX * 2, h: 0.7, fontFace: FONT, fontSize: 12.5, color: C.ink, italic: false, lineSpacingMultiple: 1.05 });
      topY = 2.2;
    }
    const chunk = fields.slice(p * perPage, (p + 1) * perPage);
    const rows = [head];
    chunk.forEach((f, i) => {
      const zebra = i % 2 === 1 ? { fill: { color: C.soft } } : { fill: { color: C.paper } };
      rows.push([
        { text: f.name + (f.req ? '  *' : ''), options: { ...zebra, color: C.char, bold: true, fontFace: FONT, fontSize: 11, valign: 'middle', margin: [3, 6, 3, 6] } },
        { text: f.desc, options: { ...zebra, color: C.ink, fontFace: FONT, fontSize: 10.5, valign: 'middle', margin: [3, 6, 3, 6] } },
        { text: f.req ? '★' : '', options: { ...zebra, color: C.gold, bold: true, align: 'center', valign: 'middle', fontSize: 11 } },
        { ...locCell(f.loc), options: { ...locCell(f.loc).options, ...zebra, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 9.5, margin: [2, 3, 2, 3] } },
      ]);
    });
    s.addTable(rows, {
      x: MX, y: topY, w: W - MX * 2, colW,
      border: { type: 'solid', color: C.line, pt: 0.5 },
      autoPage: false, valign: 'middle',
    });
    // 범례
    s.addText([
      { text: '★ 필수   ', options: { color: C.gold, bold: true, fontSize: 9 } },
      { text: '·  ', options: { color: C.line, fontSize: 9 } },
      { text: '환자에게 보임 ', options: { color: C.patient, bold: true, fontSize: 9 } },
      { text: '· 추천에만 영향 ', options: { color: C.match, bold: true, fontSize: 9 } },
      { text: '· 내부용', options: { color: C.internal, fontSize: 9 } },
    ], { x: MX, y: H - 0.74, w: W - MX * 2, h: 0.25, fontFace: FONT, align: 'left' });
  }
}
function hcell(align = 'left') {
  return { fill: { color: C.char }, color: C.warm, bold: true, fontFace: FONT_H, fontSize: 11, align, valign: 'middle', margin: [4, 6, 4, 6] };
}

// 일반 표 (자유 헤더/행)
function genericTableSlide(sec, suffix, headLabels, rows, { colW, intro } = {}) {
  const s = pptx.addSlide();
  contentHeader(s, sec, suffix);
  let topY = 1.55;
  if (intro) {
    s.addText(intro, { x: MX, y: 1.45, w: W - MX * 2, h: 0.7, fontFace: FONT, fontSize: 12.5, color: C.ink, lineSpacingMultiple: 1.05 });
    topY = 2.15;
  }
  const head = headLabels.map((t, i) => ({ text: t, options: hcell(i === 0 ? 'left' : 'left') }));
  const body = rows.map((r, ri) => {
    const zebra = ri % 2 === 1 ? C.soft : C.paper;
    return r.map((cell, ci) => {
      if (cell && typeof cell === 'object') {
        return { text: cell.text, options: { fill: { color: zebra }, fontFace: FONT, fontSize: 11, valign: 'middle', margin: [3, 6, 3, 6], color: C.ink, ...cell.options } };
      }
      return { text: cell, options: { fill: { color: zebra }, color: ci === 0 ? C.char : C.ink, bold: ci === 0, fontFace: FONT, fontSize: 11, valign: 'middle', margin: [3, 6, 3, 6] } };
    });
  });
  s.addTable([head, ...body], { x: MX, y: topY, w: W - MX * 2, colW, border: { type: 'solid', color: C.line, pt: 0.5 }, valign: 'middle', autoPage: false });
  return s;
}

// 콜아웃 박스
function calloutSlide(sec, suffix, title, lines, tone = 'gold') {
  const s = pptx.addSlide();
  contentHeader(s, sec, suffix);
  const bar = tone === 'warn' ? 'B23A3A' : C.gold;
  s.addShape(pptx.ShapeType.rect, { x: MX, y: 1.7, w: W - MX * 2, h: 4.4, fill: { color: C.paper }, line: { color: C.line, width: 1 } });
  s.addShape(pptx.ShapeType.rect, { x: MX, y: 1.7, w: 0.12, h: 4.4, fill: { color: bar } });
  s.addText(title, { x: MX + 0.4, y: 1.95, w: W - MX * 2 - 0.7, h: 0.5, fontFace: FONT_H, fontSize: 18, bold: true, color: C.char });
  const txt = lines.map((it) => ({
    text: it, options: { bullet: { code: '2022', indent: 14 }, color: C.ink, fontSize: 13, fontFace: FONT, paraSpaceAfter: 9, lineSpacingMultiple: 1.1 },
  }));
  s.addText(txt, { x: MX + 0.45, y: 2.55, w: W - MX * 2 - 0.9, h: 3.3, valign: 'top' });
  return s;
}

// =====================================================================
// 콘텐츠 정의
// =====================================================================
const sections = [];
function S(def) { sections.push(def); return def; }

// 00
S({ n: 0, title: '시작하기 전에', menu: '시작', subtitle: '로그인 · 메뉴 구조 · 모든 화면 공통 규칙', build(sec) {
  calloutSlide(sec, '어드민이 뭔가요', '홈페이지 vs 어드민', [
    '홈페이지 = 외국 환자가 보는 화면 (영어/중국어).',
    '어드민 = 운영자만 들어가는 관리 화면 (한국어). 주소: 우리사이트/admin',
    '어드민에서 입력한 내용이 곧 홈페이지에 나타납니다 — 어드민이 원본, 홈페이지가 결과물.',
    '로그인: /admin 접속 → 관리자 키 입력 (운영 책임자에게 받기).',
  ]);
  genericTableSlide(sec, '왼쪽 메뉴 구조 (5개 묶음)', ['묶음', '메뉴', '설명'], [
    ['카탈로그 (기본 재료)', '카테고리 · 시술 · 기기 · 고민', '병원과 무관한 "정보 그 자체". 모든 것의 바탕.'],
    ['매트릭스 (연결)', '고민↔시술 · 시술↔기기', '재료들을 연결. 자동 추천 품질의 80%가 여기서.'],
    ['병원 · 인력', '병원 · 의사 · B&A', '실제 병원/의사/전후사진. 신뢰 시그널.'],
    ['콘텐츠', '실시간 피드', '메인에 흐르는 "M. in Singapore — HIFU" 사회적 증거.'],
    ['운영 · 모니터링', 'AI 스캔 내역', '비용/호출 기록 보기 전용. 입력 안 함.'],
  ], { colW: [3.1, 4.0, 4.53] });
  calloutSlide(sec, '모든 화면 공통 규칙 (꼭)', '7가지 기본 규칙', [
    '별표(*) = 반드시 입력. 비우면 저장 안 됨.',
    'URL 식별자 = 영문 소문자+숫자+밑줄(예: hifu_face). 주소·사진폴더·연결에 사용. 한 번 정하면 절대 변경 금지, 같은 메뉴 내 중복 금지.',
    '사진 칸 = 끌어놓거나 클릭해 업로드 → 자동 저장. 주소를 손으로 칠 필요 없음.',
    '다국어 칸 = 한국어/영어는 꼭, 중국어는 가능한 채우기(중국 환자 비중 큼).',
    '"활성(사이트 노출)" 체크 해제 = 홈페이지에서 숨김.',
    '저장 후 "저장됨" 메시지 = 성공. 삭제는 완전삭제 아닌 숨김(복구 가능).',
    '각 칸 라벨 옆 ? 에 마우스 올리면 설명이 뜸.',
  ]);
} });

// 01
S({ n: 1, title: '입력 순서', menu: '전체 흐름', subtitle: '뒤 항목이 앞 항목을 필요로 합니다 — 반드시 이 순서로', build(sec) {
  const s = pptx.addSlide();
  contentHeader(s, sec, '8단계');
  const steps = [
    ['1', '카테고리', '이미 8개 들어있음 — 사진만 추가'],
    ['2', '고민', '환자가 쓰는 검색 키워드'],
    ['3', '시술', 'HIFU 리프팅 등 시술 자체'],
    ['4', '기기', '울쎄라 등 장비 브랜드'],
    ['5', '고민↔시술 매트릭스', '★ 추천 품질의 핵심'],
    ['6', '시술↔기기 매트릭스', '시술별 가능 장비'],
    ['7', '병원', '+ 브랜드·제공시술·의사·전후사진 한 화면'],
    ['8', '실시간 피드', '메인 부팅용 5~10개'],
  ];
  const rows = steps.map((st, i) => ([
    { text: st[0], options: { fill: { color: C.gold }, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle', fontFace: FONT_H, fontSize: 15 } },
    { text: st[1], options: { fill: { color: i % 2 ? C.soft : C.paper }, color: C.char, bold: true, fontFace: FONT, fontSize: 13, valign: 'middle', margin: [4, 8, 4, 8] } },
    { text: st[2], options: { fill: { color: i % 2 ? C.soft : C.paper }, color: C.ink, fontFace: FONT, fontSize: 12, valign: 'middle', margin: [4, 8, 4, 8] } },
  ]));
  s.addTable(rows, { x: MX, y: 1.7, w: W - MX * 2, colW: [0.8, 3.6, 7.23], border: { type: 'solid', color: C.line, pt: 0.5 }, rowH: 0.5, valign: 'middle' });
  s.addText('처음 비어있는 환경이라면 병원 1곳당 약 30분. 자세한 의존관계는 docs/data_seeding_order.xlsx 참조.', { x: MX, y: 6.55, w: W - MX * 2, h: 0.4, fontFace: FONT, fontSize: 11, color: C.internal, italic: true });
} });

// 02 카테고리
S({ n: 2, title: '카테고리', menu: '카탈로그 > 카테고리', subtitle: '시술과 고민을 묶는 가장 큰 분류 (얼굴/눈/코/바디/피부/헤어/웰니스/치과)', build(sec) {
  fieldTableSlides(sec, [
    { name: 'URL 식별자', desc: 'face, eyes, nose 같은 영문 키', req: true, loc: 'patient' },
    { name: '카테고리명 (한국어)', desc: '얼굴, 눈, 코', req: true, loc: 'patient' },
    { name: '카테고리명 (영어)', desc: 'Face, Eyes, Nose', req: true, loc: 'patient' },
    { name: '카테고리명 (중/일)', desc: '面部 / 顔 (선택)', loc: 'internal' },
    { name: '도메인', desc: '얼굴미용/바디/재생/수술/피부과/치과 중 선택', req: true, loc: 'internal' },
    { name: '상위 카테고리', desc: '보통 비움 (하위 카테고리 만들 때만)', loc: 'internal' },
    { name: '노출 순서', desc: '낮은 숫자가 먼저. 예: 10, 20, 30', loc: 'patient' },
    { name: '카테고리 페이지 히어로', desc: '가로 넓은 큰 사진(1600px+) = 홈 카드 배경 사진', loc: 'patient' },
    { name: '카드 썸네일', desc: '현재 카드는 위 히어로를 사용', loc: 'internal' },
    { name: '활성 (사이트 노출)', desc: '보통 체크', loc: 'patient' },
  ], { intro: '대부분 새로 만들기보다 "사진만 채우는" 일입니다. 홈 카드 배경은 "카테고리 페이지 히어로" 칸을 씁니다 — 8개 모두 채우세요.' });
} });

// 03 고민
S({ n: 3, title: '고민 (검색 키워드)', menu: '카탈로그 > 고민', subtitle: '외국 환자가 자기 문제를 부르는 표현 — 시술명이 아니라 환자 언어 그대로', build(sec) {
  fieldTableSlides(sec, [
    { name: 'URL 식별자', desc: 'sagging, pores, acne_scars', req: true, loc: 'internal' },
    { name: '고민 (한국어)', desc: '처짐, 모공, 여드름 흉터', req: true, loc: 'patient' },
    { name: '고민 (영어)', desc: 'sagging, pores, acne scars', req: true, loc: 'patient' },
    { name: '고민 (중/일)', desc: '松弛, 毛孔 (선택)', loc: 'internal' },
    { name: '설명 (한/영)', desc: '(선택) 짧은 설명', loc: 'internal' },
    { name: '카테고리', desc: '이름으로 검색 선택 → 스캔 화면에서 고민을 그룹으로 묶음', loc: 'patient' },
    { name: '주 부위 (보조)', desc: 'face / body / skin 등 거친 분류 (통계용)', req: true, loc: 'internal' },
    { name: '노출 순서', desc: '낮을수록 먼저', loc: 'patient' },
    { name: '활성', desc: '보통 체크', loc: 'patient' },
  ], { intro: '스캔 화면에서 환자가 고르는 칩(버튼)이 됩니다. "카테고리"를 채우면 칩들이 얼굴·피부 식으로 깔끔히 묶입니다.' });
} });

// 04 시술
S({ n: 4, title: '시술', menu: '카탈로그 > 시술', subtitle: '병원과 무관한 "시술 그 자체" 정보 (가격·장비는 병원별로 따로)', build(sec) {
  fieldTableSlides(sec, [
    { name: 'URL 식별자', desc: 'hifu_face, rhinoplasty_revision', req: true, loc: 'patient' },
    { name: '카테고리', desc: '이름으로 검색 선택 (어느 그리드에 들어갈지)', loc: 'patient' },
    { name: '시술명 (한국어)', desc: 'HIFU 얼굴 리프팅', req: true, loc: 'patient' },
    { name: '시술명 (영어)', desc: 'HIFU Face Lifting (검색/SEO에 직접 영향)', req: true, loc: 'patient' },
    { name: '시술명 (중/일)', desc: '(선택)', loc: 'internal' },
    { name: '시술 설명 (한국어)', desc: '2~3문장. 원리/효과/대상', loc: 'patient' },
    { name: '시술 설명 (영어)', desc: '검색 결과 요약문에 사용', loc: 'match' },
  ], { intro: '기본 정보. 다음 장에 분류·의학정보·가격·사진이 이어집니다.' });

  fieldTableSlides({ ...sec, title: '시술 — 분류 · 의학 정보' }, [
    { name: '작용 기전', desc: '원리 키워드 콤마. hifu, rf, injection_filler, surgery', req: true, loc: 'patient' },
    { name: '도메인', desc: '6개 중 선택 (내부 분류)', req: true, loc: 'internal' },
    { name: '부위', desc: '부위 키워드 콤마. face, neck / nose / skin', req: true, loc: 'match' },
    { name: '통증 (1-5)', desc: '1=거의없음 ~ 5=매우강함', loc: 'patient' },
    { name: '강도', desc: '자연/보통/드라마틱 (카드 필터에도 사용)', loc: 'patient' },
    { name: '다운타임 (일)', desc: '평균 회복 일수 0~21', loc: 'patient' },
    { name: '결과 발현 / 효과 지속', desc: '즉시·서서히 / 일시·몇개월·수년·영구', loc: 'patient' },
    { name: '권장 횟수', desc: '보통 몇 회. 1, 3, 5', loc: 'patient' },
  ], { perPage: 8 });

  fieldTableSlides({ ...sec, title: '시술 — 수술 정보 (수술인 경우만)' }, [
    { name: '수술 여부', desc: '수술이면 체크 (체크해야 아래가 의미)', loc: 'patient' },
    { name: '주 마취 방식', desc: '도포/국소/수면/전신/무마취', loc: 'patient' },
    { name: '수술 시간 (시간)', desc: '1.5 = 1시간 30분', loc: 'internal' },
    { name: '입원 일수 / 실밥 제거일', desc: '숫자 / 수술 후 며칠째', loc: 'internal' },
    { name: '부기 최대일 / 최종 결과(주)', desc: 'D+ / 예: 12주 후 안정', loc: 'internal' },
    { name: '재수술 정책 있음', desc: '무료 재수술 보장 여부', loc: 'internal' },
  ]);

  fieldTableSlides({ ...sec, title: '시술 — 시장 가격 · 장비 · 사진' }, [
    { name: '시장 가격 하한/상한 (원)', desc: '참고용 범위. 실가격은 병원별로', loc: 'patient' },
    { name: '가격 단위 표기', desc: '회당, 100샷', loc: 'patient' },
    { name: '단위 종류 / 자주쓰는 수량', desc: '샷·cc·회·부위·정액 / 100,200,300', loc: 'internal' },
    { name: '대표 장비 예시', desc: 'Ulthera SPT, Shurink, Thermage FLX', loc: 'patient' },
    { name: '카드 썸네일', desc: '1:1 또는 4:3, 800px = 카테고리 그리드 카드', loc: 'patient' },
    { name: '시술 상세 히어로', desc: '16:9, 1600px+ = 상세 페이지 상단', loc: 'patient' },
    { name: '결과 예시 갤러리 / 일러스트', desc: '(선택, 현재 화면 미표기)', loc: 'internal' },
    { name: '검색 태그 / 활성', desc: '내부 검색 / 보통 체크', loc: 'internal' },
  ]);
} });

// 05 기기
S({ n: 5, title: '기기', menu: '카탈로그 > 기기', subtitle: '장비 브랜드(울쎄라·슈링크·써마지). 환자가 기기명으로 검색 → /device/:slug 전용 페이지', build(sec) {
  fieldTableSlides(sec, [
    { name: 'URL 식별자', desc: 'ulthera, shurink, thermage', req: true, loc: 'patient' },
    { name: '기기명 (한국어)', desc: '울쎄라', req: true, loc: 'patient' },
    { name: '기기명 (영어)', desc: 'Ulthera', req: true, loc: 'patient' },
    { name: '기기명 (중/일)', desc: '超声刀 (선택)', loc: 'internal' },
    { name: '메커니즘', desc: '이름 검색 선택. hifu, rf (없으면 메커니즘 메뉴에서 먼저)', loc: 'patient' },
    { name: '제조사 / 원산지', desc: 'Merz, Classys / US, KR, IL', loc: 'internal' },
    { name: '설명 (영어)', desc: '한 줄. "FDA 1호 집속초음파 리프팅" → 기기 페이지 소개', loc: 'patient' },
    { name: '설명 (한/중/일)', desc: '(현재 영어 설명을 사용)', loc: 'internal' },
    { name: '배지', desc: '(선택) iconic/premium/k-favorite/classic', loc: 'patient' },
    { name: '태그', desc: 'hifu, non-invasive (추천 매칭 보조)', loc: 'match' },
    { name: '카드 썸네일 / 페이지 히어로', desc: '홈 기기 그리드 / 기기 페이지 상단', loc: 'patient' },
    { name: '갤러리 / 노출 순서 / 활성', desc: '(미표기) / 낮을수록 먼저 / 체크', loc: 'patient' },
  ], { perPage: 12 });
} });

// 06 고민↔시술
S({ n: 6, title: '고민↔시술 매트릭스', menu: '매트릭스 > 고민↔시술', star: true, subtitle: '"이 고민에는 이 시술이 잘 맞는다"를 손으로 연결 — 자동 추천의 80%가 여기서 결정', build(sec) {
  fieldTableSlides(sec, [
    { name: '고민', desc: '고민 카드가 곧 이것', req: true, loc: 'internal' },
    { name: '시술', desc: '이름으로 검색해 선택', req: true, loc: 'internal' },
    { name: '관련도', desc: 'primary(핵심)/secondary(보조)/adjunct(병행 도움) — 추천 점수에 직접 영향', req: true, loc: 'match' },
    { name: '추천 이유 (한국어)', desc: '왜 맞는지 한 줄 (향후 결과 카드 노출 예정)', loc: 'internal' },
    { name: '추천 이유 (영어)', desc: '(영문)', loc: 'internal' },
  ], { intro: '화면은 고민별 카드 → 각 카드에 "+ 시술 추가". 한 고민+한 시술 쌍은 한 번만 연결(중복 불가).' });
  calloutSlide(sec, '왜 가장 중요한가', '관련도가 추천을 좌우합니다', [
    '환자가 "모공"을 고르면 → 모공에 primary로 연결된 시술이 추천 맨 위로.',
    'primary +50점 / secondary +28점 / adjunct +12점 (16번 매칭 원리 참고).',
    '아무 시술이나 primary로 남발하면 엉뚱한 추천이 나옵니다 — 정성껏 고르세요.',
    '매트릭스가 비어 있으면 추천에 아무 병원도 안 나옵니다.',
  ], 'gold');
} });

// 07 시술↔기기
S({ n: 7, title: '시술↔기기 매트릭스', menu: '매트릭스 > 시술↔기기', subtitle: '"이 시술은 어떤 기기로 가능한가" — 같은 HIFU 리프팅도 울쎄라/슈링크/리프테라', build(sec) {
  fieldTableSlides(sec, [
    { name: '시술', desc: '시술 카드가 곧 이것', req: true, loc: 'internal' },
    { name: '기기', desc: '이름으로 검색 선택', req: true, loc: 'internal' },
    { name: '관계', desc: 'primary(대표 장비)/alternative(대체)/compatible(호환만)', req: true, loc: 'patient' },
    { name: '비고 (한/영/중/일)', desc: '"특정 부위에만 권장" 등', loc: 'internal' },
    { name: '노출 순서', desc: '같은 시술 안 기기 정렬. 낮을수록 먼저', loc: 'patient' },
  ], { intro: '시술별 카드에서 "+ 기기 추가". 한 시술당 보통 1~4개. 한 시술+한 기기 쌍은 한 번만(중복 불가).' });
} });

// 08 메커니즘
S({ n: 8, title: '메커니즘 (부록)', menu: '/admin/mechanisms', subtitle: '시술 작용 원리(HIFU·RF·보톡스). 이미 다 들어있음 — 보통 손댈 일 없음', build(sec) {
  fieldTableSlides(sec, [
    { name: 'URL 식별자', desc: 'hifu, rf, laser_pico (영문 소문자+밑줄)', req: true, loc: 'internal' },
    { name: '메커니즘명 (한국어)', desc: '집속초음파(HIFU)', req: true, loc: 'patient' },
    { name: '메커니즘명 (영어)', desc: 'HIFU', req: true, loc: 'patient' },
    { name: '메커니즘명 (중/일)', desc: '(선택)', loc: 'internal' },
    { name: '설명 (한/영)', desc: '"집속초음파로 SMAS층 자극"', loc: 'internal' },
    { name: '도메인', desc: '6개 중 선택', req: true, loc: 'internal' },
    { name: '노출 순서 / 활성', desc: '낮을수록 먼저 / 보통 체크', loc: 'internal' },
  ], { intro: '사이드바엔 안 보이지만 /admin/mechanisms 로 진입. 새 시술이 완전히 새로운 원리를 쓸 때만 추가.' });
} });

// 09 브랜드·병원 개념
S({ n: 9, title: '브랜드와 병원의 관계', menu: '개념 정리', subtitle: '운영자는 브랜드를 따로 만들 필요 없습니다', build(sec) {
  calloutSlide(sec, '한 장으로 이해하기', '브랜드 vs 병원', [
    '브랜드 = 상호/체인 본부 (예: "리엔장"). 로고·창립의사 정보.',
    '병원 = 실제 지점 (예: "리엔장 강남점", "리엔장 부산점"). 주소·전화·시술·가격.',
    '같은 브랜드의 여러 지점 = 각각 별도의 "병원"으로 추가.',
    '운영자는 병원을 추가할 때 화면 안 "브랜드 정보" 칸만 채우면 됨 → 시스템이 알아서 브랜드 생성·연결.',
  ], 'gold');
} });

// 10 병원
S({ n: 10, title: '병원', menu: '병원·인력 > 병원', subtitle: '병원 지점 1곳 = 1행. 한 화면에서 정보·브랜드·위치·응대·신뢰·사진·시술·의사·전후사진 모두', build(sec) {
  calloutSlide(sec, '가장 흔한 실수', '"계약 상태 = active" 가 아니면 안 보입니다', [
    '계약 상태를 active 로 안 두면 그 병원은 사이트·추천 어디에도 안 나옵니다.',
    '등록을 마쳤는데 병원이 안 보이면 99% 이것 때문입니다.',
    '신규 병원은 처음엔 pending → 검토 후 active 로 변경.',
  ], 'warn');

  fieldTableSlides({ ...sec, title: '병원 — 기본 · 브랜드' }, [
    { name: 'URL 식별자', desc: 'hershe_청담점 (한글 지점명 허용)', req: true, loc: 'patient' },
    { name: '지점명', desc: '강남점, 청담점. 단일이면 비움', loc: 'patient' },
    { name: '간판명 (한국어)', desc: '실제 간판 이름', req: true, loc: 'patient' },
    { name: '간판명 (영어)', desc: '영문 제목/검색', loc: 'patient' },
    { name: '브랜드명 (한국어)', desc: '여러 지점이면 모두 똑같이. 비우면 자동', loc: 'patient' },
    { name: '브랜드명 (영어)', desc: '결과 카드·비교표 병원명, WhatsApp', loc: 'patient' },
    { name: '브랜드 로고', desc: '투명 PNG/SVG (향후 헤더/카드)', loc: 'internal' },
    { name: '대표/창립 의사 · 전문성 · 체인', desc: '최우식 / niche·device_led·general / 체크', loc: 'internal' },
  ]);

  fieldTableSlides({ ...sec, title: '병원 — 위치 · 연락처' }, [
    { name: '국가', desc: '기본 KR', loc: 'internal' },
    { name: '도시', desc: '서울, 부산', req: true, loc: 'patient' },
    { name: '구', desc: '강남구, 해운대구', req: true, loc: 'patient' },
    { name: '동', desc: '청담동, 마린시티', loc: 'patient' },
    { name: '주소 (한/영) · 위도/경도', desc: '구글맵에서 복사 (현재 화면 미표기)', loc: 'internal' },
    { name: '대표 전화', desc: '02-555-2424', loc: 'patient' },
    { name: '카카오 / WeChat / WhatsApp', desc: '병원 상세 연락 줄에 표시 (WeChat 중요)', loc: 'patient' },
    { name: '이메일 / LINE / 홈페이지', desc: '(현재 화면 미표기)', loc: 'internal' },
  ]);

  fieldTableSlides({ ...sec, title: '병원 — 외국 환자 응대 (상세의 체크리스트)' }, [
    { name: '응대 가능 언어', desc: '코드 콤마: ko, en, zh → 국기 칩 + 언어일치 추천 가산', loc: 'patient' },
    { name: '국제 코디네이터', desc: '체크 → 체크리스트 + 추천 가산', loc: 'patient' },
    { name: '영어 가능 의사', desc: '체크 → 체크리스트 + 영어 환자 가산', loc: 'patient' },
    { name: '공항 픽업', desc: '체크 → 체크리스트 + "Pickup" 뱃지 + 가산', loc: 'patient' },
    { name: '통역사 상주 · 여성 의사 · 해외카드', desc: '각 체크 → 체크리스트', loc: 'patient' },
    { name: '회복 숙소 제휴 · 할랄 · 1인실', desc: '각 체크 → 체크리스트', loc: 'patient' },
    { name: '마취과 전문의 상주', desc: '수술 안전 신호 → 체크리스트', loc: 'patient' },
    { name: '통역 가능 언어', desc: '(현재 화면 미표기)', loc: 'internal' },
  ]);

  fieldTableSlides({ ...sec, title: '병원 — 신뢰 · 사진 · 운영' }, [
    { name: '안전 클레임', desc: '"50개국 4만명 무사고" → 상세 히어로 문구', loc: 'patient' },
    { name: '월간 외국 환자 건수 / 개원 연도', desc: '대략 / 4자리 → 상세 메타', loc: 'patient' },
    { name: 'B&A 보유 사진 수', desc: '대략 숫자 → 상세 "B/A photos"', loc: 'patient' },
    { name: '카드 썸네일', desc: '4:3/1:1, 800px → 비교/카테고리 카드', loc: 'patient' },
    { name: '상세 페이지 히어로', desc: '16:9, 1600px+ → 병원 상세 상단', loc: 'patient' },
    { name: '시설 갤러리 · 대체텍스트 · 외부리뷰', desc: '(현재 화면 미표기)', loc: 'internal' },
    { name: '계약 상태', desc: 'active 만 노출! 신규 pending → active', loc: 'patient' },
    { name: '수수료 / 운영 메모 / 활성', desc: '내부용 / 내부 메모 / 보통 체크', loc: 'internal' },
  ]);

  calloutSlide({ ...sec, title: '병원 — 화면 아래 패널 3개' }, '저장 후 패널', '저장하면 같은 화면 아래에 생깁니다', [
    '(A) 이 병원이 제공하는 시술 = "병원×시술 가격표" → 11번 섹션',
    '(B) 의사 = 인라인으로 의사 추가 → 12번 섹션 필드와 동일',
    '(C) B&A(전후사진) = 인라인으로 전후 사진 추가 → 13번 섹션 필드와 동일',
    '모달 없이 한 화면에서 "+ 추가"로 바로바로 등록합니다.',
  ], 'gold');
} });

// 11 병원×시술
S({ n: 11, title: '병원 × 시술 가격표', menu: '병원 화면 안 "제공 시술" 패널', subtitle: '한 병원이 한 시술을 얼마에/어떤 장비로/어떤 이벤트로 제공하는지 (병원마다 1줄씩)', build(sec) {
  fieldTableSlides(sec, [
    { name: '병원 지점 / 시술', desc: '병원 화면 안이면 자동 연결 / 이름으로 검색', req: true, loc: 'internal' },
    { name: '현재 제공 중', desc: '체크(기본). 풀면 추천에서 제외', loc: 'match' },
    { name: '병원 자체 명칭 (한국어)', desc: '슈링크 600샷 패키지. 비우면 시술명', loc: 'patient' },
    { name: '가격 공개 허용', desc: '체크해야 시작 가격이 사이트에 노출', loc: 'patient' },
    { name: '시작 가격 (원)', desc: '숫자만. 390000 = ₩390,000', loc: 'patient' },
    { name: '가격 안내 메모', desc: '"100/200/300샷 옵션"', loc: 'patient' },
    { name: '가격대(티어)', desc: '$ ~ $$$$ (현재는 시작가를 주로 표시)', loc: 'internal' },
  ], { intro: '별도 메뉴는 숨겨져 있고, 병원 편집 화면 안에서 관리합니다.' });

  fieldTableSlides({ ...sec, title: '병원 × 시술 — 이벤트 · 장비 · 사진' }, [
    { name: '이벤트 진행 중 / 내용', desc: '체크 → "event" 뱃지 + 추천 가산 / "5월 -30%"', loc: 'patient' },
    { name: '이벤트 종료일', desc: '날짜 (자동 종료)', loc: 'internal' },
    { name: '패키지 메모', desc: '"회복 호텔 3박 포함" → "Package" 뱃지', loc: 'patient' },
    { name: '사용 장비 브랜드', desc: 'Ulthera Prime, Thermage FLX → 비교표 + 기기 매칭', loc: 'patient' },
    { name: '병원 시그너처', desc: '대표 시술이면 체크 → ★뱃지 + 추천 가산', loc: 'patient' },
    { name: '이 시술 제공 연수', desc: '숫자 → 비교표 "Ny"', loc: 'patient' },
    { name: '카드 썸네일/히어로 (자체 샷)', desc: '병원 자체 사진 있을 때만', loc: 'patient' },
    { name: '담당의사 전문 · 수량 · 출처 · 메모', desc: '(현재 화면 미표기 / 내부)', loc: 'internal' },
  ]);
  calloutSlide({ ...sec, title: '병원 × 시술 — 주의' }, '주의', '가격을 넣어도 안 보일 수 있습니다', [
    '"가격 공개 허용"을 체크 안 하면 환자에겐 "상담"으로만 표시됩니다.',
    '한국 의료광고법 대응 — 공개해도 되는 병원만 체크하세요.',
  ], 'warn');
} });

// 12 의사
S({ n: 12, title: '의사', menu: '병원·인력 > 의사', subtitle: '병원 소속 의사. 외국 환자가 "누가 시술하나"를 가장 신뢰', build(sec) {
  calloutSlide(sec, '현재 안내', '아직 전용 노출 페이지는 준비 중', [
    '의사 정보는 현재 환자 화면에 직접 노출되는 페이지가 아직 없습니다(내부).',
    '그래도 신뢰 자산이고 곧 노출 예정 → 우선순위 병원(Hershe·노즈립·리엔장 강남·우아)부터 채워두면 좋습니다.',
  ], 'gold');
  fieldTableSlides(sec, [
    { name: 'URL 식별자', desc: 'choi_woosik_noselab', req: true, loc: 'internal' },
    { name: '소속 병원', desc: '이름으로 검색 선택', req: true, loc: 'internal' },
    { name: '이름 (한국어)', desc: '김민태', req: true, loc: 'internal' },
    { name: '이름 (영어) / 직책', desc: 'Dr. Min-tae Kim / 원장·Chief Doctor', loc: 'internal' },
    { name: '단독 정면 사진', desc: '1:1, 800px', loc: 'internal' },
    { name: '경력(년) / 전문 분야', desc: '15 / rhinoplasty, double_eyelid', loc: 'internal' },
    { name: '학력·자격증·학회', desc: '전문 형식 — 예시 복사 후 값만 수정', loc: 'internal' },
    { name: '구사 언어 / 소개(한·영·중·일)', desc: 'ko, en, zh / 3~5문장', loc: 'internal' },
    { name: '대표 의사 / 노출 순서 / 활성', desc: '대표로 노출 / 낮을수록 먼저 / 체크', loc: 'internal' },
  ], { perPage: 9 });
  calloutSlide({ ...sec, title: '의사 — 전문 형식 칸 작성법' }, '작성법', '복사해서 값만 바꾸세요 (대괄호·중괄호·따옴표 위치 유지)', [
    '학력:  [{"year":2008,"school":"서울대학교 의과대학","degree":"MD"}]',
    '자격증:  [{"name":"성형외과 전문의","issuer":"대한성형외과학회","year":2014}]',
    '학회:  [{"society":"ISAPS","role":"member"}]',
    '여러 개면 쉼표로 이어 붙입니다:  [ {...}, {...} ]',
  ], 'gold');
} });

// 13 B&A
S({ n: 13, title: 'B&A (전후사진)', menu: '병원·인력 > B&A', subtitle: '동의받은 시술 전/후 사진', build(sec) {
  calloutSlide(sec, '두 가지 주의', '반드시 지키세요', [
    '① 환자 서면 동의 필수 (개인정보보호법). "서면 동의 보유"를 체크하지 않으면 등록 금지.',
    '② 전후사진 전용 갤러리도 현재 환자 화면에 아직 없습니다(내부). 동의받아 모아두되 노출은 추후.',
  ], 'warn');
  fieldTableSlides(sec, [
    { name: '병원', desc: '이름으로 검색 선택', req: true, loc: 'internal' },
    { name: '시술 / 담당 의사', desc: '선택', loc: 'internal' },
    { name: '시술 전 사진', desc: '동일 각도/조명', req: true, loc: 'internal' },
    { name: '시술 후 사진', desc: '전과 같은 각도', req: true, loc: 'internal' },
    { name: '케이스 제목·연령대·성별·국가', desc: '"30대 여성·하안검" / 20s / f / CN', loc: 'internal' },
    { name: '시술 후(주) / 사용 장비 / 메모', desc: '2=2주후 / 콤마 / 메모', loc: 'internal' },
    { name: '서면 동의 보유', desc: '⚠ 동의서 있을 때만 체크', req: true, loc: 'internal' },
    { name: '공개 범위 / 익명 처리 / 활성', desc: 'public·logged_in·staff_only / 체크 / 체크', loc: 'internal' },
  ]);
} });

// 14 실시간 피드
S({ n: 14, title: '실시간 피드', menu: '콘텐츠 > 실시간 피드', subtitle: '메인에 흐르는 "M. in Singapore — HIFU · 3분 전" 사회적 증거 (익명 표기)', build(sec) {
  fieldTableSlides(sec, [
    { name: '출처', desc: 'seed(운영자) 선택. 실 환자는 자동', req: true, loc: 'internal' },
    { name: '이니셜 표기', desc: '1자+점. "M." (풀네임 금지)', req: true, loc: 'patient' },
    { name: '국가 코드 / 국가 표기(영어)', desc: 'SG → 국기 / Singapore', loc: 'patient' },
    { name: '시술/고민 (선택)', desc: '이름으로 검색 (내부 연결)', loc: 'internal' },
    { name: '시술 표기 (영어)', desc: 'HIFU Lifting → 티커 시술명', loc: 'patient' },
    { name: '결과', desc: 'matched(가장 흔함)/consulted/quoted/booked → 색 뱃지', loc: 'patient' },
    { name: '결과 메모 (영어)', desc: '"matched with 3 clinics"', loc: 'patient' },
    { name: '노출 / 우선순위', desc: '체크=보임 / 높을수록 위로 (보통 0)', loc: 'patient' },
    { name: '노출 시각 / 만료 시각', desc: '"N분 전" 기준 / 비우면 영구', loc: 'patient' },
  ], { intro: '익명 규칙: 이니셜 1자 + 국가만. 풀네임·도시·병원명 금지. 초기엔 운영자가 5~10개 직접 만들어 메인을 채웁니다.', perPage: 9 });
} });

// 15 AI 스캔 내역
S({ n: 15, title: 'AI 스캔 내역', menu: '운영·모니터링', subtitle: '얼굴 스캔·추천 합성 호출 기록 — 보기 전용 (입력하지 않음)', build(sec) {
  calloutSlide(sec, '무엇을 보나', '비용·호출 모니터링', [
    '종류: analyze(얼굴 스캔) / synthesize(Romie 추천 합성).',
    '기록: IP·세션·모델·입출력 토큰·비용(USD)·응답시간(ms)·HTTP(200 성공/500 에러)·에러.',
    'IP별 5분 쿨다운으로 남용 방지. 누적 비용 합계는 대시보드 상단 카드.',
    '한 사이클(스캔+합성) 비용 ≈ $0.0006 (약 0.8원).',
  ], 'gold');
} });

// 16 매칭 원리
S({ n: 16, title: '스캔하면 왜 이 병원이 추천되나', menu: '매칭 원리', star: true, subtitle: '운영자가 매트릭스를 잘 채워야 하는 이유 — 추천은 2단계', build(sec) {
  calloutSlide(sec, '1단계 — 후보 추리기', '아래를 전부 통과해야 추천에 등장', [
    '① 병원 계약 상태 = active',
    '② 그 시술이 "현재 제공 중" 체크',
    '③ 가격 공개 병원이면 시작 가격 ≤ 환자 예산',
    '④ 시술 다운타임 ≤ 환자 허용 회복일',
    '⑤ 시술 통증 ≤ 환자 허용 통증',
    '⑥ 그 시술이 환자가 고른 고민 중 최소 1개와 연결 (= 고민↔시술 매트릭스)',
    '→ ⑥ 때문에 매트릭스가 비면 아무도 추천되지 않습니다.',
  ], 'gold');
  genericTableSlide(sec, '2단계 — 점수로 줄 세우기 (최대 8곳)', ['신호', '점수', '운영자가 조절하는 곳'], [
    ['고민 관련도', 'primary +50 / secondary +28 / adjunct +12', '고민↔시술 매트릭스 "관련도"'],
    ['스타일 적합', '최대 +24', '시술 "강도"'],
    ['예산 여유 / 할인율', '최대 +12 / 약 +25', '병원×시술 가격·이벤트'],
    ['시그너처 / 이벤트', '+10 / +6', '병원×시술 체크'],
    ['언어·영어의사·픽업·코디', '+8 / +3 / +3 / +3', '병원 응대 항목'],
    ['선호 기기 일치', '실사용 +18 / 매트릭스 +9·+5', '병원×시술 장비 + 시술↔기기'],
  ], { colW: [3.2, 4.3, 4.13], intro: '고민 관련도(+50)가 가장 셉니다 → 매트릭스가 추천 품질의 80%. 같은 시술은 점수 1등 병원만 노출.' });
} });

// 17 함정
S({ n: 17, title: '자주 빠지는 함정', menu: '체크리스트', subtitle: '문제가 생기면 여기부터 점검', build(sec) {
  const s = pptx.addSlide();
  contentHeader(s, sec, '8가지');
  const items = [
    ['병원이 사이트에 안 보임', '십중팔구 계약 상태가 active 가 아님 (1순위)'],
    ['추천에 아무도 안 나옴', '고민↔시술 매트릭스가 비었거나 연결 안 됨'],
    ['가격이 "상담"으로만', '병원×시술 "가격 공개 허용" 체크 안 함'],
    ['링크·사진이 깨짐', 'URL 식별자를 나중에 바꿈 — 절대 변경 금지'],
    ['전후사진 동의 없이 등록', '개인정보보호법 위반 — "서면 동의 보유" 없으면 금지'],
    ['저장이 안 됨', '별표(*) 칸을 비움'],
    ['카드가 회색 빈 박스', '사진을 비움 — 최소 썸네일은 넣기'],
    ['만들다가 막힘', '입력 순서 어김 (1번 섹션 순서대로)'],
  ];
  const rows = items.map((it, i) => ([
    { text: '⚠', options: { fill: { color: i % 2 ? C.soft : C.paper }, color: 'B23A3A', align: 'center', valign: 'middle', fontSize: 13 } },
    { text: it[0], options: { fill: { color: i % 2 ? C.soft : C.paper }, color: C.char, bold: true, fontFace: FONT, fontSize: 12, valign: 'middle', margin: [4, 8, 4, 8] } },
    { text: it[1], options: { fill: { color: i % 2 ? C.soft : C.paper }, color: C.ink, fontFace: FONT, fontSize: 11.5, valign: 'middle', margin: [4, 8, 4, 8] } },
  ]));
  s.addTable(rows, { x: MX, y: 1.6, w: W - MX * 2, colW: [0.6, 3.8, 7.23], border: { type: 'solid', color: C.line, pt: 0.5 }, rowH: 0.58, valign: 'middle' });
} });

// 18 한눈 요약
S({ n: 18, title: '한눈 요약 — 어디서 관리하나', menu: '요약', subtitle: '하고 싶은 일 → 어디로 가면 되는지', build(sec) {
  genericTableSlide(sec, '', ['하고 싶은 것', '어디서'], [
    ['새 병원 등록', '병원 메뉴 → + 새로 만들기 (브랜드·시술·의사·전후사진 다 그 안에서)'],
    ['병원 가격 바꾸기', '병원 편집 → "제공 시술" 패널'],
    ['시술 자체 설명/사진', '시술 메뉴'],
    ['"이 고민엔 이 시술" 연결', '고민↔시술 매트릭스'],
    ['기기 페이지 만들기', '기기 메뉴 + 시술↔기기 매트릭스'],
    ['메인 흐르는 후기', '실시간 피드 메뉴'],
    ['병원이 안 보일 때', '병원 편집 → 계약 상태 = active 확인'],
    ['비용 확인', 'AI 스캔 내역 / 대시보드'],
  ], { colW: [4.2, 7.43] });
} });

// ── 마무리 ────────────────────────────────────────────────────────────
function closingSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.char };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.16, fill: { color: C.gold } });
  s.addText('✦', { x: 0, y: 2.3, w: W, h: 0.6, align: 'center', fontFace: FONT, fontSize: 26, color: C.gold });
  s.addText('이 문서 하나로 충분합니다', { x: 0, y: 3.0, w: W, h: 0.8, align: 'center', fontFace: FONT_H, fontSize: 30, bold: true, color: C.warm });
  s.addText('막히면 17번(함정) → 18번(요약) 순으로 확인하세요.', { x: 0, y: 4.0, w: W, h: 0.5, align: 'center', fontFace: FONT, fontSize: 14, color: 'CFC8BC' });
  s.addText('상세 텍스트본: docs/admin-manual.md   ·   데이터 구조: CLAUDE.md §8   ·   시드 순서: CLAUDE.md §25', { x: 0, y: 5.0, w: W, h: 0.4, align: 'center', fontFace: FONT, fontSize: 10, color: '8A8378' });
}

// =====================================================================
// 빌드
// =====================================================================
titleSlide();
agendaSlide(sections);
sections.forEach((sec) => {
  dividerSlide(sec);
  sec.build(sec);
});
closingSlide();

const out = path.resolve(__dirname, '..', '..', 'docs', 'admin-manual.pptx');
pptx.writeFile({ fileName: out }).then(() => {
  console.log('생성 완료 →', out);
  console.log('슬라이드 수:', pptx.slides ? pptx.slides.length : '(writeFile 후)');
}).catch((e) => {
  console.error('생성 실패:', e);
  process.exit(1);
});

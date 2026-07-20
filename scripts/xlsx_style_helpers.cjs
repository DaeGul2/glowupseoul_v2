/* eslint-disable */
// 공용 xlsx 스타일 헬퍼 — xlsx-js-style 기반.
// aoa(2차원 배열)를 받아 행 유형을 자동 분류해 색/테두리/높이/병합을 입힌다.
// 사용: const { XLSX, styledSheet, writeBook } = require('./xlsx_style_helpers.cjs');
const XLSX = require('xlsx-js-style');
const path = require('path');

/* ---------- 팔레트 ---------- */
const C = {
  ink: '1F2430',        // 본문 글자
  titleBg: '1F2430',    // 시트 제목 (다크)
  sectionBg: '35507E',  // 섹션 헤더 (네이비)
  theadBg: '44546A',    // 표 헤더
  zebraBg: 'F3F5F9',    // 표 줄무늬
  paraBg: 'FAFAFC',     // 설명 문단
  bulletBg: 'FFFFFF',   // 불릿
  noteBg: 'FFF6E0',     // 주의/노란 박스
  checkBg: 'EAF4EC',    // 체크리스트
  subGray: '6B7280',
  border: 'C9CFD8',
};

const BD = { style: 'thin', color: { rgb: C.border } };
const BORDER_ALL = { top: BD, bottom: BD, left: BD, right: BD };

function style({ bg, color = C.ink, bold = false, sz = 10, italic = false, center = false, border = true } = {}) {
  return {
    fill: bg ? { patternType: 'solid', fgColor: { rgb: bg } } : undefined,
    font: { name: '맑은 고딕', sz, bold, italic, color: { rgb: color } },
    alignment: { wrapText: true, vertical: 'center', horizontal: center ? 'center' : 'left' },
    border: border ? BORDER_ALL : undefined,
  };
}

const STYLES = {
  title:    style({ bg: C.titleBg, color: 'FFFFFF', bold: true, sz: 14 }),
  subtitle: style({ bg: 'EDEFF3', color: C.subGray, italic: true, sz: 9 }),
  section:  style({ bg: C.sectionBg, color: 'FFFFFF', bold: true, sz: 11 }),
  thead:    style({ bg: C.theadBg, color: 'FFFFFF', bold: true, center: true }),
  data:     style({}),
  dataZebra: style({ bg: C.zebraBg }),
  para:     style({ bg: C.paraBg }),
  bullet:   style({ bg: C.bulletBg }),
  note:     style({ bg: C.noteBg, color: '7A5A17' }),
  check:    style({ bg: C.checkBg }),
  blank:    style({ border: false }),
};

/* ---------- 행 유형 자동 분류 ---------- */
const HEADER_FIRSTS = new Set([
  '단계', '순번', '순서', '순위', '번호', '옵션', '항목', '증상',
  '어느 서비스', '누가', '위치', '메뉴', '구분',
]);

function classify(cells, ri) {
  const vals = cells.map((c) => String(c == null ? '' : c).trim());
  const nonEmpty = vals.filter((v) => v !== '');
  if (nonEmpty.length === 0) return 'blank';
  if (ri === 0) return 'title';
  if (nonEmpty.length === 1 && vals[0] !== '') {
    const t = vals[0];
    if (ri === 1) return 'subtitle';
    if (t.startsWith('□')) return 'check';
    if (t.startsWith('·') || t.startsWith('- ') || t.startsWith('Q.') || t.startsWith('★') || /^[①②③④]/.test(t)) return 'bullet';
    if (t.startsWith('──')) return 'section';
    if (t.length <= 45 && !/[.。]\s*$/.test(t)) return 'section';
    return 'para';
  }
  if (HEADER_FIRSTS.has(vals[0])) return 'thead';
  return 'data';
}

/* ---------- 높이 추정 (wrap 대응) ---------- */
function textWidth(s) {
  let w = 0;
  for (const ch of String(s)) w += ch.charCodeAt(0) > 0x2000 ? 1.9 : 1.02;
  return w;
}
function estLines(text, width) {
  let lines = 0;
  for (const part of String(text == null ? '' : text).split('\n')) {
    lines += Math.max(1, Math.ceil(textWidth(part) / Math.max(width - 2, 6)));
  }
  return lines;
}

/* ---------- 시트 빌더 ---------- */
function styledSheet(aoa, colWidths) {
  const nCols = colWidths.length;
  const ws = XLSX.utils.aoa_to_sheet(aoa.map((r) => {
    const row = r.slice(0, nCols);
    while (row.length < nCols) row.push('');
    return row;
  }));
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));
  ws['!rows'] = [];
  ws['!merges'] = [];
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  let dataIdx = 0;
  aoa.forEach((cells, ri) => {
    const kind = classify(cells, ri);
    if (kind !== 'data') dataIdx = 0;
    let st;
    if (kind === 'data') { st = dataIdx % 2 === 1 ? STYLES.dataZebra : STYLES.data; dataIdx++; }
    else st = STYLES[kind] || STYLES.para;

    const vals = cells.map((c) => String(c == null ? '' : c).trim());
    const isSingle = vals.filter((v) => v !== '').length <= 1 && kind !== 'data' && kind !== 'thead';

    // 병합 (단일 셀 유형은 전체 폭)
    if (isSingle && nCols > 1 && kind !== 'blank') {
      ws['!merges'].push({ s: { r: ri, c: 0 }, e: { r: ri, c: nCols - 1 } });
    }

    // 높이
    let hpt;
    if (kind === 'blank') hpt = 8;
    else if (kind === 'title') hpt = 30;
    else if (kind === 'section') hpt = 22;
    else {
      let maxLines = 1;
      if (isSingle) maxLines = estLines(cells[0], totalWidth);
      else cells.forEach((c, i) => { maxLines = Math.max(maxLines, estLines(c, colWidths[i] || 20)); });
      hpt = maxLines * 14 + 8;
    }
    ws['!rows'][ri] = { hpt };

    // 셀 스타일 (병합 영역 포함 전 열 적용)
    for (let ci = 0; ci < nCols; ci++) {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = st;
    }
  });
  return ws;
}

function writeBook(sheets, outDir, filename) {
  const wb = XLSX.utils.book_new();
  for (const [name, ws] of sheets) XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  const target = path.join(outDir, filename);
  try {
    XLSX.writeFile(wb, target);
    return target;
  } catch (e) {
    const alt = target.replace(/\.xlsx$/, '_new.xlsx');
    XLSX.writeFile(wb, alt);
    return alt;
  }
}

module.exports = { XLSX, styledSheet, writeBook };

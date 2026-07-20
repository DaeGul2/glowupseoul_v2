# -*- coding: utf-8 -*-
"""
Glow Up Seoul — v3 클라이언트(고객 사이트) 문구 검수서 (styled XLSX).
라우트별 시트 · 현재 텍스트 → 수정 칸 · 체크 · 비고. 셀 배경/테두리/줄바꿈 적용.
DB 값은 2026-06-14 스냅샷. 재생성: python scripts/export_v3_client_spec.py
"""
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

TODAY = "2026-06-14"

# ---------------- palette ----------------
INK     = "18181A"
GOLD    = "B8916A"
GOLD_DK = "8A6A4A"
PAPER   = "FAFAF7"
CARD    = "F2EEE6"
EDIT    = "FBF6EC"   # editable column tint (invite input)
LINE    = "D9D3C8"
MUTED   = "6B6B6B"
WHITE   = "FFFFFF"
PINKBG  = "FBE9F0"

FONT = "맑은 고딕"

def F(sz=11, color=INK, bold=False, italic=False):
    return Font(name=FONT, size=sz, color=color, bold=bold, italic=italic)
def fill(c):
    return PatternFill("solid", fgColor=c)
thin = Side(style="thin", color=LINE)
med  = Side(style="medium", color=GOLD)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
def align(wrap=True, h="left", v="center"):
    return Alignment(wrap_text=wrap, horizontal=h, vertical=v)

REVIEW_HDR = ["구역 / 섹션", "어디에 보이나요 (설명)", "현재 텍스트 (영문)",
              "수정 원하는 텍스트 (여기에 적어주세요)", "그대로 O / 수정 X", "비고"]
REVIEW_W = [22, 30, 56, 44, 15, 24]

wb = Workbook()
wb.remove(wb.active)

def review_sheet(tabname, title, intro, rows):
    ws = wb.create_sheet(tabname[:31])
    for i, w in enumerate(REVIEW_W, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    # title band
    ws.merge_cells("A1:F1")
    c = ws["A1"]; c.value = title; c.font = F(16, INK, True); c.fill = fill(PAPER)
    c.alignment = align(False, "left"); ws.row_dimensions[1].height = 30
    ws.merge_cells("A2:F2")
    c = ws["A2"]; c.value = intro; c.font = F(11, MUTED); c.fill = fill(PAPER)
    c.alignment = align(True, "left"); ws.row_dimensions[2].height = 30
    # header row (row 4)
    hr = 4
    for j, h in enumerate(REVIEW_HDR, 1):
        cc = ws.cell(hr, j, h); cc.font = F(11, WHITE, True); cc.fill = fill(INK)
        cc.alignment = align(True, "center"); cc.border = BORDER
    ws.row_dimensions[hr].height = 30
    # data rows
    r = hr + 1
    for (sec, desc, cur) in rows:
        is_img = sec.startswith("(이미지)") or sec.startswith("(영상)") or sec.startswith("(자동)") or sec.startswith("(코드")
        base = CARD if is_img else WHITE
        vals = [sec, desc, cur, "", "", ""]
        for j, v in enumerate(vals, 1):
            cc = ws.cell(r, j, v); cc.border = BORDER
            if j == 1:
                cc.font = F(10.5, GOLD_DK if not is_img else MUTED, True); cc.fill = fill(base)
                cc.alignment = align(True, "left", "top")
            elif j == 2:
                cc.font = F(10, MUTED); cc.fill = fill(base); cc.alignment = align(True, "left", "top")
            elif j == 3:
                cc.font = F(11, INK); cc.fill = fill(base); cc.alignment = align(True, "left", "top")
            elif j == 4:
                cc.font = F(11, INK); cc.fill = fill(EDIT); cc.alignment = align(True, "left", "top")
            elif j == 5:
                cc.font = F(11, GOLD_DK, True); cc.fill = fill(EDIT); cc.alignment = align(False, "center")
            else:
                cc.font = F(10, MUTED); cc.fill = fill(EDIT); cc.alignment = align(True, "left", "top")
        # row height by current-text length
        ln = len(cur)
        ws.row_dimensions[r].height = max(22, min(96, 18 + (ln // 38) * 15))
        r += 1
    ws.freeze_panes = "A5"
    ws.sheet_view.showGridLines = False
    return ws

# ---------------- 0. 안내 ----------------
def guide_sheet():
    ws = wb.create_sheet("0. 사용 안내")
    ws.column_dimensions["A"].width = 4
    ws.column_dimensions["B"].width = 116
    ws.sheet_view.showGridLines = False
    rows = [
        ("title", "Glow Up Seoul — 웹사이트 문구 검수서"),
        ("sub",   f"고객이 보는 사이트(영문)의 고정 문구를 페이지별로 모았습니다.  ·  기준일 {TODAY}"),
        ("gap",   ""),
        ("h",     "이 파일은 무엇인가요?"),
        ("p",     "아래 탭이 각 페이지(주소)입니다. 탭을 눌러 이동하세요."),
        ("p",     "‘현재 텍스트’ 칸이 지금 사이트에 나오는 실제 문구입니다."),
        ("gap",   ""),
        ("h",     "어떻게 사용하나요?"),
        ("p",     "① 바꾸고 싶으면 ‘수정 원하는 텍스트’ 칸(연한 금색)에 새 문구를 적어주세요. (한글로 적으셔도 됩니다 — 저희가 영문으로 다듬습니다)"),
        ("p",     "② 그대로 두려면 ‘그대로 O / 수정 X’ 칸에 O 를 적어주세요."),
        ("p",     "③ 더 하고 싶은 말은 ‘비고’ 칸에 자유롭게."),
        ("gap",   ""),
        ("h",     "참고"),
        ("p",     "· 시술/수술의 이름·가격·설명 등 ‘내용’은 관리자 페이지에서 직접 수정합니다 (별도: 관리자 사용가이드)."),
        ("p",     "· 이 시트는 디자인에 박혀 관리자에서 못 바꾸는 ‘고정 문구’ 검수용입니다."),
        ("p",     "· 메인 상단 영상(hero.mp4)은 교체 대상이 아닙니다."),
        ("p",     "· 회색 줄은 사진/영상/자동노출 항목(문구 아님)으로, 참고용 안내입니다."),
        ("gap",   ""),
        ("h",     "페이지(탭) 목록"),
        ("p",     "홈 (/) · 시술목록 (/treatments) · 수술목록 (/surgeries) · 상세 공통 · 이용방법 (/how-it-works) · 소개 (/about) · 공통(메뉴·푸터·배너) · 챗봇(Romie) · 사진 스캔"),
    ]
    r = 1
    for kind, txt in rows:
        cell = ws.cell(r, 2, txt)
        if kind == "title":
            cell.font = F(20, INK, True); ws.row_dimensions[r].height = 34
        elif kind == "sub":
            cell.font = F(12, MUTED); ws.row_dimensions[r].height = 22
        elif kind == "h":
            cell.font = F(13, GOLD_DK, True); ws.row_dimensions[r].height = 24
        elif kind == "gap":
            ws.row_dimensions[r].height = 8
        else:
            cell.font = F(11.5, INK); cell.alignment = align(True, "left"); ws.row_dimensions[r].height = 24
        r += 1
    # gold accent on title row
    ws.cell(1, 1).fill = fill(GOLD)
    return ws

guide_sheet()

# ====================== PAGE CONTENT ======================
review_sheet("홈 (·)", "홈 페이지   ·   주소: /",
    "맨 위 영상 + 소개 + ‘두 갈래 길’ 카드 + 한 줄 선언 + 하단 배너 순서입니다.",
    [
      ("상단 영상 위 — 작은 라벨", "큰 영상 위 작은 글씨", "Seoul · medical concierge"),
      ("상단 영상 — 큰 제목", "가장 큰 헤드라인 (done right. 기울임)", "Your glow, done right."),
      ("상단 영상 — 소개 문장", "제목 아래 설명", "From skin treatments to surgery, one coordinator matches you to the best Seoul clinics and carries the whole journey — so you can skip the research."),
      ("상단 영상 — 버튼 1", "채팅 여는 버튼", "Start with Romie →"),
      ("상단 영상 — 버튼 2", "왓츠앱 버튼", "Message on WhatsApp"),
      ("흐르는 띠 — 1", "숫자+설명이 가로로 흐름", "500+ patients matched"),
      ("흐르는 띠 — 2", "", "25+ countries"),
      ("흐르는 띠 — 3", "", "98% satisfaction"),
      ("흐르는 띠 — 4", "", "24h reply"),
      ("흐르는 띠 — 5", "", "Hand-picked clinics only"),
      ("흐르는 띠 — 6", "", "Ministry of Health registered"),
      ("두 갈래 섹션 — 라벨", "작은 라벨", "Where to begin"),
      ("두 갈래 섹션 — 제목", "큰 제목 (One hand 기울임)", "Two paths. One hand to guide you."),
      ("카드 01 — 작은 글씨", "왼쪽 카드(피부) 상단", "No scalpel · 1–3 days"),
      ("카드 01 — 제목", "", "Skin & glow"),
      ("카드 01 — 설명", "", "Lasers, lifting, boosters, contour — the quiet glow-up, then back to your trip."),
      ("카드 01 — 링크", "", "Explore treatments →"),
      ("카드 02 — 작은 글씨", "오른쪽 카드(수술) 상단", "Surgical · escorted"),
      ("카드 02 — 제목", "", "A real change"),
      ("카드 02 — 설명", "", "Eyes, nose, contour, lift — planned, escorted on the day, recovered with care."),
      ("카드 02 — 링크", "", "Explore surgery →"),
      ("선언 문구", "배경색 위 큰 한 줄", "Not a booking app. A personal concierge — just for you."),
      ("선언 — 하단 3개", "작은 항목 3개", "Founded 2022  /  Hand-picked clinics  /  One coordinator, start to finish"),
      ("(이미지) 카드 01 사진", "파일: home-path-skin.png", "피부/글로우 이미지"),
      ("(이미지) 카드 02 사진", "파일: home-path-change.png", "변화/인물 이미지"),
      ("(영상) 상단 배경", "파일: hero.mp4 — ※ 교체 안 함", "메인 영상"),
    ])

review_sheet("시술목록 (treatments)", "시술 목록 페이지   ·   주소: /treatments",
    "맨 위 큰 사진 + 제목 + 설명 아래로, 등록된 시술 카드가 자동으로 깔립니다. (카드 내용은 관리자에서 수정)",
    [
      ("상단 사진", "파일: treatments-hero.png", "흰 정장 여성 이미지"),
      ("작은 라벨", "제목 위", "Non-surgical · 1–3 day trip"),
      ("큰 제목", "glow. 기울임", "Skin & glow."),
      ("설명 문장", "제목 아래", "Lasers, lifting, boosters, contour — the quiet glow-up. Tap any to see how it works, what to expect, and what it costs."),
      ("목록 로딩 안내", "카탈로그 못 불러올 때만", "Catalog is loading — message Romie any time and she'll send a hand-picked shortlist."),
      ("카드 가격 표기", "가격 있을 때 / 없을 때", "from ₩700,000  /  On consultation"),
      ("(자동) 시술 카드들", "관리자 등록 시술이 자동 노출 (현재 14개: Ulthera, Thermage, Rejuran, Shurink Universe …)", "카드 = 사진 + 이름 + 한줄설명 + 태그 + 가격"),
    ])

review_sheet("수술목록 (surgeries)", "수술 목록 페이지   ·   주소: /surgeries",
    "제목 + 설명 아래로 등록된 수술 카드가 자동으로 깔립니다. (카드 내용은 관리자에서 수정)",
    [
      ("작은 라벨", "제목 위", "Surgical · escorted journey"),
      ("큰 제목", "change. 기울임", "A real change."),
      ("설명 문장", "제목 아래", "Eyes, nose, contour, lift. Carried carefully — planned in advance, escorted on the day, recovered with check-ins. Tap any to learn more."),
      ("(자동) 수술 카드들", "관리자 등록 수술이 자동 노출 (현재 6개: Rhinoplasty, Double Eyelid Surgery, Ptosis Correction, Liposuction, Facelift, Cleft Lip / Palate)", "카드 = 사진 + 이름 + 한줄설명 + 태그 + 가격"),
    ])

review_sheet("상세 공통 (detail)", "시술·수술 상세 페이지 — 고정 라벨   ·   주소: /treatments/이름, /surgeries/이름",
    "시술/수술 하나를 눌렀을 때 페이지입니다. 이름·설명·가격 등 ‘내용’은 관리자에서 수정하고, 아래는 디자인 고정 ‘라벨’입니다.",
    [
      ("뒤로가기", "좌상단", "‹ Treatments   /   ‹ Surgery"),
      ("상단 작은 라벨", "시술 종류 + 태그", "Non-surgical · Lifting · Non-invasive · HIFU  (수술은 Surgical)"),
      ("버튼 1", "상담 시작", "Start a consultation →"),
      ("버튼 2", "왓츠앱", "Ask on WhatsApp"),
      ("사진 위 작은 카드 A", "효과 지속", "Results last"),
      ("사진 위 작은 카드 B", "회복 기간", "Downtime"),
      ("요약 박스 제목", "오른쪽 고정 박스", "At a glance"),
      ("요약 박스 항목", "4개 항목 라벨", "Price  /  Results last  /  Comfort  /  Downtime"),
      ("‘Helps with’ 제목", "연결된 고민 표시", "Helps with"),
      ("요약 박스 하단 CTA 제목", "({이름} 자리에 시술명)", "Considering Ulthera?"),
      ("요약 박스 하단 CTA 문장", "", "Tell Romie and we'll arrange the right clinic, in your language."),
      ("요약 박스 하단 버튼", "", "Start with Romie →"),
      ("장점/주의 — 왼쪽 제목", "", "Good for"),
      ("장점/주의 — 오른쪽 제목", "", "Things to note"),
      ("‘왜 좋은지’ 섹션 라벨", "", "Why it helps"),
      ("‘왜 좋은지’ 섹션 제목", "({이름} 자리에 시술명)", "Why Ulthera works for these concerns"),
      ("마지막 요약 라벨", "", "In summary"),
      ("없는 페이지", "주소가 틀렸을 때", "Not found  /  This page may be coming online. Back to the list."),
      ("불러오는 중", "", "Loading…"),
    ])

review_sheet("이용방법 (how-it-works)", "이용 방법 페이지   ·   주소: /how-it-works",
    "상단 영상 + 4단계 설명입니다.",
    [
      ("상단 — 작은 라벨", "", "How it works"),
      ("상단 — 큰 제목", "steps. 기울임", "Four quiet steps."),
      ("상단 — 설명", "", "No app to install. No account. Most of it happens on WhatsApp — quietly."),
      ("1단계 — 제목", "", "One message"),
      ("1단계 — 설명", "", "Tell Romie your concern on WhatsApp. That's the whole start."),
      ("2단계 — 제목", "", "A hand-picked shortlist"),
      ("2단계 — 설명", "", "We send 2–3 clinics that fit your skin, budget and dates — with reasons, not a directory."),
      ("3단계 — 제목", "", "Arrive & be guided"),
      ("3단계 — 설명", "", "Met, interpreted, and walked through every step. You never face the clinic alone."),
      ("4단계 — 제목", "", "Aftercare home"),
      ("4단계 — 설명", "", "Check-ins after you leave. A swelling question at 11pm? The same coordinator answers."),
      ("(영상) 상단 배경", "파일: seoul-2.mp4 → seoul-1.mp4 (번갈아)", "서울 영상"),
    ])

review_sheet("소개 (about)", "소개 페이지   ·   주소: /about",
    "회사 소개 한 단락입니다.",
    [
      ("작은 라벨", "", "About"),
      ("큰 제목", "One journey. 기울임", "One coordinator. One journey."),
      ("본문", "소개 단락", "Glow Up Seoul is a Ministry of Health–registered concierge for foreign patients. We've spent a decade evaluating Korean clinics, and we work with only a hand-picked few — chosen on safety, doctor credentials, English fluency and aftercare. No marketplace. No noise. Just one person who carries your whole journey."),
      ("하단 작은 글씨", "", "Founded 2022 · Seoul · Gangnam · Busan."),
    ])

review_sheet("공통 (메뉴·푸터·배너)", "공통 요소 — 모든 페이지의 메뉴 / 하단 / 배너",
    "상단 메뉴, 페이지 맨 아래 푸터, 페이지마다 반복되는 ‘하단 배너’입니다.",
    [
      ("상단 메뉴 — 항목", "4개 메뉴", "Treatments  /  Surgery  /  How it works  /  About"),
      ("상단 메뉴 — 버튼", "오른쪽 초록 버튼", "WhatsApp"),
      ("(이미지) 로고", "파일: glowup-logo.png", "좌상단 로고"),
      ("하단 배너 — 제목", "거의 모든 페이지 맨 아래 (start? 기울임)", "Not sure where to start?"),
      ("하단 배너 — 문장", "", "Send one message. We reply within 24 hours — and quietly arrange the rest."),
      ("하단 배너 — 버튼", "", "Message Romie on WhatsApp"),
      ("푸터 — 소개", "맨 아래 회사 설명", "A personal concierge for foreign patients in Seoul. Dermatology, plastic surgery, dental — fully handled, end to end."),
      ("푸터 — Explore 묶음", "", "Skin & glow  /  Surgery  /  How it works  /  About"),
      ("푸터 — 연락처", "", "WhatsApp +82 10 6487 1060  /  glowupinseoul@gmail.com"),
      ("푸터 — 맨 아래줄", "저작권", "© 2026 Glow Up Seoul · Ministry of Health & Welfare registered   /   Seoul · Gangnam · Busan"),
      ("채팅 버튼", "우하단 떠있는 버튼", "Chat with Romie"),
    ])

review_sheet("챗봇 (Romie)", "챗봇 대화 — Romie   ·   우하단 ‘Chat with Romie’로 열림",
    "흐름: 인사 → (사진보기/건너뛰기) → 목적 → 부위 → 고민 → 추천 → 왓츠앱. 부위/고민/추천시술은 관리자 데이터에서 자동.",
    [
      ("인사 1", "첫 메시지", "Hi — I'm Romie, your Seoul beauty concierge."),
      ("인사 2", "", "Want me to take a quick look first? Share a photo and I'll suggest where to start — or we can just talk."),
      ("사진 보기 버튼", "인사 직후", "Take a quick look  /  A photo → a starting point in seconds"),
      ("건너뛰기 버튼", "", "Skip — I'll answer a few questions"),
      ("건너뛰면 — 사용자", "", "Let's just talk"),
      ("건너뛰면 — Romie", "", "No problem. First, what brings you to Seoul?"),
      ("목적 선택 1", "버튼 (제목 / 부제)", "A quiet glow-up  /  Skin · lifting · glow — no surgery"),
      ("목적 선택 2", "", "A real change  /  Eyes · nose · contour — surgery"),
      ("목적 선택 3", "", "Just exploring  /  Not sure yet — show me"),
      ("목적 응답 — glow", "선택 후 답", "A glow-up — lovely choice. Which area shall we focus on?"),
      ("목적 응답 — change", "", "A real change it is — we'll take good care of you. Which area shall we focus on?"),
      ("목적 응답 — explore", "", "Let's explore together. Which area shall we focus on?"),
      ("부위 다음 버튼", "부위 선택 화면", "Continue  /  Not sure — continue"),
      ("부위→고민 Romie", "", "Got it. And what would you most love to improve?"),
      ("고민 화면 사진버튼", "", "Take a quick look  /  Let Romie suggest a starting point"),
      ("고민 다음 버튼", "", "See my matches →"),
      ("추천 안내 (매칭 있음)", "", "Based on what you told me, here's what I'd explore for you."),
      ("추천 안내 (매칭 없음)", "", "Thank you — all noted."),
      ("전송 묻기", "", "Shall I send your consultation request with these details?"),
      ("추천 카드 — 종류", "카드 우상단", "Treatment  /  Surgery"),
      ("추천 카드 — 이유 라벨", "({고민} 자리에 고민명)", "Why for Sagging & firmness"),
      ("요약 — 라벨 3개", "", "Goal  /  Focus  /  Concerns"),
      ("전송 버튼", "왓츠앱 전송", "Yes — send my request"),
      ("다시 시작", "", "↺ Start over"),
      ("다시 시작 — Romie", "", "Of course — let's start fresh. Want a quick look, or shall we just talk?"),
      ("왓츠앱 전송 메시지", "상담사에게 가는 자동 메시지 (구역 라벨)", "[Glow Up Seoul · Consultation Request] / WHAT I'M HERE FOR / SUGGESTED FOR ME / ASK · Please send me a hand-picked shortlist and the next steps."),
      ("오류 시 대체 버튼", "데이터 못 불러올 때", "Message Romie on WhatsApp"),
    ])

review_sheet("사진 스캔 (팝업)", "사진 스캔 팝업 — ‘Take a quick look’으로 열림",
    "셀카 한 장으로 어떤 고민부터 보면 좋을지 가볍게 제안하는 팝업. (진단 아님 · 사진 저장 안 함)",
    [
      ("작은 라벨", "팝업 상단", "Quick look"),
      ("제목 — 기본", "", "Let me take a gentle look"),
      ("제목 — 분석 중", "", "Looking…"),
      ("제목 — 오류", "", "Let's try that again"),
      ("카메라 준비", "", "Starting camera…"),
      ("사진 올리기", "카메라 대신 / 안될 때", "Upload a clear selfie  /  Camera unavailable — upload a clear selfie"),
      ("오류 안내", "전송 실패 시", "The photo didn't go through. It might be the connection — your photo was not saved."),
      ("버튼 — 촬영", "", "Take photo →"),
      ("버튼 — 전환", "", "Upload a photo instead  /  Use camera"),
      ("버튼 — 재시도", "", "Try again →"),
      ("버튼 — 건너뛰기", "", "Skip — I'll answer a few questions"),
      ("개인정보 안내", "하단 작은 글씨", "◇ Analyzed once · never stored"),
    ])

# ---------------- save ----------------
out_dir = os.path.join(os.path.dirname(__file__), "..", "docs")
os.makedirs(out_dir, exist_ok=True)
target = os.path.join(out_dir, "v3_클라이언트_명세서.xlsx")
try:
    wb.save(target)
except PermissionError:
    target = target.replace(".xlsx", "_new.xlsx")
    wb.save(target)
print("생성 완료:", os.path.abspath(target), "·", len(wb.sheetnames), "시트")

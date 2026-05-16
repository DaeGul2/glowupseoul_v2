# v2 UX / IA 디렉션

조사 일자: 2026-05-11
참조 사이트: glowupseoul.com (현 운영) · seoulklinic.com (스캔 hook) · seoulbeautyglobal.com (카테고리 분기)

---

## 1. 톤앤매너 베이스라인 (운영 사이트에서 그대로 계승)

glowupseoul.com 이 이미 라이브로 운영중. v2 는 이 톤을 100% 계승하고 **확장**한다.

### 계승
- **슬로건/카피**: "Your Skin. Your *Story.* Seoul." / "One coordinator. One journey. Entirely yours."
- **포지셔닝**: "Not a booking app. *A personal concierge* — just for you."
- **페르소나 — 코디네이터 이름**: **Romie**, **Sisumate** — 매칭 결과 카피에도 "*Your Sisumate selected…*" 식으로 자연 통합
- **다국어 (현 운영)**: EN / 中文 / Bahasa
- **컬러**: warm white + 차콜 + 샴페인 골드 (`#fafaf7` / `#18181a` / `#b8916a` / `#c9a063`)
- **폰트**: Cormorant Garamond 이탤릭 헤드라인 + Inter 본문
- **심볼**: ✦ ◈ ◇ ⬡ ☽ ◎
- **정부 인증 배지** (푸터 필수): "Ministry of Health & Welfare Registered Foreign Patient Attraction Agency · Korea"

### v2 에서 확장
- **다국어 추가**: ZH (이미 中文 있음) + EN 강화 + **JP/RU/VN/TH/AR** 옵트인
- **메신저 채널**: 현재 WhatsApp 단일 → **WeChat (중국 80%)** + **LINE** 추가. Kakao는 한국어 사용자 fallback.
- **운영 연락처**:
  - WhatsApp: `+82 10 6487 1060`
  - Email: `glowupinseoul@gmail.com`
  - (v1 mock 의 7386-3249 는 폐기)

---

## 2. 메인 페이지 IA (사용자 지시 반영)

```
┌──────────────────────────────────────────────┐
│  NAV  (Lang switcher · Currency · Login)     │
├──────────────────────────────────────────────┤
│                                              │
│           HERO                               │
│   "Your Skin. Your *Story.* Seoul."         │
│   [ Start Your AI Face Analysis ]  ← CTA    │
│   ──────────────────────────────             │
│   하단: 1-line trust 지표 (500+ patients,    │
│         25+ countries, Govt Registered)      │
│                                              │
├──────────────────────────────────────────────┤
│  REAL-TIME FEED (social proof ticker)        │
│  ◇ M. in Singapore · HIFU Lifting · 3m ago   │
├──────────────────────────────────────────────┤
│  CATEGORY CARDS (8개, body-area 기준)        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ FACE │ │ EYES │ │ NOSE │ │ BODY │         │
│  │  65  │ │  12  │ │   7  │ │  17  │         │
│  └──────┘ └──────┘ └──────┘ └──────┘         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ SKIN │ │ HAIR │ │WELLN │ │DENTAL│         │
│  │  23  │ │   2  │ │   9  │ │  10  │         │
│  └──────┘ └──────┘ └──────┘ └──────┘         │
│  → 각 카드 클릭 시 /category/{slug} 페이지로 │
├──────────────────────────────────────────────┤
│  카테고리 페이지 내부 — 시술 카드 그리드:    │
│  Sub-filter: [Intensity] [Concerns] [Price]  │
│  ┌─────┐ ┌─────┐ ┌─────┐                    │
│  │HIFU │ │RF   │ │실리프트│  ← 각 카드에:  │
│  │이름 │ │이름 │ │이름   │     - 대표 이미지│
│  │N병원│ │M병원│ │K병원  │     - 병원 수    │
│  │$$   │ │$$$  │ │$$    │     - 가격 티어  │
│  │5⭐  │ │4.8⭐│ │4.9⭐ │     - 평점/리뷰  │
│  └─────┘ └─────┘ └─────┘     - 다운타임   │
├──────────────────────────────────────────────┤
│  HOW IT WORKS (3-step)                       │
│  Scan → Match → WhatsApp                     │
├──────────────────────────────────────────────┤
│  TESTIMONIALS (Sarah/Michelle/Alysa 등)      │
├──────────────────────────────────────────────┤
│  FOOTER (정부 등록 배지 · 사업자 · 다국어)    │
└──────────────────────────────────────────────┘
```

### 핵심 결정
- **Hero 의 스캔은 modal 트리거** (`/scan` 별도 라우트 X). 사용자가 "Start Your AI Face Analysis" 클릭 시 fullscreen modal 오버레이로 진입 → scan complete → 모달 닫힘 + form/results 흐름 진행. 현 운영 사이트가 페이지 단위라 마찰 큰 부분 개선.
- **카테고리는 9~11개 탭** (seoulbeautyglobal.com 패턴 인용, 단 분류 축은 다름 — **의료 시술 중심**).
- **카테고리 클릭 → 전용 카테고리 페이지로 이동** (seoulbeautyglobal 식 인필터링 X. 시술 카드 그리드 + 깊은 콘텐츠).
- **시술 카드 → 시술 상세 페이지** (다중 병원 비교 테이블 — 가격/평점/언어/위치).
- **모든 전환은 WhatsApp 1:1 concierge** (login wall 없음. 즉시 상담 진입).

---

## 3. 카테고리 분류 축 (DB `procedure_categories` 와 매핑)

seoulbeautyglobal 의 살롱 결(Nails/Waxing) 은 버리고, 의료 시술 중심으로 재설계.

**결정**: **body_area 8개 그룹** 을 1차 카테고리로 채택 (자세한 사고흐름은 `v2/CLAUDE.md §15`).
- 외국인 mental model 일치 ("I want to fix my **eyes**" 가 가장 직관)
- intensity_tier (surgery/petit/skin) 는 카테고리 페이지 내부 sub-filter 로 보존
- mechanism / brand 명은 외국인 인지도 낮아 1차 X (advanced toggle 로 살림)

| # | 슬러그 | KR | EN | ZH | 주 도메인 | 대략 시술 수 |
|---|---|---|---|---|---|---|
| 1 | `face` | 얼굴 | Face | 面部 | face_aesthetic | ~65 |
| 2 | `eyes` | 눈 | Eyes | 眼部 | surgical | ~12 |
| 3 | `nose` | 코 | Nose | 鼻部 | surgical | ~7 |
| 4 | `body` | 바디 | Body | 身体 | body_contouring | ~17 |
| 5 | `skin` | 피부 | Skin | 皮肤 | derm_medical | ~23 |
| 6 | `hair` | 헤어/두피 | Hair & Scalp | 头发与头皮 | surgical | ~2 |
| 7 | `wellness` | 재생/웰니스 | Wellness & Regenerative | 健康再生 | regenerative | ~9 |
| 8 | `dental` | 치과 | Dental | 牙科 | dental | ~10 |

→ "All" 기본 탭 + 위 8개. 우선순위 표시 순서는 `display_order` 컬럼.

### 카테고리 페이지 내부 secondary filter (모든 카테고리 공통)
- **Intensity tabs**: [All] [Surgery] [Petit] [Skin] — 바비톡 식 결정 boundary 보존
- **Concerns chips**: 해당 카테고리의 ~5-10개 매핑된 고민 (예: Face → Lifting · Wrinkles · Sagging · Volume · Pores)
- **Price tier**: $ / $$ / $$$
- **Downtime**: 0d / 1-3d / 3-7d / 7d+
- **Language support**: EN / 中文 / 日本語 / ...
- **(Advanced toggle) Mechanism**: HIFU · RF · Laser · ... — 의료 리터러시 있는 사용자용

---

## 4. 얼굴 스캔 modal (seoulklinic.com 인용 + 차별)

### 차용 — 우리 v1 위에 얹을 것
1. **로딩 단계 마이크로카피 시퀀스** (4.5초 메쉬 애니에 텍스트 페이드):
   - 0.0s "Loading face model..."
   - 1.0s "Detecting landmarks..."
   - 2.5s "Analyzing your *Story*..."
   - 4.0s "Generating your match..."
2. **사진 업로드 폴백** (카메라 거부/저조도 케이스). 단 **메인 hero 에 평등 노출 X** — modal 안 작은 텍스트 링크로 "or upload a photo".
3. **annotated 이미지 보존** — 우리 v1 이미 jpeg 캡처. 추가로 3개월 저장 + 결과 페이지 URL 재방문 가능하게 (Supabase 등 cloud storage 도입).

### 차별 — 절대 따라하지 않을 것 (사용자 명시)
1. **"Glow Score / Klinic Score" 점수형 카피 금지** — 우리는 점수가 아닌 "*Your Story*" 내러티브.
2. **퍼플/핑크 K-tech 팔레트 금지** — 샴페인골드 + Cormorant 이탤릭 절대 유지.
3. **"Powerful Facial Scan, Clear Results" 식 기능 자랑 헤드라인 금지** — 감성 이탤릭 카피로.
4. **/Scan 별도 페이지 라우팅 금지** — modal 단일 흐름.
5. **system-ui 폰트 금지** — Cormorant Garamond.

---

## 5. 신뢰 시그널 (외국인 의사결정 핵심)

운영 사이트 미흡 영역 + 경쟁 사이트 차용:

| 시그널 | 위치 | 출처 |
|---|---|---|
| 정부 등록 배지 | 푸터 + Hero 하단 | 운영 사이트 (이미 있음) |
| 환자 후기 (영문) | Testimonial 섹션 | 운영 사이트 (Sarah/Michelle/Alysa) |
| 외부 리뷰 어그리게이션 | 시술/병원 상세 | seoulklinic 인용 (Naver/YouTube/Reddit/TikTok) |
| "Locals say vs tourists say" | 병원 상세 | seoulklinic 인용 |
| Before/After 갤러리 | 병원 상세 | 신규 (운영 사이트 부재) |
| 의사 프로필 | 병원 상세 | 신규 |
| Safety claim | 병원 카드 | 신규 (Hershe 식 "50개국 4만명 0사고") |
| 통계 카운터 | Hero 하단 | 운영 사이트 (500+/98%/10000+/25+) |
| 코디네이터 페르소나 | 매칭 결과 | 운영 사이트 (Romie/Sisumate) |
| Korean ↔ EN/ZH 통역 명시 | 컨시어지 페이지 | seoulklinic 인용 |
| 체류일정 입력 (arrival/departure) | 상담 폼 | seoulklinic 인용 |
| 24h 회신 SLA | 상담 폼 | seoulklinic 인용 |

---

## 6. 페이지 트리 (v2)

```
/                                  # Main (hero + 카테고리 탭 + 시술 그리드)
/scan                              ← modal로 통합. 별도 페이지 X
/category/:slug                    # 카테고리 페이지 (예: /category/lifting)
/treatment/:slug                   # 시술 상세 (다중 병원 비교)
/clinic/:slug                      # 병원 상세
/results/:matchId                  # 매칭 결과 (스캔 + form 완료 후)
/how-it-works                      # 컨시어지 저니 설명
/about                             # 정부 등록 / 회사 정보
/faq
/consultation                      # WhatsApp 단일 CTA 페이지
/legal/privacy /legal/terms
```

---

## 7. 다국어 / 통화 / 메신저

- **언어 토글**: EN (default) / 中文 (필수) / Bahasa / JP / KO
- **통화 토글**: USD / CNY / SGD / IDR / MYR / KRW — 가격 표시 시 internal KRW 에서 FX 변환
- **메신저 채널**: WhatsApp / WeChat / LINE / Kakao 모두 노출. 사용자 언어/국가에 따라 default 채널 자동 선택.

---

## 8. 실시간 상담 신청 피드 (Social-Proof Ticker)

사용자 요구 (2026-05-11): "상담신청내역을 실시간으로 메인페이지에 보이게하고싶어. 어떤 고민, 그리고 어떤 결과 등등이 나왔는지."

### 8-1. 배치 위치
**Hero 직하단 + 카테고리 탭 직상단** — thin horizontal ticker (높이 ~44px).

```
┌──────────────────────────────────────────────┐
│           HERO (Scan CTA)                    │
├──────────────────────────────────────────────┤
│ ◇  M. in Singapore · HIFU Lifting   3m ago  │ ← 피드 ticker (회전)
├──────────────────────────────────────────────┤
│  [All] [Lifting] [Contour] [Skin] ...        │ ← 카테고리 탭
└──────────────────────────────────────────────┘
```

→ 부킹닷컴/스트라이프 식 floating corner 는 **금지** (라이트 럭셔리 톤 깨짐).
→ 정적 1줄 + 6초마다 페이드 회전. 호버 시 일시정지.
→ 우측 끝에 작은 "View all →" 링크 → 모달로 최근 20개 확장.

### 8-2. 카피 패턴 (다국어)
한 줄 — 3 부품 (initial, country, treatment) + 시간. 시술명은 Cormorant 이탤릭 강조:

| 언어 | 예시 |
|---|---|
| EN | M. in Singapore — consultation for *HIFU Lifting* · 3 min ago |
| ZH | M. 来自新加坡 — 咨询 *HIFU提升* · 3分钟前 |
| JA | シンガポールの M. さん — *HIFUリフト* を相談 · 3分前 |
| KO | M. (싱가포르) — *HIFU 리프팅* 상담 · 3분 전 |

- 이탤릭 = Cormorant Garamond, 본문 Inter
- 심볼 prefix: ◇ (회색 톤)
- 시간 표기: `Xs / Xm / Xh / Xd ago` — 7일 이상은 hide

### 8-3. 익명화 룰 (Korean PIPA 안전)
- 이름: **이니셜 1자 + 마침표** (M. / J. / 一.) — 절대 풀네임 X
- 국가: ISO 코드 → 영문/번역 라벨. **도시 단위 X** (소규모 시장 식별 위험)
- 시술: **canonical name 만** (병원명 절대 X)
- 결과: optional. "matched with 3 clinics" / "consulted" / 공란

### 8-4. 데이터 흐름
```
[user submits consultation form]
   │
   ├─ public_feed_consent = TRUE 체크박스 (디폴트 OFF)
   ▼
[inquiries / match_requests INSERT]
   │
   ├─ trigger or app-layer copy
   ▼
[public_feed_entries INSERT — anonymized]
   │
   ▼
GET /api/feed/recent?lang=en&limit=20
   │
   ▼
[main page] polling every 30s
```

운영자는 admin 에서 직접 `is_seed=true` 행을 추가/제거할 수 있다. 트래픽 적은 초기엔 시드로 ticker 살림.

### 8-5. 옵트인 UX
상담 폼 맨 아래 small checkbox (기본 **OFF**):

> ☐ *Help others — share my consultation anonymously on the home page (only initial + country + treatment shown, no identifying details).*

ZH: ☐ *帮助他人 — 在首页匿名分享我的咨询*
JA: ☐ *他の方の参考に — トップページで匿名で共有*
KO: ☐ *다른 분께 도움 — 메인페이지에 익명 공유 (이니셜 + 국가 + 시술만)*

한국 의료 데이터 규제 + GDPR 보호 차원으로 무조건 opt-in.

### 8-6. API
```
GET /api/feed/recent
  query: ?lang=en&limit=20
  returns: [{
    id, display_initial, country_label,
    treatment_label, outcome, outcome_note,
    displayed_at, age_label   // "3 min ago"
  }]
  cache: 30s edge cache
  filter: is_visible=true AND (expires_at IS NULL OR expires_at > now())
```

### 8-7. 운영자 시드 전략 (low-traffic 초기)
- 운영 시작 시 **20개 시드 엔트리** 미리 INSERT (다양한 국가/시술 분포)
- 각 시드는 7~30일 expires_at 설정 → 자연 소멸
- 실 사용자 opt-in 비율 ~5~15% 가정 (보수적), 시드로 비는 시간대 메꿈
- 시드 카피는 **canonical 다국어 라벨** 그대로 사용 → 자연스러움

### 8-8. 부정 운영 가드
- **isSeed = TRUE 행은 admin 권한 필요** + 시드 비율 모니터링 (90% 이상 시드면 경고)
- 외부 비공개: API 응답에 `is_seed` 필드 노출 X (운영자만)
- 사용자가 동의했어도 inquiry 삭제하면 cascade 로 feed 도 삭제

---

## 9. 다음 작업 순서 (제안)

1. ✅ **schema.sql** 완료 (`public_feed_entries` 포함). mechanisms / procedure_categories 시드 진행.
2. **concerns 시드** — 외국인 관점 20~30개. 본 문서 §3 카테고리와 1:N 매핑.
3. **procedures 시드** — 50~80개. 본 조사 + claude(3).md §7 기준.
4. **concern_procedures 매트릭스** — 수기 큐레이션 (운영자 Min 별도 세션).
5. **public_feed 시드** — 20개 다국가/다시술 분포 (ticker 초기 데이터).
6. **v2 client/server 부트스트랩** — 운영 사이트 톤 그대로 + 본 IA 적용 + 피드 ticker.
7. **첫 5개 hospital 입력**: Hershe / 노즈립 / 리엔장 강남 / 센텀코어 / 우아 (다국어·외국인 시그널 강한 곳).

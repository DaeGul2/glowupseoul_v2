# Glow Up Seoul v2 — CLAUDE.md

> Korea Medical Tourism Platform · 외국인 환자 ↔ 한국 강남/부산 피부·성형·치과 클리닉
> 본 문서는 v2 작업의 source of truth. 모든 결정·고민·맥락이 여기 있음.
> 최종 갱신: 2026-05-11

---

## 0. 한 줄 요약

v1 (한국 도메스틱 PWA, 강남 시술 매칭) → **v2 (외국인 환자 컨시어지 + 가이드 저니)** 로 전면 피봇.
운영 중인 사이트 `glowupseoul.com` 이 이미 EN/中/Bahasa 컨시어지 모델로 운영 중이며, v2 는 이를 기반으로 **시술 카탈로그 + 병원 매칭 + 스캔 hook + 다국어 채널** 을 더해 컨버전 흐름을 완성한다.

---

## 1. 사용자가 고민한 흐름 (의사결정 history)

이 섹션은 사용자가 실제로 말한 내용 기반. 향후 결정이 흔들릴 때 참고할 anchor.

### 1-1. 방향 피봇 결정 (2026-05-11)
- 기존 `CLAUDE.md` (v1) vs `CLAUDE (3).md` (외국인 환자 피봇 안) 둘 중 선택 → **CLAUDE (3) 방향이 맞을듯**.
- 이유: v1 의 flat `Treatment` 구조와 한국어 도메스틱 톤은 시장 규모·차별화 한계. claude(3).md 의 `procedures` (intrinsic) vs `hospital_procedures` (variant) 분리 원칙이 외국인 시장 다양성에 더 견고함.

### 1-2. 타깃 시장 결정 (사용자 그대로 인용)
> "중국 : 영어권 비율이 약 8:2 임. 근데 중국쪽은 그쪽 마케터가 알아서하긴해.
> 영어권은 수익률이 거의 99% 우리가 다 먹는대신 이사람들은 내가 직접 상담해야하고."

→ **결정**:
- **중국 80%** — 중국 마케터가 별도 운영. 우리 플랫폼은 **ZH UI + WeChat 채널** 제공만.
- **영어권 20%** — 운영자(Min) **직접 상담**. EN UI + WhatsApp 메인. **마진 ~99%**.
- 후순위: 일본어 / 러시아어 / 베트남 / 인니 / 태국 / 아랍어.

### 1-3. 구조 작업 우선순위
> "일단 그 전에 나는 스키마 설정부터 해야하거든?"

→ 코드보다 **스키마 + 데이터 카탈로그 먼저**. v1 클라이언트/서버는 그대로 두고, `v2/` 디렉토리에서 새로 시작.

### 1-4. 메인 페이지 IA (사용자 지시)
> "main 페이지 hero쪽엔 지금처럼 스캔기능 부각하는 걸 사용하되, **스캔은 modal로 처리**하자.
> 그 다음 main페이지들엔 시술별로 카테고리화하여 그거를 취급하는 병원들을 이쁜 [그리드/카드]로."

→ 결정:
- Hero = 스캔 hook (modal 단일 흐름, `/scan` 별도 라우트 X)
- 그 아래 = 카테고리 탭 → 시술 그리드 → 시술 상세 (다중 병원 비교) → 병원 상세 → WhatsApp/WeChat 1:1

### 1-5. 참조 사이트 명시
> "https://seoulklinic.com/ <- 여기서 **스캔하는 hooking** 따라하되, **절대 똑같지는 않게**.
> https://seoulbeautyglobal.com/ <- 여기선 **메인페이지 카테고리 분기**하는거."

→ 결정:
- seoulklinic 의 4-단 로딩 마이크로카피 시퀀스 + 사진 업로드 폴백 차용. **단, 점수형(Glow Score) 강조 / 퍼플-핑크 K-tech 팔레트 / system-ui 폰트는 절대 X**.
- seoulbeautyglobal 의 아이콘+라벨 탭바 패턴 차용. **단, 살롱 서비스(Nails/Waxing) 제외, 분류 축은 우리만 다르게**.

### 1-6. 병원 섬네일
> "각 병원별로 섬네일도 할거임"

→ 스키마에 이미지 3계층 추가:
- `procedures.thumbnail_url` (브랜드 무관 generic 시술 이미지)
- `hospitals.thumbnail_url` / `hero_image_url` / `gallery_urls[]` (병원 카드 / 상세 hero)
- `hospital_procedures.thumbnail_url` (병원이 특정 시술의 자체 샷을 가질 때 override)

### 1-7. 천천히 가자
> "일단 천천히해보자. 병원조사한거 결과 나한테 마랳봐. 시술 관련 정리한거. 난 이제 여기서 구조를 다시 짤거야."

→ **사용자가 구조 재설계 주체**. AI 가 임의로 카테고리 강제하지 말고, **raw 데이터 + 패턴 정리만 제공**.

### 1-8. xlsx 출력 선호
> "엑셀에다가 저장해서 줘야지 임마"

→ raw 데이터 결과물은 **반드시 xlsx 파일로 출력**. in-chat markdown 만 던지면 사용자가 검토·재구성 못함.

### 1-9. 강남언니 enum 기준
> "treatments 기준으로 혹시나 성격이나 이런 것들이 중복되는거 있는지 봐바. 그다음 merge해봐.
> 이런건 '강남언니' 등과 같은 어플의 enum기준을 참고해봐"

→ 결정: 한국 4대 플랫폼(강남언니·바비톡·여신티켓·굿닥) 분석 → **바비톡 식 3-tier intensity (surgery / petit / skin)** 채택 + **강남언니 식 3축 병행 (부위·기전·고민)** 보조.

### 1-10. 작업 디렉토리 변경 (2026-05-11)
> "이제부터 너는 glowupseoul_v2 폴더에서만 놀면된다 알겠지?"

→ **작업 경로**: `C:\Users\alsxo\Documents\GitHub\glowupseoul_v2\` 단 한 곳.
- GitHub Desktop 연동, remote = `DaeGul2/glowupseoul_v2.git` (private)
- `Desktop\glowupseoul\` 은 **폐기**. 어떤 변경도 가하지 말 것.

### 1-11. 실시간 상담 신청 피드 (2026-05-11)
> "상담신청내역을 실시간으로 메인페이지에 보이게하고싶어. 어떤 고민, 그리고 어떤 결과 등등이 나왔는지."

→ 결정: **부킹닷컴 식 social-proof ticker** (라이트 럭셔리 톤 유지 위해 floating corner X, hero 직하단 inline ticker, 6초 회전).
- 익명화 룰: 이니셜 1자 + 국가 (도시 X) + canonical 시술명 (병원명 X)
- **opt-in 디폴트 OFF** (한국 PIPA + GDPR)
- 운영자 시드 가능 (`is_seed=true`), 초기 트래픽 부족 메꿈
- 스키마: `public_feed_entries` 테이블 + `inquiries.public_feed_consent` / `match_requests.public_feed_consent`
- API: `GET /api/feed/recent` (polling 30s)
- 자세히: `docs/ux-direction.md §8`

---

## 2. 포지셔닝 — vs 강남언니 / 바비톡

| 강남언니·바비톡 | Glow Up Seoul v2 |
|---|---|
| DB 검색 + 후기 | **진단 매칭 + 저니 핸들링** |
| 셀프서비스 | **휴먼 인 더 루프 (컨시어지)** |
| 한국 도메스틱 baseline | **외국인 환자 optimized** |
| 시술 정보만 | **시술 + 숙박 + 사후관리 번들** |
| 병원 수수료 | **병원 커미션 + 환자 컨시어지 피** |
| 예약 시점에 끝 | **D+1 / D+7 / D+30 follow-up** |
| 브랜드명 카테고리 (써마지/슈링크) | **고민 키워드 진입** (외국인은 브랜드명 모름) |

### 차별화 무기 (Phase 1)
- 사전 다국어 영상 컨설팅 (Calendly + Zoom) — 강남언니 식 불가능
- 사후 D+1/D+7/D+30 체크인 + 합병증 시 병원 코디
- 외국인 특화 필터 — 영어 의사 / female-only / 통역 / halal / 호텔 인접
- B2B — 해외 뷰티 인플루언서 / 외국 의료관광 에이전시 / 외국 클리닉 referral (white-label 옵션)

---

## 3. 운영 자산 (이미 보유 — `glowupseoul.com`)

- **WhatsApp**: `+82 10 6487 1060` (v1 mock 의 7386-3249 는 폐기)
- **Email**: `glowupinseoul@gmail.com`
- **정부 등록**: Ministry of Health & Welfare — Foreign Patient Attraction Agency · Korea
- **다국어**: EN / 中文 / Bahasa (현재)
- **페르소나**: **Romie · Sisumate** — 코디네이터 이름. 매칭 결과 카피에 자연 통합 ("*Your Sisumate selected…*")
- **통계 (운영 사이트 공개)**: 500+ patients · 98% satisfaction · 10,000+ clinics evaluated · 25+ countries
- **후기 (운영 사이트 공개)**: Sarah L./London · Michelle K./Sydney · Alysa N./Singapore
- **톤앤매너**:
  - 컬러: warm white `#fafaf7` / 차콜 `#18181a` / champagne `#b8916a` / gold `#c9a063`
  - 폰트: Cormorant Garamond 이탤릭 헤드라인 + Inter 본문
  - 심볼 데코: ✦ ◈ ◇ ⬡ ☽ ◎
  - 카피 훅: "Your Skin. Your *Story.* Seoul." / "One coordinator. One journey. Entirely yours." / "Not a booking app. *A personal concierge* — just for you."

→ v2 는 이 톤을 **100% 계승하고 확장**. 컬러/폰트/페르소나 절대 양보 X.

### 운영 사이트 갭 (v2 가 채울 것)
- WeChat / LINE / Kakao 채널 없음 → **WeChat 필수 (중국 80% 타깃)**
- 통화 토글 없음 → USD/CNY/SGD/IDR/MYR/KRW 다중 통화
- 일본어 누락 → 옵션으로 추가 (Bahasa 있는데 JP 없는 건 기회/의도 분리 검토)
- before/after / doctor profile / 비디오 후기 등 컨버전 자산 부재
- 항공/숙박/공항픽업/통역 패키지 정보 페이지 미노출

---

## 4. 참조 사이트 분석 — 무엇을 차용/배제했는가

### 4-1. glowupseoul.com (현 운영)
**계승**: 카피 톤, 페르소나, 정부 등록 배지, Care / Premium Care 2-tier 분류, 환자 후기, 통계 카운터
**확장**: 다국어 (ZH 강화), 메신저(WeChat), 통화 토글, B&A 갤러리, 의사 프로필, 비디오 후기

### 4-2. seoulklinic.com (스캔 hook 참고)
**차용**:
1. 4-단 로딩 마이크로카피 시퀀스 (Loading → Detecting → Analyzing → Generating)
2. 사진 업로드 폴백 (카메라 거부/저조도 케이스)
3. annotated 이미지 저장 (3개월, 결과 페이지 재방문)
4. 외부 리뷰 어그리게이션 (Naver/YouTube/Reddit/TikTok — "Locals say vs tourists say")
5. 체류일정 입력 (arrival/departure)
6. 24h 회신 SLA 명시

**절대 따라하지 않을 것 (사용자 명시)**:
1. "Glow Score / Klinic Score" 점수형 강조 — 우린 "*Your Story*" 내러티브
2. 퍼플/핑크 K-tech 팔레트 — 우린 샴페인골드 유지
3. "Powerful Facial Scan, Clear Results" 식 기능 자랑 헤드라인 — 우린 감성 이탤릭
4. `/Scan` 별도 페이지 라우팅 — modal 단일 흐름
5. system-ui 폰트 — Cormorant Garamond 절대 유지
6. 사진 업로드 메인 평등 노출 — 라이브 스캔이 ritual

### 4-3. seoulbeautyglobal.com (카테고리 분기 참고)
**차용**:
- 9개 내외 아이콘 + 라벨 탭바 (모바일 가로 스크롤)
- "All" 기본 탭 진입 부담 제거
- footer 사업자등록 신뢰 시그널

**다르게**:
- 분류 축 자체 변경 — 살롱 서비스(Nails/Waxing) 제외, **의료 시술 중심**
- 카테고리 클릭 시 인필터링 X → **전용 카테고리 페이지**
- 시술 → **다중 병원 비교** 페이지 신설
- login wall 제거 — 즉시 WhatsApp 진입
- 신뢰 시그널 전면 배치 (의사 프로필 / B&A / 영문 후기 / 인증 배지)

### 4-4. 한국 4대 플랫폼 enum 분석
- **강남언니**: 3축 병행 (부위 / 시술 / 고민)
- **바비톡**: 시술 강도 3단 (성형 / 쁘띠 / 피부)
- **여신티켓**: 시술명 평면 (브랜드명 = 카테고리)
- **굿닥**: 진료과 단일

→ **v2 채택**:
- **1차 진입축 = concern (외국인 키워드)** — "lifting", "acne scars", "double eyelid"
- **2차 = body_area** — 카테고리 탭 (눈/코/얼굴/바디/치과)
- **3차 (필터) = mechanism** — 의료 리터러시 사용자
- **메타 axis = intensity_tier (바비톡식)** — surgery / petit / skin 강도 위계

---

## 5. 분류 축 enum 최종안

### 5-1. intensity_tier (바비톡식 3-tier — UI 강도 위계)
| slug | 의미 |
|---|---|
| `surgery` | 절개·전신마취·수일 입원/회복 |
| `petit` | 바늘/장비 — 절개X, 다운타임 짧음 |
| `skin` | 레이저 토닝·압출·필링·미백 — 가장 가벼움 |

### 5-2. domain (6개 — 시술 도메인)
| slug | 의미 |
|---|---|
| `face_aesthetic` | 리프팅·필러·보톡스·스킨부스터 |
| `body_contouring` | 지방흡입·DCA·EM·바디 HIFU |
| `regenerative` | 줄기세포·엑소좀·PRP·IV |
| `surgical` | 눈·코·가슴·윤곽·거상·구순열 |
| `derm_medical` | 여드름·흉터·색소·기미·홍조 |
| `dental` | 임플란트·교정·라미네이트·미백 |

### 5-3. mechanism enum (30개 — claude(3).md 12개 + 실측 확장)
**face_aesthetic / energy**: `hifu` · `mmfu` · `rf`
**lasers**: `laser_ablative` · `laser_non_ablative`
**injections**: `injection_toxin` · `injection_filler` · `injection_skin` · `fat_dissolve_injection`
**thread / topical / extraction**: `thread` · `peel` · `extraction` · `subcision` · `topical`
**surgical**: `surgery` · `reconstructive` · `hair_transplant`
**body**: `liposuction` · `fat_grafting` · `cryolipolysis` · `em_muscle_stim`
**regenerative**: `stem_cell` · `exosome` · `prp` · `iv_therapy`
**dental**: `implant` · `orthodontic` · `prosthetic` · `restorative` · `periodontal` · `bleaching_dental`

### 5-4. body_area (20+)
face / eye / nose / lip / jaw / cheek / forehead / brow / ear / neck / breast / abdomen / arm / thigh / calf / buttocks / shoulder / pelvis / chest / body / skin / scalp / joint / **dental** / **systemic**

### 5-5. concerns (사용자 진입 키워드)
하단 §7 catalogue 의 각 row 에 `concerns[]` 매핑. 예: `["lifting","sagging","wrinkles","elasticity"]`. 본격 시드는 사용자 큐레이션 필요 (claude(3).md §11 — 자동 생성 금지).

---

## 6. 병원 조사 결과 — 17개 active + 3 SPA-fail

데이터: `docs/hospital_research.xlsx` (5시트, 200KB)
- **Clinics** (20행) — 병원 요약
- **Treatments** (258행) — 시술 풀
- **Patterns** (230행) — 시술명 정규화 + 보유 병원 카운트
- **ForeignSignals** (17행 active) — 다국어/메신저/시그널 매트릭스
- **Legend**

### 6-1. 병원 archetype 7개
| Archetype | 예시 |
|---|---|
| Device-led derm | 아윤, 라미체, 듀이디, 햇살담은뜰 |
| Surgery specialty | 우아(가슴), 워너비(코·눈), Hershe(리프팅·힙), 노즈립(코재건), 그림(구순열), 리드(눈·거상) |
| Mixed peri-surgical | 소이, 리엔장, 센텀코어 |
| Body contouring specialty | 365mc |
| Regenerative specialty | 셀로라, 살롱드닥터튠즈 |
| Dental | 리엔장 치과 |
| Chain (체인 / 다지점) | 리엔장 (6 branches × 5 계열사) |

### 6-2. 외국인 시그널 갭 (중국 80% 타깃 관점)
- **WeChat 보유 = Hershe·센텀코어·살롱드닥터튠즈 3곳만** (17 중) — **플랫폼이 WeChat 채널 갭을 메꿔야**
- 다국어 9개 보유 최강 = **리엔장 (KR/EN/ZH 간번/JP/TH/VN/ID/RU)**, 단 WeChat 없음 — 큐레이션 대상
- 코디네이터·통역·픽업·숙소 명시 거의 없음 → **컨시어지 차별화 가치 큼**
- 운영 번호 = `+82 10 6487 1060` (모든 신규 코드는 이 번호)

### 6-3. SPA 렌더링 실패 3곳
- **벨리셀의원** — 수동 입력 또는 Playwright
- **반니 성형외과** — 수동 입력
- **셀로라 의원** — 계약 협의중 (우선순위 낮음)

→ v2 데이터 파이프라인에 Playwright headless 옵션 검토. MVP는 수동.

---

## 7. Canonical 시술 catalog (merge 완료)

데이터: `docs/hospital_canonical.xlsx` (5시트)
- **CanonicalCatalog** (159행) — 캐노니컬 시술 1행
- **CanonicalMembership** (258행) — 캐노니컬 ↔ 원본 raw 시술명 join
- **MechanismEnum** (31행)
- **CategoryAxes** (36행)
- **Legend**

### 7-1. Merge 통계
| 항목 | 값 |
|---|---|
| 원본 Treatments | 258 행 |
| Canonical 시술 | **159 개** |
| Merge된 중복 | **99 행** (38% 압축) |
| 누락 매핑 | 0 |

### 7-2. 주요 merge (5개+ 병원 보유)
- `rf_thermage` 써마지 FLX → 6 병원 (아윤·듀이디·라미체·우아·워너비·리엔장)
- `hifu_ulthera` 울쎄라 → 5 병원
- `filler_face_generic` 필러 → 6 병원
- `skinbooster_rejuran` 리쥬란 (HB·Eye 포함) → 6 병원
- `stemcell_antiaging` 줄기세포 항노화 → 7 병원
- `thread_generic` 실리프팅 → 5 병원
- `surgery_breast_aug` 가슴 확대 (모티바/멘토 포함) → 8 병원 (병원별 implant brand 만 다름)
- `botox` 보톡스 → 4 병원
- `iv_therapy` IV/수액 → 4 병원

→ **사용자가 이 시트 기반으로 구조 재설계 진행 중** (2026-05-11 현재).

---

## 8. 스키마 설계 원칙 (Postgres DDL `db/schema.sql`)

### 8-1. 진실의 axis
> "이 값이 병원에 상관없이 동일한가?"
- **Yes** → `procedures` (intrinsic)
- **No** → `hospital_procedures` (variant)

### 8-2. 핵심 테이블 14개
1. `mechanisms` (lookup, 다국어)
2. `procedure_categories` (트리, 다국어)
3. `procedures` (intrinsic — mechanism · domain · body_area · 통증/다운타임 · 수술필드 NULL-able · 이미지 generic)
4. `concerns` (외국인 키워드)
5. `concern_procedures` (매칭 매트릭스, **수기 큐레이션**)
6. `brands` (부모 — specialization_depth: niche/device_led/general, logo, brand_hero)
7. `hospitals` (branch 단위 — geo 3-tier, 메신저 4종, 언어 array, 외국인 capability, 신뢰 시그널, 이미지 thumbnail/hero/gallery)
8. `hospital_procedures` (변형 — price_tier, device_brands array, package_notes, 이미지 override)
9. `users`
10. `match_requests` (matching snapshot)
11. `inquiries` → `quotes` (concierge loop) — `public_feed_consent` 컬럼 포함
12. `trips` (저니 패키지)
13. `consultations` (pre/in/post-trip)
14. `post_op_checkins` (D+1/D+7/D+30)
15. `public_feed_entries` (메인 페이지 social-proof ticker — 익명화, opt-in, 운영자 시드 가능)

### 8-3. 결정 사항
- **brand → hospital (branch) 2계층** — 리엔장 6 branches 처리
- **mechanism = `TEXT[]`** — InMode RF+EM 조합 케이스 지원
- **이미지 3계층** — generic procedure / hospital branch / hospital_procedures override
- **dental 같은 schema 통합** — `body_area='dental'` + dental mechanism 6개. 별도 테이블 X.
- **packages MVP = 자유 텍스트** — 살롱드닥터튠즈만 1 케이스. 패턴 굳어지면 Phase 2 `procedure_bundles`.
- **가격 표시 = 티어만** ($/$$/$$$). 정가 노출 옵트인. 17곳 모두 "상담문의" — 한국 의료광고법.
- **돈 = KRW integer**. FX 변환은 display edge.
- **public_feed = 별도 테이블** — view 가 아닌 이유: (1) PIPA opt-in 강제 (2) 운영자 시드 가능 (3) pre-computed 다국어 라벨로 hot path 빠름.

---

## 9. 디렉토리 구조 (2026-05-12 평탄화 완료)

```
glowupseoul_v2/
├── CLAUDE.md                              ← 본 파일 (source of truth)
├── README.md                              ← 개요 + 운영 연락처
├── client/                                ← Vite + React (5174)
├── server/                                ← Express (3001) — 키 .env
├── db/
│   ├── schema.sql                         Postgres DDL 15 테이블 (이미지 컬럼 포함)
│   └── seed/
│       ├── mechanisms.sql                 30개 mechanism 다국어
│       └── procedure_categories.sql       10 메인 + 4 하위 카테고리
├── docs/
│   ├── research-findings.md               17개 병원 조사 종합
│   ├── ux-direction.md                    메인 IA / 스캔 modal / 카테고리 분기
│   ├── hospital_research.xlsx             raw 데이터 5시트
│   └── hospital_canonical.xlsx            canonical merge 5시트
├── scripts/
│   ├── export_research.cjs                raw research xlsx 생성
│   ├── merge_canonical.cjs                canonical merge 생성
│   └── bin_to_categories.cjs              8-카테고리 binning
└── legacy/                                ← v1 자산 보존 (참조용, 운영 X)
    ├── client_v1/                         v1 PWA
    ├── server_v1/                         v1 Express
    ├── scripts/export_ayun.cjs            v1 아윤 파싱
    ├── CLAUDE_v1.md                       v1 스펙
    ├── CLAUDE_pivot_draft.md              피봇 검토 (구 CLAUDE (3).md)
    ├── README_v1.md
    ├── ayunclinic_parsed.xlsx
    └── 기능정의*.txt
```

---

## 10. 운영 원칙 / 사용자 명시 가이드라인

1. **사용자가 구조 재설계 주체** — AI 가 임의 카테고리 강제 X. raw 데이터 + 패턴만 제공.
2. **결과는 xlsx 우선** — in-chat markdown 만 던지지 말 것.
3. **천천히 가자** — 큰 데이터는 한 번에 결정 강제 X. 검토 시간 주기.
4. **스캔은 modal** — `/scan` 별도 라우트 X.
5. **카테고리는 시술별** — 분류축 미정 상태에서도 이쁜 그리드 우선.
6. **WeChat 채널 메꾸기** — 우리 플랫폼 WeChat ID 가 갭 메꿈.
7. **점수형 hook 금지** — "Your Story" 내러티브.
8. **샴페인골드 + Cormorant 절대 사수** — 퍼플/핑크 K-tech 톤 절대 X.
9. **WhatsApp 단일 전환** — login wall 제거.
10. **콘선 → 매트릭스는 수기** — 자동 생성 금지 (claude(3) §11).

---

## 11. 미해결 / 개방된 결정 (사용자 검토 필요)

> 해결됨: ~~메인 카테고리 분기 축~~ → §15 에서 결정 (body_area 8그룹 + intensity sub-filter)

1. **159 canonical 중 진짜 카탈로그에 노출할 항목** — 마이너 디바이스(Reepot/Lucas Plus/Photona 등) 노출 vs hide?
2. **365mc 의 `body_contouring` 도메인 — 다른 face_aesthetic 과 동등 노출 vs 별도 메뉴?**
3. **리엔장 6 branches 중 v1 launch 에 몇 개 노출?** — 강남본점만? 6개 다?
4. **셀로라 (계약 협의중)** — 포함 / 보류?
5. **다국어 일본어 추가 시점** — 현재 운영은 EN/中/Bahasa. JP 시장 진입?
6. **B&A 갤러리 자산 확보 방법** — 병원에서 직접? 사용자 동의받고 환자 후기?
7. **컨시어지 capacity** — Min 솔로로 영어권 동시 몇 명까지?
8. **WeChat 운영자 계정 발급** — 누가, 언제?
9. **CN UI 번역 품질** — 자체 vs 프로 번역 outsource?
10. **실시간 피드 시드 분포** — 20개 초기 시드의 국가/시술 mix 누가 큐레이션? 실 사용자 opt-in 비율 도달 시점은 언제? 시드 자동 만료 정책 (7일 / 30일 / 영구)?
11. **8 카테고리 중 'Hair' 의 시술 수 부족 (~2)** — 그대로 유지 (차별화 시그널)? 아니면 'Body' 와 통합 ('Body & Hair')? 아니면 hair_transplant 만 surgery 로 옮기고 카테고리 7개로 축소?

---

## 12. 다음 작업 (큐 — 사용자 결정 대기)

| # | 작업 | 상태 |
|---|---|---|
| ✅ | 17개 병원 조사 · xlsx 출력 | 완료 |
| ✅ | Postgres 스키마 15 테이블 + 이미지 컬럼 + 피드 | 완료 |
| ✅ | mechanism / category 시드 (다국어) | 완료 |
| ✅ | Canonical merge (258 → 159) | 완료 |
| ✅ | 카테고리 분기 축 결정 (§15) — body_area 8개 그룹 + intensity sub-filter | 완료 |
| ⏳ | concerns 시드 (20~30, 외국인 키워드) | 사용자 큐레이션 필요 |
| ⏳ | concern_procedures 매트릭스 | 사용자 큐레이션 필요 |
| ⏳ | public_feed 시드 (20개 다국가/다시술 분포) | 카탈로그 확정 후 |
| ⏳ | v2 client/server 부트스트랩 + 피드 ticker | 카탈로그 확정 후 |
| ⏳ | 초기 hospital 5개 입력 + 섬네일 | Hershe / 노즈립 / 리엔장 강남 / 센텀코어 / 우아 우선 |

---

## 15. 카테고리 분기 축 결정 — 사고의 흐름 (2026-05-11)

> 사용자 명시: "ㅇㅇ 일단 너가 추천하는방식대로해보고 어떤 사고의 흐름인지도 저장해놔"

### 15-1. 후보 5개 평가

| 옵션 | 카테고리 수 | 출처 | 장점 | 단점 | 외국인 친화 |
|---|---|---|---|---|---|
| **A. intensity_tier** | 3 (surgery/petit/skin) | 바비톡 | 의사결정 boundary 명확 | abstract, "petit" 단어 인지도 낮음, 첫화면 휑 | △ |
| **B. domain** | 6 | claude(3) 자체 | 적당한 개수, 365mc/dental specialty 분리 | face_aesthetic 한 도메인이 80+ 시술로 비대해짐 | ○ |
| **C. body_area** | ~20 | 강남언니 부위축 | mental model 가장 직관 ("I want to fix my nose") | 20개는 모바일 가로 스크롤 길어짐 | ◎ |
| **D. mechanism** | ~30 | 강남언니 시술축 / 여신티켓 | 의료적으로 정확 | 외국인 100% 모름 (HIFU/subcision/fat_dissolve...) | ✗ |
| **E. concerns** | ~30 | 강남언니 고민축 | 외국인 검색어와 1:1 매칭 | 30개는 첫화면 빡빡, UI 정돈 어려움 | ◎ |

### 15-2. 채택: **C 변형 — body_area 8 그룹 (1차) + intensity/concerns (2차)**

### 15-3. 채택 이유 (가중치 순)
1. **외국인 mental model 일치**: "I want eye surgery" / "interested in nose" — 부위 진입이 자연스러움. 강남언니 식 "써마지 vs 슈링크 vs 인모드" 비교는 한국인 의료 리터러시 가정. 외국인은 브랜드명 모름 → 부위로 진입해야 함.
2. **운영 사이트 (glowupseoul.com) 톤과 호환**: "Care / Premium Care 2-tier" 가 결국 부위·intensity 혼합. body_area 1차 가 자연스러움.
3. **159 canonical 분포가 골고루** (다음 §15-4):
   - 가장 큰 카테고리(Face) 65개도 sub-filter 로 깔끔 정리 가능
   - 가장 작은 카테고리(Hair) 2개 — 차별화 시그널로 유지 가치 있음 (탈모 = 외국인 환자 ↗)
4. **seoulbeautyglobal.com 의 9-탭 패턴 호환** + 살롱 서비스(Nails/Waxing) → 의료 시술로 재구성하면 외국인 환자에게 더 적합
5. **intensity_tier 는 sub-filter 로 보존** — surgery vs petit vs skin 결정 boundary 가 사라지지 않음

### 15-4. 안 채택한 이유 (Anti-rationale)

**왜 A(intensity 1차)가 아닌가?**
- 첫 화면에 카드 3개만 노출은 시각적 빈약. 부킹닷컴/에어비앤비 모두 첫화면 카드 6~10개 패턴.
- "Petit" / "Non-surgical" / "Skin Care" — 외국인이 정확한 의미 매핑 어려움. 특히 "Petit" 는 프랑스어 차용으로 EN 사용자에게 비직관적.

**왜 B(domain 1차)가 아닌가?**
- 6개는 적당하지만 face_aesthetic + surgical (안면거상 surgery) + derm_medical (얼굴 acne) 셋 다 얼굴 관련. 외국인이 "내 얼굴 시술 보고싶은데 어느 도메인?" 마찰.
- domain 은 backend 분류 / 운영자 도구로는 유용 (실제 schema 에서 사용 중) — 단 UI 1차는 부적합.

**왜 D(mechanism 1차)가 아닌가?**
- 외국인 사용자 매우 일부만 "HIFU" / "PRP" 같은 단어 인지. "subcision", "exosome", "fat_dissolve_injection" 같은 건 거의 0%.
- 여신티켓은 브랜드명을 카테고리로 쓰는데 그건 한국인 가정 (시술 브랜드 = 일반 명사 수준의 인지도).

**왜 E(concerns 1차)가 아닌가?**
- 30개를 첫화면에 다 노출은 빡빡. 5~7개 핵심만 노출하면 cover 못하는 영역 발생.
- concerns 는 카테고리 페이지 내부 chip filter 로 사용하면 더 잘 살아남 — 시술 카드 위에 "Lifting · Wrinkles · Pores · Acne Scars · ..." 형태.

### 15-5. 채택한 8 카테고리 + 분포 (실측 검증)

`scripts/bin_to_categories.cjs` 가 159 canonical 을 binning rule 에 따라 단일 카테고리로 자동 분류한 결과:

| # | 카테고리 | EN label | ZH | 포함 mechanism / 시술군 | canonical 수 | surgery / petit / skin |
|---|---|---|---|---|---|---|
| 1 | **Face** | Face | 面部 | 리프팅(HIFU/RF/실)·필러·보톡스·스킨부스터·안면거상·이마·턱·광대 | **73** | 21 / 52 / 0 |
| 2 | **Eyes** | Eyes | 眼部 | 쌍커풀·앞뒤트임·눈밑지방·blepharoplasty·sub-brow lift | **11** | 10 / 1 / 0 |
| 3 | **Nose** | Nose | 鼻部 | 매부리코·무보형물·휜코·구축코·기능코 | **7** | 7 / 0 / 0 |
| 4 | **Body** | Body | 身体 | 지방흡입·LAMS·DCA·EM·바디 HIFU·바디 필러·복부성형·힙업·fat grafting | **24** | 15 / 9 / 0 |
| 5 | **Skin** | Skin | 皮肤 | 레이저(CO2·Pico·Fraxel·IPL·BBL)·여드름·subcision·색소·스케일링·미백 | **23** | 1 / 0 / 22 |
| 6 | **Hair** | Hair & Scalp | 头发与头皮 | 모발이식·탈모 줄기세포 | **4** | 1 / 3 / 0 |
| 7 | **Wellness** | Wellness & Regenerative | 健康再生 | 줄기세포(systemic)·엑소좀·PRP·IV·고압산소 | **7** | 0 / 3 / 4 |
| 8 | **Dental** | Dental | 牙科 | 임플란트·라미네이트·교정·치주·미백·충치 | **10** | 4 / 2 / 4 |
| | **TOTAL** | | | | **159** | 59 / 70 / 30 |

→ 누락 0. 전체 159 canonical 모두 단일 카테고리로 배정됨 (Rejuran 등 모호한 케이스는 binning 룰의 우선순위로 결정).

### 15-5-1. 분포에서 도출된 추가 결정
- **Face 73개로 최대** → 카테고리 페이지 sub-filter UX 가 가장 중요. concerns chip (~10개) + intensity tab + price tier 필수.
- **Eyes / Nose 는 surgery 비중 90%+** → 다운타임·회복기간·마취 정보 강조 (수술 의사결정 마찰 줄임).
- **Skin 은 skin-tier 가 96%** → "가볍게 시작" 사용자 진입점. 첫 방문자 default 추천 후보.
- **Body 는 surgery/petit 비율 5:3 균등** → 사용자 commitment level 에 따라 선택 가능.
- **Wellness 는 petit/skin 만** (surgery 0) → 외국인 환자 "K-beauty 회복/재충전" 마케팅 angle 적합.
- **Dental 분포 균등** (4/2/4) → standalone domain 으로서 자족적.

자세한 binning 룰: `scripts/bin_to_categories.cjs`
시술별 카테고리 매핑: `docs/hospital_canonical.xlsx` 의 `CategoryBinning_Detail` 시트.

### 15-6. 카테고리 페이지 내부 sub-filter 설계

각 카테고리 페이지에서 추가 노출:
- **Intensity tabs**: [All] [Surgery] [Petit] [Skin] (바비톡 식, 살려둠)
- **Concerns chips** (해당 카테고리에서 매핑되는 ~5-10개만): 예 Face → [Lifting] [Wrinkles] [Sagging] [Volume] [Pores] [Acne Scars] [Pigmentation] ...
- **(Advanced toggle) Mechanism**: HIFU/RF/Laser/... — 고급 사용자 only
- **Price tier**: $ / $$ / $$$
- **Downtime**: 0d / 1-3d / 3-7d / 7d+
- **Language support filter**: EN / 中文 / etc.

### 15-7. 향후 결정 의존성
- ✅ `procedure_categories` 시드를 8개 코어로 재작성 — `db/seed/procedure_categories.sql` 갱신 완료.
- ⏳ `concern_procedures` 매트릭스 작성 시 8개 그룹별로 chip 매핑 진행 (수기 큐레이션).
- ⏳ public_feed ticker 시드 분포 — Face 73개라고 73% 노출은 부자연스러우므로 8개 카테고리 균등 또는 외국인 인기도 (Eyes/Nose 가산) 가중 분배.
- ⏳ procedures 시드 (50~80개) 작성 시 각 row 에 `category_id` 매핑 — binning 룰을 따르면 자동.

---

## 13. 비고 / 참조 문서

- `README.md` — 빠른 개요
- `docs/research-findings.md` — 17 병원 조사 종합 + 스키마 시사점
- `docs/ux-direction.md` — 메인 IA + 스캔 modal + 카테고리 분기 디테일
- `db/schema.sql` — Postgres DDL 14 테이블
- `db/seed/*.sql` — mechanism 30 + category 14
- `docs/hospital_research.xlsx` — raw 데이터 (258 시술)
- `docs/hospital_canonical.xlsx` — canonical merge (159 시술)
- `scripts/export_research.cjs` / `scripts/merge_canonical.cjs` / `scripts/bin_to_categories.cjs` — 재생성 가능

레거시 (모두 `legacy/` 폴더):
- `legacy/CLAUDE_v1.md` — v1 (한국 도메스틱 mock 매칭 PWA) 스펙. **참조용으로만 보존**.
- `legacy/CLAUDE_pivot_draft.md` — 피봇 검토 문서 (구 `CLAUDE (3).md`). 본 문서가 이를 대체.
- `legacy/client_v1/` `legacy/server_v1/` — v1 코드. 운영 X.

---

*§15 까지 마지막 갱신: 2026-05-11. §16 추가: 2026-05-12 (v2 client + server 풀스택 구현 세션).*

---

## 16. 2026-05-12 작업 세션 — v2 풀스택 구현

이 섹션은 **하루치 세션 로그**다. 위 §1~§15 가 "스키마/IA 결정사" 라면 여기는 "그 결정을 코드로 옮긴 실제 구현 + 그 과정의 사용자 고민" 이다. 향후 새로 합류하는 collaborator 가 코드를 읽기 전에 여기를 읽으면, **왜 이 구조인지** 와 **무엇이 의도된 한계인지** 가 한 화면에 잡힌다.

### 16-0. 한 줄 요약

mock DB + Vite 클라이언트 (no-server 부터 시작) → 4 페이지 → AI 스캔 (GPT-4o-mini vision) → 매칭 룰 + GPT 합성 → Google Places 리뷰 → device 축 → 모던 럭셔리 UI 재설계. 22 병원 × 30 시술 × 69 hospital_procedures 시드 완성. 한 사이클 비용 **~$0.0006 (≈0.8원)**.

### 16-1. 사용자가 실제로 말한 핵심 의사결정

다음 인용은 모두 사용자 발화. 향후 톤·우선순위·반대 결정이 흔들릴 때 anchor.

**스택 결정**
> "간이 db를 만들어서 모든 필드 싹 넣은 뒤에 vite로 만들어줘봐 일단 서버 없다고 하고"

→ Phase 0 은 **클라이언트 단독 + 인메모리 mock**. db.js 한 파일이 향후 fetch wrapper 로 교체될 후보. 스키마 그대로 in-memory 로 옮김.

**v1 기능 포팅 결정**
> "v1 즉 glowupseroul/client 단에서 얼굴 스캔하는거 추가 + 스캔 이후 질문들을 통해 우리 db 내 병원가 매칭 추가 + 해당정보 그대로 와츠앱 문의하기 추가 + glowupseoul.com 을 보고 여기 내 about us 나 how it works, faq, services, home 내용 모두 추가"

→ MediaPipe FaceScanner / PreferenceForm 그대로 가져오되 **v2 톤 (영문 stage 카피, 다국어 폼)** 으로 재가공. about/how/faq/services 4 페이지 신설.

**얼굴 스캔 실제 활용**
> "혹시 진짜로 얼굴 스캔 결과를 이용할 방법이 없을까? 지금은 솔직히 그냥 보여주기식이잖아 ㅋㅋ llm api 쓸 의향이 어느정도는 있어. 근데 돈 안들면 더 좋고"

→ 옵션 3 제시 (로컬 CV / Gemini 무료 / GPT 유료) 후 **사용자가 GPT 선택**:
> "gpt api 써서해보자. 근데, 진짜 무슨 의학 스캔 결과 나온것처럼 개간지나게해야돼."

→ 결정: `gpt-4o-mini` (vision, `detail: 'low'`). 더불어 스캐너 시각화 medical-HUD 급으로 업그레이드 (멀티 레이어 메쉬 + region heatmap + 크로스헤어 + sweep + HUD 프레임 + 스트리밍 로그).

**총평 분리**
> "내 얼굴스캔을 데이터화 + 내가 상담받고자하는거 -> gpt api 써서 내 얼굴 상태 분석 및 이를 통해 내가 상담받고자하는 거에 대한 총평 나오게해줘야지"

→ GPT 2-call 흐름 확정:
1. `/api/analyze` — 스냅샷 → concerns/metrics/regions/narrative
2. `/api/synthesize` — (1)의 결과 + 폼 답변 + 룰베이스 매치 후보 → **overall 총평 + top 3 personalized rationale + closing**

**리뷰 자동 수집**
> "야 각 의원들 주소 이용해서 구글리뷰나 다른 리뷰 땡겨올 수 있게 해봐"

→ Google Places API (New) `textSearch` + `placeDetails` 자동. 22 병원 자동 매칭, 파일 캐시 24h.

**리뷰 진위 확인 (중요)**
> "야 지금 댓글갖고온거 진짜 댓글임? 그리고 어케 외국인 댓글만 갖고온거임?"

→ 답: 진짜 Google 리뷰. 영어만 나온 건 `languageCode: 'en'` 필터 때문. 결정:
> "오 아주아주 잘했어 ㅋㅋ 영어, 중국어 둘 다 갖고오도록해줘버ㅘ"

→ EN + ZH 병렬 호출, `originalText.languageCode` 가 en/zh* 인 것만 유지 (한국어→영문 번역본 자동 차단).

**UI 톤 분노 (2회 연속)**
> "UI가 너~~~~~~~무 유치함 너무 올드함 진짜 개빡칠정도로 ㄹㅇ;; 톤은 이대로 가져가되 매우 모던한 최신 스타일로 삭 바꿔"

(1차 모더나이즈 후 다시)
> "야 지금 기능 그대로 두고 UI좀 전면 개편해봐라 제발 제발.. 레이아웃이 씨발 너무너무 2010년대같아. 좀 최신 자료 찾아봐 디자인"

→ 두 단계로 진행. **1차** = padding/typography/grain/marquee/CTA pill, **2차** = bento·magazine·split-screen·press marquee·pull quote.

**매칭 정확도 버그 (사용자가 발견)**
> "아니 나는 모공으로 알아보는데 소이의원 소이 사각턱은 왜 시발 추천되는거야?"

→ 진짜 버그. concernScore=0 인 시술에 `-25` 페널티 만 줬는데, 할인 weight `×80` 이 페널티 보다 커서 무관 시술이 위로 올라옴. **HARD filter (`concernScore === 0` 이면 컷)** + weight 재조정.

**device 축 의향**
> "지금은 얼굴 눈 코 바디 피부 등등으로 돼있는데, 그 아래에 device (기기 울세라같은거) 별로도 카테고리화 하는거어떄"

→ Body-area 8 카테고리는 그대로 두고 **device 축 11개 추가** (Ulthera, Shurink, Thermage, InMode, PicoSure, CO2, CoolSculpting, EMSCULPT, Rejuran, Juvelook, HydraFacial). 외국인 mental model 일치 ("울세라 받고싶다").

**device 클릭 정확성 (사용자가 발견)**
> "울세라 눌러서 들어갔더니 여기 나오는 클리닉이 왜 시발 슈링크가 나옴?"

→ 초기 구현은 `hero_procedure_slug` (`hifu_face`) 로 보냈더니 해당 시술의 *모든* 디바이스가 나옴. **`/device/:slug` 전용 페이지** 신설, `device_brands` 매칭만 필터.

**비용 민감**
> "이 한 사이클이 얼마정도 나오는지도 알려줘"
> "이거 한 번 하면 1회당 얼마정도 돈 드냐? 지금 모델 기준"

→ 매 GPT 추가마다 비용 보고. 결과: gpt-4o-mini 기준 한 사이클 (analyze + synthesize) = ~$0.0006 (≈0.8원). 1만명 = ~$6. Google Places = $200/월 무료 크레딧 내 무한.

---

### 16-2. 산출물 — 파일 트리

```
glowupseoul_v2/
├── client/                          ← Vite + React 클라이언트
│   ├── package.json                 mediapipe + react + vite (no react-router; hash 라우터 직접)
│   ├── vite.config.js               host:true · port 5174 · proxy /api → 3001 · allowedHosts (트럼펄/엔그록/loca/pinggy)
│   ├── index.html                   <meta name="referrer" content="no-referrer-when-downgrade"> 포함
│   ├── public/                      (hero.mp4 드롭 가능 — 비디오 sources 2순위)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  Hash 라우터 + ScanContext (scan/match flow 글로벌 state)
│       ├── styles.css               64KB · :root vars · hero v2 · bento · magazine · split-screen · device hero · synth orb · AI pick · reviews
│       ├── data/                    스키마 1:1 인메모리 미러
│       │   ├── mechanisms.js        15 mechanisms (HIFU/RF/Pico/CO2/Botox/Filler/Thread/Skinbooster/Stem/Exosome/Surgery/EM/Cryo/Implant/Ortho)
│       │   ├── procedureCategories.js  8 categories (face/eyes/nose/body/skin/hair/wellness/dental)
│       │   ├── concerns.js          20 concerns
│       │   ├── procedures.js        30 procedures · 모든 필드
│       │   ├── concernProcedures.js 50+ 매핑 (primary/secondary/adjunct)
│       │   ├── brands.js            22 brands (사용자 제공 병원 리스트 그대로)
│       │   ├── hospitals.js         22 hospitals · brand_id 자동 resolve
│       │   ├── hospitalProcedures.js 69 offerings · 가격·디바이스·이벤트·시그너처
│       │   ├── publicFeed.js        8 seed entries (다국가 분포)
│       │   ├── devices.js           11 device 묶음 (브랜드 ↔ procedure 매핑)
│       │   └── db.js                Single import surface — query helpers
│       ├── pages/
│       │   ├── HomePage.jsx         Hero · Press · Editorial · Ticker · Bento · Device · Magazine Steps · Tier Split · Magazine Treatments · Pull Quote · Finale
│       │   ├── CategoryPage.jsx     intensity / price / concern 필터 + 그리드
│       │   ├── TreatmentDetailPage.jsx  시술 본질 + 다중 병원 비교 테이블
│       │   ├── HospitalDetailPage.jsx   병원 hero + 외국 환자 capability + 시술 메뉴 + ClinicReviews
│       │   ├── DeviceDetailPage.jsx ⬡ device hero + device_brands 필터 비교 테이블
│       │   ├── ResultsPage.jsx      AI Selection (synth 3 picks + 임베드 리뷰) + Other candidates
│       │   ├── AboutPage.jsx        Romie 스토리 + 3 pillar + stat
│       │   ├── HowItWorksPage.jsx   5 step magazine + Care/Premium tier
│       │   ├── ServicesPage.jsx     12 카테고리 그리드 (Care 6 + Premium 6) + "never on the menu" 3 pillar
│       │   └── FAQPage.jsx          4 카테고리 × 14 Q&A · expand toggle
│       ├── components/
│       │   ├── Hero.jsx             풀블리드 비디오 (Pexels) · 좌하단 타이틀 · 마퀴 · scroll cue
│       │   ├── Header.jsx           스크롤 80px 넘으면 solid 모드로 변신
│       │   ├── Footer.jsx
│       │   ├── PublicFeedTicker.jsx 4.5s 회전, ◇ M. in Singapore — consultation for *HIFU Lifting* · 3 min ago
│       │   ├── CategoryCards.jsx    Bento 외 다른 곳에서 쓸 수 있는 기본 4-up (사용처는 현재 없음, 차후 카테고리 페이지)
│       │   ├── DeviceCategories.jsx 4-col device grid → /device/:slug
│       │   ├── TreatmentCard.jsx    minimal + dark variant
│       │   ├── FaceScanner.jsx      MediaPipe + 멀티 레이어 medical HUD (mesh / region heatmap / 크로스헤어 / sweep / ID / 스트리밍 로그 / 라이브 카운터)
│       │   ├── ScanModal.jsx        3-step (scan → form → handoff). FaceScanner.onComplete = { snapshot, ai }
│       │   ├── PreferenceForm.jsx   v2 concerns · budget tier · style · 언어 · 여행날짜 · public_feed opt-in
│       │   ├── AiSynthLoading.jsx   골드 orb (코어 + 3 ripple) + 11줄 스트리밍 로그 + Candidates/Offerings/Tokens 카운터 + sweep progress
│       │   ├── ClinicReviews.jsx    병원 상세 페이지의 리뷰 섹션 (Google Places + ReviewAvatar)
│       │   ├── ReviewAvatar.jsx     referrerPolicy="no-referrer" + onError → 이니셜 폴백
│       │   └── WhatsAppCTA.jsx      whatsapp:// 네이티브 + 데스크탑 폴백
│       └── utils/
│           ├── matching.js          rule-based, HARD concern filter, weight 재조정 (concern 50/28/12, discount ×25)
│           ├── api.js               fetch wrapper — analyzeSnapshot / synthesizeMatch / getClinicReviews / getHealth
│           └── useReveal.js         IntersectionObserver hook · prefers-reduced-motion 대응
│
├── server/                          ← Express ESM 서버
│   ├── package.json                 express · cors · dotenv · openai
│   ├── .env                         (gitignored) OPENAI_API_KEY · GOOGLE_PLACES_API_KEY · OPENAI_MODEL · CORS_ORIGIN · MAX_BODY_MB · REVIEWS_CACHE_HOURS
│   ├── .env.example
│   ├── .gitignore                   node_modules · .env
│   ├── index.js                     Express + CORS + routes 등록 + 부팅 로그
│   ├── concerns.js                  슬러그 allow-list (client 와 동기 유지)
│   ├── hospitalDirectory.js         22 병원 - place 검색용 query_en + (옵션) googlePlaceId
│   ├── cache/reviews.json           Google Places 응답 캐시 (자동 생성, 24h TTL)
│   └── routes/
│       ├── analyze.js               POST /api/analyze — vision · `gpt-4o-mini` · structured JSON 강제 · sanitize · key 없으면 mock
│       ├── synthesize.js            POST /api/synthesize — text · Romie 페르소나 · JSON schema · 다국어 출력 · sanitize · mock 폴백
│       └── reviews.js               GET /api/reviews/:slug — textSearch + placeDetails (EN + ZH 병렬) · 원본 언어 필터 · 파일 캐시
│
├── db/                              ← Postgres DDL + 시드
└── docs/                            ← 조사·기획 산출물 (xlsx 포함)
```

---

### 16-3. 결정 로그 — 무엇을 왜

| 결정 | 한 줄 이유 |
|------|-----------|
| **인메모리 mock DB** 부터 시작 | DB 가 아직 Postgres 로 안 올라갔으니 schema.sql 을 JS 객체로 1:1 이식해 UI 부터 검증. db.js 가 향후 RPC client 로 교체. |
| **react-router-dom 안 씀** | 하드 deps 줄이고, hash 라우터 직접 (`#/category/face` 식). 한글 slug `decodeURIComponent` 처리 필수. |
| **GPT-4o-mini** (4o 아님) | 비용 17x 차이. mini 의 vision/text 도 컨시어지 톤 충분. 만약 톤 부족하면 synthesize 만 4o 로 올릴 여지. |
| **vision `detail: 'low'`** | 이미지 token 85 flat (high 는 ~600). concierge concern 추출엔 low 가 충분. |
| **2 GPT calls (analyze + synthesize)** | analyze 는 이미지 입력만, synthesize 는 텍스트 페이로드만 → 토큰 캐싱·재시도 분리. 한 콜에 다 넣는 것보다 안정적. |
| **synthesize 가 별도 페르소나 (Romie)** | "AI 가 분석함" 톤 X. concierge 가 직접 읽은 것 같은 카피 톤이 브랜드 톤과 맞음. |
| **server-side `sanitize()` 강제** | GPT 가 우리 concern allow-list 밖 슬러그 뱉으면 그 자리에서 drop. 매칭 로직 안 깨짐. |
| **mock 응답 (`_mock: true`)** | OPENAI/GOOGLE 키 없어도 UX 풀 흐름 테스트 가능. 클라가 빨간 경고 배너 띄움. |
| **Places API (New)** (legacy 아님) | 신규 GCP 프로젝트는 legacy 못 씀. New 의 fieldMask + languageCode 가 깔끔. |
| **EN + ZH 병렬 호출 + originalText 필터** | 한국어 리뷰 → 영어 번역본이 EN 응답에 섞이는 문제 차단. 원본이 진짜로 EN/ZH 인 것만 표시. |
| **파일 기반 리뷰 캐시** (Redis 아님) | 22 병원 × 24h = 660 호출/월, in-memory + JSON 영속화로 충분. 본격 운영 시 Redis. |
| **`/device/:slug` 별도 페이지** (필터 query param 아님) | 디바이스는 외국인 mental model 에서 first-class 카테고리. 자체 hero/통계/뱃지를 가지는 게 맞음. |
| **devices 12 → 11** | "Surgery" 같은 mechanism 은 device 가 아니라 제외. 외국인이 브랜드명으로 부르는 것만. |
| **referrerPolicy="no-referrer"** | Google `lh3.googleusercontent.com` 가 Referer 보고 403. 표준 우회. |
| **Hero 비디오 = Pexels CC0 URL** + `public/hero.mp4` 폴백 | 사용자가 자체 영상 만들기 전까지 무료 stock 으로 데모, drop-in 으로 교체 가능. |
| **bento 그리드 (face / body 2칸)** | 외국인 트래픽이 face / body 에 집중되는 데이터(73% / 17%) 가 시각 위계로 반영. |
| **5-step magazine alternating** | seoulklinic 식 평면 5-up 대신 매거진 톤. 좌/우 alternating + 거대 ghost 숫자. |
| **Tier split-screen (Care vs Premium)** | 2 카드 평면 비교 X. 풀스크린 좌우 분할 (라이트/다크) + hover 시 BG 이미지 페이드. |
| **단일 pull quote 회전** (3-up 그리드 X) | testimonial 은 한 번에 한 명에 집중 + 거대 italic 따옴표 deco. |

---

### 16-4. 매칭 로직 디테일 (`utils/matching.js`)

**Hard filter (모두 통과해야 후보)**:
1. `hospital.contract_status === 'active'` — 계약 협의중 5곳 추천 안 함
2. `hp.price_disclosed && starting_price_krw <= budgetMax`
3. `procedure.downtime_days <= downtimeMax`
4. `procedure.pain_level <= painMax`
5. **`concernScore > 0`** — 사용자 concern 매트릭스에 있어야 함. **이게 §16-1 의 사각턱 버그 root cause 였음. -25 페널티로 충분하다 가정 → 할인 weight ×80 이 페널티 압도 → 무관 시술이 떠오름. HARD 필터로 결론.**

**Score 가중치**:
- concern: primary **50** / secondary **28** / adjunct **12** (concern 축이 dominant)
- style fit (4 - |target - intensityRank|) **× 6**
- 예산 여유율 **× 12**
- 할인 % **× 25** (이전 ×80 → 무관 시술 부각의 주범이었음)
- signature **+10**, active event **+6**
- 언어 매치 **+8**, english_doctor **+3**, airport_pickup **+3**, intl_coordinator **+3**

**Dedupe**: 같은 procedure 의 여러 hospital_procedures 중 최고점 1개만 (HIFU 7행 도배 방지).

검증 (smoke):
- `pores` 단일 → 2 결과 (소이 피코토닝, 듀이디 페이셜). 사각턱·직각어깨 자취 없음. ✓
- `sagging+wrinkles+pores` → 7 결과, 사각턱 #2 (wrinkles 의 primary 매치이므로 정당)
- `face_size` 단일 → 사각턱 1개 (genioplasty 는 downtime 초과로 컷)

---

### 16-5. GPT 프롬프트 핵심 부분

**analyze (vision) system prompt 골자**:
- "You are a cosmetic concierge assistant analyzing a selfie for non-medical aesthetic concerns. You are NOT a doctor. You do NOT diagnose."
- 응답 JSON schema 강제: `concerns[]` (allow-list 만), `narrative` (1줄, "we notice"/"you might explore" 톤), `metrics{6개 0-100}`, `regions[]`, `confidence`
- "If image too dark/blurry/no face: concerns=[], confidence='low'"

**synthesize (text) system prompt 골자**:
- "You are Romie — founder and head concierge of Glow Up Seoul. NOT a doctor. NOT clinical. Warm, specific, lightly literary."
- 입력 3개 (AI 스캔 결과 + 사용자 prefs + 룰베이스 후보) 명시
- 응답 JSON: `overall` (2-3문장 총평), `top_picks[3]` (각 {match_id, rationale}), `closing`
- "Write in the patient's preferred language: {LANG}" (prefs.language 동적 주입)
- "Never recommend something outside the provided matches"
- "Never claim medical efficacy. Yes 'candidates', 'worth exploring'. No 'you have X', Yes 'we notice X'."

**Sanitize 양쪽 다**:
- analyze: concerns 슬러그를 `CONCERN_SLUGS` (서버 측 카피) 와 교차해서 invalid 슬러그 drop
- synthesize: `top_picks[]` 의 `match_id` 가 입력 matches 의 hp.id 와 매칭되는 것만 유지
- 두 응답 모두 문자열 길이 cap

---

### 16-6. UI / UX 핵심 컴포넌트 노트

**FaceScanner medical HUD** (`components/FaceScanner.jsx`)
- Phase 머신: `loading → idle → scanning → analyzing → done`
- `analyzing` 페이즈 = scanning 끝난 직후 자동 진입. 그 사이에 `/api/analyze` 호출. UI 는 cyan 톤 (스캐닝은 gold), 동심원 ripple, 진행바가 1.6s 사이클로 sweep.
- 6 region (FOREHEAD/CHEEK·L/CHEEK·R/UNDER_EYE/JAWLINE/NOSE) 의 polygon fill + 크로스헤어 + 매칭된 region 만 hover-bright.
- AI 응답 도착 후 floating badge ("UNDER_EYE · DARKNESS 67") 가 region 중심에서 connector line 으로 연결되며 등장.
- HUD 좌상단 = ANID-XXXX-XXXX (랜덤) + KST 시계 + GPU/WEBGL2 + 모델명. 우상단 = 펄싱 status. 좌하단 = 7줄 스트리밍 로그 (`$ initializing biometric channel...`). 우하단 = 라이브 카운터 (LM 234/478, EDGE 1,487/3072, PX 384,201).

**AiSynthLoading** (`components/AiSynthLoading.jsx`)
- ResultsPage 의 AI Selection 섹션이 synth 응답 기다리는 동안 띄우는 패널.
- 골드 orb (코어 펄싱 + 3 ring ripple 0.8s stagger), 11줄 streaming log (`> initializing concierge model · gpt-4o-mini` → `✓ synthesis complete`), 3 stat (Candidates 00/22, Offerings scored 0/8, Tokens 1180+).
- 동시에 3개 `<AiPickSkeleton>` 카드가 shimmer.

**ResultsPage 구조**
1. Hero (스냅샷 + 매치 수 + 큰 italic synth.overall 인용)
2. **AI Selection 섹션** (synth top_picks 3개) — vertical stack, 큰 picture-portrait + giant ghost 01/02/03 + italic rationale + 임베드 Google 리뷰 (rating + best review)
3. **Other candidates 섹션** (light bg) — 나머지 5개, 3-up 그리드
4. CTA strip

**ClinicReviews / AI Pick reviews 임베드**
- AI Pick 카드가 마운트되면 그 hospital.slug 로 `/api/reviews/:slug` 병렬 호출
- 카드 안에 "**4.9** ★★★★★ · 101 Google reviews · 6 🇬🇧 · 2 🇨🇳"
- best review 1개 (EN 우선, 없으면 ZH, 그 중 별점 최고) + ReviewAvatar (referrer 우회) + 4줄 clamp

---

### 16-7. 비용 모델 (한 사이클 = analyze + synthesize)

`gpt-4o-mini` · $0.150 / 1M input · $0.600 / 1M output

| Call | Input tok | Output tok | 비용 |
|------|-----------|------------|------|
| analyze (vision, detail=low) | sys 350 + text 30 + image 85 ≈ 465 | concerns/metrics ≈ 250 | $0.000220 |
| synthesize (text) | sys 480 + payload 920 ≈ 1,400 | overall+rationale+closing ≈ 280 | $0.000378 |
| **합계** | | | **~$0.0006 / 0.8원** |

| 사용자 수 | USD | KRW |
|---|---|---|
| 1,000 | $0.60 | ~800원 |
| 10,000 | $6 | ~8,000원 |
| 100,000 | $60 | ~80,000원 |

Google Places: 22 병원 × 24h 캐시 = 660 calls/월 + (EN+ZH 병렬 → ×2) = ~1,320 calls/월. $200/월 무료 크레딧 안에서 무한.

---

### 16-8. 알려진 한계 / TODO (다음 세션 후보)

- [ ] `procedures` 30개는 시드용. 운영 시작 전 docs/hospital_canonical.xlsx 159 시술 import.
- [ ] `concern_procedures` 매핑 50+ → 실 운영 전 운영자 Min 큐레이션으로 100+ 보강.
- [ ] 다국어 UI 분기 — 현재 모든 라벨이 영문 + 한글 혼용. `name_ko/en/zh/ja` 필드는 다 차있지만 실제 i18n 라우팅 미적용.
- [ ] 통화 변환 — KRW 만 표시. USD/CNY/SGD/IDR/MYR FX 변환 hook 미구현.
- [ ] Google Places 가 잘못된 place 잡을 가능성 (한국어 이름 매칭 약함) — `hospitalDirectory.js` 의 row 에 `googlePlaceId` 명시하면 우회.
- [ ] Naver Place 리뷰 통합 — Naver 공식 API 없어 미구현. 필요 시 카드 옆 외부 링크.
- [ ] 매칭 결과 영구화 — match_request UUID 발급, `/results/:matchId` URL 로 공유 가능. 현재는 in-memory state.
- [ ] B&A 갤러리 / 의사 프로필 / 비디오 후기 — 운영 사이트 부재 영역. v2 에 자리는 있지만 데이터 X.
- [ ] 실 Postgres 도입 — `db/schema.sql` 그대로 적용, `client/src/data/db.js` 를 fetch wrapper 로 교체.
- [ ] 운영자 어드민 — `hospital_procedures` / `public_feed_entries` CRUD UI 미구현.
- [ ] PWA — service worker / manifest / 오프라인 미구현 (필요성 재검토).

---

### 16-9. 실행 / 디버그 cheat sheet

**개발**
```powershell
# Terminal A (server)
cd <repo>/server
npm run dev               # http://localhost:3001 · node --watch

# Terminal B (client)
cd <repo>/client
npm run dev               # http://localhost:5174 · Vite HMR · /api 자동 프록시
```

**Health / 검증**
```powershell
curl http://localhost:3001/api/health
# → {"ok":true,"has_openai_key":true,"has_google_key":true,"model":"gpt-4o-mini"}

curl http://localhost:3001/api/reviews/hershe_%EC%B2%AD%EB%8B%B4%EC%A0%90
# → Hershe 청담 Google 리뷰 (EN+ZH 머지). _source=google / _cache=hit | miss
```

**Smoke test 데이터**
```powershell
cd client
node scripts/smoke.mjs           # DB 무결성 (procedures/hospitals/hp 카운트, 가격 범위)
node scripts/match-smoke.mjs     # 매칭 알고리즘 (concern 별 결과)
node scripts/device-smoke.mjs    # device 별 clinic / price aggregation
node scripts/device-detail-smoke.mjs  # device_brands 필터 정확도
```

**서버 재시작 필요 시점**
- `routes/*.js` 새 파일 추가 시 (`node --watch` 가 새 import 그래프 변화는 가끔 못 잡음)
- `.env` 키 변경 시
- 그 외엔 HMR / `node --watch` 가 알아서.

**Hero 비디오 교체**
- 사용자 보유 mp4 를 `client/public/hero.mp4` 로 드롭 → 자동 우선 (Pexels URL 은 2순위 source).
- 또는 `components/Hero.jsx` 의 `VIDEO_SOURCES` 배열을 직접 수정.

**OpenAI / Google 키 없이 데모**
- 그래도 풀 흐름 작동. `/api/analyze`·`/api/synthesize`·`/api/reviews` 모두 mock 응답 반환 (`_mock: true` 플래그).
- 클라가 빨간 ⚠ 경고 배너 자동 표시.

---

### 16-10. 사용자가 향후 결정해야 할 것들 (open questions)

- **GPT 모델 업그레이드 시점** — 4o-mini 의 톤이 부족하다 싶으면 synthesize 만 4o 로. ~17x 비용이지만 여전히 사이클당 $0.01 수준.
- **다국어 라우팅** — `?lang=zh` 쿼리 / 서브도메인 / path prefix 중 선택.
- **scan snapshot 영구 저장** — 현재 in-memory (session). Supabase Storage 등 도입 시 결과 페이지 URL 재방문 가능.
- **device 페이지 ↔ 시술 페이지 관계 명시** — 같은 데이터 두 축으로 보여주는 건 의도된 것. 단 SEO 영향 고려해서 canonical 정의 필요할 수도.
- **매칭 결과 공유** — `/results/:matchId` 영구 URL + OG 이미지 (시술 카드 합성) 필요할지.

---

*§16 갱신: 2026-05-12 (v2 풀스택 + AI + 리뷰 + UI 모더나이즈 세션). 새 결정 시 §16-3 결정 로그에 한 줄, 사용자 인용은 §16-1 에 추가.*

---

## 17. 2026-05-12 (이어서) — Live Match Feed + Case Detail + EN/ZH WhatsApp 인콰이어리

§16 다음 같은 날 추가된 변경. v2 의 **컨버전 깔때기 마지막 마일**을 정의한다 — 스캔 결과를 사람(상담사 Romie) 손으로 넘기는 부분.

### 17-1. 사용자 발화 (의사결정 anchor)

**Recent matches 가시화**
> "스캔했던 내용도 나중에 db에 저장할거야. 어떤 사람이(이건 아마 로그인 안 하고 하는거니까 그냥 익명 표시하면되고) 어떤 고민이 있어서 어떤 설정값으로 신청했고, 이 때 어떤 추천을 해줬었는지도 나올거야. 이건 홈페이지 메인페이지에 잘 보이게해야돼"

→ 결정:
- 인증 없이 익명 (`display_initial` 1자 + 국가 코드 + 옵션 노출 동의)
- **메인페이지에서 시각적 위계 1순위** — Hero 아래 얇은 ticker 는 살리되, 큰 에디토리얼 섹션 신설
- 데이터 모델은 schema.sql 의 `public_feed_entries` + `match_requests.match_result` 합쳐서 한 entry 로

**카드는 티저 / 디테일은 풀**
> "기록들은 지금처럼 하는 게 아니라, 디테일 누르면 실제 이 고객이 어떤 요청 했었는지 선택했던 것들 있잖아 스캔 시에. 그리고 이 결과(ai 추천 시술, ai 한줄평 등등)를 매우 가시적으로 명확하게 보여주도록"

→ 결정:
- 카드 = 이니셜·국가·concerns·top match 만 (3-5초 스캔 가능)
- 모달 = **3 섹션 (Brief / AI Scan / Romie 추천)** 풀 케이스 스터디. 매우 가시적·구분명확.

**상담사 인콰이어리 자동화**
> "스캔 결과 그대로 와츠앱 문의에 나오게. 필드 장 정리해서 상담사 자체도 쉽게 고민내용 알 수 있게. 스캔 이후에 '이 결과 그대로 문의하기' 영어버전/중국어버전 다 만들어놓고, 스캔 내역(홈페이지 메인)에도 이 버튼 그대로 동작하게 만들어놔"

→ 결정:
- 메시지 = **5섹션 ━━━ 굵은 구분선** (PATIENT / BRIEF / AI FACE SCAN / AI RECOMMENDATION / ASK)
- **EN + ZH 두 버전** 만들어서 어떤 페이지/모달이든 같은 빌더 (`buildCaseMessage`) 통과
- **본인 스캔 (ResultsPage) + 시드 케이스 (CaseDetailModal) 모두 동일 메시지 포맷** — 일관성

---

### 17-2. 새 산출물

```
client/src/
├── data/
│   └── publicFeed.js          ← 시드 10개 entry 에 `case: { prefs, ai_scan, synth, top_match }` 풀세트
│                                +  addPublicFeedEntry() / subscribeFeed() / clearLocalFeed() 헬퍼
│                                +  localStorage 영속 (key: gs_v2_public_feed_local, 최대 20)
├── components/
│   ├── RecentMatches.jsx      ← 홈 메인 에디토리얼 섹션 (Live · 골드 펄스 점 / 3-col × 2-row 카드 / Detail 버튼)
│   └── CaseDetailModal.jsx    ← 풀스크린 케이스 스터디 모달
│                                  · Header: 이니셜·국가·시간·outcome
│                                  · §01 Brief — concerns 칩 + 5-up 메트릭 (budget/downtime/pain/style/lang) + 노트
│                                  · §02 AI Scan — 다크 BG · narrative 인용 · 6 metric 진행바 · region 알약
│                                  · §03 Recommendation — synth 인용 + 매치 카드 (가격+할인+device+rationale) + closing
│                                  · Footer: EN/ZH WhatsApp 듀얼 버튼 + Preview/Copy 도구
└── utils/
    └── caseMessage.js         ← buildCaseMessage({entry, lang}) + buildEntryFromLive({ai, prefs, matches, synth})
                                   I18N 테이블 (en/zh): section header · field label · metric label · pain scale
                                   환자 자유 텍스트 (narrative/notes) 는 원어 그대로 유지
```

**확장된 publicFeed entry shape**
```js
{
  // 기존 (§16)
  id, display_initial, country_code, country_label_en,
  concern_slugs, concern_labels_en,
  treatment_slug, treatment_label_en,
  hospital_slug, hospital_label_en,
  outcome, outcome_note_en, story_en, displayed_at,
  is_visible, is_seed, source_type,

  // NEW — 디테일 모달에 푸는 풀세트
  case: {
    prefs: {
      budget_tier, budget_label,
      downtime_max, pain_max,
      style_target, style_label,
      language, notes,
    },
    ai_scan: null | {
      narrative, confidence,
      concerns_detected, metrics, regions,
    },
    synth: null | {
      overall, rationale, closing,
    },
    top_match: {
      procedure_name_en, hospital_name_en,
      price_krw, original_price_krw, discount_pct,
      device_brands,
    },
  },
}
```

---

### 17-3. WhatsApp 메시지 포맷 (상담사 핸드오프)

5섹션, ━━━ 굵은 구분선, 모바일 WhatsApp 에서 스크롤 안 해도 한 호흡으로 스캔 가능.

```
[Glow Up Seoul · AI Scan Inquiry]

━━━ PATIENT ━━━
• Initial: M.
• Country: Singapore
• Language: EN
• Submitted: 05/12/2026, 14:32 KST   ← Intl.DateTimeFormat Asia/Seoul 강제
• Outcome: matched

━━━ THEIR BRIEF ━━━
• Concerns: Lifting · Wrinkles
• Budget: ₩800k – ₩2M
• Max downtime: 3 days
• Pain tolerance: high (4/5)
• Style preference: Soft (2/5)
• Notes:
  "Wedding in October — need recovery to be quick."

━━━ AI FACE SCAN ━━━
• Confidence: medium
• AI observed:
  "We notice mild jawline softening..."
• Metrics (0–100):
    – Skin clarity: 72
    – Tone evenness: 78
    – Under-eye darkness: 24
    – Jawline definition: 56
    – Symmetry: 91
    – Youthful volume: 78
• Flagged regions:
    – JAWLINE — soft contour — lift candidates apply

━━━ AI RECOMMENDATION ━━━
• Romie's overall read:
  "Your scan reads as early-stage softening..."
• Top match: HIFU Face Lifting
•   Hospital: Vellicell · Gangnam
•   Device: Shurink
•   Price: ₩390,000 (orig ₩600,000, −35%)
  Why this fit:
    "Shurink 600-shot fits both your budget headroom and the SMAS-layer signal..."
• Closing note:
  "Pick a date — we'll confirm doctor availability."

━━━ ASK ━━━
Please confirm doctor availability for the patient's trip dates, and any pre-treatment requirements.
```

**ZH 버전** — 섹션 헤더와 라벨만 번역 (`━━━ 客户 ━━━`, `关注问题`, `预算`, `AI 面部扫描`, `指标`, `首选推荐`, `匹配原因`, `结语`). 환자 자유 텍스트(narrative / notes)는 **원어 그대로** — 진짜 환자 목소리 보존. 영어 환자가 ZH 버전 보내도 한국인 상담사가 라벨로 어떤 케이스인지 즉시 파악.

**핵심 디자인 결정**
- I18N 은 **라벨만**, 콘텐츠는 원어 — 번역 비용·왜곡 회피
- 시간은 항상 **KST 강제** — 서울 상담사 mental model 기준
- 가격은 항상 **KRW + 천 단위 콤마** — 한국 운영진 baseline 통화
- ASK 섹션 = 상담사가 답할 action 명시 — "확인해야 할 것" 만 깔끔하게

---

### 17-4. 버튼 통합 — 4 진입점, 1 빌더

같은 `buildCaseMessage()` 빌더 통과해서 동일한 메시지 포맷이 4 군데에서 동일하게 동작:

| 위치 | 진입점 | source data |
|------|--------|-------------|
| 홈 RecentMatches 카드 | "View full case →" 버튼 → CaseDetailModal 모달 → 푸터 EN/ZH 버튼 | publicFeed 시드 (10 entries) |
| ResultsPage Hero | EN/ZH 듀얼 풀-width 버튼 | live 스캔 (`buildEntryFromLive`) |
| ResultsPage Finale CTA strip | EN/ZH 듀얼 버튼 | 동일 |
| 본인 스캔 (opt-in 후) | localStorage 저장된 본인 entry → CaseDetailModal 에서 동일 흐름 | live + 영속 |

CaseDetailModal 푸터의 보조 도구 (3 개 텍스트 버튼):
- `Preview EN message ↓` — 모노스페이스 다크 박스에 메시지 그대로 표시
- `Preview 中文 message ↓` — 동일
- `Copy to clipboard ⧉` — navigator.clipboard 로 메시지 카피 (WhatsApp 안 열고 다른 채널 쓸 때)

---

### 17-5. UI 디테일

**RecentMatches 섹션 (홈)**
- Hero · Press · Editorial · Ticker 다음 위치
- 좌상단 `◇ Live · recently matched` 의 ● 아이콘이 1.6s ease-in-out 펄스 (살아있다는 신호)
- 거대 italic "Real *journeys,* right now."
- 우측 설명 + 옵트인 안내
- 3-col 카드 그리드 (모바일 1-col / 태블릿 2-col)
- 본인 스캔 entry 는 **"YOUR SCAN" 골드 알약** + 골드 배경 + 골드 보더로 즉시 식별
- 1분마다 "X min ago" 시간 리프레시 (setInterval)
- subscribeFeed 로 새 entry 추가 시 즉시 재렌더

**CaseDetailModal**
- Backdrop `rgba(15,15,17,0.75) + blur(10px)` — 백뷰 가리되 공간감 유지
- 카드 max-width 1080px, 모바일 폭 가득
- 우상단 닫기 = 반투명 흰 원 + blur
- 섹션 3개 padding 56px (수직 호흡)
- §02 AI Scan 만 다크 BG — 다른 섹션과 시각 위계 다름
- §03 매치 카드 = 크림 BG + 골드 좌측 4px 보더 + 거대 italic 가격 (우측 정렬)
- Footer 의 EN/ZH 버튼 = 풀-width 다크 (Hover 시 골드로 변신 + translateY -2px + 골드 그림자)
- Disclaimer = 다크 띠 한 줄 ("Shared with the patient's explicit opt-in...")

**localStorage 영속 (`gs_v2_public_feed_local`)**
- 본인 스캔 + opt-in → entry 가 localStorage 와 인메모리 둘 다에 prepend
- 새로고침해도 본인 entry 가 시드 위에 살아있음
- 최대 20개까지 (오래된 자동 truncate)
- `db.clearLocalFeed()` 헬퍼로 reset 가능 (admin 용도)

---

### 17-6. 결정 로그 추가

| 결정 | 한 줄 이유 |
|------|-----------|
| **인증 X — 익명 1자 이니셜만** | 외국인 환자 + 의료 데이터 → 가입 마찰 줄이고 PIPA 안전. opt-in 1 체크박스 (디폴트 OFF) 가 최소 합의. |
| **메인 ticker + 큰 섹션 동시 운영** | ticker = "지금 일어나고 있다" 신호 (44px 라인), 섹션 = "case study 깊이". 두 스케일 social proof. |
| **카드는 티저, 모달은 풀** | 카드에 모든 걸 박으면 시각 부하. 클릭 → 디테일 분기가 모던 luxury 사이트 패턴. |
| **모달 3 섹션 (Brief / Scan / Rec)** | schema 의 3 entity (`match_requests` / `analyze` 결과 / `synthesize` 결과) 시각적 1:1 매핑. 학습 비용 0. |
| **§02 만 다크 BG** | AI Scan 섹션 = "기계가 본 것" → 색상으로도 결 다름을 표현. 라이트/다크/라이트 리듬. |
| **WhatsApp 메시지 5섹션 + ━━━ 구분선** | 상담사 모바일에서 한 호흡 스캔. 텍스트만으로 시각 위계. |
| **라벨만 i18n, 콘텐츠 원어 유지** | 환자 voice 보존 + 번역 비용 0. 상담사는 라벨로 파악, 원문은 그대로 환자 의도. |
| **`buildEntryFromLive` 어댑터** | live 스캔 state 와 publicFeed entry shape 를 1:1 변환 → 4 진입점이 한 빌더 통과. |
| **localStorage 영속 (Redis 아님)** | 본인 entry 가 새로고침에도 살아있는 게 핵심 UX. 운영 시 server-side `match_requests` 로 이전. |
| **메시지 Preview + Copy** | 일부 환자는 WhatsApp 안 쓰고 WeChat/LINE 쓸 수 있음. 카피해서 다른 채널 보낼 옵션 보존. |

---

### 17-7. 알려진 한계 / TODO

- [ ] **synth 영속화** — 현재 본인 스캔에서 synth 응답을 `case.synth` 에 넣는 코드가 ResultsPage 에서 일어나야 하는데, App.jsx 의 onScanSubmit 시점엔 synth 결과가 아직 도착 안 함 (results 페이지 마운트 후 비동기 호출). 본인 entry 는 `synth: null` 로 저장됨 → ResultsPage 에서 synth 도착 시 entry update 하는 로직 추가 필요.
- [ ] **국가 추정 정확도** — opt-in 한 본인 entry 의 country_code 가 prefs.language 로만 추정 (en → 랜덤 US/GB/AU/SG). 폼에 country dropdown 추가 가능.
- [ ] **메시지 길이 cap** — WhatsApp URL ~4KB 한계. 현재 ~1500 chars 로 안전하지만 notes 길어지면 cap 필요.
- [ ] **server-side `/api/feed`** — 실 DB 도입 시 localStorage 대신 `POST /api/feed` + `GET /api/feed/recent`. publicFeed.js 의 `addPublicFeedEntry` / `getPublicFeedEntries` 가 fetch 로 교체될 후보 (지금은 인메모리 + localStorage).
- [ ] **opt-in UX 강화** — 현재 폼 마지막 단일 체크박스. 권리 명시 + privacy 페이지 링크 검토.
- [ ] **outcome 라이프사이클** — 시드 entries 는 matched/quoted/consulted/booked/completed 다양하게. 실 운영에선 운영자가 outcome 수동 진행 (matched → quoted → booked). admin UI 미구현.

---

### 17-8. 비용 영향

추가 GPT/Google API 호출 **없음**. RecentMatches / CaseDetailModal / WhatsApp 빌더는 모두 클라이언트 로컬 연산. localStorage R/W 만.

§16-7 의 사이클당 ~$0.0006 (analyze + synthesize) 그대로.

---

*§17 갱신: 2026-05-12 (Live feed + Case detail + EN/ZH 상담사 인콰이어리). 다음 자연스러운 확장점 = §17-7 의 synth 영속화 + server-side `/api/feed` 도입.*

---

## 18. 2026-05-12 (이어서) — 파트너 등록 흐름 + 한국어 B2B FAB

### 18-1. 사용자 발화

**파트너 등록 페이지 신설**
> "현재 우리 db 참고해서, 파트너사들도 우리한테 자기 병원 등록해달라고 본인들 정보 올릴수 있는 페이지도 만들어"

→ 결정: schema 의 `brands` + `hospitals` + `hospital_procedures` 필드 그대로 따라가는 6-step 다단계 폼. 서버에 JSON 파일로 저장 + 운영자한테 WhatsApp 핸드오프 링크 자동 생성.

**한국어 전용 B2B 홍보**
> "우리 홈페이지 들어온 병원들이 파트너 계약맺을 수 있게(이건 근데 무조건 한국어로) 메인홈페이지에도 홍보해줘야지"

→ 외국 환자용 영문 메인 흐름은 그대로, **한국어 전용** B2B 섹션 별도. Noto Serif KR 폰트 도입.

**카피 톤 + 위치 피드백**
> "멘트가 씨발 개 좆병신같음 ㄹㅇ ㅋㅋㅋ 한국인이 쓴거처럼 바꾸셈 ㅋㅋㅋ 그리고 이건 우측 하단에 floating될 수 있도록"

→ 인라인 섹션 폐기, **우측 하단 floating FAB + 펼치는 카드**로 전환. 카피는 한국 의료계 자연 톤 ("원장님 / 외국 환자 응대 / 저희가 대신합니다"). 직역체 ("핸드픽 22개 클리닉에만 흘려보냅니다") 절대 X.

**모바일 issue**
> "핸드폰 모드일때 /partner 들어오면 reach romie 이쪽 계속 플로팅돼서 볼수가없음"
> "아니 플로팅은 똑같이 원복해주고, 병원등록하기 누르면 화면이 겹친다니까"

→ FAB 는 `/partner` 페이지에서도 보이게 (가드 풀음). 단 FAB 카드의 CTA 클릭 시 카드 자동 close → navigate 후 겹침 X. 모바일 sticky rail 만 풀어서 본문 덮는 것 방지.

**Pending 상태 룰**
> "파트너 신청한다고 바로 db등록되는게 아니라 pending상태로 있고 나중에 admin페이지에서 할거임"

→ 제출은 `server/submissions/` JSON 으로만 떨어짐. **운영자가 직접 admin UI 에서 검토 후 `brands`/`hospitals`/`hospital_procedures` 에 import 결정**. 자동 등록 X. `hospitals.contract_status` 의 default `'pending'` 이 이 흐름 schema-level 보장.

---

### 18-2. 산출물

```
server/
├── routes/partner.js              POST /api/partner · GET /api/partner/admin?key=...
└── submissions/                   파일 시스템 캐시 (gitignored 권장)
                                   · partner_2026-05-12T...Z_brand_slug.json

client/src/
├── pages/PartnerApplyPage.jsx     6-step 다단계 폼
│                                   · 좌측 sticky progress rail (데스크탑) · 우측 step body
│                                   · 모바일에선 sticky 풀음 (본문 덮는 것 방지)
├── components/PartnerFloating.jsx 우측 하단 floating FAB (한국어 B2B)
│                                   · 알약 → 펼친 카드 → 신청하기 / 통화 문의 CTA
│                                   · sessionStorage dismiss · 7s hint pulse
│                                   · 어디서나 떠있음 (다른 풀스크린 모달 열리면 z-index 로 자동 가림)
└── utils/api.js                   submitPartner(payload) 추가
```

---

### 18-3. 파트너 신청 → DB 등록 흐름 (PENDING 룰)

```
[클라]  PartnerApplyPage 폼 6단계 작성
         · 모든 필드 schema.sql 의 brands + hospitals + hospital_procedures 와 1:1 매핑
         · consent.terms + consent.data_use 필수 체크
         ↓
[클라]  POST /api/partner
         ↓
[서버]  routes/partner.js
         ├─ shallowOk() 으로 필수 필드 검증
         ├─ sanitize() — 길이 cap, enum 검증, 타입 강제
         ├─ JSON 파일 저장: server/submissions/partner_TIMESTAMP_SLUG.json
         ├─ 응답: { ok, id, file, admin_handoff_url, message }
         └─ admin_handoff_url = WhatsApp 링크 (운영자가 클릭하면 새 지원자 요약 자동 깔림)
         ↓
[운영자] WhatsApp 으로 알림 받음 — 새 지원자 한 줄 요약
         ↓
[운영자] GET /api/partner/admin?key=ADMIN_KEY — 최근 100개 리스트 조회
         ↓
[운영자] 수기 검토 (안전 기록·면허·외국인 응대력)
         ├─ 승인: brands → hospitals → hospital_procedures 에 수동 INSERT
         │        hospital.contract_status = 'active' 로 설정
         │        (현재는 client/src/data/*.js 미러에 직접 추가)
         └─ 보류/거절: 파일 그대로 두거나 _archived/ 로 이동
```

**핵심 — 자동 등록 절대 X**:
- `/api/partner` 는 *submission* 만 받음. brands / hospitals / hospital_procedures 테이블에 row 추가하지 않음.
- 신청자가 신청 즉시 어디에도 노출되지 않음. 카테고리 페이지·매칭·홈 어디서도 안 보임.
- `hospital.contract_status` 의 default `'pending'` 이 이를 schema-level 로 보장 (이미 §5 의 hospital_procedures 에 `negotiating` 5개가 그렇게 처리됨 — `matchOfferings()` 에서 `contract_status !== 'active'` 인 곳은 매칭 후보에서 컷).
- 클라이언트 UI 어디에도 신청서 내용이 자동 표시 안 됨. 운영자가 directly `client/src/data/brands.js` / `hospitals.js` / `hospitalProcedures.js` 에 row 추가해야만 노출.

---

### 18-4. 한국어 B2B 톤 룰 (잊지 않게)

다음은 영문 직역으로 한국 의료계에 어색한 표현 → 자연 톤:

| ✕ 직역체 | ✓ 자연 톤 |
|---|---|
| "병원이신가요?" | **"원장님,"** |
| "외국 환자 매칭, 저희가 합니다" | **"외국 환자 응대, 저희가 대신합니다"** |
| "보건복지부 등록 외국인 환자 유치 에이전시" | "보건복지부 정식 등록 · 외국인 환자 유치 에이전시" |
| "풀세트 컨시어지 트래픽을 흘려보냅니다" | "외국 환자를 한국 병원에 연결해드립니다" |
| "핸드픽 22개 클리닉에만" | "강남·청담·부산 22개 병원과 함께" |
| "환자 저니 전체를 운영합니다" | "환자 모객부터 사후 관리까지 — 전 과정을 직접 운영합니다" |
| "병원은 진료에만 집중하시면 됩니다" | "원장님은 진료에만 집중하시면 됩니다" |
| "먼저 상담받기" (병원이 상담받는 거 거꾸로) | **"먼저 통화로 문의"** |
| "수기 검토 · 자동 등록 없음" | "자동 등록 아님 · 운영팀 직접 심사" |
| "평균 48시간 회신" | "평균 2일 내 회신" |

**일반 원칙**
- 호칭은 "원장님" (한국 의료계 표준)
- "응대" / "통화" / "문의" 같은 비즈니스 한국어 자연 사용
- 영문 비즈니스 용어 (concierge / journey / hand-pick) 무리하게 한국어 직역하지 말고 풀어쓰기
- 시간 표현은 한국식 ("2일" 이 "48시간" 보다 자연)

---

### 18-5. UI 디테일

**floating FAB** (`gs-pf-fab`)
- `position: fixed; bottom: 24px; right: 24px; z-index: 70`
- 다크 BG 알약 · 골드 원형 ✦ 심볼 · "병원이세요? / 파트너 등록 안내" · `+` 회전 인디케이터
- 7초 뒤 한 번 살짝 펄스 (위로 6px, 골드 그림자 1.6s × 2회) — 살아있다는 시그널
- 호버: 골드 BG + `+` 90° 회전
- z-index 70 → ScanModal(100) / CaseDetailModal(110) 같은 풀스크린 모달 열리면 자동으로 그 아래 깔림 (의도된 동작)

**펼친 카드**
- 다크 BG + 상단 1px 골드 그라데이션 라인
- 우상단 X (sessionStorage dismiss)
- 한국어 Noto Serif KR (헤드라인 + 본문)
- 강조 어구는 옅은 골드 underline highlight
- 메인 CTA: 골드 BG "파트너 신청하기 →" — **클릭 시 setOpen(false) → navigate('/partner')** (카드 자동 닫힘 → 새 페이지에서 겹침 X)
- 보조 CTA: outline "먼저 통화로 문의 →" — WhatsApp 한국어 프리필 메시지 ("[글러업서울 · 파트너 문의] 안녕하세요...")
- 미세글: "◇ 자동 등록 아님 · 운영팀 직접 심사 · 평균 2일 내 회신"

**모바일 (≤700px)**
- FAB 가 좌우 16px 가득 채움
- 카드 펼치면 풀폭
- partner 페이지 본문의 `.gs-pa-nav { padding-bottom: 96px }` 추가 — FAB 가 마지막 액션 버튼 가리지 않게

**모바일 (≤1000px) — partner 페이지**
- 좌측 rail `position: static` (sticky 풀음) — 단일 컬럼 위에서 본문 덮지 않게
- step 인디케이터 + Reach Romie footer 는 그대로 노출 (모바일에서도 진행 단계 + 보조 CTA 확인 가능)

---

### 18-6. 결정 로그 추가

| 결정 | 한 줄 이유 |
|------|-----------|
| **별도 floating FAB** (인라인 섹션 X) | 외국 환자용 메인 흐름 방해 X. 한국 클리닉 운영자만 자연스럽게 시야에 들어옴. |
| **Noto Serif KR 도입** | Cormorant Garamond 의 한국어 fallback 못생김. 한국어 헤드라인 임팩트 + Inter / Pretendard sans fallback. |
| **자동 등록 절대 X · 운영자 수동 import** | 의료 도메인 → 자동 등록은 책임 리스크 + 품질 통제 불가. `hospitals.contract_status === 'active'` 만 매칭 후보 — schema-level 가드. |
| **server/submissions/ 파일 저장** (DB INSERT 아님) | 운영자가 검토 전엔 어디에도 노출되지 않아야. 파일은 운영자만 보는 raw inbox. |
| **admin_handoff_url 자동 생성** | 운영자가 모바일에서 새 지원자 알림 즉시 받기 — WhatsApp 한 클릭. |
| **sessionStorage dismiss** (localStorage 아님) | session 동안만 안 보이게. 다음 방문 시 다시 떠서 conversion 기회. |
| **FAB CTA → 카드 자동 close** | partner 페이지 navigate 후 카드가 위에 남아있으면 화면 겹침. setOpen(false) 가 사용자 보고한 issue 의 직접 원인 fix. |
| **모바일 sticky rail 풀음** | 단일 컬럼 grid 에서 sticky 가 본문 위 600px 가량 덮음. static 으로 변경. |

---

### 18-7. 알려진 한계 / TODO

- [ ] **Admin UI 미구현** — 현재 운영자가 `GET /api/partner/admin?key=...` JSON 응답을 직접 읽어야 함. 향후 `/admin/partners` 라우트 + 카드 그리드 + "Approve → import to DB" 버튼.
- [ ] **운영자 알림 자동화** — 현재는 응답의 admin_handoff_url 을 신청자가 받는데, 신청자가 그걸 안 누르면 운영자가 모름. 별도 webhook / email / SMS forward 필요.
- [ ] **submissions/ git 처리** — 현재 server/.gitignore 에 안 들어가있음. PII 포함 가능하므로 추가 필요.
- [ ] **이메일 검증** — 현재 이메일 형식 단순 검증 없음 (length cap 만). Zod 같은 schema validator 도입 고려.
- [ ] **중복 신청 핸들링** — 같은 브랜드명으로 여러 번 신청 시 합치는 룰 없음. 운영자가 수기로 정리.
- [ ] **다국어 신청 폼** — 현재 폼 라벨은 영문 (한국 운영자 직접 입력하는 케이스도 있음). 한국어 라벨 토글 또는 자동 감지 도입.

---

*§18 갱신: 2026-05-12 (Partner application + Korean B2B FAB). 룰 핵심: **자동 등록 X · 운영자가 admin UI 에서 검토 후 import**.*

---

## 19. 2026-05-12 — AWS RDS (MySQL) 스캐폴딩

mock 데이터(client/src/data/*.js)를 실 DB 로 이관하기 위한 서버측 준비. **DDL + 풀 + 카탈로그 라우트 + 마이그레이션 스크립트 까지만**. 클라이언트 fetch 전환은 데이터 import 검증 후 별도 작업 (Phase 2).

### 19-1. 결정

| 결정 | 한 줄 이유 |
|------|-----------|
| **MySQL 8.x on AWS RDS** | 사용자 지정. Postgres `db/schema.sql` 은 보존, 별도 `db/schema.mysql.sql` 로 변환 (TEXT[]/JSONB→JSON, SERIAL→AUTO_INCREMENT, UUID 함수 변경, GIN/partial index 제거). |
| **mysql2 raw + prepared statements** | ORM (Prisma/Knex) 미도입. 도메인 작아서 over-engineering. 추후 필요 시 도입. |
| **풀 한 개 싱글톤** (`server/db/pool.js`) | 라우트마다 createConnection 안 함. `getPool()` lazy init. SIGTERM 시 `closePool()`. |
| **RDS TLS 의무** | `DB_SSL_MODE=rds` 기본. `server/certs/rds-global-bundle.pem` 자동 로드. 없으면 generic TLS 폴백. dev 만 `false` 허용. |
| **timezone='Z' (UTC)** | RDS UTC 저장 + 표시 단에서 KST 변환. mysql2 dateStrings=false → JS Date. |
| **`/api/catalog/*` 별도 라우트 그룹** | 기존 AI/concierge 라우트(`/api/analyze`,`/api/synthesize` 등)와 분리. DB 미설정 시 503 (mock 로 fallback 안 함 — 명시적 분리). |
| **schema 시드와 mock 시드 분리** | `db/seed/*.mysql.sql` = mechanisms/categories (정규화된 lookup). `server/scripts/seed-from-mock.js` = 데이터 (brands/hospitals/procedures/hp/concerns/feed). |
| **JSON 컬럼**으로 `TEXT[]` 대체 | MySQL 8 JSON 인덱싱은 generated column 필요 → MVP 는 일반 인덱스 + app 레벨 필터. Phase 2 에서 hot path 별 generated column 추가. |
| **partial index 제거** (`WHERE is_signature`) | MySQL 미지원. 일반 인덱스로 대체 (선택률 낮은 컬럼이라 성능 영향 미미). |

### 19-2. 산출물

```
db/
├── schema.sql                  ← Postgres (보존, 참조용)
├── schema.mysql.sql            ← MySQL 8.x — RDS 적용 대상
└── seed/
    ├── mechanisms.sql                 (Postgres)
    ├── mechanisms.mysql.sql           (MySQL, ON DUPLICATE KEY UPDATE)
    ├── procedure_categories.sql       (Postgres)
    └── procedure_categories.mysql.sql (MySQL)

server/
├── .env                        ← + DB_HOST/PORT/USER/PASSWORD/NAME, SSL 옵션, pool limit
├── .env.example                ← 동일
├── package.json                ← + mysql2, db:migrate / db:seed-from-mock / db:reset 스크립트
├── db/
│   ├── pool.js                 싱글톤 mysql2 promise pool · RDS TLS · 종료 훅
│   ├── health.js               SELECT 1 헬스체크 (configured/ok/latency_ms)
│   └── queries/
│       └── catalog.js          read-only: categories / concerns / procedures / hospitals / offerings / feed
├── routes/
│   └── catalog.js              ↑ 위 query 들을 HTTP 로 노출 + 503 guard
├── scripts/
│   ├── migrate.js              db/schema.mysql.sql + seed *.mysql.sql 적용 (--schema / --seeds 분리 옵션)
│   └── seed-from-mock.js       client/src/data/*.js → RDS upsert (--dry / --only= 옵션)
└── index.js                    ← /api/health 에 db 상태, 카탈로그 라우트 등록, SIGTERM 풀 종료
```

### 19-3. 환경변수 (`server/.env`)

```
# AWS RDS MySQL
DB_HOST=                  # RDS endpoint (xxx.rds.amazonaws.com)
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=              # ★ 필수
DB_NAME=glowupseoul
DB_CHARSET=utf8mb4
DB_CONNECTION_LIMIT=10
DB_SSL_MODE=rds           # 'rds' | 'true' | 'false' (dev only)
DB_SSL_CA_PATH=           # 빈 채로 두면 server/certs/rds-global-bundle.pem 사용
```

**RDS CA 번들 받기** (TLS 검증 정상화):
- 다운로드: https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
- 저장: `server/certs/rds-global-bundle.pem` (gitignored)
- `DB_SSL_MODE=rds` 면 자동 로드, 없으면 `rejectUnauthorized:false` 로 폴백 (dev 만 권장)

### 19-4. 운영 흐름 (cutover 절차)

1. **RDS 인스턴스 생성** — MySQL 8.x, 퍼블릭 액세스 ON (또는 SSH 터널), Security Group 에서 작업 IP 만 허용
2. **DB 생성** — RDS 콘솔에서 `glowupseoul` 데이터베이스 생성, 또는 `CREATE DATABASE glowupseoul DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
3. **`.env` 채우기** — DB_HOST/PASSWORD 박기
4. **CA 번들 드롭** — `server/certs/rds-global-bundle.pem`
5. **install** — `cd server && npm install`
6. **migrate** — `npm run db:migrate` (스키마 + lookup 시드)
7. **import mock** — `npm run db:seed-from-mock -- --dry` 로 미리보기 → 실 실행
8. **검증** — `curl http://localhost:3001/api/health` → `db.ok=true`
9. **클라 전환 (Phase 2)** — `client/src/data/db.js` 가 인메모리 import 대신 `/api/catalog/*` fetch 로 교체

### 19-5. API 신규 (read-only)

| 메서드 | 경로 | 반환 |
|---|---|---|
| GET | `/api/health` | `{ ok, has_openai_key, has_google_key, model, db:{ok,configured,latency_ms} }` |
| GET | `/api/catalog/categories` | `{ categories: [...] }` 8개 body-area |
| GET | `/api/catalog/concerns` | `{ concerns: [...] }` |
| GET | `/api/catalog/procedures?category=&surgical=` | `{ procedures: [...] }` |
| GET | `/api/catalog/procedures/:slug` | `{ procedure, offerings:[hospital_procedures + hospital info] }` |
| GET | `/api/catalog/hospitals?city=&contract=active` | `{ hospitals: [...] }` |
| GET | `/api/catalog/hospitals/:slug` | `{ hospital, offerings:[...] }` |
| GET | `/api/feed/recent?limit=20` | `{ entries: [...] }` 메인 ticker 용 |

**DB 미설정 시** 모든 catalog/feed 라우트 → `503 { error: 'db not configured' }`. 클라이언트는 cutover 완료 전까지 인메모리 mock 으로 폴백.

### 19-6. Write-side 라우트 (TODO — Phase 2)

| 메서드 | 경로 | 용도 |
|---|---|---|
| POST | `/api/match/requests` | `match_requests` insert + 매칭 result 스냅샷 저장 |
| POST | `/api/inquiries` | WhatsApp 핸드오프 시점에 inquiry 영구화 |
| POST | `/api/feed/entries` | opt-in 동의자 entry + 운영자 시드 |
| PATCH | `/api/feed/entries/:id` | 운영자 visibility/priority 토글 |
| PATCH | `/api/inquiries/:id` | 상담 진행 단계 (sent → quoted → booked) |

### 19-7. 알려진 한계 / 차주 작업

- [ ] **client/src/data/db.js 가 아직 fetch 안 함** — 인메모리 그대로. cutover 후 분리 PR 로 교체 (혼란 줄임).
- [ ] **users / auth flow 부재** — schema 만 있고 라우트/세션 미구현. 외국인 환자 OAuth (구글/LINE/WeChat) 도입 시점에 결정.
- [ ] **JSON 컬럼 인덱싱** — `procedures.mechanism`, `hospitals.languages_supported`, `hp.device_brands` 등. 카탈로그 트래픽 발생 후 hot path 별 generated column + 인덱스 추가.
- [ ] **마이그레이션 버저닝** — `schema_migrations` 테이블 없음. v0 → v1 변경 시점에 도입.
- [ ] **백업/복구 SOP** — RDS 자동 백업만 의존. PITR 검증 / dump 자동화 / 복구 리허설 미수행.
- [ ] **읽기 전용 레플리카** — 트래픽 증가 시 RDS Read Replica + `mysql2` 다중 풀 (write/read 분리).
- [ ] **연결 문자열 secrets manager** — 현재 `.env` 평문. 운영 진입 시 AWS Secrets Manager 또는 SSM Parameter Store 로 이전.

---

*§19 갱신: 2026-05-12 (AWS RDS MySQL 스캐폴딩). 다음 자연 확장점 = mock 데이터 import 검증 → client `data/db.js` fetch 전환.*

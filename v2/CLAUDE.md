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

데이터: `v2/docs/hospital_research.xlsx` (5시트, 200KB)
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

데이터: `v2/docs/hospital_canonical.xlsx` (5시트)
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

## 8. 스키마 설계 원칙 (Postgres DDL `v2/db/schema.sql`)

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
11. `inquiries` → `quotes` (concierge loop)
12. `trips` (저니 패키지)
13. `consultations` (pre/in/post-trip)
14. `post_op_checkins` (D+1/D+7/D+30)

### 8-3. 결정 사항
- **brand → hospital (branch) 2계층** — 리엔장 6 branches 처리
- **mechanism = `TEXT[]`** — InMode RF+EM 조합 케이스 지원
- **이미지 3계층** — generic procedure / hospital branch / hospital_procedures override
- **dental 같은 schema 통합** — `body_area='dental'` + dental mechanism 6개. 별도 테이블 X.
- **packages MVP = 자유 텍스트** — 살롱드닥터튠즈만 1 케이스. 패턴 굳어지면 Phase 2 `procedure_bundles`.
- **가격 표시 = 티어만** ($/$$/$$$). 정가 노출 옵트인. 17곳 모두 "상담문의" — 한국 의료광고법.
- **돈 = KRW integer**. FX 변환은 display edge.

---

## 9. v2 디렉토리 구조 (2026-05-11 현재)

```
v2/
├── CLAUDE.md                              ← 본 파일 (source of truth)
├── README.md                              ← v2 개요 + 운영 연락처
├── docs/
│   ├── research-findings.md               17개 병원 조사 종합
│   ├── ux-direction.md                    메인 IA / 스캔 modal / 카테고리 분기
│   ├── hospital_research.xlsx             ← raw 데이터 5시트
│   └── hospital_canonical.xlsx            ← canonical merge 5시트
└── db/
    ├── schema.sql                         Postgres DDL 14 테이블 (이미지 컬럼 포함)
    └── seed/
        ├── mechanisms.sql                 30개 mechanism 다국어
        └── procedure_categories.sql       10 메인 + 4 하위 카테고리

(루트의 v1 자산)
client/                                    v1 PWA — 그대로 보존, 참조용
server/                                    v1 Express — 그대로 보존
scripts/
  ├── export_ayun.cjs                      v1 아윤 파싱
  ├── export_research.cjs                  v2 raw research xlsx 생성
  └── merge_canonical.cjs                  v2 canonical merge 생성
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

1. **메인 카테고리 분기 축 최종 결정** — 사용자 표현 그대로: "**시술별(사실 이 기준을 뭐로할진 아직 미정)**". intensity_tier 우선? body_area 우선? concern 우선?
2. **159 canonical 중 진짜 카탈로그에 노출할 항목** — 마이너 디바이스(Reepot/Lucas Plus/Photona 등) 노출 vs hide?
3. **365mc 의 `body_contouring` 도메인 — 다른 face_aesthetic 과 동등 노출 vs 별도 메뉴?**
4. **리엔장 6 branches 중 v1 launch 에 몇 개 노출?** — 강남본점만? 6개 다?
5. **셀로라 (계약 협의중)** — 포함 / 보류?
6. **다국어 일본어 추가 시점** — 현재 운영은 EN/中/Bahasa. JP 시장 진입?
7. **B&A 갤러리 자산 확보 방법** — 병원에서 직접? 사용자 동의받고 환자 후기?
8. **컨시어지 capacity** — Min 솔로로 영어권 동시 몇 명까지?
9. **WeChat 운영자 계정 발급** — 누가, 언제?
10. **CN UI 번역 품질** — 자체 vs 프로 번역 outsource?

---

## 12. 다음 작업 (큐 — 사용자 결정 대기)

| # | 작업 | 상태 |
|---|---|---|
| ✅ | 17개 병원 조사 · xlsx 출력 | 완료 |
| ✅ | Postgres 스키마 14 테이블 + 이미지 컬럼 | 완료 |
| ✅ | mechanism / category 시드 (다국어) | 완료 |
| ✅ | Canonical merge (258 → 159) | 완료 |
| ⏳ | **카테고리 분기 축 최종 결정** | **사용자 검토중** |
| ⏳ | concerns 시드 (20~30, 외국인 키워드) | 사용자 큐레이션 필요 |
| ⏳ | concern_procedures 매트릭스 | 사용자 큐레이션 필요 |
| ⏳ | v2 client/server 부트스트랩 | 카탈로그 확정 후 |
| ⏳ | 초기 hospital 5개 입력 + 섬네일 | Hershe / 노즈립 / 리엔장 강남 / 센텀코어 / 우아 우선 |

---

## 13. 비고 / 참조 문서

- `v2/README.md` — 빠른 개요
- `v2/docs/research-findings.md` — 17 병원 조사 종합 + 스키마 시사점
- `v2/docs/ux-direction.md` — 메인 IA + 스캔 modal + 카테고리 분기 디테일
- `v2/db/schema.sql` — Postgres DDL 14 테이블
- `v2/db/seed/*.sql` — mechanism 30 + category 14
- `v2/docs/hospital_research.xlsx` — raw 데이터 (258 시술)
- `v2/docs/hospital_canonical.xlsx` — canonical merge (159 시술)
- `scripts/export_research.cjs` / `scripts/merge_canonical.cjs` — 재생성 가능

레거시:
- `../CLAUDE.md` — v1 (한국 도메스틱 mock 매칭 PWA) 스펙. v2 와 무관. **참조용으로만 보존**.
- `../CLAUDE (3).md` — 피봇 검토 문서. 본 문서가 이를 대체.
- `../client/` `../server/` — v1 코드. v2 는 별도 디렉토리에서 진행.

---

*마지막 갱신: 2026-05-11. 새 결정 추가 시 §1 (의사결정 history) + §11 (미해결 결정) 갱신 필수.*

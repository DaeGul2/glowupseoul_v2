# Glow Up Seoul v2 — CLAUDE.md

> Korea Medical Tourism Platform · 외국인 환자 ↔ 한국 강남/부산 피부·성형·치과 클리닉
> 본 문서는 v2 작업의 source of truth. 모든 결정·고민·맥락이 여기 있음.
> 최종 갱신: 2026-06-06

---

## 0. 한 줄 요약

v1 (한국 도메스틱 PWA, 강남 시술 매칭) → **v2 (외국인 환자 컨시어지 + 가이드 저니)** 로 전면 피봇.
운영 중인 사이트 `glowupseoul.com` 이 이미 EN/中/Bahasa 컨시어지 모델로 운영 중이며, v2 는 이를 기반으로 **시술 카탈로그 + 병원 매칭 + 스캔 hook + 다국어 채널** 을 더해 컨버전 흐름을 완성한다.

> ⚠ **데이터 현황(병원/시술/오퍼링 수 등)은 라이브 RDS 가 진실.** `node server/scripts/db-ping.js` 또는 어드민 `/api/admin/stats` 로 확인. 이 문서엔 row 카운트를 하드코딩하지 않는다 (드리프트 원인). DB 테이블 구조는 §8 참조.

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

→ **작업 경로**: `C:\Users\민태희\Desktop\github\glowupseoul_v2\` 단 한 곳.
- GitHub Desktop 연동, remote = `DaeGul2/glowupseoul_v2.git` (private)
- 구 v1 `glowupseoul/` 은 **폐기**. 어떤 변경도 가하지 말 것.

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

### 8-2. 테이블 인벤토리 (라이브 RDS 기준 — 21개)

> SoT = `db/schema.mysql.sql` (코어) + `db/schema.extend.mysql.sql` (admin 확장: doctors / ba_photos / scan_events / devices / procedure_devices + 이미지 컬럼). Sequelize 미러 = `server/db/models.js`.

**카탈로그 코어**
1. `mechanisms` (lookup, PK=slug, 다국어)
2. `procedure_categories` (트리, 다국어, category hero/thumbnail)
3. `procedures` (intrinsic — mechanism · domain · body_area · 통증/다운타임 · 수술필드 NULL-able · 이미지 generic + gallery)
4. `concerns` (외국인 키워드 — `category_id` FK 로 §27 카테고리 매핑 보유)
5. `concern_procedures` (고민↔시술 매칭 매트릭스, composite PK, **수기 큐레이션**)
6. `devices` (기기 브랜드 — Ulthera/Shurink 등, mechanism_slug FK) · §26
7. `procedure_devices` (시술↔기기 매트릭스, composite PK, relevance) · §26

**병원 / 인력**
8. `brands` (부모 — specialization_depth, logo, brand_hero)
9. `hospitals` (branch 단위 — geo 3-tier, 메신저 4종, 언어 array, 외국인 capability, 신뢰 시그널, 이미지)
10. `hospital_procedures` (변형 — price_tier, device_brands JSON, package_notes, 이미지 override)
11. `doctors` (병원당 다수, portrait/hero/gallery + credentials JSON) · §21
12. `ba_photos` (before/after 짝, consent/visibility) · §21

**환자 / 플로우 / 운영**
13. `users`
14. `match_requests` (matching snapshot — 스캔 영구화, 익명 session_token) · §21
15. `inquiries` → 16. `quotes` (concierge loop, `public_feed_consent` 포함)
17. `trips` (저니 패키지)
18. `consultations` (pre/in/post-trip)
19. `post_op_checkins` (D+1/D+7/D+30)
20. `public_feed_entries` (메인 ticker — 익명화, opt-in, 운영자 시드)
21. `scan_events` (AI 스캔 호출 로그 — 비용/IP/rate-limit) · §21

(파트너 신청은 DB 테이블이 아니라 `server/submissions/*.json` 파일 inbox — §18.)

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
│   ├── schema.mysql.sql + schema.extend.mysql.sql   MySQL DDL — RDS 적용 대상 (21 테이블)
│   ├── schema.sql                         Postgres DDL (참조용, 운영 X)
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

## 12. 다음 작업 (큐)

> 통합 TODO 는 **§23 으로 일원화**됨 (초기 큐는 대부분 완료). 작업 우선순위는 §23 참조.

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
- `db/schema.mysql.sql` + `db/schema.extend.mysql.sql` — MySQL DDL (RDS 적용 대상, 21 테이블). `db/schema.sql` 은 Postgres 참조용.
- `db/seed/*.mysql.sql` — mechanisms / procedure_categories lookup 시드 (다국어)
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

mock DB + Vite 클라이언트 (no-server 부터 시작) → 4 페이지 → AI 스캔 (GPT-4o-mini vision) → 매칭 룰 + GPT 합성 → Google Places 리뷰 → device 축 → 모던 럭셔리 UI 재설계. 병원·시술·오퍼링 mock 시드. 한 사이클 비용 **~$0.0006 (≈0.8원)**.

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

### 16-2. 산출물 (요약 — 정식 트리는 §9)

- **client/src/data/** — 스키마 1:1 인메모리 미러 (mechanisms / procedureCategories / concerns / procedures / concernProcedures / brands / hospitals / hospitalProcedures / publicFeed / devices / db.js). *현재는 RDS 가 진실 — 이 파일들은 seed-from-mock 입력으로만 의미 (§27-5).*
- **client/src/pages/** — HomePage · CategoryPage · TreatmentDetailPage · HospitalDetailPage · DeviceDetailPage · ResultsPage · About · HowItWorks · Services · FAQ
- **client/src/components/** — Hero · Header · Footer · PublicFeedTicker · DeviceCategories · TreatmentCard · FaceScanner (MediaPipe + medical HUD) · ScanModal (scan→form→handoff) · PreferenceForm · AiSynthLoading · ClinicReviews · ReviewAvatar · WhatsAppCTA
- **client/src/utils/** — matching.js (rule-based, HARD concern filter) · api.js (analyze/synthesize/reviews fetch) · useReveal.js
- **server/routes/** — analyze.js (vision) · synthesize.js (Romie persona) · reviews.js (Google Places EN+ZH)

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

### 16-6. UI / UX 핵심 컴포넌트 노트 (요약)

- **FaceScanner** (`components/FaceScanner.jsx`) — phase 머신 `loading → idle → scanning → analyzing → done`. `analyzing` 중 `/api/analyze` 호출. 멀티 레이어 medical HUD (6 region polygon + 크로스헤어 + 스트리밍 로그 + 라이브 카운터). "보여주기식 X · 진짜 의학 스캔처럼" 이 톤 룰.
- **AiSynthLoading** — ResultsPage 가 synth 기다리는 동안 골드 orb + 스트리밍 로그 + skeleton 카드.
- **ResultsPage** — Hero(synth.overall 인용) → AI Selection (synth top 3 + 임베드 Google 리뷰) → Other candidates → CTA strip.
- **ClinicReviews / AI Pick reviews** — hospital.slug 로 `/api/reviews/:slug` 호출, best review 1개 + rating + ReviewAvatar(referrer 우회) + 4줄 clamp.

---

### 16-7. 비용 모델

`gpt-4o-mini` 기준 한 사이클(analyze vision detail=low + synthesize text) ≈ **$0.0006 (≈0.8원)**. 1만명 ≈ $6, 10만명 ≈ $60. Google Places 는 24h 파일 캐시 + EN/ZH 병렬 → $200/월 무료 크레딧 내 무한. (이후 §17·§26 작업은 추가 API 호출 없음 — 클라 로컬 연산.)

---

### 16-8. 실행 / 디버그 cheat sheet

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

---

## 20. 2026-05-13 — RDS live · Sequelize · seed-from-mock 성공

`§19` 의 스캐폴딩이 실제로 살아 움직임. RDS 띄움 → 보안그룹 → 스키마 적용 → mock 데이터 모두 import. raw mysql2 path 를 **Sequelize** 로 전면 교체 (사용자 지시 "야 시퀄라이즈 써").

### 20-1. 사용자 발화 / 의사결정

> "DB 주소도 필요하지않음? 엔드포인트"
> "다 넣어놨음 테스트해봐"
> "함" (Security Group inbound rule 추가 후)
> "야 시퀄라이즈 써"
> "나 궁금한게 왜 #/admin 으로 가는거야? 걍 /admin으로 안하고? 보통 #을 붙여?"
> "slug의 역할은 뭐야?"

→ 결정: 사용자가 본격적으로 운영 도구를 만질 시점. ORM 도입 / path URL / slug 개념 잡기 모두 같은 흐름.

### 20-2. RDS 인스턴스 (운영 좌표)

| 항목 | 값 |
|---|---|
| endpoint | `database-1.cna8q8goadu8.ap-northeast-2.rds.amazonaws.com` |
| engine | MySQL 8.4.8 |
| region | `ap-northeast-2` (서울) |
| master user | `admin` |
| DB name | `glowupseoul` |
| SG inbound | `MYSQL/Aurora 3306, Source 0.0.0.0/0` (dev 편의 — 운영 진입 전 좁히기) |
| TLS | `rejectUnauthorized:false` 폴백 사용 중 (실 PEM 미배치) |

> 운영 진입 시 필수:
> - SG source `0.0.0.0/0` → 특정 IP / VPC peering
> - `server/certs/rds-global-bundle.pem` 다운로드 → 진짜 CA 검증
> - DB_PASSWORD 를 AWS Secrets Manager 로 이전

### 20-3. Sequelize 전환

| 변경 | 결과 |
|---|---|
| `server/db/pool.js` (raw mysql2 풀) → `server/db/sequelize.js` | 싱글톤 Sequelize, RDS SSL, pool 옵션 |
| `server/db/queries/catalog.js` (raw SQL) → `server/db/models.js` | 15개 모델 + associations 한 파일 |
| `server/routes/catalog.js` | `Model.findAll({ include })` 로 재작성 |
| `server/scripts/migrate.js` | `--use-sequelize` 옵션 추가 (기본은 raw SQL — CHECK 제약 보존) |
| `server/scripts/seed-from-mock.js` | `bulkCreate({ updateOnDuplicate })` 기반. mock id → DB id 슬러그 매핑 자동 |
| `server/db/health.js` | `sequelize.authenticate()` |

**라이브러리 추가**: `sequelize@^6.37.4` (driver = mysql2)

### 20-4. mock 데이터 import 결과

`seed-from-mock` 으로 brands / hospitals / procedures / concerns / hospital_procedures / concern_procedures / public_feed 모두 RDS upsert 성공. **row 수는 라이브 기준이며 이후 재시드·운영으로 변동** — `node server/scripts/db-ping.js` 또는 `/api/admin/stats` 로 확인. `/api/health` → `db.ok=true` · `s3_configured: true`.

### 20-5. 진단 스크립트 — `server/scripts/db-ping.js`

연결 안 될 때 첫 단추로 돌리는 진단. 친절한 에러 메시지로 ETIMEDOUT (SG 차단) / ACCESS_DENIED (자격 증명 오류) / ENOTFOUND (endpoint 오타) 분기 안내.

### 20-6. 결정 추가

| 결정 | 한 줄 이유 |
|------|-----------|
| **Sequelize (ORM) 채택** | 사용자 지시. 모델 변경 시 raw SQL 전체 수정 비용 큼. mysql2 는 sequelize 의 driver 로 그대로 유지. |
| **모든 모델 한 파일** (`db/models.js`) | 15개 분리하면 import 그래프 복잡. 한 파일 + 각 모델 export 가 깔끔. associations 도 같이 정의. |
| **`migrate.js` 의 raw path 가 기본** | `sequelize.sync` 는 CHECK 제약 / partial 인덱스를 못 만듦. `db/schema.mysql.sql` 이 source of truth. |
| **SG source `0.0.0.0/0`** | dev 가 카페·집·핫스팟 옮겨다님. My-IP 만 허용하면 와이파이 바뀔 때마다 재설정. 운영 진입 전엔 좁힌다. |

### 20-7. Slug 의 역할 (사용자 질문 정리)

| 용도 | 예시 |
|---|---|
| URL 식별자 | `/treatment/hifu_face`, `/clinic/hershe_청담점` |
| DB id 대체 안정 키 | id 1→47 로 바뀌어도 slug 는 동일 → 코드는 slug 로 lookup |
| SEO 친화 URL | 구글이 `hifu_face` 키워드를 URL 에서 인덱스 |
| S3 폴더 이름 | `procedures/hifu_face/thumbnail-xxx.jpg` (id 였으면 무의미) |
| Admin FkPicker 검색 키 | slug + name 으로 검색해서 id 자동 매칭 |

**규칙**: 소문자 + 영숫자 + `_`/`-`. 한글 허용 (지점명 `_청담점`). **한 번 정하면 절대 변경 X** (URL 깨짐).

---

## 21. 2026-05-13 — Admin 시스템 풀세트 + S3 + 파트너 승인 + 스캔 영구화

사용자 발화: "이제 어드민 페이지 제대로만들어봐 각 사진들도 넣을수있게" → "다 만들고 저장소는 s3 할게" → "모든 테이블에 대하여 CRUD 가능하도록 만들어줘야되고, pending된 파트너사 승인하는 부분도 만들어야하고, 어떤 병신같은 곳에서 id를 직접 손으로 치나? 비개발자들이 할건데?"

### 21-1. 사용자 명시 가이드라인 (잊지 않게)

| 룰 | 적용 |
|---|---|
| **모든 테이블 CRUD** | generic `/api/admin/:kind` + spec 기반 자동 폼 생성 |
| **사진 슬롯 다 넣을 수 있게** | procedures 3 + brands 2 + hospitals 3+gallery + doctors 3 + ba_photos 2 + categories 2 + hospital_procedures override 2 |
| **저장소 = S3** | presigned PUT direct upload, 서버는 URL 발급만 |
| **파트너 신청 = pending → 운영자 승인** | submissions/*.json → admin 모달에서 검토 → "Approve → DB import" 누르면 brand+hospital+hp 자동 INSERT, `contract_status='pending'` 으로 들어가서 매칭에 자동 노출 X |
| **비개발자 친화 FK** | id 숫자 입력 절대 X. **이름으로 검색하는 콤보박스** (FkPicker) |
| **스캔 내역 영구 저장** | 옵트인 무관하게 match_requests 에 저장. 옵트인 시 public_feed_entries 에도. |
| **클라가 RDS 에서 가져옴** | 최소 publicFeed → `/api/feed/recent`. 나머지 catalog 는 Phase 2. |

### 21-2. 스키마 확장 (`db/schema.extend.mysql.sql`)

| 변경 | 이유 |
|---|---|
| `procedure_categories.thumbnail_url`, `.hero_image_url` | 카테고리 hero (1:1 + 16:9) |
| `procedures.gallery_urls` (JSON) | 시술 hero 외 결과 예시 5~10장 |
| `doctors` 테이블 신설 | 병원당 의사 다수. 외국 환자 신뢰 시그널 1순위. portrait/hero/gallery + bio 다국어 + credentials JSON |
| `ba_photos` 테이블 신설 | before/after 짝. consent_signed, visibility (public/logged_in/staff_only), 환자 메타 (age_range/country) |

적용: `npm run db:extend` (서버 측). idempotent — errno 1050/1060/1061/1826 무시 (재실행 안전).

### 21-3. S3 통합 (`server/s3.js`)

**presigned PUT 방식** — 파일이 서버를 통과하지 않음. 클라 → 직접 S3.

| 항목 | 값 |
|---|---|
| 버킷 | `glowupseoul` (ap-northeast-2) |
| 객체 소유권 | ACL 비활성화 (권장) |
| 퍼블릭 액세스 | 차단 해제 (사진 CDN 용) |
| 버킷 정책 | `s3:GetObject` Allow `Principal: *` |
| CORS | `PUT/GET/HEAD` from `*` (dev) |
| 암호화 | SSE-S3 (무료, 자동) |
| IAM | `glowupseoul-server` 사용자 + `AmazonS3FullAccess` |

**키 구조** (자동 생성):
```
procedures/hifu_face/thumbnail-mp2px9ru.jpg
procedures/hifu_face/gallery/{ts}-{uuid}.jpg
hospitals/hershe_청담점/hero-xxx.jpg
hospitals/hershe_청담점/gallery/{ts}-{uuid}.jpg
brands/soi/logo-xxx.png
doctors/{slug}/portrait-xxx.jpg
ba/{id}/before.jpg, ba/{id}/after.jpg
categories/{slug}/thumbnail-xxx.jpg
```

`S3_PUBLIC_BASE_URL` 비워두면 `https://glowupseoul.s3.ap-northeast-2.amazonaws.com/{key}` 자동.

### 21-4. Admin API (server/routes/admin.js)

전부 `X-Admin-Key` 헤더 가드. 401 → 자동 로그아웃.

| 메서드 | 경로 | 용도 |
|---|---|---|
| GET | `/api/admin/stats` | 모델별 row 수 + S3 상태 |
| POST | `/api/admin/upload/presign` | `{ kind, owner, slot, mime, size }` → `{ upload_url, public_url }` |
| GET/POST/GET/PATCH/DELETE | `/api/admin/:kind`, `/api/admin/:kind/:id` | generic CRUD (9개 모델: brands, hospitals, procedures, procedure_categories, concerns, hospital_procedures, doctors, ba_photos, public_feed_entries, concern_procedures) |
| GET | `/api/admin/partner-submissions` | 파일 inbox |
| GET | `/api/admin/partner-submissions/:file` | 한 건 풀 본문 |
| POST | `/api/admin/partner-submissions/:file/approve` | brand + hospital + hospital_procedures INSERT, 파일 `_approved/` 로 이동 |
| POST | `/api/admin/partner-submissions/:file/reject` | 파일 `_rejected/` 로 이동 |

### 21-5. 스캔 영구화 (`server/routes/match.js`)

POST `/api/match-requests` — 익명 OK (`session_token` 만이 키). 옵션 feed entry 동시 생성.

`client/src/App.jsx` 의 `onScanSubmit` 이 자동 호출 → match_request 영구 저장. 옵트인 시 public_feed_entries 도 자동 추가.

`session_token` 은 `sessionStorage.gs_session_token` 에 저장 — 같은 사용자가 새로고침해도 동일 session 유지.

### 21-6. Admin UI (`client/src/admin/` — 14 파일)

```
client/src/admin/
├── AdminApp.jsx           ← 라우터 + 인증 가드 (BrowserRouter)
├── AdminLogin.jsx         ← 키 입력 → verify → sessionStorage 'gs_admin_key'
├── AdminLayout.jsx        ← 좌측 nav (Dashboard / Partners / 10개 모델)
├── AdminDashboard.jsx     ← 카운트 카드 그리드 + S3 chip
├── AdminList.jsx          ← 공용 테이블 + 페이지네이션 + 필터 + FK 컬럼 자동 join 표시
├── AdminEdit.jsx          ← spec 기반 자동 폼 (text/textarea/number/bool/date/datetime/select/tags/json/image/gallery/fk)
├── AdminPartners.jsx      ← 신청서 inbox + 모달 + Approve → DB import
├── ImageUploader.jsx      ← 단일 사진 드래그앤드롭 → presign → S3 PUT → URL 자동 반환
├── ImageGalleryEditor.jsx ← 다중 사진 + 순서 변경 + 삭제
├── FkPicker.jsx           ← FK 콤보박스 — 이름/slug 로 검색, id 자동 매칭, 캐시 + invalidate
├── specs.js               ← 10개 모델 × 모든 컬럼 metadata (group/type/upload slot/options)
├── api.js                 ← fetch wrapper, X-Admin-Key 자동 헤더, 401 시 자동 로그아웃 + navigate
└── admin.css              ← Linear/Notion 풍 회색조 sans-only 톤 (사이트 럭셔리 톤과 분리)
```

### 21-7. 결정 추가

| 결정 | 한 줄 이유 |
|------|-----------|
| **presigned PUT, 서버 우회 업로드** | 큰 파일 (이미지) 이 Node 메모리 통과 X. 서버는 URL 발급만. |
| **bucket public read + bucket policy** | 사진 CDN. 운영 진입 시 CloudFront + Origin Access Control 로 이전 옵션. |
| **모델 spec 기반 자동 폼** | 100+ 컬럼 수기 작성하면 유지보수 폭망. spec 한 곳만 수정 → 폼 자동 업데이트. |
| **FK = 콤보박스만** (id 입력 금지) | 비개발자가 사용. id 직접 입력은 운영자 실수 1순위. |
| **List 의 FK 컬럼 = join 된 이름** | `hospital_id: 9` 대신 `Hershe 청담점` 표시. 백엔드 `include` 가 자동으로 join 객체 보내줌. |
| **soft delete (`deleted_at`) 기본** | `is_active=false` + 타임스탬프. 운영자가 실수로 삭제해도 복구 가능. |
| **파트너 approve = `contract_status='pending'`** | 자동 노출 X. 운영자가 별도 단계로 행 편집해서 `active` 로 바꿔야 매칭에 등장. 2단계 안전망. |
| **세션 토큰 = 익명 영구화 키** | 로그인 안 하는 외국 환자도 본인 스캔 결과 다시 볼 수 있어야. `session_token` 으로 owner 검증. |
| **publicFeed 만 RDS hydrate** (catalog 는 mock 유지) | catalog 전체 fetch 전환은 비동기 마이그레이션 부담. 메인 ticker / RecentMatches 가 동적이면 운영자 입력 즉시 반영 가능 — 가장 큰 가치. |

### 21-8. 알려진 한계 / TODO (Phase 2)

- [ ] **catalog 도 RDS fetch 로** — `client/src/data/db.js` 의 procedures/hospitals/concerns/categories/devices/brands 까지 fetch 로 교체. 동기 → 비동기 변환 필요, React Query 또는 SWR 도입 결정.
- [ ] **doctors / ba_photos 시드 0 건** — 운영자가 admin 에서 채워야 함. 우선순위: Hershe · 노즈립 · 리엔장 강남 · 우아 의사 1~3명 + 시그너처 시술 B&A 5~10건.
- [ ] **procedures.category_id NULL** — mock 의 `category_slug` 누락. 일괄 UPDATE 또는 mock 재시드 필요.
- [ ] **composite PK 편집** (`concern_procedures`) — `/admin/concern_procedures/{concern_id}-{procedure_id}` 형태로 처리하긴 하나 새로 만들 때 `id` URL 자리에 `new` 만 가니까 PK 두 개 모두 폼에서 결정. 작동은 함, UX 거칠음.
- [ ] **CloudFront 도입** — 이미지 CDN. 현재 S3 직접 호출 (서울 리전 → 글로벌 사용자 latency).
- [ ] **이미지 자동 리사이즈 / 포맷 변환** — 현재 원본 그대로 저장. webp/avif 자동 + 썸네일 자동 생성 → Lambda@Edge 또는 Cloudinary 검토.
- [ ] **EXIF 위치 정보 strip** — 환자 사진 업로드 시 GPS 등 메타 자동 제거 (privacy).
- [ ] **rate limit / brute-force 보호** — `/api/admin/upload/presign` 무제한. 토큰 throttle 필요.

---

## 22. 2026-05-13 — Path-based 라우팅 전환 + 풀 SEO

사용자 발화: "나 궁금한게 왜 #/admin 으로 가는거야? 걍 /admin으로 안하고? 보통 #을 붙여?" → "먼저 전환해. 그리고 seo도 검색 잘 되도록 넣어줘 부탁할게. v2 Preview라넛도 없애고 그냥 GlowUpSeoul 로만 인덱스 ㄱㄱ" → "seo같은거 할떄 아주 제대로좀 해야돼. 고수들의 노하우를 따라해서 해줘"

### 22-1. Path-based 라우팅 (hash router → BrowserRouter)

| 변경 | 결과 |
|---|---|
| `react-router-dom@^7` 도입 | `<BrowserRouter>` + `<Routes>` + `<Link>` + `useNavigate` |
| `App.jsx` 의 `parseHash` 제거 | `<Routes>` 정의로 대체 |
| `redirectLegacyHash()` 1회 실행 | 사용자가 옛 `#/about` 로 들어와도 자동 `/about` 로 `replaceState` — 사용자 동작 0 |
| `navigate('/x')` 호환 헬퍼 | 컴포넌트 밖에서 호출 가능 (`history.pushState` + popstate 이벤트). 기존 `navigate()` 콜러 코드 변경 없이 작동. |
| 모든 `href="#/..."` → `href="/..."` 일괄 치환 | admin + 사이트 본 |
| `vite.config.js` SPA fallback | dev 는 vite 자동, 운영은 호스팅(nginx/vercel/netlify) 설정 필요 |
| `NotFoundPage.jsx` 신설 | 매칭 안 되는 path → 404 + noindex |

운영 진입 시 호스팅 SPA fallback 예시:
- **nginx**: `try_files $uri /index.html;`
- **vercel**: `vercel.json` 에 `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`
- **netlify**: `_redirects` 에 `/*  /index.html  200`

### 22-2. SEO 시스템 (`client/src/utils/seo.js`)

**`useSeo()` 훅** — 마운트 시 head 동적 변경, unmount 시 자동 복구. react-helmet 도입 X (의존성 줄임).

세팅하는 것 (페이지마다 고유):
- `<title>` (suffix 자동 ` · Glow Up Seoul`)
- `<meta name="description">`, `name="keywords"`, `name="robots"` (noindex 옵션)
- `<link rel="canonical">` (절대 URL 자동)
- Open Graph: `og:title`, `og:description`, `og:url`, `og:image`, `og:type`
- Twitter: `summary_large_image` 카드
- `<link rel="alternate" hreflang="…">` (다국어 변형 시)
- `<script type="application/ld+json">` (구조화 데이터 한 페이지에 여러 개 가능)

**JSON-LD 빌더** (모든 빌더가 `utils/seo.js` 에서 export):

| 빌더 | 용도 | 페이지 |
|---|---|---|
| `breadcrumbLd(items)` | BreadcrumbList — 구글 rich result 의 빵부스러기 표시 | 거의 모든 페이지 |
| `medicalProcedureLd(procedure)` | MedicalProcedure schema — 시술 정보가 의료 카드로 표시 | TreatmentDetailPage |
| `medicalBusinessLd(hospital)` | MedicalBusiness with address + geo | HospitalDetailPage |
| `faqPageLd(items)` | FAQPage — Q&A 가 검색결과에 펼쳐서 표시 | FAQPage |

### 22-3. 페이지별 SEO 적용

| 페이지 | title | special |
|---|---|---|
| Home | "Korea Medical Tourism Concierge" | site-wide MedicalBusiness LD (index.html) |
| About | "About — Romie & the Glow Up Seoul concierge" | AboutPage LD |
| HowItWorks | "How it works — five-step concierge journey" | |
| Services | "Services — Care & Premium Care" | |
| FAQ | "FAQ — booking, travel, treatment, privacy" | **FAQPage schema (모든 Q&A flatten)** |
| Partner | "파트너 신청 — 외국 환자 모객 위탁" (한국어) | |
| Category (`/category/:slug`) | `${name_en} — Korean clinic services` | CollectionPage LD, 동적 |
| Treatment (`/treatment/:slug`) | `${name_en} — clinics, price, downtime` | **MedicalProcedure LD**, 동적, og:type=article |
| Hospital (`/clinic/:slug`) | `${name} · ${neighborhood} — clinic profile` | **MedicalBusiness LD with address/geo**, 동적 |
| Device (`/device/:slug`) | `${name} — Korean clinics offering this device` | 동적 |
| Results (`/results`) | "Your scan result" | **noindex** (개인) |
| 404 (`/*`) | "Page not found" | **noindex** |
| Admin | "Admin" | **noindex** (어디서도 노출 금지) |

### 22-4. 동적 sitemap.xml + robots.txt

**`server/routes/sitemap.js`** — RDS 의 `procedure_categories` + `procedures` (is_active) + `hospitals` (contract_status='active') 모두 자동 포함. `lastmod` 도 `updated_at` 기반.

```xml
<url>
  <loc>https://glowupseoul.com/treatment/hifu_face</loc>
  <lastmod>2026-05-13</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>
…
```

**`server/routes/sitemap.js → robotsHandler`** — Disallow `/admin`, `/api`, `/results`. Sitemap 위치 명시.

vite proxy 가 dev 에서도 `/sitemap.xml`, `/robots.txt` 를 백엔드로 보냄. 정적 `public/sitemap.xml`, `public/robots.txt` 는 삭제 (충돌 방지).

### 22-5. `index.html` site-wide 메타

| 항목 | 값 |
|---|---|
| `<html lang="en">` | en 으로 변경 (기본). 페이지별 다국어는 페이지 component 가 처리 |
| `<title>` | `Glow Up Seoul — Korea Medical Tourism Concierge` ("v2 Preview" 제거) |
| `<meta name="description">` | 기본 (페이지가 override) |
| `<meta name="keywords">` | Korea medical tourism, Seoul plastic surgery, K-beauty… |
| `<link rel="canonical">` | `https://glowupseoul.com/` |
| OG 기본값 | og:image = `/og-cover.jpg` (사용자 측 드롭 필요) |
| Twitter | summary_large_image |
| favicon | `/favicon.svg`, `/apple-touch-icon.png` (사용자 측 드롭 필요) |
| theme-color | `#fafaf7` (브랜드 warm white) |
| site-wide JSON-LD | MedicalBusiness — areaServed, knowsAbout, availableLanguage, founder=Romie |

### 22-6. "v2 preview" 박멸

| 위치 | 변경 |
|---|---|
| `client/index.html` `<title>` | "Glow Up Seoul — Korea Medical Tourism Concierge" |
| `client/src/components/Footer.jsx` | "© 2026 Glow Up Seoul. All rights reserved." |

검색 결과 어디에도 v2/preview/beta 표시 0.

### 22-7. 결정 추가

| 결정 | 한 줄 이유 |
|------|-----------|
| **react-router-dom 도입** | 가벼움보다 표준이 더 가치 있는 시점. SEO + 운영 도구 모두 path URL 필수. |
| **react-helmet 안 씀** (직접 head DOM 조작) | 단일 페이지의 단순 head 갱신이면 react-helmet 의 무거운 추상 불필요. 50줄 헬퍼로 충분. |
| **per-page useSeo + cleanup** | 페이지 떠나면 자동 복구. SPA 에서 stale meta 남는 버그 방지. |
| **JSON-LD 페이지 타입 매칭** | MedicalProcedure / MedicalBusiness / FAQPage / BreadcrumbList 등 의료 도메인 schema 풀세트 — 구글 rich result 노출 극대화. |
| **동적 sitemap (정적 파일 X)** | RDS 에 시술/병원 추가될 때마다 운영자가 sitemap 다시 만들 일 없음. `/sitemap.xml` 호출 시점에 빌드. |
| **Results / Admin noindex** | 개인 결과 + 운영 도구는 검색 노출 NG. canonical 도 home 으로 redirect 시켜서 잘못 들어와도 home 인덱스만. |
| **og:image 자리만 만들고 파일은 사용자 측** | 디자인 결정 (메인 비주얼) 은 운영자. 코드는 자리만 깔아둠. |

### 22-8. 운영 진입 체크리스트

- [ ] `client/public/og-cover.jpg` (1200×630), `favicon.svg`, `apple-touch-icon.png` (180×180) 드롭
- [ ] 도메인 연결 (`glowupseoul.com`) — DNS A/AAAA → 호스팅
- [ ] 호스팅 SPA fallback 설정 (위 §22-1 참고)
- [ ] `SITE_ORIGIN` 환경변수 — 운영 도메인으로 설정 (sitemap/robots 가 사용)
- [ ] HTTPS 강제 + www → non-www (또는 반대) 301 redirect
- [ ] **Google Search Console** 에 `https://glowupseoul.com/sitemap.xml` 제출
- [ ] **Bing Webmaster Tools** 등록
- [ ] Google Analytics / GTM 코드 박기 (현재 0)
- [ ] Naver / Yahoo 도 webmaster tool 등록 (한국 + 일본 시장)
- [ ] 中文 SEO 백도어: 백두 / Sogou 도 sitemap 제출 (중국 80% 타깃)
- [ ] Schema.org Review/Rating — Google Places 리뷰 5점 평균을 시술/병원 LD 에 attach 검토
- [ ] Performance: 이미지 lazy loading, `<img width height>` 명시, font preload 검증 (Lighthouse 95+)
- [ ] Core Web Vitals 모니터 — Vercel Analytics 또는 RUM

---

*§20–22 갱신: 2026-05-13. 한 사이클 작업량: Sequelize 전환 / Admin UI 전체 / S3 / 파트너 승인 / 스캔 영구화 / Path 라우팅 / 풀 SEO. 다음 자연 확장점 = catalog fetch 전환 (Phase 2) + 운영 도메인 + Google Search Console.*

---

## 23. 통합 TODO — 즉시 / 단기 / 운영 진입

이 섹션은 §10–22 곳곳에 흩어진 TODO 를 **우선순위 한 줄로** 압축. 새 세션 진입 시 여기부터 봐도 됨.

### 즉시 (다음 세션 시작 시)
1. **catalog fetch 전환** — ✅ 완료 (`§26`). bootstrap 으로 devices/procedure_devices 포함 모든 카탈로그 hydrate.
2. **concerns.category_id 분류** — ✅ 완료 (`§27`). 20 concerns 모두 category 매핑. Admin/PreferenceForm 그룹뷰.
3. **Admin 사이드바 섹션화 + 아코디언** — ✅ 완료 (`§27-4`).
4. **publicFeed mock 박멸** — ✅ 완료 (`§27-5`). 클라는 RDS 만 source.
5. **procedures.category_id NULL 일괄 채우기** — mock 의 `category_slug` 누락. UPDATE 쿼리 또는 mock 재시드. (`§20`, `§21-8`)
6. **OG / favicon 이미지 드롭** — `client/public/og-cover.jpg`, `favicon.svg`, `apple-touch-icon.png` (`§22-8`)
7. **devices + procedure_devices 운영자 큐레이션** — admin 매트릭스 페이지로 20~30 기기 + 60+ 매핑 채워 넣기. (`§26-9`)
8. **ResultsPage 의 deviceMatched 시각화** — 매치 결과 카드에 "uses your Ulthera" 골드 알약 추가. 데이터는 이미 옴, UI 만. (`§26-8`)
9. **시술 추가 시 concern 매핑 복사 도우미** — §27-2 해결책 B. 같은 mechanism 의 다른 시술 매핑 자동 제안. 운영 6개월 후 매핑 누락 문제로 드러나면 우선순위 ↑.
10. **db_relationships.xlsx 갱신** — concerns↔procedure_categories 1:N 관계 + 환자 흐름 시트에 그룹화 반영. (`§27-8`)
11. **CLAUDE.md §25 운영 매뉴얼 동기화** — Phase 1 concerns 단계에 category_id 입력 안내 추가. (`§27-8`)

### 단기 (운영 시작 전)
6. **doctors + ba_photos 시드** — Hershe / 노즈립 / 리엔장 강남 / 우아 의사 + 시그너처 시술 B&A. (`§21-8`)
7. **concerns 시드 + concern_procedures 매트릭스** — 20~30 concern + 100+ 매핑 수기 큐레이션. (`§11`)
8. **hospital_procedure_devices 정규화** — `hospital_procedures.device_brands` JSON → 3-way 조인 테이블. "Ulthera 쓰는 병원 모두" hot path 발생 시. (`§26-8`)
9. **multi-mechanism device** — InMode 같은 RF+EM 복합 기기를 devices.mechanism_slug 단일 FK 아닌 JSON 배열로 갈지 결정. (`§26-8`)
10. **CloudFront** — 이미지 CDN. Origin Access Control 로 버킷 직접 접근 차단. (`§21-8`)
11. **이미지 자동 변환 (Lambda@Edge / Cloudinary)** — webp/avif, 썸네일 자동 생성, EXIF strip. (`§21-8`)
12. **JP 다국어 라우팅** — 현재 EN/中/Bahasa 운영. JP 시장 진입. (`§11`)

### 운영 진입 (도메인 + SEO 마무리)
13. **호스팅 SPA fallback** — nginx/vercel/netlify 한 곳 결정 후 fallback 설정. (`§22-8`)
14. **DB / S3 credential → AWS Secrets Manager** — `.env` 평문 탈피. (`§19-7`, `§21-8`)
15. **RDS SG 좁히기** + 진짜 CA 번들 배치 — 0.0.0.0/0 → 운영 IP / VPC peering, `server/certs/rds-global-bundle.pem`. (`§20-2`)
16. **Google Search Console + Naver Webmaster + 中文 (Baidu/Sogou)** — sitemap 제출. (`§22-8`)
17. **Analytics** — GA4 + GTM, Core Web Vitals 모니터. (`§22-8`)
18. **읽기 전용 RDS 레플리카** — 트래픽 증가 시 read/write 분리. (`§19-7`)
19. **schema_migrations 테이블** — 마이그레이션 버저닝 부재. v0→v1 변경 시 도입. (`§19-7`)
20. **device 페이지 JSON-LD MedicalDevice schema** — SEO. (`§26-8`)

### 장기 (Phase 3)
21. **users / auth flow** — schema 만 있고 OAuth 라우트 미구현. WeChat/LINE/Google. (`§19-7`)
22. **JSON 컬럼 generated column + 인덱스** — 카탈로그 hot path 별로. (`§19-7`)
23. **Schema.org Review/Rating** — Google Places 리뷰를 시술/병원 LD 에 attach. (`§22-8`)
24. **백업/복구 SOP** — PITR 검증, dump 자동화, 복구 리허설. (`§19-7`)
25. **rate limit on /api/admin/upload/presign** — 토큰 throttle. (`§21-8`)
26. **device 페이지에서 스캔 deep-link** — `/device/ulthera` 에서 "Ulthera 로 매칭받기" → ScanModal prefs.devicePrefSlugs 자동 채움. (`§26-8`)

---

*§23 갱신: 2026-05-16 (§27 작업 반영). 우선순위는 변경될 수 있으니 새 결정마다 이 섹션 동기화.*

---

## 24. 2026-05-13 — Admin 한국어화 + 필드 설명 풀세트

사용자 발화: "각 필드 설명도 다 추가해줘 admin페이지에. 이게 뭘 의미하는건지말야. 그리고 필드값 그대로 넣지말고 비개발자를 위해서 설명을 좀 쳐 넣어봐;; admin페이지는 한국인만 쓸거임. 설명 친화적으로 싹 만들어"

### 24-1. 룰

| 룰 | 적용 |
|---|---|
| **Admin = 한국어 전용** | 사이트 본 화면은 EN/中 multilingual, admin 만 한국어. 운영자(Min) + 한국 운영팀 baseline. |
| **필드 raw 이름 노출 금지** | `contract_status` ❌ → "계약 상태" ⭕. `slug` ❌ → "URL 식별자" ⭕. raw 영문은 회색 작은 hint 로만. |
| **모든 필드에 friendly help** | `help_ko` 한 줄로 "이게 뭐고 / 언제 쓰고 / 예시" 안내. 비개발자가 1분만 봐도 이해되게. |
| **그룹 이름도 한국어** | "Identity" → "기본 정보". "Photos" → "사진". "Languages & care" → "언어 / 외국 환자 응대". |
| **사이드바·버튼·플래시 메시지** 전부 한국어 | "Sign out" → "로그아웃". "+ New" → "+ 새로 만들기". "Saved." → "저장됨." |
| **enum 값 자체는 영문 유지** | DB 와 매칭. 단 select 옵션 표기는 "active (운영중)" 처럼 한글 보조. |

### 24-2. 산출물 (이번 작업)

| 파일 | 변경 |
|---|---|
| `client/src/admin/specs.js` | 모든 컬럼에 `label`, `help` 추가 + `group` 한국어 + `KINDS` 한국어 + enum option `label` 추가 |
| `client/src/admin/AdminEdit.jsx` | 라벨 렌더링 → `col.label || col.name`, help → 회색 한 줄 hint |
| `client/src/admin/AdminLayout.jsx` | 사이드바 메뉴 + 로그아웃 한국어 |
| `client/src/admin/AdminDashboard.jsx` | 카드 라벨 + "S3 연결됨" 등 한국어 |
| `client/src/admin/AdminList.jsx` | "+ 새로 만들기", "Prev/Next" → "이전/다음", 검색 placeholder 한국어 |
| `client/src/admin/AdminEdit.jsx` | "저장 / 취소 / 저장됨" 등 한국어 |
| `client/src/admin/AdminPartners.jsx` | "Approve → import to DB" → "승인 → DB에 등록" 등 |
| `client/src/admin/AdminLogin.jsx` | "관리자 키 입력" 등 |
| `client/src/admin/FkPicker.jsx` | placeholder 한국어 |
| `client/src/admin/ImageUploader.jsx` / `ImageGalleryEditor.jsx` | "드롭 또는 클릭" 등 |

### 24-3. 필드 설명 패턴 (예시)

```js
// before:
{ name: 'slug', type: 'text', required: true, group: 'Identity' }

// after:
{
  name: 'slug',
  label: 'URL 식별자',
  help: 'URL · 사진 폴더 · 매칭에 쓰이는 짧은 영문 키. 예: hifu_face. 한 번 정하면 절대 바꾸지 마세요 (외부 링크가 깨집니다).',
  type: 'text',
  required: true,
  group: '기본 정보',
}
```

### 24-4. 다음 작업 (이번 작업 끝난 뒤)

- [ ] 운영자에게 자주 헷갈리는 필드는 별도 **모달 가이드** ("?" 아이콘 클릭 → 자세한 설명 + 스크린샷)
- [ ] enum select 옵션도 그룹화 (예: `intensity` 의 subtle/moderate/dramatic → "자연 / 보통 / 강조" 식 한글 표시)
- [ ] 모델 단위 페이지 상단에 **이 모델은 무엇인가** 안내 박스 (Hospital = "병원 지점 1개 = 1행. 같은 브랜드의 다른 지점은 별도 행으로.")
- [ ] 운영 매뉴얼 페이지 `/admin/help` — 시술 추가하는 법, 병원 추가하는 법, B&A 올리는 법 (3분 가이드)

---

### 24-5. 모델 통합 (사용자 추가 지시)

> "브랜드랑 병원지점 왜 분리해놓은거야 존나복잡하게" → "걍 합쳐"
> "병원 x 시술 가격표는 걍 병원에다가 넣어놓는게 좋을거같은데 합쳐서"

DB schema 는 그대로 유지 (체인 처리 / 가격 변형 / 데이터 정규화 가치), **운영자 시야에서만** 합침:

| 변경 | 결과 |
|---|---|
| 사이드바에서 **brands 메뉴 제거** | 운영자 시야에서 사라짐. 라우트는 살아있어 어드밴스드 진입 가능. |
| **hospitals 편집 폼 안에 "브랜드 정보" 그룹** 추가 | `brand_name_ko/en/logo_url/founding_doctor/specialization_depth/is_chain/website_url` 합성 필드를 hospital 폼에 노출 |
| **백엔드 자동 brand upsert** | `server/routes/admin.js` 의 `upsertBrandFromHospitalPayload()` — hospital create/update 시 brand_* 필드 추출 → brand 자동 upsert → `brand_id` 자동 연결 |
| 사이드바에서 **hospital_procedures 메뉴 제거** | 운영자는 병원 편집 페이지 안에서 \"이 병원이 제공하는 시술\" 패널로 관리 |
| `HospitalOfferingsPanel` 신설 | 병원 ID 가 있는 경우 (=기존 hospital 편집) 폼 하단에 자동 마운트. 시술 추가 inline 폼 (시술/가격/장비/시그너처/공개) + 행별 삭제 + \"자세히\" 링크로 풀 편집 페이지 |
| 백엔드 `adminList` 에 **FK 필터 옵션** 추가 | `?hospital_id=X` 같은 query 로 그 병원의 hospital_procedures 만 가져오기. 화이트리스트된 컬럼만 허용. |

### 24-6. UI 전체 정리 (사용자 추가 지시)

> "CRUD편하게하도록, 시각적으로 분리시킬거 분리시키고 같은 테이블 단인건 모아놓고 UI전체적으로 다 바꿔주고, 설명하는 부분은 ? 표시에다가 하도록"

| 변경 | 결과 |
|---|---|
| **help → 라벨 옆 `?` 아이콘** | 라벨 아래 회색 한 줄로 깔리던 help 가 시각 노이즈 → 라벨 옆 작은 원형 `?` 로 압축. hover/focus 시 다크 툴팁 (꼬리 화살표) 등장. 폼이 깔끔. |
| **section 카드 시각 분리 강화** | `.gs-admin-formsec` 에 둥근 모서리 10px + 작은 그림자 + 헤딩 하단 경계선. 그룹 간 여백 18px. |
| **listIntro 안내 박스** | 각 list 페이지 상단에 노란빛 안내 박스 (이 모델이 무엇인지 한 줄). 새 모델 진입 시 운영자 학습 비용 0. |
| **이미지 URL input 숨김** | `<details>` 안에 접어둠 — 운영자가 URL 을 손으로 칠 일은 없음. 시각 노이즈 제거. |
| **inline 시술 추가 폼** | 모달 없이 패널 안에서 인라인으로 5필드만 (시술/가격/장비/시그너처/공개). 빠른 등록. |
| **컬럼 라벨 한국어** | List 페이지의 테이블 헤더가 `slug` → `URL 식별자`, `contract_status` → `계약 상태` 식. specs.cols 의 label 을 자동 매핑 + fallback. |

### 24-7. 최종 사이드바 (운영자 시야)

```
대시보드
파트너 신청서
─ 카탈로그 관리 ─
병원                    ← brand + branch + hospital_procedures 통합
시술                    ← procedures
카테고리                ← procedure_categories
고민 (검색 키워드)       ← concerns
의사                    ← doctors (병원 편집 안에서도 inline 가능, 차후)
B&A (전후사진)           ← ba_photos
실시간 피드             ← public_feed_entries
고민↔시술 매트릭스      ← concern_procedures
```

이전 10개 → 9개. brands / hospital_procedures 가 hospitals 안으로 흡수.

---

### 24-8. 그룹뷰 + Append 패턴 (사용자 추가 지시)

> "고민 시술 매트릭스도.. 고민 끼리 묶고 거기에다가 시술이랑 관련도를 append하는 식으로 하면 좋잖아"
> "이런거랑 비슷한거 있나 살펴보고 append 이후 crud쉽게 다른 필드들도 다 바꿔봐"

| 변경 | 결과 |
|---|---|
| `ConcernMatrixPage.jsx` 신설 | `/admin/concern_procedures` 진입 시 일반 list 대신 **고민별 그룹뷰**. 각 고민 카드 = 헤더 (이름·body_area·매핑 수) + 시술 리스트 + "+ 시술 추가" 인라인 폼. relevance select 가 행마다 즉시 변경. |
| `HospitalDoctorsPanel.jsx` 신설 | 병원 편집 페이지 안에 의사 inline 목록. 행 1줄 = portrait 클릭 업로드 + 이름·직책·경력 + "대표 토글 / 자세히 / 삭제". 추가는 4필드 인라인 폼. |
| `HospitalBAPhotosPanel.jsx` 신설 | 병원 편집 페이지 안에 B&A 카드 그리드. 새 추가는 before/after 두 박스 + 환자 메타 + **서면 동의 강제 체크**. 카드 옆 visibility select 즉시 변경. |
| AdminList 의 FK 컬럼 라벨 매핑 | `concern_id` → `고민`, `procedure_id` → `시술` 식으로 헤더 한국어. `cols` 의 label 우선 + fallback 사전. |

### 24-9. 패턴 정리 (재사용)

| 케이스 | 진입점 | 그룹 기준 | 자식 |
|---|---|---|---|
| 병원 ↔ 시술 가격표 | `/admin/hospitals/:id` 안 | 병원 | hospital_procedures rows |
| 병원 ↔ 의사 | 동일 | 병원 | doctors rows |
| 병원 ↔ B&A | 동일 | 병원 | ba_photos cards |
| **고민 ↔ 시술** | `/admin/concern_procedures` | 고민 | concern_procedures rows |

**공통 UX 룰**:
- 자식 추가는 **모달 X · 인라인 폼**. 핵심 3~5 필드만. 자세히 = 기존 풀 편집 페이지로 링크.
- 자식 행 옆 **인라인 액션** (visibility/relevance/featured 토글, 삭제).
- 부모 카드 헤더에 자식 카운트 (예: "이 병원 소속 의사 (3명)").

### 24-10. CSS 추가

| 클래스 | 용도 |
|---|---|
| `.gs-cm-card / .gs-cm-row / .gs-cm-row-actions` | 고민 매트릭스 그룹뷰 |
| `.gs-dr-list / .gs-dr-row / .gs-dr-portrait` | 의사 inline 행 + 사진 |
| `.gs-ba-grid / .gs-ba-card / .gs-ba-pair / .gs-ba-uploadbox / .gs-ba-consent` | B&A 그리드 + 신규 추가 폼 |

---

*§24 갱신: 2026-05-13. 룰 핵심: **Admin = 한국어 전용 + ? 툴팁 + 부모↔자식 그룹뷰 + 인라인 append**. 모달 없이 한 화면에서 끝.*

---

## 25. 운영 매뉴얼 — 처음부터 DB 시드하는 순서

> 사용자 발화: "자 그러면 아예 첨부터 모든거 싹 지우고 시작한다고 가정하고 어떤 순서대로 db에 넣으면되려나? 구체적으로 말해"
> 이 섹션은 **운영팀이 새 환경에서 부트스트랩**할 때 참고하는 SOP. 엑셀로도 동시 배포 — `docs/data_seeding_order.xlsx`.

### 25-0. 의존성 그래프 (FK 기준)

```
mechanisms (lookup)        ← 의존성 없음. migrate 자동 시드.
procedure_categories (8)   ← 의존성 없음. migrate 자동 시드.
concerns                   ← 의존성 없음. 운영자 수기.
brands                     ← 의존성 없음. hospitals 저장 시 자동 upsert.
procedures                 ← procedure_categories(category_id)
hospitals                  ← brands(brand_id) [자동]
concern_procedures         ← concerns + procedures
doctors                    ← hospitals
hospital_procedures        ← hospitals + procedures
ba_photos                  ← hospitals (+ procedures, doctors 옵션)
public_feed_entries        ← procedures, concerns (옵션) — 실 환자 + 운영자 시드
users / match_requests / inquiries / quotes / trips / consultations / post_op_checkins  ← 운영 자동
```

### 25-1. Phase 0 — 인프라

```
1.  AWS RDS MySQL 인스턴스 생성 (서울 ap-northeast-2, MySQL 8.x)
2.  Security Group inbound: 3306 / 0.0.0.0/0  (dev 만)
3.  server/.env 채움 — DB_HOST · DB_PASSWORD · ADMIN_KEY · AWS_* · OPENAI_API_KEY · GOOGLE_PLACES_API_KEY
4.  node scripts/db-ping.js                     # 연결 확인
5.  npm run db:migrate                          # 스키마 + lookup 시드 (mechanisms 30, categories 8)
6.  npm run db:extend                           # doctors / ba_photos 테이블 + 추가 컬럼
7.  npm run dev  (server)                       # 부팅 로그 + /api/health  db.ok=true
8.  /admin/login                                # ADMIN_KEY 입력. counts 전부 0.
```

### 25-2. Phase 1 — 카탈로그 토대 (순서 절대 어기지 마세요)

| 순서 | 메뉴 | 양 | 시간 | 주의 |
|---|---|---|---|---|
| **1** | `/admin/concerns` | 20~30 | 30분 | 외국 환자 키워드. slug + name_ko/en + body_area 필수. |
| **2** | `/admin/procedure_categories` | 8 (행은 시드됨) | 15분 | thumbnail_url + hero_image_url 만 업로드. |
| **3** | `/admin/procedures` | 30~50 | 2시간 | category_id · mechanism · domain · body_area 필수. 인기 10개 먼저. |
| **4** | `/admin/concern_procedures` | 90~150 매핑 | 1~2시간 | 매트릭스 그룹뷰. 한 고민당 2~3개 시술. **매칭 품질의 핵심.** |

### 25-3. Phase 2 — 병원 (한 화면에 다)

각 병원당 약 30분 × 22개 = 약 10시간.

| 순서 | 위치 | 작업 |
|---|---|---|
| **5** | `/admin/hospitals` → "+ 새로 만들기" | 기본 정보 (slug · 간판명 · 주소 · 연락처) + 브랜드 정보 그룹 (이름·로고 — 자동 brand 생성) + 언어/응대 + 사진 + **contract_status = active** ← ⚠ 필수 |
| **6** | (저장 후 같은 화면) 의사 패널 | "+ 의사 추가" → 이름·직책·경력. portrait 클릭 업로드. 대표 의사 토글. |
| **7** | (같은 화면) 시술 가격표 패널 | "+ 시술 추가" → 시술 선택 + 시작 가격 + 장비. 10~30개. |
| **8** | (같은 화면) B&A 패널 | "+ B&A 추가" → before/after 2장. ⚠ 환자 서면 동의 체크 필수. |

### 25-4. Phase 3 — 메인 페이지 활성화

| 순서 | 위치 | 작업 |
|---|---|---|
| **9** | `/admin/public_feed_entries` | 운영자 시드 5~10건 (메인 ticker 부트스트랩). `is_seed=true`. |
| **10** | `client/public/` | `og-cover.jpg` (1200×630) + `favicon.svg` + `apple-touch-icon.png` 드롭. |

### 25-5. Phase 4 — 운영 시작 (자동)

| 모델 | 누가 생성 |
|---|---|
| `users` | 환자 로그인 (현재 미구현 — 익명 가능) |
| `match_requests` | 스캔 완료 시 자동 (`POST /api/match-requests`) |
| `public_feed_entries` (실 환자) | 옵트인 시 자동 append |
| `inquiries` / `quotes` | WhatsApp 핸드오프 후 운영자 수기 (Phase 2 작업) |
| 신규 `brands` / `hospitals` (외부 신청) | `/admin/partners` → 승인 → 자동 INSERT (`contract_status=pending` — 운영자가 `active` 로 변경 필요) |

### 25-6. 자주 빠뜨리는 함정 (관통하는 룰)

1. **순서 절대 어기지 마세요** — concerns/procedures/hospitals 가 후속 작업의 전제.
2. **slug 는 한 번 정하면 변경 X** — URL · S3 폴더 · 외부 링크 모두 깨짐.
3. **병원 `contract_status = 'active'` 확인** — active 아니면 사이트·매칭 모두 미노출. **함정 1순위.**
4. **B&A 환자 서면 동의 없이 절대 X** — PIPA 위반.
5. **사진은 권장이지만 최소 thumbnail 은** — 비어있으면 카드 회색 박스.
6. **파트너 승인 후 `pending` → `active`** — 자동 등록은 항상 pending 으로 들어옴.
7. **매트릭스는 운영 품질의 80%** — 매칭 결과의 핵심. 수기 큐레이션 정성 들이세요.

### 25-7. 전체 소요 시간 추정

| Phase | 시간 |
|---|---|
| Phase 0 (인프라) | 30분 |
| Phase 1 (카탈로그) | 4시간 |
| Phase 2 (병원 22곳) | 10시간 |
| Phase 3 (메인 활성화) | 30분 |
| **합계** | **약 15시간** |

병원 측 사진·B&A 받는 시간 별도. 외주 분배 가능 (병원당 30분 작업이 22 인스턴스 병렬).

### 25-8. 산출물

| 파일 | 용도 |
|---|---|
| `CLAUDE.md §25` | 본 SOP (개발팀 참조) |
| `docs/data_seeding_order.xlsx` | 운영팀 배포용 4시트:<br>① 단계별 순서 · ② 테이블 의존성 · ③ 필수 입력 필드 · ④ 핵심 룰 |
| `scripts/export_seeding_order.cjs` | xlsx 재생성 스크립트 |

---

*§25 갱신: 2026-05-13. 운영 매뉴얼 — 처음부터 DB 시드하는 순서. 새 환경 부트스트랩 시 이 섹션만 따라가면 됨.*

---

## 26. 2026-05-15 ~ 16 — 기기(devices) 정식 테이블화 + 매트릭스 + 매칭 가중치

§16 의 `client/src/data/devices.js` 인메모리 stub 을 RDS 정규 테이블로 승격. "메커니즘 ↔ 기기 ↔ 시술" 3축이 모두 DB-가시 상태가 됨. 운영자가 기기를 admin 으로 CRUD + 시술↔기기 매트릭스를 직접 큐레이션. 환자가 PreferenceForm 에서 선호 기기 선택 시 매칭 점수에 soft boost.

### 26-1. 사용자 발화 (의사결정 anchor)

> "우리근데 기기 별로도 또 나누자고하지않았어? 시술이랑 기기 둘 다? 지금 db테이블은 기기 없지"
> "메카니즘이랑 기기랑 시술이 뭐가달라?"
> "기기도 db로관리해서 매트릭스로 합치게 하자"
> "싹다 ㄱ"
> "마이그레이션도 다된거야? 그리고 디바이스 가중치도 넣고. 클라쪽도 하고"

→ 결정 일괄:
- `devices` 테이블 신설 (mechanism 1개를 FK 로 참조, 1:N).
- `procedure_devices` 조인 테이블 신설 (시술↔기기 M:N, relevance 컬럼 보유).
- `hospital_procedures.device_brands` JSON 은 Phase 1 단순화로 유지 (병원이 *실제* 그 시술에 쓰는 장비 — 매칭 fuzzy 매치).
- 매칭 로직에 device preference soft boost (concern 보다 약함, signature 와 비슷한 weight).
- PreferenceForm 에 device chip multi-select 추가, WhatsApp 핸드오프 메시지에도 한 줄 반영.

### 26-2. 결정 — 메커니즘 / 기기 / 시술 관계 정리

| 관계 | 카디널리티 | 어떻게 풀었나 | FK 강제 | DB 객체 |
|---|---|---|---|---|
| 메커니즘 → 기기 | **1 : N** | FK 컬럼 | DB | `devices.mechanism_slug` → `mechanisms.slug`, ON DELETE SET NULL |
| 메커니즘 ↔ 시술 | **M : N** (보통 1~2) | JSON 배열 | app | `procedures.mechanism` JSON |
| 시술 ↔ 기기 | **M : N** (의미 풍부) | 조인 테이블 | DB | `procedure_devices` (composite PK + relevance) |
| 병원 ↔ 시술 | **M : N** (의미 풍부) | 조인 테이블 | DB | `hospital_procedures` |
| (병원 × 시술) ↔ 기기 | **3-way M:N** | JSON (Phase 1 단순화) | app | `hospital_procedures.device_brands` |

휴리스틱 정리 (다음 결정용):
- **1:N + 자식에서 lookup** → FK 컬럼
- **M:N + 보통 작은 배열 + 쌍에 부가 속성 없음** → JSON 배열
- **M:N + 쌍마다 의미 있음 (관련도·노트·순서)** → 조인 테이블
- **lookup 테이블이 잘 안 바뀜** → PK 를 slug 로 (URL 안정성)

자세한 비교/예시: `docs/db_relationships.xlsx` 6시트 (📘 핵심 / 1. 세 개의 차이 / 2. HIFU 케이스 / 3. 카디널리티 + FK / 4. 환자 흐름 / 5. 결정 휴리스틱).

### 26-3. 산출물 — 파일 트리

```
db/
├── schema.extend.mysql.sql           ← + devices, procedure_devices 테이블
                                         (FK · UNIQUE · CHECK · 인덱스 포함)

server/
├── db/models.js                      ← + Device, ProcedureDevice 모델 + associations
│                                       (Mechanism.hasMany(Device), Procedure↔Device m2m)
├── routes/catalog.js                 ← + devicesHandler, deviceDetailHandler
│                                         + bootstrap 응답에 devices, procedure_devices 포함
├── routes/admin.js                   ← + devices, procedure_devices, mechanisms MODELS
│                                         + composite PK 처리 (parseCompositeId, findRowByAnyPk)
│                                         + adminStats 카운트 확장
├── scripts/seed-from-mock.js         ← + importDevices, importProcedureDevices
│                                         + mechanism slug alias (cryolipo→cryolipolysis 등)
└── index.js                          ← + /api/catalog/devices, /api/catalog/devices/:slug

client/src/
├── data/devices.js                   ← deprecated. seed source 로만 보존.
│                                         runtime 은 db.devices (bootstrap hydrate).
├── data/db.js                        ← + devices, procedureDevices 컬렉션 + 인덱스
│                                         + enrichDevices (legacy alias: image/blurb/name/brands)
│                                         + offeringsForDevice / proceduresForDevice / devicesForProcedure
│                                         + deviceMatchesOffering (loose substring 매치)
├── admin/specs.js                    ← + devices, procedure_devices, mechanisms spec
│                                         + KINDS 사이드바 2개 추가
├── admin/ProcedureDeviceMatrixPage.jsx ← 신설. 시술별 그룹뷰 + 인라인 기기 추가
│                                         (ConcernMatrixPage 와 동일 패턴)
├── admin/FkPicker.jsx                ← + refField / refLabel 옵션 (string PK 지원)
├── admin/AdminApp.jsx                ← + ProcedureDeviceMatrixPage 라우팅
├── components/PreferenceForm.jsx     ← + "Preferred device" chip multi-select 섹션
│                                         (badge 순 정렬: iconic → k-favorite → premium)
├── utils/matching.js                 ← + devicePrefSlugs 받음
│                                         + hpUsesDevice 헬퍼
│                                         + procDevicePref 인덱스 (procedure→max relevance)
│                                         + soft boost: hp 실 매칭 +18 / matrix primary +9 / alt +5
├── utils/caseMessage.js              ← + devicePref 라벨 (EN/ZH)
│                                         + buildEntryFromLive 에 devices 인자 추가
└── pages/ResultsPage.jsx             ← buildLiveCase 가 db.devices 도 전달

scripts/
└── export_relationships.cjs          ← 신설. docs/db_relationships.xlsx 생성기

docs/
└── db_relationships.xlsx             ← 신설. 6시트 (위 설명).
```

### 26-4. RDS 마이그레이션 — 완료

```
npm run db:extend                                  # devices + procedure_devices 테이블 생성
npm run db:seed-from-mock -- --only=devices,procedure_devices
```

`devices` (Ulthera·Shurink·Thermage·InMode 등) + `procedure_devices` 매트릭스 시드 완료. `/api/catalog/bootstrap` 응답에 두 컬렉션 정상 노출, `/api/catalog/devices/:slug` detail endpoint 동작. (현재 row 수는 §8-2 라이브 DB 참조.)

### 26-5. 매칭 가중치 — `utils/matching.js`

`prefs.devicePrefSlugs: ['ulthera', 'shurink']` 입력 시 (soft boost — hard filter X):

| 시그널 | 점수 | 메시지 |
|---|---|---|
| hp.device_brands 가 선호 기기를 실제로 명시 | **+18** | `uses your preferred Ulthera` |
| procedure ↔ device 매트릭스 primary | +9 | `procedure is a canonical fit for your preferred device` |
| procedure ↔ device 매트릭스 alternative | +5 | `procedure is compatible with your preferred device` |

비교 weight: concern primary 50, signature 10, 할인 ×25, 언어 매치 8, intl coord 3.

→ 디바이스 가중치 = concern 보다 약함 (개념의 우선순위 보존) + signature 와 비슷한 양 (환자 의지 존중). 매치 결과 객체에 `deviceMatched: { slug, name_en, name_ko }` 도 같이 옴 → UI 에서 "uses your Ulthera" 골드 알약 노출 등 가능.

### 26-6. Admin UX — `procedure_devices` 매트릭스

`/admin/procedure_devices` 진입 시 일반 list 대신 `ProcedureDeviceMatrixPage` 그룹뷰:

- 시술 카드별 (헤더: 시술명 + slug + 기기 N개)
- 카드 안에 매핑된 기기 리스트 (relevance 알약: 대표 / 대체 / 호환)
- "+ 기기 추가" 인라인 폼 (FkPicker + relevance select + 비고)
- 행별 인라인 변경: relevance select 즉시 변경 / 삭제 버튼 / "자세히" → 풀 편집

`ConcernMatrixPage` 와 동일한 부모↔자식 그룹뷰 패턴 (§24-8).

### 26-7. 결정 추가 / 결정 로그

| 결정 | 한 줄 이유 |
|---|---|
| **메커니즘 PK 는 slug** | URL 안정 + SQL 가독성. 잘 안 바뀜. |
| **devices 는 id+slug 이중** | URL 친화(slug) + 조인 효율(int id). procedure_devices 는 id 로 조인. |
| **procedure_devices 의 PK = composite (procedure_id, device_id)** | 자체 행 의미가 페어임. id 자동증가 PK 보다 명확. |
| **procedure_devices.relevance ENUM = primary/alternative/compatible** | concern_procedures 의 primary/secondary/adjunct 와 다른 단어 선택: 시술 관점에서 "이 시술의 *대표* 장비" 라는 어감이 더 자연. |
| **hospital_procedures.device_brands 는 JSON 유지** | Phase 1. "이 병원이 *그 시술* 에 *어떤 장비* 쓰는지" 는 그 hp 행에서만 쓰임 → 정규화 비용 > 효익. Phase 2 hospital_procedure_devices 정규화 후보. |
| **mechanism_slug FK ON DELETE SET NULL** | mechanism 지울 일 거의 없지만, 지워져도 devices 행 살아남게. CASCADE 는 과함. |
| **procedure_devices FK ON DELETE CASCADE** | 시술/기기 지우면 매핑은 의미 없음 → 자동 삭제. |
| **devices.mechanism_slug 는 1개만 (배열 X)** | 기기는 보통 1개 기전. InMode 처럼 RF+EM 멀티 기전이면 mechanism_slug='rf' + description 에 명시. (또는 tags 활용) |
| **PreferenceForm 의 device chip 은 옵션** | "비워둘 수 있음" 명시. 디바이스 인지가 낮은 환자 차단 X. |
| **devicePrefSlugs 는 hard filter 아닌 soft boost** | 환자가 Ulthera 선택했다고 Shurink 결과 컷하면 매칭 다양성 망가짐. 가중치만. |
| **caseMessage 의 라벨만 i18n** | 환자 voice (원어) 보존. 디바이스 라벨은 `Ulthera (울쎄라)` 식 페어로. |
| **devices.js 인메모리 stub 은 seed source 로만 보존** | runtime 은 RDS 가 진실. 백워드 호환 위해 빈 export 가 아니라 historic data 유지 (재시드 가능). |
| **FkPicker 가 refField 옵션** | mechanisms 처럼 PK = slug 인 lookup 도 FK 콤보로 선택 가능하게. |
| **composite PK admin 처리** | `/admin/procedure_devices/{procedure_id}-{device_id}` URL 패턴. parseCompositeId + findRowByAnyPk 헬퍼. concern_procedures 도 같이 정상화 (이전엔 findByPk 가 silently 실패하던 가능성). |

### 26-8. 알려진 한계 / Phase 2 후보

- [ ] **hp 의 device 정규화** — 현재 `hospital_procedures.device_brands` JSON → 향후 `hospital_procedure_devices` 조인 테이블. "Ulthera 쓰는 병원 모두" 같은 hot path 발생 시.
- [ ] **device 페이지 SEO** — 현재 `<title>` 만 동적. JSON-LD 의 MedicalDevice schema 적용 여지.
- [ ] **device-procedure 매트릭스 더 풍부하게** — 현재 11 매핑 (각 device 의 primary 만). procedures.device_examples JSON 으로 alternative 자동 매핑은 try 했지만 데이터가 빈약. 운영자가 admin 에서 채워야.
- [ ] **multi-mechanism device** — InMode 처럼 RF+EM 복합 기기는 현재 mechanism_slug 한 개만. JSON 배열로 갈지 결정 필요 (현 schema 는 device 1개 = mechanism 1개 가정).
- [ ] **device 페이지 → 매칭 결과 페이지로의 deep-link** — `/device/ulthera` 카드에서 "Ulthera 로 매칭받기" 누르면 prefs 에 devicePrefSlugs 자동 채워서 스캔 모달.
- [ ] **UI 매치 알약** — `deviceMatched` 필드 클라가 받지만 ResultsPage 카드에 아직 시각화 안 됨. 골드 작은 알약 추가 후보.

### 26-9. 운영자 매뉴얼 — 기기 데이터 채우기 (§25 의 새 Phase)

§25 의 Phase 1 (카탈로그 토대) 에 다음 단계 추가:

| 순서 | 메뉴 | 양 | 시간 |
|---|---|---|---|
| 3.5 | `/admin/devices` | 20~30 | 2~3시간. 메커니즘 선택 + 이미지 업로드. |
| 4.5 | `/admin/procedure_devices` | 시술 30개 × 평균 2 = 60+ 매핑 | 1~2시간. 매트릭스 그룹뷰에서 시술 카드별 + 기기 추가. |

도움 자료:
- `docs/seed_examples.xlsx` 시트 6 (기기 20개 예시) + 시트 7 (시술↔기기 매트릭스 26개 예시)
- `docs/db_relationships.xlsx` — 신규 운영자 학습용

### 26-10. 비용 / 성능 영향

- DB 행 증가: `devices` 11 + `procedure_devices` 11 (현재 시드). 운영 진입 시 30+60 예상. 영향 미미.
- Bootstrap 응답 크기 증가: +~5KB (devices + procedure_devices). 캐시 안 됨 (`Cache-Control: no-store`) — 매 부팅마다 fetch.
- 매칭 로직: 기존 `O(n_hp)` 에 device 비교 inner loop 추가 → `O(n_hp × n_prefDevices)`. devicePrefSlugs 보통 ≤2 → 사실상 영향 없음.
- 클라이언트 bundle: +2.5KB (gzipped) (`utils/matching.js` device 로직 + PreferenceForm chips).

---

*§26 갱신: 2026-05-16 (devices/procedure_devices 정식 테이블화 + 매칭 가중치 + 클라이언트 UI). 새 결정 시 §26-7 결정 로그에 한 줄, 사용자 인용은 §26-1 에.*

---

## 27. 2026-05-16 (이어서) — 고민↔카테고리 + Admin 섹션화 + 피드 mock 박멸

§26 이후 같은 날 이어진 세 가지 작업. 모두 **데이터 단위 정리 + admin UX + 클라 진실성**의 결.

### 27-1. 사용자 발화 (의사결정 anchor)

> "아니그럼 고민이랑 시술이랑 엮을게 아니라 고민이랑 메커니즘이랑 엮는게맞는거아닌가?"
> "오 너말이 맞네 시술이랑 엮는 게 맞네 ㅋㅋ 근데 고민도 카테고리별로 묶는게 어떨까? 그래야 좀 더 편하지않으려나"
> "ㅇㅇ A옵션 같이 가는 게 좋은거같은데?"
> "admin페이지가 되게 중요하걸랑? 마스터 테이블이랑 맵핑 테이블 나눠줘. 논리적 단위 같은거끼리 묶고"
> "하위 카테고리는 아코디언으로 세로로 덜어지게해줘"
> "아니글고 실시간 피드 이거는 등록한거 없는데 어케 클라측에나오는거임? 실제값으로만 할거라니까 클라 이제부터"

→ 결정 일괄:
- **concern_procedures 매핑은 유지** (메커니즘 매핑이 아닌). 이유: §27-2 의 함정 케이스.
- **concerns 에 category_id FK 추가** — procedure_categories 8개를 *공유* (별도 concern_groups 안 만듦).
- **Admin 사이드바를 4섹션 + 아코디언** — 카탈로그(마스터) / 매트릭스(조인) / 병원·인력 / 콘텐츠.
- **publicFeed.js 의 hardcoded seed 더 이상 클라 런타임에 로드 X** — DB-empty → 홈 섹션 자동 숨김.

### 27-2. "concern 은 mechanism 이 아니라 procedure 와 엮어야" — 결론 정리

사용자가 효율성 관점으로 메커니즘 매핑을 제안 → 함정 케이스가 너무 많아 procedure 매핑이 정답.

**메커니즘 매핑이 깨지는 케이스 (우리 실데이터)**:

| 메커니즘 | 시술 A | A의 concern | 시술 B | B의 concern |
|---|---|---|---|---|
| `botox` | 사각턱 보톡스 | `face_size` | 주름 보톡스 | `wrinkles` |
| `filler_ha` | 볼 필러 | `volume_loss` | 입술 필러 | `lip_shape` |
| `surgery` | 쌍커풀 | `eye_shape` | 모발 이식 | `hair_loss` |
| `skinbooster` | 리쥬란 (PN) | `pores`·`acne_scars` | 쥬베룩 (PDLA) | `aging_overall` |

→ 같은 메커니즘이 *완전히 다른 concern* 에 쓰임. 메커니즘 단위 매핑은 잘못된 추천 양산.

**시술 단위 매핑이 맞는 이유**:
- 시술 = 부위 + 강도 + 기법의 *조합* (concern 과 같은 grain)
- `concern_procedures.rationale_ko` 가 시술-구체적 ("SMAS 직접 자극..." 은 `hifu_face` 에만)
- 환자가 예약하는 단위가 시술 (메커니즘 X)
- 가격 필터(budgetMax) 도 hospital_procedures 기준

**대안 (해결책 B, 미구현)**: 운영자가 새 시술 추가할 때 같은 mechanism 의 다른 시술 concern 매핑을 자동 보여주고 "복사" 원클릭. 별도 테이블 안 만들고 admin UI 만 똑똑하게. → 운영 6개월 후 매핑 누락이 큰 문제로 드러나면 그때.

### 27-3. concerns.category_id — procedure_categories 공유

| 결정 | 내용 |
|---|---|
| **스키마** | `ALTER TABLE concerns ADD COLUMN category_id INT, ADD FK → procedure_categories(id) ON DELETE SET NULL, ADD INDEX` (3개 statement, idempotent) |
| **카테고리 분류축** | `procedure_categories` 8개 *재사용* (Face/Eyes/Nose/Body/Skin/Hair/Wellness/Dental). 별도 concern_groups 테이블 안 만듦. 운영자가 학습할 분류 1개로 통일. |
| **body_area 유지** | category 보다 거친 분류 (face/skin/body/hair/dental 5개). 통계/대시보드용 보조. |
| **매핑 (20 concerns)** | sagging/wrinkles/volume_loss/jawline/face_size/cheekbones/lip_shape/aging_overall → **face** · pores/skin_tone/pigmentation/acne_scars/acne_active → **skin** · dark_circles/eye_shape → **eyes** ⚠ (이전 body_area="face") · nose_shape → **nose** ⚠ · body_contour/fat_local → **body** · hair_loss → **hair** · dental_align → **dental** |

→ 7개 카테고리 사용 (Wellness 만 비어있음 — 우리 concerns 에 wellness 관련 없음).

**효과**:
- ConcernMatrixPage 가 **카테고리별 collapsible 그룹뷰** ("얼굴 — 고민 8개 · 매핑 14건" 헤더, 클릭 시 접힘)
- PreferenceForm 의 concern chip 이 **카테고리 sub-header 로 그룹** (`Face · 얼굴`, `Skin · 피부`, ...) — flat 20 chip → 그룹화로 ux 정돈

**매칭 영향**: 0. category_id 는 UI/큐레이션 보조 메타. `utils/matching.js` 는 안 봄. concern_procedures 가 매칭 source of truth 그대로.

### 27-4. Admin 사이드바 4섹션 + 아코디언

**Before**: 10개 메뉴가 한 줄로 flat 나열. 운영자가 "이건 마스터인지 매핑인지" 인지 부담.

**After**:

```
대시보드
파트너 신청서
▾ 카탈로그 (마스터)        4    ← 시술 데이터의 본질
  카테고리 · 시술 · 기기 · 고민
▾ 매트릭스 (관계 매핑)     2    ← 매칭 품질이 여기서
  고민↔시술 · 시술↔기기
▾ 병원 · 인력              3    ← 외국 환자 신뢰 시그널
  병원 · 의사 · B&A
▾ 콘텐츠 (사용자 화면)     1    ← 운영자 직접 시드
  실시간 피드
로그아웃
```

| 구현 디테일 | 내용 |
|---|---|
| **`specs.js`** | `KINDS[i].section` 필드 추가 (`'catalog' / 'matrix' / 'clinic' / 'content'`) + `KIND_SECTIONS` 메타 배열 (key / label / hint) |
| **`AdminLayout.jsx`** | section 별 group 으로 렌더, caret + count badge. 클릭으로 토글. |
| **상태 영속** | `localStorage.gs_admin_nav_open` — 한 번 접어두면 다음 방문에도 그대로 |
| **자동 펼침** | 현재 보고 있는 kind 의 섹션은 강제 펼침 (`useEffect` 가 params.kind 감지). 닫힌 그룹의 메뉴로 navigate 해도 위치가 보임. |
| **AdminDashboard** | 같은 KIND_SECTIONS 구조로 카드 그룹 (`카탈로그 (마스터) — 시술 데이터의 본질` 헤더 + sub-hint) — 일관성 |
| **CSS** | `.gs-admin-nav-group / -sec / -sec-caret / -sec-count / -children` + `.gs-admin-statsec-*` |

**원칙**: 운영자가 "지금 내가 마스터 데이터를 보고 있는지, 관계 매핑을 보고 있는지" 가 매 화면에서 명확. 새 모델 추가 시 `section: 'catalog' | 'matrix' | 'clinic' | 'content'` 한 줄만 박으면 사이드바·대시보드 자동 반영.

### 27-5. 실시간 피드 mock 박멸

**문제**: `client/src/data/publicFeed.js` 가 `seed` 배열 10개를 *모듈 로드 시점* 에 `entries` 에 박아둠 → 홈에 진입하면 RDS 와 무관하게 가짜 entries 가 즉시 표시. `hydratePublicFeed()` 의 empty-fallback 이 "DB 가 0개 응답하면 seed 유지" 라 RDS 가 비어도 mock 계속 노출.

**수정**:

| 변경 | 결과 |
|---|---|
| `let entries = []` 로 초기화 | seed 더 이상 자동 로드 X |
| `seed` 배열 자체는 보존 (주석 명시) | server `seed-from-mock.js` 의 시드 input 으로만 사용 — 클라 런타임 미사용 |
| `hydratePublicFeed()` 의 empty fallback 제거 | DB 가 빈 응답 → 그냥 0개 표시 (mock 으로 돌아가지 않음). `_hydrated = true` 명시 |
| `addPublicFeedEntry` / `clearLocalFeed` 가 `entries` reference 유지 | `entries.unshift()` / `entries.splice()` 로 in-place mutation. exported `publicFeedEntries` 가 stale 안 됨. |
| **`RecentMatches.jsx`** 가 `entries.length === 0` 일 때 `return null` | 빈 그리드 + "Live · recently matched" 헤더만 남는 어색함 제거. 섹션 통째로 숨김. |
| `PublicFeedTicker.jsx` | 이미 empty 가드 존재. 그대로. |

**결과**: 현재 RDS public_feed_entries = 0 → 홈 페이지의 ticker + RecentMatches 섹션 자동 사라짐. 운영자가 `/admin/public_feed_entries` 에서 시드 추가하거나, 환자가 옵트인으로 스캔 완료 → match-requests 가 자동 entry 생성, 그때부터 노출.

**원칙 — "클라는 이제부터 실제값으로만"**:
- `client/src/data/*.js` 의 모든 mock 배열은 **seed-from-mock 의 input** 으로만 의미 있음.
- runtime 은 `db.hydrate()` (= `/api/catalog/bootstrap`) 또는 `hydratePublicFeed()` (= `/api/feed/recent`) 가 채움.
- DB 가 비어있으면 화면도 비어있음. mock fallback 금지.

### 27-6. 결정 로그 추가

| 결정 | 한 줄 이유 |
|---|---|
| **concern_procedures 유지** (concern_mechanisms 신설 X) | 같은 mechanism 이 다른 concern 에 걸치는 케이스 많음 (botox·filler·surgery). 정확도 우선. |
| **concerns.category_id 가 procedure_categories 공유** | 분류축 1개로 통일. 별도 concern_groups 의 학습 비용 회피. 95% concerns 가 1 카테고리에 깔끔 매핑. |
| **`body_area` 컬럼 유지** | category 가 더 정밀. body_area 는 통계용 보조. 미래에 의학적 분류가 필요해질 수 있음. |
| **dark_circles → Eyes** (body_area="face" 였음) | 의미적으로 Eyes 가 정확. 카테고리 도입 기회에 정정. |
| **사이드바 4섹션 + 아코디언** | 마스터/매트릭스 정신적 부담 줄임. 모델 늘어나도 (10 → 15) 그룹 안에서 정돈. |
| **localStorage 로 펼침 상태 영속** | sessionStorage 보다 운영자 친화 — 매번 같은 그룹 펼쳐두는 사람의 클릭 비용 0. |
| **활성 메뉴의 섹션 자동 펼침** | 닫힌 섹션 안의 메뉴로 navigate 후에도 위치 보이게. |
| **AdminDashboard 도 같은 4섹션 구조** | 사이드바와 대시보드의 정신적 모델 일치. |
| **publicFeed seed 클라 런타임 로드 X** | 가짜 데이터로 운영 환경 디버깅 어려움. seed 는 seed-from-mock input 으로만. |
| **DB-empty → 섹션 통째 숨김** | 빈 ticker / 빈 grid 어색함 회피. "데이터 있을 때만 보여줌". |
| **mock 배열 파일 (devices.js, publicFeed.js) 은 historic seed 로 보존** | 재시드 가능성. runtime 영향 0 (export 만 비어있는 stub). |

### 27-7. 산출물

```
db/
└── schema.extend.mysql.sql   ← + concerns.category_id ALTER 3 statements

server/
├── db/models.js              ← + Concern.category_id + belongsTo(ProcedureCategory, as: 'category')
├── routes/admin.js           ← concerns spec 에 category_id col + filter
└── scripts/seed-from-mock.js ← importConcerns 가 category_slug → category_id 변환

client/src/
├── data/concerns.js          ← 20행 모두 category_slug 추가 (Eyes/Nose 재배치 포함)
├── data/publicFeed.js        ← seed 자동 로드 제거 / hydrate 의 empty fallback 제거 /
│                                in-place mutation 으로 reference 유지
├── admin/specs.js            ← KINDS 에 section 필드 + KIND_SECTIONS 메타 / concerns 에 category_id FK col
├── admin/AdminLayout.jsx     ← 4섹션 아코디언 (localStorage 영속 + 활성 자동 펼침 + caret + count)
├── admin/AdminDashboard.jsx  ← 같은 4섹션으로 카드 그룹
├── admin/ConcernMatrixPage.jsx ← 카테고리별 collapsible 그룹뷰 + 매핑 카운트
├── admin/admin.css           ← .gs-admin-nav-group / -sec / -children / .gs-admin-statsec-*
│                                + .gs-cm-group / -group-head 매트릭스 그룹 헤더
├── components/PreferenceForm.jsx ← concern chip 카테고리 그룹 + sub-header (fallback flat)
├── components/RecentMatches.jsx ← entries 빈 배열일 때 return null
└── styles.css                ← .gs-chip-groups / .gs-chip-group-head 추가
```

### 27-8. 알려진 한계 / 다음 작업 후보

- [ ] **wellness category 의 concerns 가 0개** — 외국 환자 "K-beauty 회복/항노화" 톤의 concern 추가 시점에 채워질 자리. 현재 빈 카테고리 = 메뉴/UI에 안 노출 (자동 처리).
- [ ] **운영자 매뉴얼 update** — §25 의 Phase 1 단계 3 (concerns) 에 "category_id 도 같이 채워주세요" 한 줄 추가 필요.
- [ ] **시술 추가 시 concern 매핑 복사 도우미** — §27-2 의 해결책 B. 같은 mechanism 의 다른 시술 concern 매핑을 보여주고 "복사" 원클릭. 운영 6개월 후 매핑 누락이 문제로 드러나면 우선순위 ↑.
- [ ] **`docs/db_relationships.xlsx` 갱신** — Sheet 3 (카디널리티) 에 concerns ↔ procedure_categories 추가 (1:N FK). Sheet 4 (환자 흐름) 에 concern→category 그룹화 반영.
- [ ] **CLAUDE.md §25 운영 매뉴얼 동기화** — Phase 1 concerns 단계에 category_id 입력 안내 추가.

---

*§27 갱신: 2026-05-16 (concerns.category_id + admin 4섹션 아코디언 + publicFeed mock 박멸). 룰 핵심: **클라 런타임은 RDS 가 진실. mock fallback 금지.***

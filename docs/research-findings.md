# 파트너 후보 클리닉 조사 — 종합

조사 일자: 2026-05-11
조사 방법: WebFetch (4개 병렬 에이전트 × 5병원 = 20병원 시도 → 17 성공)
SPA 렌더링 실패: 벨리셀, 반니, 셀로라 (정적 HTML 비어있음 — headless 필요)

---

## 1. 병원 archetype 분류

| Archetype | 병원 | 핵심 시그너처 |
|---|---|---|
| **Derm + device 시그너처** | 아윤, 라미체, 듀이디, 햇살담은뜰 | 장비 브랜드명 자체가 SKU (Ulthera Prime, Thermage FLX, Silhouette Soft) |
| **Surgery-led (specialty)** | 우아(가슴), 워너비(코/눈/탈모), Hershe(힙·리프트), 노즈립(코재건/구순구개열), 그림(구순열), 리드(눈/거상) | 단일 분야 30년 노하우형 다수 |
| **Mixed peri-surgical** | 소이, 리엔장, 센텀코어 | 피부 + 쁘띠 + 일부 수술 |
| **Body / 비만 specialty** | 365mc | 지방흡입·DCA·지방줄기세포 — 기존 mechanism enum 거의 다 미커버 |
| **Regenerative specialty** | 셀로라(첨단재생의료기관), 살롱드닥터튠즈 | 줄기세포·엑소좀 / 프로그램 단위 |
| **Dental** | 리엔장 치과 | 임플란트/교정/라미네이트 (mechanism 완전 다름) |
| **Chain** | 리엔장 (6지점 × 다계열) | brand → branch 분리 강제 |

---

## 2. Mechanism enum 확장 결과

claude(3).md baseline 12개 → **신규 12개 추가** = 24개

### Baseline (12)
`hifu` / `rf` / `laser_ablative` / `laser_non_ablative` / `injection_toxin` / `injection_filler` / `injection_skin` / `thread` / `peel` / `surgery` / `extraction` / `topical`

### 추가 — 미용/체형/재생 (8)
- `stem_cell` — 소이·살롱드닥터튠즈·유넬·우아·노즈립·셀로라·센텀코어 (7곳)
- `exosome` — 리엔장 ASCE+, 셀로라 (재생의료 트렌드)
- `fat_grafting` / `autologous_fat_graft` — Hershe·우아·365mc·센텀코어
- `liposuction` — 365mc·Hershe·워너비·우아
- `fat_dissolve_injection` — 365mc DCA·리엔장 살빼주사
- `prp` — 워너비
- `iv_therapy` — 소이 수액·살롱드닥터튠즈 Sportif·센텀코어 기능의학
- `em_muscle_stim` — Emsculpt at 햇살담은뜰
- `hair_transplant` — 워너비 탈모센터
- `reconstructive` — 노즈립 구순구개열·그림 구순열·리드 화상/켈로이드
- `subcision` — 노즈립 흉터·듀이디 Subsicion
- `mmfu` — 소프웨이브 (리엔장) — `hifu`와 구분

### 추가 — 치과 (6)
- `implant` / `prosthetic` / `orthodontic` / `restorative` / `periodontal` / `bleaching_dental`

→ 총 mechanisms 슬러그 약 30개. `mechanisms` 룩업 테이블에 다국어 라벨 시드.

---

## 3. 카테고리 (domain) 5+1축

`procedures.domain` enum:

| Domain | 포함 |
|---|---|
| `face_aesthetic` | 리프팅·필러·보톡스·스킨부스터·레이저 (대다수) |
| `body_contouring` | 지방흡입·DCA·EM근육자극·바디리프팅 (365mc·Hershe) |
| `regenerative` | 줄기세포·엑소좀·PRP·IV 기능의학 (셀로라·살롱드닥터튠즈·센텀코어) |
| `surgical` | 절개 외과 (눈·코·가슴·윤곽·구순열·이마축소) |
| `derm_medical` | 여드름·흉터·색소·기미 등 의학적 피부진료 |
| `dental` | 임플란트·교정·라미네이트·미백·잇몸 |

→ UI 최상위 필터에 그대로 노출 가능.

---

## 4. 외국인 시그널 현황 (중국 80% 타깃 관점)

| 병원 | 다국어 | WeChat | WhatsApp | LINE | 코디네이터 명시 |
|---|---|---|---|---|---|
| **리엔장(강남)** | KR/EN/ZH(간번)/JP/TH/VN/ID/**RU** 9개 | ✗ | ✗ | ✗ | ✗ |
| **노즈립** | KR/EN/JP/TH/ZH/AR/ID 7개 | ✗ | ✗ | ✗ | ✗ (마취과 전문의 상주 명시) |
| **Hershe** | KR/EN/ZH/JP/VN/ID 6개 | **✓** | **✓** | ✗ | "50개국 4만명 0사고" |
| **우아** | KR/EN/ZH/JP/MN/VN/ID 6+ | ✗ | ✗ | ✗ | ✗ |
| **센텀코어 (부산)** | KR/EN/JP/**RU** | **✓** | ✗ | **✓** | ✗ |
| **소이/듀이디/살롱드닥터튠즈** | KR/EN/ZH/JP 4개 | ✗ | (살롱만 ✓) | ✗ | (살롱만 ✓) |
| **워너비/리엔장치과** | KR/EN/ZH/JP 4개 | ✗ | ✗ | ✗ | ✗ |
| **리드** | KR/EN | ✗ | ✗ | ✗ | ✗ |
| **그림** | KR + 별도 JP 도메인 | ✗ | ✗ | ✗ | ✗ |
| **아윤/유넬/라미체** | KR only | ✗ | ✗ | ✗ | ✗ |

### 핵심 관찰
- **WeChat 보유는 Hershe·센텀코어 단 2곳** — 중국 80% 타깃 관점에서 **플랫폼이 WeChat 채널 갭을 직접 메꿔야** 한다. 우리 플랫폼 WeChat ID로 모든 inquiry 유입.
- **코디네이터·통역·픽업·숙소 명시 거의 없음** → 우리 컨시어지가 차별화 가치를 가짐 (강남언니/바비톡 대비).
- **다국어 자체는 7~9곳 보유** — 다국어만으로는 차별화 불가.

---

## 5. Schema 구조 결정사항

### 5-1. Brand → Hospital(branch) 2계층
리엔장 단독으로 6 branch × 다계열 보유. 단일 `hospitals` 테이블은 동일 시술 6회 중복 등록 강제. → `brands` 부모 + `hospitals` 가 branch 단위.

### 5-2. Device brand는 hospital_procedures에
- 아윤 "Ultherapy PRIME" / "THERMAGE FLX" 자체가 시그너처
- 듀이디 메뉴는 디바이스명 그대로 ("Potenza", "Picosure")
- → `procedures` 는 generic (`hifu_face`), `hospital_procedures.device_brands TEXT[]` 가 SKU 보유

### 5-3. 지역 3-tier
부산 센텀코어 발견 → `city / district / neighborhood` 3단. UI는 city 필터부터.

### 5-4. 수술 특화 필드 → procedures에 NULL-able
외국인 환자 의사결정 핵심:
- `anesthesia_typical` (topical/local/sedation/general)
- `op_duration_hours`
- `hospitalization_days`
- `stitch_removal_days`
- `swelling_peak_days`
- `final_result_weeks`

→ 절제(`procedures.is_surgical=true`)일 때만 NOT NULL 권장 (DB constraint은 보류).

### 5-5. 신뢰 시그널 → hospitals에
- `ba_gallery_url` + `ba_photo_count` — Hershe 핵심
- `doctor_profile_url` / `safety_claim` — Noselips·Hershe
- `foreign_case_volume_monthly`
- `specialization_depth` enum: `niche` (Noselips/그림 구순열) / `device_led` (아윤) / `general` (소이/리엔장)
- `established_year`

### 5-6. 가격은 표시 안 함, 필터만
조사한 17곳 **전부 "상담문의" 일원화**. 한국 의료광고법 영향. → `procedures.market_price_min/max` 는 필터용, `hospital_procedures.price_tier` ($/$$/$$$) 는 표시용. 정가 노출은 `price_disclosed=true` 옵트인.

### 5-7. 패키지/프로그램 — MVP 자유텍스트
살롱드닥터튠즈 "Salon de Juvénile / All-Layer / Sportif" 처럼 프로그램 단위는 procedure 단일 row로 못 잡음. **MVP: `hospital_procedures.package_notes` 자유텍스트.** 패턴 굳어지면 Phase 2에 `procedure_bundles` 신설.

---

## 6. SPA 렌더링 실패 처리

| 클리닉 | 실패 사유 | 대응 |
|---|---|---|
| 벨리셀의원 | `/page/sub.php?id=N` 본문 SSR 부재 | 수동 입력 또는 Playwright |
| 반니 성형외과 | 메인 SPA 정적 추출 불가 | 수동 입력 |
| 셀로라 의원 | Vue/React SPA, loadingA.svg만 노출 | 수동 입력 (계약 협의중이므로 우선순위 낮음) |

→ v2 파이프라인에 Playwright headless 옵션 추가 검토. 단 MVP는 수동 입력으로 처리.

---

## 7. 다음 작업

1. **`v2/db/schema.sql`** Postgres DDL 완성 (본 문서 기반).
2. `mechanisms.sql` / `procedure_categories.sql` 시드 (다국어 라벨 포함).
3. `concerns` 시드 — 20~30개 외국인 관점 고민 정의 (한국어 baseline 19개 → CN/EN 번역).
4. `concern_procedures` 매트릭스 — **수기 큐레이션** 필요. 운영자(Min)와 별도 세션 권장.
5. `procedures` 시드 — 본 조사 기반 50~80개 procedure 정의. mechanism / domain / 다운타임 / 통증 / 수술 필드 sanity 체크.
6. `hospitals` + `hospital_procedures` 첫 5개 클리닉 입력 (Hershe / 노즈립 / 리엔장 강남 / 센텀코어 / 우아 — 다국어·외국인 시그널 강한 곳부터).

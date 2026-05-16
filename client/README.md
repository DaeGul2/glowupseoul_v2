# Glow Up Seoul — v2 client (mock DB, no server)

서버 없이 Vite + 인메모리 mock DB 로 v2 IA·데이터모델·UI 흐름을 한 번에 확인하는 프리뷰.

## 무엇이 들어있나

### Mock DB (`src/data/`)
`v2/db/schema.sql` 의 테이블을 1:1 로 옮긴 in-memory 구조. 실 Postgres 도입 시 `db.js` 만 fetch wrapper 로 교체.

| 파일 | 매핑 테이블 | 행 수 |
|------|-------------|-------|
| `mechanisms.js`         | `mechanisms`            | 15 |
| `procedureCategories.js`| `procedure_categories`  | 8  |
| `concerns.js`           | `concerns`              | 20 |
| `procedures.js`         | `procedures`            | 30 |
| `concernProcedures.js`  | `concern_procedures`    | 50+ |
| `brands.js`             | `brands`                | 22 (사용자 제공 병원 리스트) |
| `hospitals.js`          | `hospitals`             | 22 (브랜드 × 1 브랜치) |
| `hospitalProcedures.js` | `hospital_procedures`   | 69 (가격·이벤트·디바이스·시그너처) |
| `publicFeed.js`         | `public_feed_entries`   | 8 |
| `db.js`                 | query helper            | — |

### 핵심: `hospital_procedures`
같은 'HIFU' 라도 병원마다 가격·디바이스·이벤트·운영연수가 다르다는 걸 보여주는 브리지 테이블. 실 운영에서는 이 행 하나당 1개 화면 카드/비교행이 매핑됨.

```
HIFU 얼굴 리프팅 (procedure)
 ├─ 벨리셀     │ Shurink         │ 39만 (-30%)
 ├─ 소이       │ Shurink Universe│ 48만
 ├─ 리엔장     │ Shurink Universe│ 49만
 ├─ 아윤       │ Ulthera Prime   │ 55만  [signature]
 ├─ 라미체     │ Ulthera SPT     │ 60만
 ├─ 365mc 등 ...
```

### 페이지
| 라우트 | 컴포넌트 | 보여주는 것 |
|--------|---------|------------|
| `#/`                  | `HomePage`           | Hero · ticker · 8 카테고리 카드 · trending 시술 6개 |
| `#/category/:slug`    | `CategoryPage`       | 카테고리 내 시술 그리드 + intensity/price/concern 필터 |
| `#/treatment/:slug`   | `TreatmentDetailPage` | 시술 본질 정보 + N개 병원 비교 테이블 |
| `#/clinic/:slug`      | `HospitalDetailPage`  | 병원 메타 · 외국환자 capability · 보유 시술 메뉴 |

## 실행

```bash
cd v2/client
npm install
npm run dev          # http://localhost:5174
```

부팅 검증:
```bash
node scripts/smoke.mjs
```

## 다음 작업 후보

- 매칭 흐름 (스캔 modal → form → `/results/:matchId`) 복원
- 운영자 어드민 — `hospital_procedures` CRUD UI
- 실 Postgres + RPC 어댑터 (db.js → API client 로 교체)
- 다국어 — `name_ko` / `name_en` / `name_zh` / `name_ja` 분기 hook
- 통화 변환 (KRW → USD/CNY/SGD)

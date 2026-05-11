# v2 — Korea Medical Tourism Platform (Foreign Patient)

> v1(glowupseoul, 한국 도메스틱 PWA)에서 피봇.
> 외국인 환자 ↔ 한국 강남/부산 피부·성형·치과 클리닉 매칭 + 컨시어지 저니.
> v1 코드는 client/ server/ 그대로 보존됨 (참조용).

## 타깃 시장 (v1 launch)
- **중국 80%** — 그쪽 마케터 담당. 우리는 WeChat 채널 + ZH UI 제공.
- **영어권 20%** — 운영자(Min) 직접 상담. EN UI + WhatsApp 채널. 마진 ~99%.
- (후순위) JP / RU / VN / TH / AR.

## 현재 단계
**스키마 설계 단계**. 17개 파트너 후보 클리닉 사이트를 조사해 mechanism / category / 외국인 시그널 / 다국어 / 메신저 / 디바이스 브랜드 / 체인 구조 패턴을 수집함.

→ `docs/research-findings.md` 에 종합.
→ `db/schema.sql` 에 Postgres DDL 초안.

## 디렉토리
```
v2/
├── README.md                       ← 본 파일
├── docs/
│   ├── research-findings.md        17개 병원 조사 종합 + 스키마 시사점
│   └── ux-direction.md             메인 IA · 톤앤매너 · 카테고리 분류 · 스캔 modal UX
└── db/
    ├── schema.sql                  Postgres DDL (procedures / hospital_procedures / brands / ...)
    └── seed/
        ├── mechanisms.sql          mechanism 룩업 30개 (KR/EN/ZH/JP 라벨)
        └── procedure_categories.sql 메인 카테고리 10개 + 하위 4개 (lifting sub)
```

## 운영 연락처 (glowupseoul.com 운영중)
- WhatsApp: `+82 10 6487 1060`
- Email: `glowupinseoul@gmail.com`
- 정부 등록: Ministry of Health & Welfare — Foreign Patient Attraction Agency
- 페르소나: **Romie · Sisumate** (코디네이터 이름. 매칭 결과 카피에 자연 통합)

> v1 mock 의 `+82 10-7386-3249` 는 폐기. 모든 신규 코드는 위 운영 번호 사용.

## 설계 원칙 (claude(3).md 계승 + 실측 보완)
1. **"이 값이 병원에 상관없이 동일한가?"** → Yes는 `procedures`, No는 `hospital_procedures`.
2. **brand → hospital(branch)** 2계층. 리엔장처럼 6지점 체인 처리.
3. **device_brand는 hospital_procedures 컬럼** (Ulthera Prime, Thermage FLX 등 SKU 브랜드). procedures는 generic('hifu_face').
4. **mechanism은 `text[]`** (조합 시술 대응) + `mechanisms` 룩업 테이블에 다국어 라벨.
5. **돈은 KRW integer**, 표시 시 FX. 가격은 `price_tier` ($/$$/$$$) 중심, 정가 노출은 옵션.
6. **치과 통합**: `body_area='dental'` + mechanism 확장 (prosthetic/orthodontic/restorative/periodontal/implant/bleaching). 별도 테이블 X.
7. **외국인 친화 시그널은 hospital(branch) 단위**. WeChat 보유 = 중국 타깃 핵심 필터.
8. **concern_procedures 매트릭스는 사람이 큐레이션**. 자동생성 금지.

## 미해결 / 차순위
- 패키지/프로그램 단위 상품 (살롱드닥터튠즈 케이스) — MVP는 `hospital_procedures.package_notes` 자유텍스트. 패턴 굳어지면 `procedure_bundles` 신설.
- SPA 렌더링 클리닉 3곳 (벨리셀 / 반니 / 셀로라) — Playwright headless 단계 또는 수동 입력.
- 매칭/inquiries/quotes/trips/consultations/post_op_checkins — claude(3).md §3 스펙 유지, schema에 stub만 두고 운영은 컨시어지 수기.

## v1 → v2 자산 재사용
- 얼굴 스캐너 (FaceScanner) → 재사용 가능, 단 톤앤매너만 CN 친화로 조정 필요할 수 있음.
- WhatsApp 네이티브 스킴 호출 패턴 → 재사용. WeChat은 별도 처리 필요 (Web→앱 deep link 한국 외부는 제한적).
- gpt-4o-mini 매칭 룰 → 룰 유지. 단 추천 이유 NL을 ZH/EN로 생성.

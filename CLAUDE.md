# Glow Up Seoul — CLAUDE.md

뷰티 시술 큐레이션 PWA. 사용자 얼굴 스캔(연출용) + 고민·예산·다운타임·통증·선호 스타일 입력 →
GPT가 강남권 병원 DB에서 매칭 → 결과 카드 → 상세 모달 → WhatsApp 1:1 상담.

> 본 문서는 2026-05-10 기준 작업 스냅샷. 코드/DB가 변경되면 같이 업데이트할 것.

---

## 프로젝트 개요 / 핵심 가치

- **고민 → 시술 매칭**의 마찰을 없앤다. 사용자는 가격/회복기간/통증/스타일만 답하면 됨.
- "AI가 골라준 느낌"이 핵심 UX. 그래서 추천 이유를 자연어로 같이 보여줌.
- 얼굴 스캐너는 **실질 효과 0의 연출 장치**. "Face ID스러운 가오"로 신뢰감/재미 부여.
- 톤앤매너는 [glowupseoul.com](https://www.glowupseoul.com/) 라이트 럭셔리 기반.
- 결제·예약은 미구현. 모든 전환은 **WhatsApp 상담(`+82 10-7386-3249`)** 으로 떨어짐.

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트 | Vite + React 18, vanilla CSS |
| 얼굴 인식 | `@mediapipe/tasks-vision` (Face Landmarker, 478 landmarks, GPU delegate) |
| 백엔드 | Express (ESM), CORS |
| LLM | OpenAI `gpt-4o-mini` (룰베이스 폴백 내장) |
| 폰트 | Cormorant Garamond (이탤릭 강조) + Inter (본문) |
| 모바일 테스트 | cloudflared quick tunnel (HTTPS 필수 — getUserMedia) |

---

## 디렉토리 구조

```
glowupseoul/
├── client/                       # Vite + React (5173)
│   ├── index.html
│   ├── vite.config.js            # host:true, /api proxy → 3001, allowedHosts: trycloudflare/ngrok/loca.lt 등
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # 3-step 흐름 (scan → form → results)
│       ├── styles.css            # 라이트/럭셔리 톤
│       └── components/
│           ├── FaceScanner.jsx   # MediaPipe + canvas 메쉬, 12% 확장 오버레이, 스냅샷 캡처
│           ├── PreferenceForm.jsx
│           ├── MatchResults.jsx  # YOUR SCAN 포트레잇 + 카드 + Detail 버튼
│           └── ClinicDetailModal.jsx  # 병원 상세 + WhatsApp CTA
│
├── server/                       # Express (3001)
│   ├── index.js
│   ├── .env                      # 키 (gitignored)
│   ├── .env.example              # 템플릿 (sk-... placeholder)
│   ├── data/
│   │   └── clinics.js            # mock 10개 병원 + getAllTreatments()
│   └── routes/
│       ├── clinics.js            # GET /api/clinics, /:id
│       └── match.js              # POST /api/match (GPT or rule-based)
│
├── scripts/
│   └── export_ayun.cjs           # ayunclinic.com 파싱 → xlsx
│
├── ayunclinic_parsed.xlsx        # 아윤클리닉 파싱 결과 (Clinic / Treatments / Schema 시트)
├── README.md
└── CLAUDE.md                     # ← 본 문서
```

---

## 사용자 흐름 (3 step)

| Step | 컴포넌트 | 핵심 |
|------|---------|------|
| 01 Scan | `FaceScanner` | 카메라 권한 → MediaPipe 모델 로드(2-3s) → 얼굴 인식되면 "분석 시작" 활성화 → 4.5초 메쉬 애니메이션 → **video+오버레이 합성 jpeg 캡처** → 다음 단계 |
| 02 Form | `PreferenceForm` | 19개 고민 칩 + 슬라이더 4개(예산/다운타임/통증/스타일) + 자유 메모 |
| 03 Results | `MatchResults` + `ClinicDetailModal` | 캡처된 얼굴 portrait 카드 + TOP 5 시술 카드 + 상세 모달 + WhatsApp CTA |

---

## DB 스키마

### `clinics` (mock, server/data/clinics.js)

| 필드 | 타입 | 의미 |
|------|------|------|
| `id` | string | 병원 고유 ID (`c01`~`c10`) |
| `name` | string | 병원명 (한국어) |
| `area` | string | 강남 / 청담 / 압구정 / 신사 |
| `rating` | number | 평점 (4.0~5.0) |
| `description` | string | 한 줄 컨셉 |
| `address` | string | 주소 |
| `heroImage` | URL | 병원 대표 사진 (Unsplash) |
| `highlights` | string[] | 특징 키워드 3개 (예: '10년 경력', '점심시간 시술 가능') |
| `treatments` | Treatment[] | 시술 배열 |

### `Treatment` (subdocument)

| 필드 | 타입 | 의미 |
|------|------|------|
| `id` | string | 시술 고유 ID (`t01-1`) |
| `name` | string | 시술명 |
| `concerns` | string[] | **매칭 키워드** — 모공/주름/리프팅/턱선/광대/얼굴축소/눈/코/입술/여드름/여드름흉터/피부톤/다크서클/볼륨/탄력/피부결/잡티/색소/처짐 등 |
| `originalPrice` | number | 정가 (원) |
| `eventPrice` | number | 이벤트가 (원) |
| `downtimeDays` | number | 0~21 |
| `painLevel` | 1\|2\|3\|4\|5 | 1=아주 약함 ~ 5=매우 강함 |
| `style` | 1\|2\|3\|4\|5 | **1=자연 ↔ 5=드라마틱** |
| `description` | string | 시술 설명 |

### 외부 파싱 데이터 (확장 후보 필드)

`ayunclinic_parsed.xlsx` 만들면서 추가로 잡은 필드 — 향후 mock → real 전환 시 채택:

| 필드 | 의미 |
|------|------|
| `nameEn` | 영문명 |
| `category` | 리프팅/윤곽/스킨부스터/레이저 |
| `targetAreas` | 시술 부위 |
| `marketEstimate` | 가격 비공개 시 시장 평균 추정 |
| `downtimeNote` | 자유 텍스트 부연 |
| `painNote` | 마취 옵션 등 부연 |
| `styleNote` | 결과 스타일 부연 |
| `sessions` | 권장 횟수/주기 |
| `sourceUrl` | 원본 URL |
| `phone` | 대표 번호 |

### 사용자 입력 (`prefs` shape)

```ts
{
  concerns: string[];        // 다중 선택, 19개 옵션 중
  budgetMax: number;         // 100,000 ~ 10,000,000원
  downtimeMax: number;       // 0~21일
  painMax: 1|2|3|4|5;
  styleTarget: 1|2|3|4|5;
  notes: string;             // 자유 입력 (LLM이 해석)
}
```

---

## API

```
GET  /api/health           { ok: true, gpt: boolean }
GET  /api/clinics          전체 병원 (10)
GET  /api/clinics/:id      단일 병원
POST /api/match            body=prefs → { matches[], source: 'gpt'|'rule-based' }
```

---

## 매칭 로직 (server/routes/match.js)

**2-stage**:

1. **하드 필터 (`prefilter`)** — 예산/다운타임/통증 한계 안 맞는 시술은 즉시 컷. 결정적 룰.
2. **랭킹**:
   - **GPT 모드** (키 있을 때, 기본): `gpt-4o-mini`에 system + user prompt + 후보 시술 JSON 전달.
     `response_format: { type: 'json_object' }`로 `{ matches: [{ treatmentId, score, reason }] }` 강제.
     `temperature: 0.3` 으로 결정성 확보. 한국어 추천 이유 1-2문장.
   - **룰베이스 폴백** (키 없을 때): 가중치 점수
     - 고민 매칭 × 30
     - 스타일 차이 (4 - |diff|) × 10
     - 예산 여유율 × 20
     - 할인율 × 15
     - (rating - 4) × 10

**TOP 5 + discount(%) 자동 계산** 후 반환.

### GPT 비용 (gpt-4o-mini, 1명당)
- 입력 ~2,000 토큰 + 출력 ~800 토큰
- = $0.0003 + $0.00048 ≈ **$0.0008 (≈ 1.1원)**
- 1,000명 = 1,100원. 사실상 무시 가능.

---

## Face Scanner (FaceScanner.jsx) 상세

### 라이브러리
- `@mediapipe/tasks-vision@0.10.35`
- 모델: `face_landmarker.task` (Google CDN)
- WASM: `cdn.jsdelivr.net/.../tasks-vision@0.10.35/wasm`

### Phase 머신
`loading → idle → scanning → done` (또는 `error`)

| Phase | 동작 |
|-------|------|
| loading | WASM + 모델 + 카메라 초기화. 2-3초. |
| idle | 실시간 감지. 얼굴 잡히면 "얼굴 인식됨" → 시작 버튼 활성. |
| scanning | 4.5초간 progress 0→1. 메쉬가 점진적으로 reveal됨. sweep 라인이 얼굴 bbox 안에서 sweep. |
| done | 최종 프레임 + 메쉬 합성해 `captureSnapshot()`로 jpeg data URL 저장. 700ms 후 onComplete(snapshot). |

### 렌더링 디테일
- `<video>` + `<canvas>` 둘 다 `transform: scaleX(-1)` (사용자 시점 미러링).
- **`OVERLAY_SCALE = 1.12`** — 모든 랜드마크를 FACE_OVAL bbox 중심에서 12% 바깥으로 확장해 그림.
  - 좁다고 느꼈을 때 1.15~1.20으로 올리기. 너무 넓으면 1.05.
- 그리는 레이어:
  1. `FACE_LANDMARKS_TESSELATION` 풀 메쉬 (faint, 점진적 reveal)
  2. 특징 윤곽선 (FACE_OVAL/EYE/EYEBROW/LIPS/IRIS) — 항상
  3. 랜드마크 점 (sparse step=4, 펄스 애니메이션)
  4. Sweep 라인 (얼굴 상단→하단, gradient + glow)
- 색: `#c9a063` (champagne gold) + `#e8d4a8` (light gold). glowupseoul.com 톤과 합치.

### 스냅샷 캡처
- `done` phase 진입 직후, rAF 루프 안에서 1회만 실행.
- 임시 canvas에 `scaleX(-1)` 적용 후 video + live canvas를 합성 → `toDataURL('image/jpeg', 0.88)`.
- App state로 올라가 `MatchResults`의 portrait 카드에 표시.

---

## WhatsApp 연동 (ClinicDetailModal.jsx)

**문제**: `wa.me/...` 사용 시 데스크탑에서 web.whatsapp.com 기기연결 QR 페이지로 빠짐.

**해결**: 네이티브 앱 스킴 직접 호출.

```js
const native = `whatsapp://send?phone=${phone}&text=${encodedText}`;
const web = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
```

- **모바일**(`/Mobi|Android|iPhone|iPad|iPod/`): 즉시 native 스킴 호출 → 앱 실행.
- **데스크탑**: native 시도 → 1.5초 내 blur 이벤트 없으면(앱 미설치) `web.whatsapp.com/send`로 폴백.

**Pre-fill 메시지 포맷**:
```
[Glow Up Seoul 시술 상담 문의]

▸ 병원: {clinicName} ({clinicArea})
▸ 시술: {treatmentName}
▸ 가격: {eventPrice}원 (정가 {originalPrice}원)
▸ 다운타임: {downtimeDays}일
▸ 통증: {painLevel}/5

문의드립니다 :)
```

---

## 톤앤매너 (glowupseoul.com 매칭)

- **컬러**: `--bg #fafaf7` (warm white) / `--text #18181a` / `--accent #b8916a` (champagne) / `--gold #c9a063` / `--rose #c9837a`
- **타이포**: 헤딩 = Cormorant Garamond 이탤릭 강조 ("Your *Story.*"), 본문 = Inter
- **심볼 데코**: ✦ ◈ ◇ ⬡ ☽ ◎ — form label, modal section, eyebrow에 사용
- **버튼**: 솔리드 차콜 + 화이트 텍스트 + 0.15em 트래킹 + 대문자 → 명품 매장 톤
- **카드**: rounded 4px, 미니멀 shadow, 호버 시 border-color + shadow 강조
- **이탤릭 감성 훅**: 영문 단어 한두개를 *italic*으로 — "Tell us your *Story.*", "*당신만을 위한* 시술"
- 모달: bottom sheet 스타일 (`align-items: flex-end` + slideUp)

---

## 환경변수 (server/.env)

```
PORT=3001
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

`.env`는 gitignored. `.env.example`은 placeholder만.

---

## 실행

```bash
# server
cd server && npm install && npm run dev

# client (다른 터미널)
cd client && npm install && npm run dev
```

→ http://localhost:5173

### 모바일 테스트 (HTTPS 필요 — 카메라 권한)

```bash
# PC 한 번 더 별도 터미널
cloudflared tunnel --url http://localhost:5173
# → https://xxx.trycloudflare.com 출력
# 휴대폰 브라우저로 그 URL 접속
```

`vite.config.js`의 `allowedHosts`에 `.trycloudflare.com / .ngrok-free.app / .ngrok.app / .loca.lt / .serveo.net / .pinggy.link` 모두 화이트리스트 됨.

> **caveat**: cloudflared quick tunnel은 401/500 간헐적 에러. 안 되면 `localtunnel`(`npx localtunnel --port 5173`) 또는 `pinggy` 폴백.

---

## 결정/고민 기록

| 항목 | 결정 | 이유 |
|------|------|------|
| 얼굴 분석을 실제로 쓸지 | **연출만, 분석 X** | 사용자 명시 요구. 비용·복잡도·프라이버시 회피. |
| MediaPipe vs face-api.js | **MediaPipe** | 478 랜드마크, GPU 가속, 메쉬 connection set 풍부 |
| GPT vs 룰베이스 | **GPT 기본 + 룰베이스 폴백** | 추천 이유 NL 생성이 핵심 UX. 비용 1원/명 수준이라 무시 가능. |
| 다크 vs 라이트 톤 | **라이트 럭셔리** | glowupseoul.com 매칭. |
| 결제/예약 통합 | **하지 않음** | 모든 전환 → WhatsApp 1:1. 운영자가 컨시어지처럼 응대. |
| WhatsApp 링크 형태 | `whatsapp://` 네이티브 스킴 + web 폴백 | `wa.me`는 기기연결 QR 페이지 우회 안 됨 |
| Vite host | `host: true` + `allowedHosts` | LAN/터널 동시 지원 |

---

## 데이터 소스 / 외부 파싱

| 소스 | 결과 | 비고 |
|------|------|------|
| 자체 mock 10개 | `server/data/clinics.js` | 강남/청담/압구정/신사. 시술 22개. |
| ayunclinic.com | `ayunclinic_parsed.xlsx` (Clinic/Treatments/Schema 시트) | 가격 비공개 → `상담` 표기 + `marketEstimate` 별도 컬럼 |

추후 추가 병원도 같은 xlsx 스키마로 파싱하고, `clinics.js`로 import 가능하게 변환 스크립트 만들 예정.

---

## 미해결 / 다음 할 일 (TODO)

- [ ] 가격 미공개 클리닉의 합리적 추정치 도출 룰 (현재는 수동)
- [ ] 병원/시술 이미지 — Unsplash 대체 → 실제 병원 이미지 크롤
- [ ] 매칭에 의사 정보(원장 경력, 전문분야) 가산점 반영
- [ ] 결과 페이지 공유 기능 (URL/QR로 매칭 결과 저장)
- [ ] 다국어 (영/중/일 — 외국 환자 시장)
- [ ] 사용자 후기/평점 — 매칭 가중치
- [ ] 시술 비포애프터 사진 (개인정보/동의 이슈 신중히)
- [ ] 운영자 대시보드 — WhatsApp 유입 추적, 매칭 이력 분석

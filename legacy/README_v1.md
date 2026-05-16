# Glow Up Seoul

뷰티 시술 매칭 PoC — 사용자 얼굴 스캔(연출용) + 고민/예산/다운타임/통증/선호 스타일을 받아
GPT가 강남권 병원 DB에서 시술을 매칭해주는 데모.

```
glowupseoul/
├── client/   # Vite + React (5173)
└── server/   # Express + OpenAI (3001)
```

## 준비

1) `server/.env` 생성

```
PORT=3001
OPENAI_API_KEY=sk-...        # 본인 키
OPENAI_MODEL=gpt-4o-mini
```

> 키가 없으면 룰베이스 폴백으로 동작합니다 (UI/구조 테스트 용도).

## 실행

### 서버

```bash
cd server
npm install
npm run dev
# http://localhost:3001/api/health 확인
```

### 클라이언트 (다른 터미널)

```bash
cd client
npm install
npm run dev
# http://localhost:5173
```

Vite가 `/api/*` 를 자동으로 3001로 프록시합니다.

## 흐름

1. **Face Scan** — 카메라 권한 허용 → "얼굴 분석 시작" → 윤곽/메쉬/스캔라인 애니메이션 (실제 분석은 없음, UX 연출)
2. **Preference Form** — 고민(다중), 예산, 다운타임, 통증, 선호 스타일(자연↔드라마틱), 메모
3. **Results** — `POST /api/match` 로 GPT 호출 → 상위 5개 시술 + 가격비교 + 추천 이유
4. **Detail Modal** — 카드의 "자세히 보기" → 병원 hero 사진 + 병원 특징 + 시술 상세 + AI 추천 이유
5. **WhatsApp 상담** — 모달 하단 "WhatsApp 으로 상담하기" → `wa.me/821073863249` 로 시술/가격 정보 자동 첨부된 메시지 전송

## API

```
GET  /api/health                  # 상태 + GPT on/off
GET  /api/clinics                 # 전체 병원 (10개)
GET  /api/clinics/:id             # 단일 병원
POST /api/match                   # body: { concerns[], budgetMax, downtimeMax, painMax, styleTarget, notes }
```

## 주의

- 카메라는 https 또는 localhost 에서만 동작합니다 (Vite dev는 localhost라 OK).
- iOS Safari는 첫 진입 시 사용자 제스처(버튼 클릭) 후 `getUserMedia` 호출하는 게 안정적입니다.
- 시술/가격은 모두 mock 데이터입니다.

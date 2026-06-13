# Glow Up Seoul v3 — 이미지 슬롯 정의 + Midjourney 프롬프트

> 방향: **부위 포커스 에디토리얼** — 각 시술을 *부위·각도·맥락*으로 변별. (예쁜 헤드샷 복붙 금지)
> 톤: 럭셔리 뷰티(Dior / Aesop / Aman). 아이보리·샴페인. **금지: 병원/장비/주사기, 텍스트·로고.**
> 엑셀(바로 복붙): `docs/image_prompts.xlsx` (열려 있으면 `image_prompts_new.xlsx`) — 한 행 = 한 이미지.

---

## ⚠ 왜 다시 잡았나
이전 프롬프트는 전부 "예쁜 동양 여자 포트레이트" 베이스 → 미드저니가 시술 단어(lifted/even-toned…)를
무시하고 **똑같은 베이지 배경 미녀 헤드샷**만 뽑음. 14개가 다 같은 얼굴 = 시술 대표 실패.

**해결: 시술마다 보여주는 걸 다르게.**
- 리프팅 5종 → **각도로 변별** (3/4·측면·정면·로우앵글·업샷)
- 글로우 5종 → **소품/광으로 변별** (물방울·타월·골든·톤·텍스처)
- 눈 3종 → **눈 중심 크롭** / 코 → 옆얼굴 / 입술 → 입·볼 / 이마 → 보톡스
- 바디(지방흡입) → 실크 드레이프 허리 실루엣 / IV → 라운지 라이프스타일 / 안면거상 → 40대 모델

---

## 1. 이미지 슬롯

| 위치 | 용도 | 비율 | 상태 |
|---|---|---|---|
| 홈 / How 히어로 | 영상 | — | ✅ |
| /treatments 히어로 | 흰옷 여성 (treatments-hero.png) | 16:9 | ✅ 교체완료 |
| 로고 | glowup-logo.png | — | ✅ |
| **시술 썸네일 ×14** | 그리드 카드 + 상세 히어로 | **4:5** | ⛔ 12 필요 |
| **수술 썸네일 ×6** | 그리드 카드 + 상세 히어로 | **4:5** | ⛔ 6 필요 |
| /surgeries 히어로 | (선택) | 16:9 | ➕ |
| OG 커버 | 소셜 | 1200×630 | ➕ |

---

## 2. 공통 스타일 블록 (subject 뒤에 붙임)
```
luxury beauty editorial photography, soft warm cinematic lighting,
ivory and champagne color palette, clean minimal neutral background, shallow depth of field,
natural realistic skin, Dior beauty campaign aesthetic, premium, elegant, serene,
no clinical setting, no medical devices
--ar 4:5 --style raw --v 6.1 --no distortion, fisheye, tongue, open mouth, text, logo
```
팁 — 같은 모델 통일: 첫 컷 URL을 나머지에 `--cref <url> --cw 80`. 더 따뜻하게 `golden hour`.

---

## 3. 시술(Treatments) — subject (뒤에 §2)

리프팅(각도 변별)
- **ulthera** — `Three-quarter beauty portrait of an elegant East Asian woman, sculpted lifted jawline and high cheekbone catching the light, poised`
- **shurink** — `Side profile beauty portrait of an East Asian woman, sharply lifted jawline and elegant neck line, graceful`
- **thermage** — `Front beauty portrait of an East Asian woman, smooth firm taut cheeks and radiant skin, serene`
- **inmode** — `Low three-quarter angle beauty portrait of an East Asian woman, slim defined chin and contoured jawline, refined`
- **thread_lift** — `Upward three-quarter beauty portrait of an East Asian woman, lifted youthful mid-face contour, elegant`

글로우(소품/광 변별)
- **rejuran** — `Front beauty portrait of an East Asian woman, luminous dewy glowing skin with delicate water droplets, fresh and hydrated`
- **juvelook** — `Front beauty portrait of an East Asian woman, plump bouncy collagen-rich skin in warm golden glow, fresh`
- **pico_laser** — `Front beauty portrait of an East Asian woman, bright even-toned spotless complexion, clear and luminous`
- **co2_laser** — `Soft beauty portrait of an East Asian woman, smooth refined even skin texture, matte radiance`
- **aqua_peel** — `Beauty portrait of a fresh-faced East Asian woman after a facial, dewy hydrated skin with water droplets, white towel, spa serenity`

타깃 부위 / 웰니스
- **botox** — `Serene front beauty portrait of an East Asian woman, smooth relaxed forehead and softened brow area, calm`
- **filler** — `Soft beauty portrait of an East Asian woman emphasizing naturally full lips and healthy cheek volume, gentle`
- **tear_trough** — `Beauty portrait of an East Asian woman cropped around bright refreshed eyes, smooth well-rested under-eye area, gentle gaze`
- **iv_glow** — `Lifestyle editorial of a serene East Asian woman in a soft robe relaxing in a luxury wellness lounge, radiant healthy glow, calm`

---

## 4. 수술(Surgeries) — subject (뒤에 §2)
- **rhinoplasty** — `Elegant side profile beauty portrait of an East Asian woman, refined natural nose line, soft studio light, sophisticated`
- **double_eyelid** — `Beauty portrait of an East Asian woman cropped on bright expressive eyes with defined natural double eyelids, captivating`
- **ptosis_correction** — `Beauty portrait of an East Asian woman cropped on bright wide-awake alert eyes, refreshed and open, elegant`
- **liposuction** — `Body editorial of a slim East Asian woman, graceful waist and torso in flowing silk drape, golden light, tasteful, fully clothed`
- **facelift** — `Graceful three-quarter portrait of a sophisticated East Asian woman in her late 40s, naturally lifted youthful radiant skin, timeless`
- **cleft_lip** — `Warm dignified portrait of a gently smiling East Asian person, confident hopeful expression, soft natural light`

---

## 5. (선택) 부가 이미지
**/surgeries 히어로** (16:9)
`Cinematic wide shot of a confident elegant East Asian woman in a luxury Seoul interior at golden hour, premium beauty travel campaign, ivory and champagne tones, no text, no logos --ar 16:9 --style raw --v 6.1`

**OG 커버** (1200×630)
`Luxury beauty concierge mood, elegant East Asian woman with flawless glowing skin, warm ivory and champagne palette, premium editorial, generous negative space on the left, no text, no logos --ar 191:100 --style raw --v 6.1`

---

## 6. 업로드
admin(`/admin`) → 시술/수술 편집 → **Photo** 드래그&드롭 → S3 → 그리드·상세 자동 반영. 권장 4:5, 가로 1200px+.

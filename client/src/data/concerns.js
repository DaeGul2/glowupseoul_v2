// 사용자 언어 — "their problem, not medical term"
// category_slug 는 procedure_categories 와 공유. UI 그룹핑 + 운영자 큐레이션용.
export const concerns = [
  { id: 1,  slug: 'sagging',          name_ko: '처짐·리프팅', name_en: 'Sagging / Lifting',         name_zh: '松弛',         name_ja: 'たるみ',     body_area: 'face',   category_slug: 'face',   display_order: 1 },
  { id: 2,  slug: 'wrinkles',         name_ko: '주름',         name_en: 'Wrinkles',                  name_zh: '皱纹',         name_ja: 'シワ',       body_area: 'face',   category_slug: 'face',   display_order: 2 },
  { id: 3,  slug: 'volume_loss',      name_ko: '볼륨 손실',    name_en: 'Volume Loss',               name_zh: '凹陷',         name_ja: 'ボリューム不足', body_area: 'face', category_slug: 'face',   display_order: 3 },
  { id: 4,  slug: 'jawline',          name_ko: '턱선',         name_en: 'Jawline Definition',        name_zh: '下颌线',       name_ja: 'フェイスライン', body_area: 'face', category_slug: 'face',   display_order: 4 },
  { id: 5,  slug: 'face_size',        name_ko: '얼굴 축소',    name_en: 'Face Slimming',             name_zh: '瘦脸',         name_ja: '小顔',       body_area: 'face',   category_slug: 'face',   display_order: 5 },
  { id: 6,  slug: 'cheekbones',       name_ko: '광대',         name_en: 'Cheekbone Reduction',       name_zh: '颧骨',         name_ja: '頬骨',       body_area: 'face',   category_slug: 'face',   display_order: 6 },
  { id: 7,  slug: 'pores',            name_ko: '모공',         name_en: 'Pores',                     name_zh: '毛孔',         name_ja: '毛穴',       body_area: 'skin',   category_slug: 'skin',   display_order: 7 },
  { id: 8,  slug: 'skin_tone',        name_ko: '피부톤',       name_en: 'Skin Tone',                 name_zh: '肤色',         name_ja: '肌トーン',   body_area: 'skin',   category_slug: 'skin',   display_order: 8 },
  { id: 9,  slug: 'pigmentation',     name_ko: '잡티·색소',    name_en: 'Pigmentation',              name_zh: '色斑',         name_ja: 'シミ',       body_area: 'skin',   category_slug: 'skin',   display_order: 9 },
  { id: 10, slug: 'acne_scars',       name_ko: '여드름 흉터',  name_en: 'Acne Scars',                name_zh: '痘印',         name_ja: 'ニキビ跡',   body_area: 'skin',   category_slug: 'skin',   display_order: 10 },
  { id: 11, slug: 'acne_active',      name_ko: '여드름',       name_en: 'Active Acne',               name_zh: '痘痘',         name_ja: 'ニキビ',     body_area: 'skin',   category_slug: 'skin',   display_order: 11 },
  { id: 12, slug: 'dark_circles',     name_ko: '다크서클',     name_en: 'Dark Circles',              name_zh: '黑眼圈',       name_ja: 'クマ',       body_area: 'face',   category_slug: 'eyes',   display_order: 12 },
  { id: 13, slug: 'eye_shape',        name_ko: '쌍커풀·눈매',  name_en: 'Eyelid / Eye Shape',        name_zh: '双眼皮',       name_ja: '二重',       body_area: 'face',   category_slug: 'eyes',   display_order: 13 },
  { id: 14, slug: 'nose_shape',       name_ko: '코 모양',      name_en: 'Nose Shape',                name_zh: '鼻形',         name_ja: '鼻の形',     body_area: 'face',   category_slug: 'nose',   display_order: 14 },
  { id: 15, slug: 'lip_shape',        name_ko: '입술 모양',    name_en: 'Lip Shape',                 name_zh: '唇形',         name_ja: '唇の形',     body_area: 'face',   category_slug: 'face',   display_order: 15 },
  { id: 16, slug: 'body_contour',     name_ko: '바디라인',     name_en: 'Body Contour',              name_zh: '身材',         name_ja: 'ボディライン', body_area: 'body', category_slug: 'body',   display_order: 16 },
  { id: 17, slug: 'fat_local',        name_ko: '부분 지방',    name_en: 'Localized Fat',             name_zh: '局部脂肪',     name_ja: '部分痩せ',   body_area: 'body',   category_slug: 'body',   display_order: 17 },
  { id: 18, slug: 'hair_loss',        name_ko: '탈모',         name_en: 'Hair Loss',                 name_zh: '脱发',         name_ja: '薄毛',       body_area: 'hair',   category_slug: 'hair',   display_order: 18 },
  { id: 19, slug: 'aging_overall',    name_ko: '전반 노화',    name_en: 'Overall Aging',             name_zh: '整体衰老',     name_ja: '全体エイジング', body_area: 'face', category_slug: 'face',   display_order: 19 },
  { id: 20, slug: 'dental_align',     name_ko: '치아 정렬',    name_en: 'Teeth Alignment',           name_zh: '牙齿矫正',     name_ja: '歯列矫正',   body_area: 'dental', category_slug: 'dental', display_order: 20 },
];

export const concernBySlug = Object.fromEntries(concerns.map((c) => [c.slug, c]));
export const concernById = Object.fromEntries(concerns.map((c) => [c.id, c]));

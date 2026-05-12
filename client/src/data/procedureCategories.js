// body_area 기준 8 카테고리 (ux-direction §3)
export const procedureCategories = [
  { id: 1, slug: 'face',     name_ko: '얼굴',       name_en: 'Face',                   name_zh: '面部',     name_ja: 'フェイス', domain: 'face_aesthetic',  display_order: 1, parent_id: null, is_active: true },
  { id: 2, slug: 'eyes',     name_ko: '눈',         name_en: 'Eyes',                   name_zh: '眼部',     name_ja: '目',       domain: 'surgical',        display_order: 2, parent_id: null, is_active: true },
  { id: 3, slug: 'nose',     name_ko: '코',         name_en: 'Nose',                   name_zh: '鼻部',     name_ja: '鼻',       domain: 'surgical',        display_order: 3, parent_id: null, is_active: true },
  { id: 4, slug: 'body',     name_ko: '바디',       name_en: 'Body',                   name_zh: '身体',     name_ja: 'ボディ',   domain: 'body_contouring', display_order: 4, parent_id: null, is_active: true },
  { id: 5, slug: 'skin',     name_ko: '피부',       name_en: 'Skin',                   name_zh: '皮肤',     name_ja: '肌',       domain: 'derm_medical',    display_order: 5, parent_id: null, is_active: true },
  { id: 6, slug: 'hair',     name_ko: '헤어·두피',   name_en: 'Hair & Scalp',           name_zh: '头发与头皮', name_ja: '髪・頭皮', domain: 'surgical',        display_order: 6, parent_id: null, is_active: true },
  { id: 7, slug: 'wellness', name_ko: '재생·웰니스', name_en: 'Wellness & Regenerative', name_zh: '健康再生', name_ja: 'ウェルネス', domain: 'regenerative',    display_order: 7, parent_id: null, is_active: true },
  { id: 8, slug: 'dental',   name_ko: '치과',       name_en: 'Dental',                 name_zh: '牙科',     name_ja: '歯科',     domain: 'dental',          display_order: 8, parent_id: null, is_active: true },
];

export const categoryBySlug = Object.fromEntries(procedureCategories.map((c) => [c.slug, c]));
export const categoryById = Object.fromEntries(procedureCategories.map((c) => [c.id, c]));

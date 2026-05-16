// Canonical concern slugs — MUST match v2/client/src/data/concerns.js.
// Server keeps its own copy so we can validate GPT output without crossing the
// client boundary. If you add a slug to the client list, mirror it here.

export const CONCERN_SLUGS = [
  'sagging','wrinkles','volume_loss','jawline','face_size','cheekbones',
  'pores','skin_tone','pigmentation','acne_scars','acne_active','dark_circles',
  'eye_shape','nose_shape','lip_shape',
  'body_contour','fat_local','hair_loss','aging_overall','dental_align',
];

export const CONCERN_SET = new Set(CONCERN_SLUGS);

// Generate docs/image_prompts.xlsx — one row per image, ready-to-paste
// Midjourney prompt. Direction: FOCUS-MAPPED editorial — each procedure is
// differentiated by body area / angle / context so the grid isn't 14 identical
// headshots. Run: node scripts/export_image_prompts.cjs
const XLSX = require('xlsx');
const path = require('path');

// Look + quality only. Framing lives in each subject (so eyes/lips/body crops vary).
const STYLE = 'luxury beauty editorial photography, soft warm cinematic lighting, '
  + 'ivory and champagne color palette, clean minimal neutral background, shallow depth of field, '
  + 'natural realistic skin, Dior beauty campaign aesthetic, premium, elegant, serene, '
  + 'no clinical setting, no medical devices';
const PARAMS = '--style raw --v 6.1 --no distortion, fisheye, tongue, open mouth, text, logo';

// kind, slug, name, where, ar, status, subject (framing embedded → distinct per row)
const ITEMS = [
  // ---- Lifting / contour: vary the ANGLE so they don't collapse ----
  ['Treatment', 'ulthera', 'Ulthera', 'Grid card + detail hero', '4:5', 'Have', 'Three-quarter beauty portrait of an elegant East Asian woman, sculpted lifted jawline and high cheekbone catching the light, poised'],
  ['Treatment', 'shurink', 'Shurink Universe', 'Grid card + detail hero', '4:5', 'Need', 'Side profile beauty portrait of an East Asian woman, sharply lifted jawline and elegant neck line, graceful'],
  ['Treatment', 'thermage', 'Thermage', 'Grid card + detail hero', '4:5', 'Have', 'Front beauty portrait of an East Asian woman, smooth firm taut cheeks and radiant skin, serene'],
  ['Treatment', 'inmode', 'InMode (FX + Forma)', 'Grid card + detail hero', '4:5', 'Need', 'Low three-quarter angle beauty portrait of an East Asian woman, slim defined chin and contoured jawline, refined'],
  ['Treatment', 'thread_lift', 'Thread Lift', 'Grid card + detail hero', '4:5', 'Need', 'Upward three-quarter beauty portrait of an East Asian woman, lifted youthful mid-face contour, elegant'],
  // ---- Glow / skin: vary the PROP/context (water, towel, golden, tone) ----
  ['Treatment', 'rejuran', 'Rejuran', 'Grid card + detail hero', '4:5', 'Need', 'Front beauty portrait of an East Asian woman, luminous dewy glowing skin with delicate water droplets, fresh and hydrated'],
  ['Treatment', 'juvelook', 'Juvelook', 'Grid card + detail hero', '4:5', 'Need', 'Front beauty portrait of an East Asian woman, plump bouncy collagen-rich skin in warm golden glow, fresh'],
  ['Treatment', 'pico_laser', 'Pico Laser', 'Grid card + detail hero', '4:5', 'Need', 'Front beauty portrait of an East Asian woman, bright even-toned spotless complexion, clear and luminous'],
  ['Treatment', 'co2_laser', 'CO2 Fractional Laser', 'Grid card + detail hero', '4:5', 'Need', 'Soft beauty portrait of an East Asian woman, smooth refined even skin texture, matte radiance'],
  ['Treatment', 'aqua_peel', 'Aqua Peel', 'Grid card + detail hero', '4:5', 'Need', 'Beauty portrait of a fresh-faced East Asian woman after a facial, dewy hydrated skin with water droplets, white towel, spa serenity'],
  // ---- Targeted area ----
  ['Treatment', 'botox', 'Botox', 'Grid card + detail hero', '4:5', 'Need', 'Serene front beauty portrait of an East Asian woman, smooth relaxed forehead and softened brow area, calm'],
  ['Treatment', 'filler', 'Filler', 'Grid card + detail hero', '4:5', 'Need', 'Soft beauty portrait of an East Asian woman emphasizing naturally full lips and healthy cheek volume, gentle'],
  ['Treatment', 'tear_trough', 'Tear-trough Filler', 'Grid card + detail hero', '4:5', 'Need', 'Beauty portrait of an East Asian woman cropped around bright refreshed eyes, smooth well-rested under-eye area, gentle gaze'],
  // ---- Wellness: lifestyle scene ----
  ['Treatment', 'iv_glow', 'Glow IV Drip', 'Grid card + detail hero', '4:5', 'Need', 'Lifestyle editorial of a serene East Asian woman in a soft robe relaxing in a luxury wellness lounge, radiant healthy glow, calm'],

  // ---- Surgeries ----
  ['Surgery', 'rhinoplasty', 'Rhinoplasty', 'Grid card + detail hero', '4:5', 'Need', 'Elegant side profile beauty portrait of an East Asian woman, refined natural nose line, soft studio light, sophisticated'],
  ['Surgery', 'double_eyelid', 'Double Eyelid Surgery', 'Grid card + detail hero', '4:5', 'Need', 'Beauty portrait of an East Asian woman cropped on bright expressive eyes with defined natural double eyelids, captivating'],
  ['Surgery', 'ptosis_correction', 'Ptosis Correction', 'Grid card + detail hero', '4:5', 'Need', 'Beauty portrait of an East Asian woman cropped on bright wide-awake alert eyes, refreshed and open, elegant'],
  ['Surgery', 'liposuction', 'Liposuction', 'Grid card + detail hero', '4:5', 'Need', 'Body editorial of a slim East Asian woman, graceful waist and torso in flowing silk drape, golden light, tasteful, fully clothed'],
  ['Surgery', 'facelift', 'Facelift', 'Grid card + detail hero', '4:5', 'Need', 'Graceful three-quarter portrait of a sophisticated East Asian woman in her late 40s, naturally lifted youthful radiant skin, timeless'],
  ['Surgery', 'cleft_lip', 'Cleft Lip / Palate', 'Grid card + detail hero', '4:5', 'Need', 'Warm dignified portrait of a gently smiling East Asian person, confident hopeful expression, soft natural light'],

  // ---- Site extras ----
  ['Site', 'surgeries_hero', '/surgeries hero banner', 'Surgeries page hero', '16:9', 'Optional', 'Cinematic wide shot of a confident elegant East Asian woman in a luxury Seoul interior at golden hour, premium beauty travel campaign, ivory and champagne tones'],
  ['Site', 'og_cover', 'OG social cover', 'Social share card', '1.91:1', 'Optional', 'Luxury beauty concierge mood, elegant East Asian woman with flawless glowing skin, warm ivory and champagne palette, premium editorial, generous negative space on the left'],
];

function fullPrompt(subject, ar) {
  const arFlag = ar === '4:5' ? '--ar 4:5' : ar === '16:9' ? '--ar 16:9' : '--ar 191:100';
  return `${subject}, ${STYLE} ${arFlag} ${PARAMS}`;
}

const header = ['#', 'Kind', 'Slug', 'Name', 'Where used', 'Aspect', 'Status', 'Midjourney prompt (ready to paste)'];
const rows = ITEMS.map((it, i) => {
  const [kind, slug, name, where, ar, status, subject] = it;
  return [i + 1, kind, slug, name, where, ar, status, fullPrompt(subject, ar)];
});

const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
ws['!cols'] = [{ wch: 4 }, { wch: 10 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 8 }, { wch: 9 }, { wch: 130 }];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Image prompts');
let out = path.resolve(__dirname, '..', 'docs', 'image_prompts.xlsx');
try {
  XLSX.writeFile(wb, out);
} catch (e) {
  if (e.code === 'EBUSY' || e.code === 'EPERM') {
    out = path.resolve(__dirname, '..', 'docs', 'image_prompts_new.xlsx');
    XLSX.writeFile(wb, out);
    console.log('(원본이 열려 있어 _new 로 저장)');
  } else throw e;
}
console.log(`wrote ${out} — ${rows.length} rows`);

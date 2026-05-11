// 159 canonical 을 8개 body-area 카테고리에 binning
// 출력: v2/docs/hospital_canonical.xlsx 에 시트 1개 추가 (CategoryBinning)
//
// 결정 근거: v2/CLAUDE.md §15

const XLSX = require('xlsx');
const path = require('path');

const xlsxPath = path.join(__dirname, '..', 'v2', 'docs', 'hospital_canonical.xlsx');
const wb = XLSX.readFile(xlsxPath);

// CanonicalCatalog 시트 읽기
const catalog = XLSX.utils.sheet_to_json(wb.Sheets['CanonicalCatalog']);

// =====================================================================
// Binning 룰 — 우선순위 위에서 아래로 (첫 매치)
// =====================================================================
function classify(row) {
  const slug = row.slug || '';
  const ba = (row.body_areas || '').split(',').map(s => s.trim());
  const domain = row.domain || '';
  const mech = row.mechanism || '';

  // Dental 우선
  if (domain === 'dental' || ba.includes('dental')) return 'dental';

  // Hair
  if (ba.includes('scalp') || mech === 'hair_transplant' ||
      slug === 'stemcell_hair') return 'hair';

  // Wellness (regenerative — IV / stem cell systemic / exosome / PRP / hyperbaric)
  if (slug === 'iv_therapy' || slug === 'special_hyperbaric' ||
      slug === 'cream_firming') return 'wellness';
  if (mech === 'iv_therapy') return 'wellness';
  if (mech === 'exosome' || slug === 'exosome_asce') return 'wellness';
  if (mech === 'prp') return 'wellness';
  if (slug === 'stemcell_bio' || slug === 'stemcell_banking' || slug === 'stemcell_joint') return 'wellness';

  // Eyes
  if (ba.includes('eye') || ba.includes('brow')) return 'eyes';
  if (slug.startsWith('surgery_eye_')) return 'eyes';

  // Nose
  if (ba.includes('nose') && !ba.includes('lip')) return 'nose';
  if (slug.startsWith('surgery_nose_')) return 'nose';

  // Body (지방흡입, body contour, em, breast, buttocks, abdomen 등)
  if (domain === 'body_contouring') return 'body';
  if (mech === 'liposuction') return 'body';
  if (mech === 'em_muscle_stim') return 'body';
  if (mech === 'fat_dissolve_injection') return 'body';
  if (ba.includes('breast') || ba.includes('buttocks') || ba.includes('hip') ||
      ba.includes('abdomen') || ba.includes('arm') || ba.includes('thigh') ||
      ba.includes('calf') || ba.includes('chest') || ba.includes('shoulder') ||
      ba.includes('pelvis')) return 'body';
  if (slug === 'fat_grafting' || slug === 'accusculpt') {
    // fat_grafting 은 얼굴/바디 모두 가능 — 우선 body 로
    return 'body';
  }

  // Skin (derm medical — laser, acne, scar, pigmentation)
  if (domain === 'derm_medical') return 'skin';
  if (mech === 'laser_ablative' || mech === 'laser_non_ablative') return 'skin';
  if (mech === 'subcision' || mech === 'extraction' || mech === 'peel') return 'skin';

  // 나머지는 Face (face_aesthetic 대부분: HIFU/RF/필러/보톡스/실/스킨부스터/거상수술)
  if (ba.includes('face') || ba.includes('lip') || ba.includes('jaw') ||
      ba.includes('cheek') || ba.includes('forehead') || ba.includes('neck') ||
      ba.includes('ear')) return 'face';

  // stemcell antiaging (face systemic) → face
  if (slug === 'stemcell_antiaging' || slug === 'stemcell_skin_shot') return 'face';

  // 기본값
  return 'face';
}

// =====================================================================
// Bin + count
// =====================================================================
const buckets = { face: [], eyes: [], nose: [], body: [], skin: [], hair: [], wellness: [], dental: [] };
const orderedKeys = ['face', 'eyes', 'nose', 'body', 'skin', 'hair', 'wellness', 'dental'];

for (const row of catalog) {
  const cat = classify(row);
  if (!buckets[cat]) {
    console.warn('unknown bucket:', cat, 'for', row.slug);
    continue;
  }
  buckets[cat].push(row);
}

// =====================================================================
// Output sheet rows
// =====================================================================
const summary = orderedKeys.map(k => ({
  category: k,
  display_name_en: ({
    face:'Face', eyes:'Eyes', nose:'Nose', body:'Body',
    skin:'Skin', hair:'Hair & Scalp', wellness:'Wellness & Regenerative', dental:'Dental'
  })[k],
  canonical_count: buckets[k].length,
  hospital_count_union: [...new Set(buckets[k].flatMap(r => (r.example_hospitals || '').split(',')))].filter(Boolean).length,
  intensity_surgery: buckets[k].filter(r => r.intensity_tier === 'surgery').length,
  intensity_petit: buckets[k].filter(r => r.intensity_tier === 'petit').length,
  intensity_skin: buckets[k].filter(r => r.intensity_tier === 'skin').length,
  example_slugs: buckets[k].slice(0, 5).map(r => r.slug).join(', ') + (buckets[k].length > 5 ? ', ...' : '')
}));

// Detail rows — each canonical with its assigned bucket
const detail = orderedKeys.flatMap(k =>
  buckets[k].map(r => ({
    category: k,
    canonical_id: r.id,
    slug: r.slug,
    name_ko: r.name_ko,
    name_en: r.name_en,
    intensity_tier: r.intensity_tier,
    mechanism: r.mechanism,
    body_areas: r.body_areas,
    hospital_count: r.hospital_count
  }))
);

// =====================================================================
// Write
// =====================================================================
const removeIfExists = (name) => {
  if (wb.SheetNames.includes(name)) {
    delete wb.Sheets[name];
    wb.SheetNames = wb.SheetNames.filter(n => n !== name);
  }
};

removeIfExists('CategoryBinning_Summary');
removeIfExists('CategoryBinning_Detail');

const wsS = XLSX.utils.json_to_sheet(summary);
wsS['!cols'] = [
  {wch:12},{wch:24},{wch:14},{wch:18},
  {wch:14},{wch:14},{wch:14},{wch:60}
];
XLSX.utils.book_append_sheet(wb, wsS, 'CategoryBinning_Summary');

const wsD = XLSX.utils.json_to_sheet(detail);
wsD['!cols'] = [
  {wch:12},{wch:8},{wch:32},{wch:30},{wch:38},
  {wch:14},{wch:26},{wch:24},{wch:8}
];
XLSX.utils.book_append_sheet(wb, wsD, 'CategoryBinning_Detail');

XLSX.writeFile(wb, xlsxPath);

// =====================================================================
// Report
// =====================================================================
console.log('=== 159 canonical → 8 카테고리 binning ===');
console.log('출력:', xlsxPath);
console.log('');
for (const k of orderedKeys) {
  const c = summary.find(s => s.category === k);
  console.log(`  ${k.padEnd(10)} : ${String(c.canonical_count).padStart(3)} canonicals` +
              ` | surgery=${String(c.intensity_surgery).padStart(2)} petit=${String(c.intensity_petit).padStart(2)} skin=${String(c.intensity_skin).padStart(2)}`);
}
const total = orderedKeys.reduce((acc, k) => acc + buckets[k].length, 0);
console.log(`  ${'-'.repeat(40)}`);
console.log(`  TOTAL      : ${String(total).padStart(3)} (원본 ${catalog.length}, 누락 ${catalog.length - total})`);

import db from '../src/data/db.js';
const recent = db.getRecentMatches(10);
console.log(`recent feed entries: ${recent.length}`);
recent.slice(0, 5).forEach((e, i) => {
  console.log(`  #${i+1} ${e.display_initial} (${e.country_label_en}) · "${e.concern_labels_en}" → ${e.treatment_label_en} @ ${e.hospital_label_en} [${e.outcome}]`);
});

// Test add
console.log('\nappending live entry...');
db.addPublicFeedEntry({
  display_initial: 'X.',
  country_code: 'KR',
  country_label_en: 'Korea',
  concern_labels_en: 'Pores',
  treatment_slug: 'picosure_pico',
  treatment_label_en: 'PicoSure',
  hospital_slug: 'lienjang_강남점',
  hospital_label_en: 'Lienjang',
  outcome: 'matched',
});
const after = db.getRecentMatches(10);
console.log(`after add: ${after.length} (first = ${after[0].display_initial})`);

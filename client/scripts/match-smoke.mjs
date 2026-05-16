import db from '../src/data/db.js';
import { matchOfferings } from '../src/utils/matching.js';

console.log('\n=== Test: pores only ===');
let m = matchOfferings({
  concernIds: [db.concernBySlug.pores.id],
  budgetMax: 1_500_000, downtimeMax: 3, painMax: 4, styleTarget: 2, language: 'en',
});
console.log(`matches: ${m.length}`);
m.forEach((x, i) => {
  const o = x.offering;
  console.log(`  #${i+1} score=${x.score} concern=${x.concernScore} ${o.brand.name_ko} · ${o.hp.local_name_ko} · ₩${(o.hp.starting_price_krw || 0).toLocaleString()}`);
});

console.log('\n=== Test: sagging+wrinkles+pores ===');
m = matchOfferings({
  concernIds: [db.concernBySlug.sagging.id, db.concernBySlug.wrinkles.id, db.concernBySlug.pores.id],
  budgetMax: 1_500_000, downtimeMax: 3, painMax: 4, styleTarget: 2, language: 'en',
});
console.log(`matches: ${m.length}`);
m.forEach((x, i) => {
  const o = x.offering;
  console.log(`  #${i+1} score=${x.score} concern=${x.concernScore} ${o.brand.name_ko} · ${o.hp.local_name_ko}`);
});

console.log('\n=== Test: face_size ===');
m = matchOfferings({
  concernIds: [db.concernBySlug.face_size.id],
  budgetMax: 1_500_000, downtimeMax: 3, painMax: 4, styleTarget: 2, language: 'en',
});
console.log(`matches: ${m.length}`);
m.forEach((x, i) => {
  const o = x.offering;
  console.log(`  #${i+1} score=${x.score} concern=${x.concernScore} ${o.brand.name_ko} · ${o.hp.local_name_ko}`);
});

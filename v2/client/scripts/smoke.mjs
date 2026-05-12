// Smoke test — import the db and assert nothing throws + key invariants hold.
import db from '../src/data/db.js';

const fails = [];

function assert(cond, msg) { if (!cond) fails.push(msg); }

assert(db.procedureCategories.length === 8, `expected 8 categories, got ${db.procedureCategories.length}`);
assert(db.procedures.length >= 28, `expected ≥28 procedures, got ${db.procedures.length}`);
assert(db.hospitals.length === 22, `expected 22 hospitals, got ${db.hospitals.length}`);
assert(db.brands.length === 22, `expected 22 brands, got ${db.brands.length}`);
assert(db.hospitalProcedures.length >= 50, `expected ≥50 hospital_procedures rows, got ${db.hospitalProcedures.length}`);

for (const h of db.hospitals) {
  assert(h.brand_id != null, `hospital ${h.slug} missing brand_id`);
  assert(h.name_ko && h.name_en, `hospital ${h.slug} missing names`);
}

for (const hp of db.hospitalProcedures) {
  assert(db.hospitalById[hp.hospital_id], `hp ${hp.id} dangling hospital_id ${hp.hospital_id}`);
  assert(db.procedureById[hp.procedure_id], `hp ${hp.id} dangling procedure_id ${hp.procedure_id}`);
}

// price range / offerings sanity
const hifuRange = db.priceRangeForProcedure(db.procedureBySlug['hifu_face'].id);
assert(hifuRange && hifuRange.min > 0 && hifuRange.max > hifuRange.min, `hifu price range broken: ${JSON.stringify(hifuRange)}`);

const hifuOfferings = db.offeringsForProcedure(db.procedureBySlug['hifu_face'].id);
assert(hifuOfferings.length >= 4, `hifu offerings should be ≥4, got ${hifuOfferings.length}`);

const hersheOfferings = db.offeringsForHospital(db.hospitalBySlug['hershe_청담점'].id);
assert(hersheOfferings.length >= 3, `hershe offerings should be ≥3, got ${hersheOfferings.length}`);

console.log(`procedures=${db.procedures.length} hospitals=${db.hospitals.length} brands=${db.brands.length} hp=${db.hospitalProcedures.length}`);
console.log(`hifu offerings=${hifuOfferings.length} hifu price range=${JSON.stringify(hifuRange)}`);
console.log(`hershe offerings=${hersheOfferings.length}`);

if (fails.length) {
  console.error('\n❌ FAILED:');
  fails.forEach((f) => console.error('  - ' + f));
  process.exit(1);
}
console.log('\n✅ smoke OK');

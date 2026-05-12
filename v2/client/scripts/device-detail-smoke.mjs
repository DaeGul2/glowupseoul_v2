import db from '../src/data/db.js';

for (const slug of ['ulthera', 'shurink', 'thermage']) {
  const d = db.deviceBySlug[slug];
  const offs = db.offeringsForDevice(slug);
  console.log(`\n${d.name_en} (${d.brands.join(', ')}):`);
  offs.forEach((o) => {
    const matched = o.hp.device_brands.filter((b) => d.brands.includes(b));
    console.log(`  - ${o.brand.name_ko} · ${o.procedure.name_ko} · device=${matched.join(', ')} · ₩${o.hp.starting_price_krw?.toLocaleString()}`);
  });
}

import db from '../src/data/db.js';
const stats = db.devicesWithStats();
console.log(`${stats.length} devices in taxonomy`);
stats.forEach((s) => {
  const range = s.price_min != null ? `₩${(s.price_min/10000).toFixed(0)}만 - ${(s.price_max/10000).toFixed(0)}만` : '—';
  console.log(`  ${s.device.name_en.padEnd(18)} · ${s.clinic_count} clinics · ${s.match_count} offerings · ${range}`);
});

// Remove the "## Who it's for" section from every procedure's Markdown
// description (it duplicates the `benefits` / "Good for" field). Surgical:
// reads the current description, strips only that section, saves back.
//   node scripts/strip-who-its-for.js
import 'dotenv/config';
import { Treatment, Surgery, Op } from '../db/modelsV3.js';

// Match "## Who it's for" (straight or curly apostrophe, or "Who is it for")
// up to the next "## " heading or end of string.
const RE = /\n*##\s*Who\s+(?:it'?s|is\s+it)\s+for[\s\S]*?(?=\n##\s|$)/i;

async function strip(M, label) {
  const rows = await M.findAll({ where: { deleted_at: { [Op.is]: null } }, attributes: ['id', 'slug', 'description'] });
  let n = 0;
  for (const r of rows) {
    const d = r.description || '';
    if (!RE.test(d)) continue;
    const next = d.replace(RE, '\n').replace(/\n{3,}/g, '\n\n').trim();
    await M.update({ description: next }, { where: { id: r.id } });
    n += 1; console.log(`   stripped ${label}: ${r.slug}`);
  }
  return n;
}

(async () => {
  const t = await strip(Treatment, 'treatment');
  const s = await strip(Surgery, 'surgery');
  console.log(`\n done — removed from ${t + s} rows.`);
  process.exit(0);
})().catch((e) => { console.error('failed:', e.message); process.exit(1); });

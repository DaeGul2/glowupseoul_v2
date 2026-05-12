// Apply db/schema.extend.mysql.sql to RDS. Idempotent.
//   node scripts/extend.js
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolvePath(dirname(__filename), '..', '..');

function splitStatements(sql) {
  const cleaned = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  return cleaned
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  if (!process.env.DB_HOST || !process.env.DB_PASSWORD) {
    console.error('✗ DB_HOST / DB_PASSWORD not set');
    process.exit(1);
  }
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'glowupseoul',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  });
  try {
    const sql = readFileSync(resolvePath(REPO_ROOT, 'db/schema.extend.mysql.sql'), 'utf8');
    const stmts = splitStatements(sql);
    console.log(`→ extend (db/schema.extend.mysql.sql): ${stmts.length} statements`);
    // errno allow-list = idempotent re-runs
    //   1050 table already exists
    //   1060 duplicate column name
    //   1061 duplicate key name
    //   1826 duplicate FK constraint name
    const SKIP_ERRNO = new Set([1050, 1060, 1061, 1826]);
    for (const [i, stmt] of stmts.entries()) {
      try {
        await conn.query(stmt);
        process.stdout.write('.');
      } catch (e) {
        if (SKIP_ERRNO.has(e.errno)) {
          process.stdout.write('-');
          continue;
        }
        console.error(`\n  ✗ stmt ${i + 1} failed: ${e.message}`);
        console.error('    SQL:', stmt.slice(0, 200), stmt.length > 200 ? '…' : '');
        throw e;
      }
    }
    console.log(' ok');
    console.log('\n✓ extend complete');
  } catch (e) {
    console.error('\n✗ extend aborted:', e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();

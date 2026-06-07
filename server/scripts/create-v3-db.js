// Create the v3 database (DB_NAME, e.g. glowupseoul_v3) on RDS and apply
// db/schema.v3.sql. Idempotent (CREATE TABLE IF NOT EXISTS).
//
//   node scripts/create-v3-db.js
//
// Optional:  --db-name=<name>   (default: env DB_NAME)

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolvePath(dirname(__filename), '..', '..');

const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const has = (k) => args.includes(`--${k}`);
const TARGET_DB = flag('db-name') || process.env.DB_NAME || 'glowupseoul_v3';
const FRESH = has('fresh');   // drop existing v3 tables first (schema changed)

// Drop order respects FK deps (joins → tags → base tables).
const DROP_ORDER = [
  'surgery_concerns', 'treatment_concerns', 'surgery_tags', 'treatment_tags',
  'concerns', 'concern_areas', 'tags', 'surgeries', 'treatments',
];

function splitStatements(sql) {
  const cleaned = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  return cleaned.split(/;\s*(?:\r?\n|$)/).map((s) => s.trim()).filter(Boolean);
}

async function main() {
  if (!process.env.DB_HOST || !process.env.DB_PASSWORD) {
    console.error('✗ DB_HOST / DB_PASSWORD not set in server/.env');
    process.exit(1);
  }
  console.log(`Target DB:  ${TARGET_DB}`);
  console.log(`RDS host:   ${process.env.DB_HOST}\n`);

  const ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: false };
  const connOpts = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl,
  };

  // Phase 1 — ensure database exists.
  console.log('→ ensuring database exists…');
  const root = await mysql.createConnection(connOpts);
  try {
    await root.query(
      `CREATE DATABASE IF NOT EXISTS \`${TARGET_DB}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✓ database \`${TARGET_DB}\` ready`);
  } finally {
    await root.end();
  }

  // Phase 2 — apply schema.v3.sql.
  console.log('\n→ applying db/schema.v3.sql…');
  const conn = await mysql.createConnection({ ...connOpts, database: TARGET_DB, multipleStatements: false });
  try {
    if (FRESH) {
      console.log('  --fresh: dropping existing v3 tables…');
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const t of DROP_ORDER) await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    const sql = readFileSync(resolvePath(REPO_ROOT, 'db/schema.v3.sql'), 'utf8');
    const stmts = splitStatements(sql);
    for (const [i, stmt] of stmts.entries()) {
      try {
        await conn.query(stmt);
        process.stdout.write('.');
      } catch (e) {
        console.error(`\n  ✗ stmt ${i + 1} failed: ${e.code || ''} ${e.message}`);
        console.error('    SQL:', stmt.slice(0, 200));
        throw e;
      }
    }
    console.log(` ok (${stmts.length} statements)`);

    // Summary
    for (const t of ['treatments', 'surgeries']) {
      const [r] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
      console.log(`   ${t.padEnd(14)} ${r[0].n} rows`);
    }
  } finally {
    await conn.end();
  }
  console.log('\n✓ done.');
}

main().catch((e) => { console.error('\n✗ failed:', e.message); process.exit(1); });

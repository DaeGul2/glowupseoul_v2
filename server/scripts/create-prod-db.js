// Create the `glowupseoul_prod` database on RDS and apply schema + lookup
// seeds. Idempotent — re-running is a no-op for an already-provisioned DB
// because the schema uses CREATE TABLE IF NOT EXISTS and seeds use
// ON DUPLICATE KEY UPDATE.
//
//   node scripts/create-prod-db.js
//
// Optional flags:
//   --db-name=<name>      target DB name (default: env DB_NAME or 'glowupseoul_prod')
//   --skip-extend         skip db/schema.extend.mysql.sql
//   --skip-seeds          skip lookup seeds (mechanisms / categories)

import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolvePath(dirname(__filename), '..', '..');

const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const has = (k) => args.includes(`--${k}`);

const TARGET_DB = flag('db-name') || process.env.DB_NAME || 'glowupseoul_prod';
const SKIP_EXTEND = has('skip-extend');
const SKIP_SEEDS  = has('skip-seeds');

function readSql(rel) {
  return readFileSync(resolvePath(REPO_ROOT, rel), 'utf8');
}

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

// Same idempotent-friendly error codes the extend script swallows.
const SOFT_ERRORS = new Set([
  'ER_TABLE_EXISTS_ERROR',       // 1050
  'ER_DUP_FIELDNAME',            // 1060
  'ER_DUP_KEYNAME',              // 1061
  'ER_FK_DUP_NAME',              // 1826
  'ER_CANT_DROP_FIELD_OR_KEY',   // 1091 (drop attempt on missing key)
]);

async function runRawFile(conn, rel, label, { tolerateSoft = false } = {}) {
  const stmts = splitStatements(readSql(rel));
  console.log(`\n→ ${label} (${rel}) — ${stmts.length} statements`);
  let okCount = 0;
  let softCount = 0;
  for (const [i, stmt] of stmts.entries()) {
    try {
      await conn.query(stmt);
      okCount++;
      process.stdout.write('.');
    } catch (e) {
      if (tolerateSoft && SOFT_ERRORS.has(e.code)) {
        softCount++;
        process.stdout.write('~');
        continue;
      }
      console.error(`\n  ✗ stmt ${i + 1} failed: ${e.code || ''} ${e.message}`);
      console.error('    SQL:', stmt.slice(0, 220), stmt.length > 220 ? '…' : '');
      throw e;
    }
  }
  console.log(` ok (${okCount} applied${softCount ? `, ${softCount} already-present` : ''})`);
}

async function main() {
  if (!process.env.DB_HOST || !process.env.DB_PASSWORD) {
    console.error('✗ DB_HOST / DB_PASSWORD not set in server/.env');
    process.exit(1);
  }

  console.log(`Target DB:  ${TARGET_DB}`);
  console.log(`RDS host:   ${process.env.DB_HOST}`);
  console.log(`User:       ${process.env.DB_USER}\n`);

  // -------- Phase 1 — connect WITHOUT a database; ensure target DB exists --------
  console.log('→ Phase 1: connecting to RDS (no db selected)…');
  const rootConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  });

  try {
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${TARGET_DB}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✓ database \`${TARGET_DB}\` exists (or was just created)`);
    // Sanity-check: does it actually exist now?
    const [rows] = await rootConn.query(
      `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [TARGET_DB]
    );
    if (rows.length === 0) throw new Error(`database \`${TARGET_DB}\` not found after CREATE`);
  } finally {
    await rootConn.end();
  }

  // -------- Phase 2 — re-connect to that DB and apply schema + seeds --------
  console.log(`\n→ Phase 2: applying schema + seeds to \`${TARGET_DB}\`…`);
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: TARGET_DB,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
    multipleStatements: false,
  });

  try {
    await runRawFile(conn, 'db/schema.mysql.sql', 'schema');

    if (!SKIP_EXTEND) {
      const extendPath = resolvePath(REPO_ROOT, 'db/schema.extend.mysql.sql');
      if (existsSync(extendPath)) {
        await runRawFile(conn, 'db/schema.extend.mysql.sql', 'schema extend', { tolerateSoft: true });
      } else {
        console.log('\n→ no db/schema.extend.mysql.sql, skipping');
      }
    }

    if (!SKIP_SEEDS) {
      await runRawFile(conn, 'db/seed/mechanisms.mysql.sql', 'seed: mechanisms');
      await runRawFile(conn, 'db/seed/procedure_categories.mysql.sql', 'seed: procedure_categories');
    }

    // -------- Phase 3 — summary --------
    console.log('\n→ Phase 3: counting…');
    const tables = ['mechanisms', 'procedure_categories', 'concerns', 'procedures', 'brands', 'hospitals', 'hospital_procedures', 'public_feed_entries'];
    for (const t of tables) {
      try {
        const [r] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
        console.log(`   ${t.padEnd(28)} ${r[0].n}`);
      } catch (e) {
        console.log(`   ${t.padEnd(28)} (n/a — ${e.code || e.message})`);
      }
    }
  } finally {
    await conn.end();
  }

  console.log('\n✓ done.');
}

main().catch((e) => {
  console.error('\n✗ failed:', e.message);
  process.exit(1);
});

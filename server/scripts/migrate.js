// Apply schema + lookup seeds to RDS.
//
//   node scripts/migrate.js                  # raw SQL (CHECK constraints preserved)
//   node scripts/migrate.js --schema         # schema only (raw SQL)
//   node scripts/migrate.js --seeds          # lookup seeds only
//   node scripts/migrate.js --use-sequelize  # Sequelize sync({alter:false}) instead of raw SQL
//
// Default = raw SQL path so the live DDL matches db/schema.mysql.sql byte-for-byte
// (Sequelize sync skips CHECK constraints and a few index nuances).

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { getSequelize, closeSequelize, hasDbConfig } from '../db/sequelize.js';
import '../db/models.js';  // register models on the sequelize instance

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolvePath(dirname(__filename), '..', '..');

const args = new Set(process.argv.slice(2));
const useSequelize = args.has('--use-sequelize');
const runSchema    = args.size === 0 || args.has('--schema');
const runSeeds     = args.size === 0 || args.has('--seeds');

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

async function runRawFile(conn, rel, label) {
  const stmts = splitStatements(readSql(rel));
  console.log(`\n→ ${label} (${rel}): ${stmts.length} statements`);
  for (const [i, stmt] of stmts.entries()) {
    try {
      await conn.query(stmt);
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n  ✗ stmt ${i + 1} failed: ${e.message}`);
      console.error('    SQL:', stmt.slice(0, 200), stmt.length > 200 ? '…' : '');
      throw e;
    }
  }
  console.log(' ok');
}

async function rawPath() {
  // Use a fresh mysql2 connection (Sequelize's pool isn't ideal for batched DDL).
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'glowupseoul',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
    multipleStatements: false,
  });
  try {
    if (runSchema) await runRawFile(conn, 'db/schema.mysql.sql', 'schema');
    if (runSeeds) {
      await runRawFile(conn, 'db/seed/mechanisms.mysql.sql', 'seed: mechanisms');
      await runRawFile(conn, 'db/seed/procedure_categories.mysql.sql', 'seed: procedure_categories');
    }
  } finally {
    await conn.end();
  }
}

async function sequelizePath() {
  const sequelize = getSequelize();
  await sequelize.authenticate();
  console.log('→ sequelize.sync({ alter: false }) …');
  await sequelize.sync({ alter: false });
  console.log('✓ models synced (CHECK constraints from db/schema.mysql.sql NOT applied — use raw path for prod)');
  if (runSeeds) {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'glowupseoul',
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
    });
    try {
      await runRawFile(conn, 'db/seed/mechanisms.mysql.sql', 'seed: mechanisms');
      await runRawFile(conn, 'db/seed/procedure_categories.mysql.sql', 'seed: procedure_categories');
    } finally {
      await conn.end();
    }
  }
}

async function main() {
  if (!hasDbConfig()) {
    console.error('✗ DB_HOST / DB_PASSWORD not set');
    process.exit(1);
  }
  try {
    if (useSequelize) await sequelizePath();
    else              await rawPath();
    console.log('\n✓ migration complete');
  } catch (e) {
    console.error('\n✗ migration aborted:', e.message);
    process.exitCode = 1;
  } finally {
    await closeSequelize();
  }
}

main();

// Clone one MySQL database into another on the same RDS instance.
// Copies table DDL (incl. FKs via SHOW CREATE TABLE) + all rows.
//
//   node scripts/clone-db.js                          # glowupseoul_v3 → glowupseoul_v3_dev
//   node scripts/clone-db.js --src=A --dest=B
//
// Idempotent: dest tables are dropped and recreated each run.

import 'dotenv/config';
import mysql from 'mysql2/promise';

const args = process.argv.slice(2);
const flag = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] || d;
const SRC = flag('src', 'glowupseoul_v3');
const DEST = flag('dest', 'glowupseoul_v3_dev');

async function main() {
  if (!process.env.DB_HOST || !process.env.DB_PASSWORD) {
    console.error('✗ DB_HOST / DB_PASSWORD not set in server/.env');
    process.exit(1);
  }
  if (SRC === DEST) {
    console.error('✗ src and dest are the same database');
    process.exit(1);
  }
  console.log(`Clone: \`${SRC}\` → \`${DEST}\`  (host: ${process.env.DB_HOST})\n`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
    multipleStatements: false,
  });

  try {
    // dest database
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DEST}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    // source tables (base tables only)
    const [tables] = await conn.query(
      `SELECT TABLE_NAME AS t FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
      [SRC]
    );
    if (!tables.length) {
      console.error(`✗ source \`${SRC}\` has no tables`);
      process.exit(1);
    }
    console.log(`source tables: ${tables.map((r) => r.t).join(', ')}\n`);

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query(`USE \`${DEST}\``);

    // 1) DDL — SHOW CREATE TABLE keeps FKs/indexes/charset intact
    for (const { t } of tables) {
      const [[row]] = await conn.query(`SHOW CREATE TABLE \`${SRC}\`.\`${t}\``);
      await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
      await conn.query(row['Create Table']);
      console.log(`  ✓ table created  ${t}`);
    }

    // 2) data
    console.log('');
    for (const { t } of tables) {
      await conn.query(`INSERT INTO \`${DEST}\`.\`${t}\` SELECT * FROM \`${SRC}\`.\`${t}\``);
      const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${DEST}\`.\`${t}\``);
      const [[{ m }]] = await conn.query(`SELECT COUNT(*) AS m FROM \`${SRC}\`.\`${t}\``);
      const ok = Number(n) === Number(m);
      console.log(`  ${ok ? '✓' : '✗'} rows copied   ${t}  (${n}/${m})`);
      if (!ok) process.exitCode = 1;
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`\n✓ done — \`${DEST}\` is a full copy of \`${SRC}\``);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error('✗ clone failed:', e.message);
  process.exit(1);
});

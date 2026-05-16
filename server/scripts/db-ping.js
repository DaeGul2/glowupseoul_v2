// Diagnostic: try to reach RDS, list databases, ensure target DB exists.
// Doesn't touch any tables. Safe to re-run.
import 'dotenv/config';
import mysql from 'mysql2/promise';

const cfg = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectTimeout: 8000,
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
};

if (!cfg.host || !cfg.password) {
  console.error('✗ DB_HOST or DB_PASSWORD missing');
  process.exit(1);
}

console.log(`→ connecting to ${cfg.host}:${cfg.port} as ${cfg.user} …`);
const t0 = Date.now();

try {
  const conn = await mysql.createConnection(cfg);
  console.log(`✓ TCP+TLS+auth ok (${Date.now() - t0} ms)`);

  const [version] = await conn.query('SELECT VERSION() AS v');
  console.log(`  MySQL version: ${version[0].v}`);

  const [dbs] = await conn.query('SHOW DATABASES');
  const names = dbs.map((r) => r.Database);
  console.log(`  databases: ${names.join(', ')}`);

  const target = process.env.DB_NAME || 'glowupseoul';
  if (names.includes(target)) {
    console.log(`✓ target db '${target}' exists`);
  } else {
    console.log(`⚠ target db '${target}' missing — creating …`);
    await conn.query(`CREATE DATABASE \`${target}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✓ created '${target}'`);
  }

  await conn.end();
  process.exit(0);
} catch (e) {
  console.error(`✗ FAILED (${Date.now() - t0} ms)`);
  console.error(`  code: ${e.code}`);
  console.error(`  errno: ${e.errno}`);
  console.error(`  message: ${e.message}`);
  if (e.code === 'ETIMEDOUT' || e.code === 'ECONNREFUSED') {
    console.error('\n  → Likely cause: RDS Security Group blocking your IP.');
    console.error('    AWS Console → RDS → DB → Connectivity → VPC security groups');
    console.error('    → Inbound rules → add MYSQL/Aurora (3306) from "My IP"');
  } else if (e.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('\n  → DB_USER / DB_PASSWORD mismatch with RDS master credentials.');
  } else if (e.code === 'ENOTFOUND') {
    console.error('\n  → DB_HOST DNS lookup failed. Check endpoint string.');
  }
  process.exit(2);
}

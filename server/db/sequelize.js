// Sequelize singleton. Mirrors the connection options that pool.js used to
// expose, but lets the ORM own connection management.
import { Sequelize } from 'sequelize';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

let _sequelize = null;

function buildSslOption() {
  const mode = (process.env.DB_SSL_MODE || 'rds').trim().toLowerCase();
  if (mode === 'false' || mode === 'off' || mode === '0') return false;

  if (process.env.DB_SSL_CA_PATH) {
    return {
      ca: readFileSync(resolvePath(process.env.DB_SSL_CA_PATH), 'utf8'),
      minVersion: 'TLSv1.2',
    };
  }

  if (mode === 'rds') {
    try {
      const p = resolvePath(process.cwd(), 'certs', 'rds-global-bundle.pem');
      return { ca: readFileSync(p, 'utf8'), minVersion: 'TLSv1.2' };
    } catch {
      return { minVersion: 'TLSv1.2', rejectUnauthorized: false };
    }
  }
  return { minVersion: 'TLSv1.2' };
}

export function hasDbConfig() {
  return Boolean(process.env.DB_HOST && process.env.DB_PASSWORD);
}

export function getSequelize() {
  if (_sequelize) return _sequelize;
  if (!hasDbConfig()) {
    throw new Error('[db] DB_HOST / DB_PASSWORD not set — refusing to init Sequelize');
  }
  _sequelize = new Sequelize(
    process.env.DB_NAME || 'glowupseoul',
    process.env.DB_USER || 'admin',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      dialectOptions: {
        ssl: buildSslOption(),
        dateStrings: false,
        charset: process.env.DB_CHARSET || 'utf8mb4',
      },
      pool: {
        max: Number(process.env.DB_CONNECTION_LIMIT) || 10,
        min: 0,
        idle: 10_000,
        acquire: 30_000,
      },
      logging: process.env.DB_LOG === '1' ? console.log : false,
      timezone: '+00:00',  // store/read UTC; convert at display edge
      define: {
        underscored: false,         // models already use snake_case field names
        freezeTableName: true,      // model.tableName must match SQL exactly
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );
  return _sequelize;
}

export async function closeSequelize() {
  if (_sequelize) {
    await _sequelize.close();
    _sequelize = null;
  }
}

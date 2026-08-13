/**
 * Creates the database if needed and applies db/schema.sql.
 * Destructive: schema.sql drops every table before recreating it.
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'yaleclubs';

async function main() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  };

  const root = await mysql.createConnection(config);
  await root.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await root.end();

  const conn = await mysql.createConnection({ ...config, database: DB_NAME });
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await conn.query(sql);
  await conn.end();

  console.log(`✓ schema applied to \`${DB_NAME}\` at ${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error('✗ migration failed:', err.message);
  process.exit(1);
});

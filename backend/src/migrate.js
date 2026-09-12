const fs = require('node:fs/promises');
const path = require('node:path');
const { query, pool } = require('./db');

async function migrate() {
  const schema = await fs.readFile(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await query(schema);
  console.log('Database schema applied.');
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => pool.end());

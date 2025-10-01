#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Cargar .env del backend (si existe)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const sqlPath = path.join(__dirname, '..', 'db', 'sql', 'add_defaults.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('No se encontró', sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, { encoding: 'utf8' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL no encontrada en backend/.env');
  process.exit(2);
}

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Iniciando transacción y aplicando SQL...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ SQL aplicado correctamente.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    console.error('❌ Error aplicando SQL:', err.message || err);
    process.exitCode = 3;
  } finally {
    await client.end();
  }
}

run();

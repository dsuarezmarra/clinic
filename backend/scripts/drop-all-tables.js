/**
 * Script para eliminar todas las tablas del Supabase personal
 * Esto deja la base de datos limpia para importar desde el Supabase del trabajo
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function dropAllTables() {
  const client = await pool.connect();
  
  try {
    console.log('=== Eliminando todas las tablas del schema public ===\n');
    
    // Obtener todas las tablas del schema public
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(r => r.tablename);
    console.log('Tablas encontradas:', tables.length);
    console.log(tables.join('\n'));
    
    if (tables.length === 0) {
      console.log('\nNo hay tablas que eliminar.');
      return;
    }
    
    console.log('\n--- Eliminando tablas ---\n');
    
    // Desactivar restricciones temporalmente
    await client.query('SET session_replication_role = replica;');
    
    // Eliminar cada tabla
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`? Eliminada: ${table}`);
      } catch (err) {
        console.log(`? Error eliminando ${table}: ${err.message}`);
      }
    }
    
    // Reactivar restricciones
    await client.query('SET session_replication_role = DEFAULT;');
    
    console.log('\n=== Todas las tablas eliminadas ===');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

dropAllTables();

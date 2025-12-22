/**
 * Script de Migración de Datos: Trabajo ? Personal
 * ================================================
 * 
 * Este script exporta datos desde Supabase de trabajo e importa a Supabase personal.
 * 
 * PREREQUISITOS:
 * 1. Ejecutar primero migrate-schema-to-personal.sql en Supabase personal
 * 2. Configurar las credenciales de ambas bases de datos
 * 
 * USO:
 * 1. Configurar las credenciales abajo
 * 2. Ejecutar: node scripts/migrate-data.js
 */

const https = require('https');

// =========================================================
// CONFIGURACIÓN - MODIFICAR ESTAS CREDENCIALES
// =========================================================

const CONFIG = {
  // Supabase de TRABAJO (origen - dsuarez12345)
  work: {
    url: 'https://skukyfkrwqsfnkbxedty.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjExNjgsImV4cCI6MjA3MjAzNzE2OH0.b1muFW9Ht0f_OLW16dfooA5wro2LnxsvW1NDmtVN-Rg',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ2MTE2OCwiZXhwIjoyMDcyMDM3MTY4fQ.Df8E2G--ulzTVUXeSBHgNRm9qQTeZDi_TYlG1UD02BQ'
  },
  
  // Supabase PERSONAL (destino - dsuarezmarra)
  personal: {
    url: 'https://kctoxebchyrgkwofdkht.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdG94ZWJjaHlyZ2t3b2Zka2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTgxNDYsImV4cCI6MjA4MTk5NDE0Nn0.WAvvg89qBQ_APPR4TKeVMd9ARBn2tbkRoW3kVLCOTJ0',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdG94ZWJjaHlyZ2t3b2Zka2h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxODE0NiwiZXhwIjoyMDgxOTk0MTQ2fQ.flxX_nhymMXBVMtkQe0MpcjM1fzZF6t_-_vgKkhx06c'
  }
};

// =========================================================
// TABLAS A MIGRAR (en orden de dependencias)
// =========================================================

const TABLES_TO_MIGRATE = [
  // Sistema
  'tenants',
  'user_profiles',
  
  // Configuración
  'configurations_actifisio',
  'configurations_masajecorporaldeportivo',
  
  // Backups
  'backups_actifisio',
  'backups_masajecorporaldeportivo',
  
  // Pacientes (primero, ya que otras tablas dependen de ellos)
  'patients_actifisio',
  'patients_masajecorporaldeportivo',
  
  // Citas
  'appointments_actifisio',
  'appointments_masajecorporaldeportivo',
  
  // Packs de crédito
  'credit_packs_actifisio',
  'credit_packs_masajecorporaldeportivo',
  
  // Facturas
  'invoices_actifisio',
  'invoices_masajecorporaldeportivo',
  
  // Archivos de pacientes
  'patient_files_actifisio',
  'patient_files_masajecorporaldeportivo',
  
  // Redempciones de crédito
  'credit_redemptions_actifisio',
  'credit_redemptions_masajecorporaldeportivo',
  
  // Items de factura
  'invoice_items_actifisio',
  'invoice_items_masajecorporaldeportivo'
];

// =========================================================
// FUNCIONES DE API
// =========================================================

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(data);
          }
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function fetchFromSupabase(config, table, useServiceKey = true) {
  const url = new URL(`${config.url}/rest/v1/${table}`);
  url.searchParams.set('select', '*');
  
  const options = {
    hostname: url.hostname,
    path: `${url.pathname}${url.search}`,
    method: 'GET',
    headers: {
      'apikey': useServiceKey ? config.serviceKey : config.anonKey,
      'Authorization': `Bearer ${useServiceKey ? config.serviceKey : config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  
  return makeRequest(options);
}

async function insertToSupabase(config, table, data, useServiceKey = true) {
  if (!data || data.length === 0) {
    return { inserted: 0 };
  }
  
  const url = new URL(`${config.url}/rest/v1/${table}`);
  
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'apikey': useServiceKey ? config.serviceKey : config.anonKey,
      'Authorization': `Bearer ${useServiceKey ? config.serviceKey : config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates,return=minimal'
    }
  };
  
  await makeRequest(options, JSON.stringify(data));
  return { inserted: data.length };
}

// =========================================================
// MIGRACIÓN PRINCIPAL
// =========================================================

async function migrateTable(tableName) {
  console.log(`\n?? Migrando tabla: ${tableName}`);
  
  try {
    // 1. Obtener datos de origen
    console.log(`   ??  Obteniendo datos de trabajo...`);
    const data = await fetchFromSupabase(CONFIG.work, tableName);
    
    if (!data || data.length === 0) {
      console.log(`   ? Tabla vacía, saltando...`);
      return { table: tableName, status: 'empty', count: 0 };
    }
    
    console.log(`   ?? ${data.length} registros encontrados`);
    
    // 2. Insertar en destino
    console.log(`   ??  Insertando en personal...`);
    const result = await insertToSupabase(CONFIG.personal, tableName, data);
    
    console.log(`   ? ${result.inserted} registros migrados`);
    return { table: tableName, status: 'success', count: data.length };
    
  } catch (error) {
    console.log(`   ? Error: ${error.message}`);
    return { table: tableName, status: 'error', error: error.message };
  }
}

async function runMigration() {
  console.log('??????????????????????????????????????????????????????????????');
  console.log('?   MIGRACIÓN DE DATOS: Supabase Trabajo ? Supabase Personal ?');
  console.log('??????????????????????????????????????????????????????????????');
  
  // Verificar configuración
  console.log('\n?? Configuración:');
  console.log(`   Origen (Trabajo): ${CONFIG.work.url}`);
  console.log(`   Destino (Personal): ${CONFIG.personal.url}`);
  console.log('');
  
  const results = [];
  
  for (const table of TABLES_TO_MIGRATE) {
    const result = await migrateTable(table);
    results.push(result);
  }
  
  // Resumen
  console.log('\n??????????????????????????????????????????????????????????????');
  console.log('?                    RESUMEN DE MIGRACIÓN                     ?');
  console.log('??????????????????????????????????????????????????????????????\n');
  
  const successful = results.filter(r => r.status === 'success');
  const empty = results.filter(r => r.status === 'empty');
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`? Tablas migradas: ${successful.length}`);
  console.log(`? Tablas vacías: ${empty.length}`);
  console.log(`? Errores: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrores encontrados:');
    errors.forEach(e => console.log(`   - ${e.table}: ${e.error}`));
  }
  
  const totalRecords = successful.reduce((sum, r) => sum + r.count, 0);
  console.log(`\n?? Total de registros migrados: ${totalRecords}`);
}

// Ejecutar
runMigration().catch(console.error);

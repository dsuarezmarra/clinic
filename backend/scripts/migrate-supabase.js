/**
 * Script de migración de Supabase
 * Migra tablas y datos desde el proyecto del trabajo al proyecto personal
 * 
 * Uso: node migrate-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración - Supabase del TRABAJO (origen)
const SOURCE_SUPABASE_URL = 'https://skukyfkrwqsfnkbxedty.supabase.co';
const SOURCE_SUPABASE_KEY = process.env.SOURCE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ2MTE2OCwiZXhwIjoyMDcyMDM3MTY4fQ.Df8E2G--ulzTVUXeSBHgNRm9qQTeZDi_TYlG1UD02BQ';

// Configuración - Supabase PERSONAL (destino)
const TARGET_SUPABASE_URL = 'https://kctoxebchyrgkwofdkht.supabase.co';
const TARGET_SUPABASE_KEY = process.env.TARGET_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdG94ZWJjaHlyZ2t3b2Zka2h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxODE0NiwiZXhwIjoyMDgxOTk0MTQ2fQ.flxX_nhymMXBVMtkQe0MpcjM1fzZF6t_-_vgKkhx06c';

// Lista de tablas a migrar (en orden para respetar foreign keys)
const TABLES_TO_MIGRATE = [
  // Primero las tablas base sin dependencias
  'tenants',
  'user_profiles',
  
  // Tablas de masajecorporaldeportivo
  'patients_masajecorporaldeportivo',
  'configurations_masajecorporaldeportivo',
  'appointments_masajecorporaldeportivo',
  'credit_packs_masajecorporaldeportivo',
  'credit_redemptions_masajecorporaldeportivo',
  'invoices_masajecorporaldeportivo',
  'invoice_items_masajecorporaldeportivo',
  'patient_files_masajecorporaldeportivo',
  'backups_masajecorporaldeportivo',
  
  // Tablas de actifisio
  'patients_actifisio',
  'configurations_actifisio',
  'appointments_actifisio',
  'credit_packs_actifisio',
  'credit_redemptions_actifisio',
  'invoices_actifisio',
  'invoice_items_actifisio',
  'patient_files_actifisio',
  'backups_actifisio',
];

// Crear clientes
const sourceClient = createClient(SOURCE_SUPABASE_URL, SOURCE_SUPABASE_KEY);
const targetClient = createClient(TARGET_SUPABASE_URL, TARGET_SUPABASE_KEY);

async function migrateTable(tableName) {
  console.log(`\n?? Migrando tabla: ${tableName}`);
  
  try {
    // Obtener todos los datos de la tabla origen
    const { data: sourceData, error: sourceError } = await sourceClient
      .from(tableName)
      .select('*');
    
    if (sourceError) {
      console.log(`  ?? Error leyendo ${tableName}: ${sourceError.message}`);
      return { success: false, table: tableName, error: sourceError.message };
    }
    
    if (!sourceData || sourceData.length === 0) {
      console.log(`  ?? Tabla ${tableName} vacía o no existe`);
      return { success: true, table: tableName, rows: 0 };
    }
    
    console.log(`  ?? Leídos ${sourceData.length} registros`);
    
    // Insertar en la tabla destino (upsert para evitar duplicados)
    const { data: insertedData, error: targetError } = await targetClient
      .from(tableName)
      .upsert(sourceData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (targetError) {
      console.log(`  ? Error insertando en ${tableName}: ${targetError.message}`);
      return { success: false, table: tableName, error: targetError.message };
    }
    
    console.log(`  ? Migrados ${sourceData.length} registros exitosamente`);
    return { success: true, table: tableName, rows: sourceData.length };
    
  } catch (error) {
    console.log(`  ? Error en ${tableName}: ${error.message}`);
    return { success: false, table: tableName, error: error.message };
  }
}

async function main() {
  console.log('????????????????????????????????????????????????????????????????');
  console.log('?     MIGRACIÓN DE SUPABASE - TRABAJO ? PERSONAL              ?');
  console.log('????????????????????????????????????????????????????????????????');
  console.log('');
  console.log(`?? Origen: ${SOURCE_SUPABASE_URL}`);
  console.log(`?? Destino: ${TARGET_SUPABASE_URL}`);
  console.log('');
  
  // Verificar conexión al origen
  console.log('?? Verificando conexión al origen...');
  const { data: sourceTest, error: sourceTestError } = await sourceClient
    .from('tenants')
    .select('count')
    .limit(1);
  
  if (sourceTestError) {
    console.error('? No se puede conectar al Supabase origen:', sourceTestError.message);
    console.log('\n?? Asegúrate de configurar SOURCE_SUPABASE_KEY con el service_role key del trabajo');
    process.exit(1);
  }
  console.log('? Conexión al origen verificada');
  
  // Verificar conexión al destino
  console.log('?? Verificando conexión al destino...');
  const { data: targetTest, error: targetTestError } = await targetClient
    .from('tenants')
    .select('count')
    .limit(1);
  
  // Si la tabla no existe en destino, es normal - la crearemos
  if (targetTestError && !targetTestError.message.includes('does not exist')) {
    console.error('? No se puede conectar al Supabase destino:', targetTestError.message);
    process.exit(1);
  }
  console.log('? Conexión al destino verificada');
  
  console.log('\n?? Tablas a migrar:', TABLES_TO_MIGRATE.length);
  console.log('?'.repeat(60));
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  let totalRows = 0;
  
  for (const table of TABLES_TO_MIGRATE) {
    const result = await migrateTable(table);
    results.push(result);
    
    if (result.success) {
      successCount++;
      totalRows += result.rows || 0;
    } else {
      failCount++;
    }
  }
  
  // Resumen
  console.log('\n');
  console.log('?'.repeat(60));
  console.log('?? RESUMEN DE MIGRACIÓN');
  console.log('?'.repeat(60));
  console.log(`? Tablas exitosas: ${successCount}`);
  console.log(`? Tablas fallidas: ${failCount}`);
  console.log(`?? Total registros migrados: ${totalRows}`);
  console.log('');
  
  if (failCount > 0) {
    console.log('?? Tablas con errores:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`);
    });
  }
  
  console.log('\n?? Migración completada!');
}

main().catch(console.error);

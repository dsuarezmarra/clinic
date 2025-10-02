/**
 * Script de Backup Manual Pre-Migration
 * 
 * Este script exporta TODOS los datos de las tablas actuales
 * a archivos JSON como backup de seguridad.
 * 
 * Uso:
 *   node backup-pre-migration.js
 */

const fs = require('fs');
const path = require('path');

// Cargar configuración de Supabase
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY requeridas');
  process.exit(1);
}

// Helper para hacer peticiones a Supabase
async function supabaseFetch(endpoint) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error fetching ${endpoint}: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function main() {
  console.log('💾 ============================================');
  console.log('   Backup Manual Pre-Migration');
  console.log('   ============================================\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].substring(0, 8);
  
  const backupDir = path.join(__dirname, '..', 'backups', `pre-migration-${timestamp}`);
  
  // Crear directorio de backup
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📁 Directorio de backup: ${backupDir}\n`);

  const tables = [
    'patients',
    'appointments',
    'credit_packs',
    'credit_redemptions',
    'configurations',
    'backups'
  ];

  let totalRecords = 0;
  const summary = {};

  for (const table of tables) {
    try {
      process.stdout.write(`📥 Exportando ${table}... `);
      
      const data = await supabaseFetch(`${table}?select=*&order=created_at.asc`);
      
      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      summary[table] = data.length;
      totalRecords += data.length;
      
      console.log(`✅ ${data.length} registros`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      summary[table] = 'ERROR';
    }
  }

  // Guardar resumen del backup
  const summaryData = {
    timestamp: new Date().toISOString(),
    tables: summary,
    totalRecords,
    supabaseUrl: SUPABASE_URL
  };

  fs.writeFileSync(
    path.join(backupDir, 'backup-summary.json'),
    JSON.stringify(summaryData, null, 2),
    'utf8'
  );

  console.log('\n📊 ============================================');
  console.log('   Resumen del Backup');
  console.log('   ============================================\n');
  
  Object.entries(summary).forEach(([table, count]) => {
    console.log(`   ${table.padEnd(25)} ${count} registros`);
  });
  
  console.log(`\n   Total: ${totalRecords} registros`);
  console.log('\n✅ Backup completado exitosamente!');
  console.log(`📁 Ubicación: ${backupDir}\n`);

  // Crear archivo README en el backup
  const readmeContent = `# Backup Pre-Migration

**Fecha**: ${new Date().toISOString()}
**Total de registros**: ${totalRecords}

## Archivos incluidos:
${tables.map(t => `- ${t}.json (${summary[t]} registros)`).join('\n')}

## Restauración
Si necesitas restaurar estos datos, usa el script restore-backup.js:
\`\`\`
node restore-backup.js ${path.basename(backupDir)}
\`\`\`

## Contenido del backup:
${Object.entries(summary).map(([table, count]) => `- **${table}**: ${count} registros`).join('\n')}
`;

  fs.writeFileSync(path.join(backupDir, 'README.md'), readmeContent, 'utf8');

  console.log('🎯 PRÓXIMO PASO:');
  console.log('   Ejecutar scripts SQL en Supabase\n');
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error.message);
  process.exit(1);
});

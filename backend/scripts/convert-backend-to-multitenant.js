#!/usr/bin/env node

/**
 * Script Automatizado: Convertir bridge.js a Multi-Tenant
 * 
 * Este script modifica automáticamente el archivo bridge.js para:
 * 1. Importar el middleware de tenant
 * 2. Aplicar middleware a rutas protegidas
 * 3. Reemplazar nombres de tabla fijos por dinámicos usando req.getTable()
 * 
 * Uso:
 *   node convert-backend-to-multitenant.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const BRIDGE_FILE = path.join(__dirname, '..', 'src', 'routes', 'bridge.js');
const BACKUP_FILE = path.join(__dirname, '..', 'src', 'routes', 'bridge.js.backup');

// Tablas a reemplazar
const TABLES = [
  'patients',
  'appointments',
  'credit_packs',
  'credit_redemptions',
  'configurations',
  'backups'
];

console.log('🤖 ============================================');
console.log('   Convertir Backend a Multi-Tenant');
console.log('   ============================================\n');

// Paso 1: Verificar que existe el archivo
if (!fs.existsSync(BRIDGE_FILE)) {
  console.error('❌ Error: No se encuentra bridge.js en:', BRIDGE_FILE);
  process.exit(1);
}

console.log('✅ Archivo encontrado:', BRIDGE_FILE);

// Paso 2: Crear backup
console.log('💾 Creando backup...');
fs.copyFileSync(BRIDGE_FILE, BACKUP_FILE);
console.log('✅ Backup creado:', BACKUP_FILE, '\n');

// Paso 3: Leer contenido
let content = fs.readFileSync(BRIDGE_FILE, 'utf8');
const originalContent = content;
const changes = [];

// Paso 4: Agregar import del middleware
console.log('📝 Paso 1: Agregando import del middleware...');
if (!content.includes("require('../middleware/tenant')")) {
  // Buscar la línea del router
  const routerLine = "const router = express.Router();";
  if (content.includes(routerLine)) {
    content = content.replace(
      routerLine,
      `const router = express.Router();\n\n// Importar middleware de tenant\nconst { loadTenant } = require('../middleware/tenant');`
    );
    changes.push('✅ Import del middleware agregado');
    console.log('   ✅ Import agregado después de la declaración del router');
  }
}

// Paso 5: Agregar middleware a rutas
console.log('\n📝 Paso 2: Aplicando middleware a rutas protegidas...');
const middlewareBlock = `
// ============================================================
// MIDDLEWARE: Aplicar detección de tenant a rutas protegidas
// ============================================================
// Este middleware carga el tenant y prepara req.getTable()
// para usar nombres de tabla dinámicos según el tenant

router.use('/patients*', loadTenant);
router.use('/appointments*', loadTenant);
router.use('/credits*', loadTenant);
router.use('/reports*', loadTenant);
router.use('/backup*', loadTenant);
router.use('/meta/config*', loadTenant);

// Los endpoints /tenants y /meta/locations NO requieren tenant
// porque son endpoints públicos o de configuración global

`;

if (!content.includes('router.use(\'/patients*\', loadTenant)')) {
  // Buscar la sección de PATIENTS ENDPOINTS
  const patientsSection = '// PATIENTS ENDPOINTS';
  if (content.includes(patientsSection)) {
    content = content.replace(
      patientsSection,
      `${middlewareBlock}// PATIENTS ENDPOINTS`
    );
    changes.push('✅ Middleware aplicado a rutas protegidas');
    console.log('   ✅ Middleware aplicado');
  }
}

// Paso 6: Reemplazar nombres de tablas
console.log('\n📝 Paso 3: Convirtiendo nombres de tabla a dinámicos...');
let totalReplacements = 0;

// Función para escapar regex
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Para cada tabla, buscar y reemplazar todos los patrones
for (const table of TABLES) {
  let tableReplacements = 0;
  
  // Patrón 1: `tabla?...` → `${req.getTable('tabla')}?...`
  const pattern1 = new RegExp(`\`${escapeRegex(table)}\\?`, 'g');
  const matches1 = content.match(pattern1);
  if (matches1) {
    content = content.replace(pattern1, `\`\${req.getTable('${table}')}?`);
    tableReplacements += matches1.length;
  }
  
  // Patrón 2: 'tabla?...' → '${req.getTable('tabla')}?...'
  const pattern2 = new RegExp(`'${escapeRegex(table)}\\?`, 'g');
  const matches2 = content.match(pattern2);
  if (matches2) {
    content = content.replace(pattern2, `'\${req.getTable('${table}')}?`);
    tableReplacements += matches2.length;
  }
  
  // Patrón 3: ,tabla( → ,${req.getTable('tabla')}(
  const pattern3 = new RegExp(`,${escapeRegex(table)}\\(`, 'g');
  const matches3 = content.match(pattern3);
  if (matches3) {
    content = content.replace(pattern3, `,\${req.getTable('${table}'}(`);
    tableReplacements += matches3.length;
  }
  
  // Patrón 4: INSERT/UPDATE con tabla
  // Ejemplo: method: 'POST', body: JSON.stringify(...) seguido de referencia a tabla
  const pattern4 = new RegExp(`(supabaseFetch\\(\\s*['\`])${escapeRegex(table)}(['\`]\\s*,)`, 'g');
  const matches4 = content.match(pattern4);
  if (matches4) {
    content = content.replace(pattern4, `$1\${req.getTable('${table}')}$2`);
    tableReplacements += matches4.length;
  }
  
  if (tableReplacements > 0) {
    totalReplacements += tableReplacements;
    changes.push(`✅ ${table}: ${tableReplacements} reemplazos`);
    console.log(`   ✅ ${table.padEnd(20)} ${tableReplacements} reemplazos`);
  }
}

// Paso 7: Agregar endpoint para obtener tenant config
console.log('\n📝 Paso 4: Agregando endpoint /api/tenants/:slug...');
const tenantsEndpoint = `
// ============================================================
// TENANTS ENDPOINTS
// ============================================================

// GET /api/tenants/:slug - Obtener configuración de un tenant
router.get('/tenants/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data } = await supabaseFetch(
      \`tenants?select=*&slug=eq.\${slug}&active=eq.true&limit=1\`
    );
    
    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: 'Tenant no encontrado',
        message: \`No existe un tenant activo con slug: \${slug}\`
      });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: error.message });
  }
});

`;

if (!content.includes("router.get('/tenants/:slug'")) {
  // Agregar antes de PATIENTS ENDPOINTS
  const patientsComment = '// PATIENTS ENDPOINTS';
  if (content.includes(patientsComment)) {
    content = content.replace(
      patientsComment,
      `${tenantsEndpoint}${patientsComment}`
    );
    changes.push('✅ Endpoint /api/tenants/:slug agregado');
    console.log('   ✅ Endpoint agregado');
  }
}

// Paso 8: Guardar archivo modificado
console.log('\n💾 Guardando cambios...');
fs.writeFileSync(BRIDGE_FILE, content, 'utf8');
console.log('✅ Archivo guardado:', BRIDGE_FILE);

// Paso 9: Generar reporte
console.log('\n📊 ============================================');
console.log('   Reporte de Cambios');
console.log('   ============================================\n');

console.log(`📄 Archivo: bridge.js`);
console.log(`📏 Tamaño original: ${originalContent.length} caracteres`);
console.log(`📏 Tamaño nuevo: ${content.length} caracteres`);
console.log(`📊 Total de reemplazos: ${totalReplacements}`);
console.log(`\n✨ Cambios realizados:\n`);

changes.forEach(change => console.log(`   ${change}`));

// Guardar reporte
const reportPath = path.join(__dirname, 'conversion-report.txt');
const report = `
REPORTE DE CONVERSIÓN A MULTI-TENANT
=====================================

Fecha: ${new Date().toISOString()}
Archivo: bridge.js

CAMBIOS REALIZADOS:
${changes.map(c => `- ${c}`).join('\n')}

ESTADÍSTICAS:
- Total de reemplazos de tabla: ${totalReplacements}
- Tamaño original: ${originalContent.length} caracteres
- Tamaño nuevo: ${content.length} caracteres

BACKUP:
El archivo original fue respaldado en: bridge.js.backup

PRÓXIMOS PASOS:
1. Revisar el archivo modificado en: ${BRIDGE_FILE}
2. Probar endpoints localmente
3. Desplegar backend a Vercel
4. Modificar frontend para enviar header X-Tenant-Slug
`;

fs.writeFileSync(reportPath, report, 'utf8');

console.log(`\n📄 Reporte guardado en: ${reportPath}`);
console.log('\n✅ ============================================');
console.log('   Conversión Completada');
console.log('   ============================================\n');

console.log('🎯 PRÓXIMOS PASOS:\n');
console.log('1. Revisar el archivo modificado:');
console.log(`   ${BRIDGE_FILE}`);
console.log('\n2. Si algo salió mal, restaurar desde backup:');
console.log(`   cp ${BACKUP_FILE} ${BRIDGE_FILE}`);
console.log('\n3. Probar localmente:');
console.log('   npm run dev');
console.log('\n4. Desplegar a producción:');
console.log('   vercel --prod');
console.log('\n✨ ¡Listo!\n');

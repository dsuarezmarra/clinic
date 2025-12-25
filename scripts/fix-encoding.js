/**
 * Script para corregir problemas de encoding UTF-8 -> Latin-1
 * 
 * Problema: Archivos guardados con UTF-8 pero interpretados como Latin-1
 * Resultado: Caracteres espanoles corruptos
 */

const fs = require('fs');
const path = require('path');

// Mapa de reemplazos (UTF-8 corrupto -> correcto)
// Usamos Buffer para definir los bytes exactos
const replacements = [
  // Minusculas acentuadas
  [Buffer.from([0xC3, 0x83, 0xC2, 0xB3]).toString('utf8'), '\u00F3'],  // o con acento
  [Buffer.from([0xC3, 0x83, 0xC2, 0xAD]).toString('utf8'), '\u00ED'],  // i con acento
  [Buffer.from([0xC3, 0x83, 0xC2, 0xB1]).toString('utf8'), '\u00F1'],  // n con tilde
  [Buffer.from([0xC3, 0x83, 0xC2, 0xA1]).toString('utf8'), '\u00E1'],  // a con acento
  [Buffer.from([0xC3, 0x83, 0xC2, 0xA9]).toString('utf8'), '\u00E9'],  // e con acento
  [Buffer.from([0xC3, 0x83, 0xC2, 0xBA]).toString('utf8'), '\u00FA'],  // u con acento
  // Signos de interrogacion y exclamacion
  [Buffer.from([0xC3, 0x82, 0xC2, 0xBF]).toString('utf8'), '\u00BF'],  // ?invertido
  [Buffer.from([0xC3, 0x82, 0xC2, 0xA1]).toString('utf8'), '\u00A1'],  // !invertido
];

// Archivos a procesar (rutas relativas desde la raíz del proyecto)
const filesToFix = [
  // Frontend - Archivos críticos visibles al usuario
  'frontend/public/manifest.webmanifest',
  'frontend/src/app/pages/agenda/calendar/calendar.component.html',
  'frontend/src/app/pages/agenda/calendar/calendar.component.scss',
  'frontend/src/app/services/logger.service.ts',
  'frontend/src/app/services/utils.service.ts',
  'frontend/src/app/pages/pacientes/pacientes.component.ts',
  
  // Backend
  'backend/src/middleware/database-middleware.js',
  'backend/scripts/backup.js',
  'backend/src/routes/backup.js',
  'backend/api/index.js',
  
  // Scripts
  'scripts/test-multicliente.ps1',
  'scripts/setup-vercel-env.ps1',
  'scripts/setup-frontend-vercel-env.ps1',
  'scripts/generate-manifest.ps1',
  'scripts/generate-manifest.js',
  'scripts/drive/setup-and-test.ps1',
  'scripts/drive/README.md',
  
  // Documentación
  '.github/copilot-instructions.md',
];

// Función para corregir un archivo
function fixFile(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`??  Archivo no encontrado: ${filePath}`);
    return { fixed: false, changes: 0 };
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  let totalChanges = 0;
  
  for (const [corrupted, correct] of replacements) {
    const regex = new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      totalChanges += matches.length;
      content = content.replace(regex, correct);
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`? ${filePath} - ${totalChanges} correcciones`);
    return { fixed: true, changes: totalChanges };
  } else {
    console.log(`??  ${filePath} - Sin cambios necesarios`);
    return { fixed: false, changes: 0 };
  }
}

// Función principal
function main() {
  console.log('?? Corrigiendo problemas de encoding UTF-8 ? Latin-1\n');
  console.log('=' .repeat(60));
  
  let totalFiles = 0;
  let totalChanges = 0;
  let filesFixed = 0;
  
  for (const file of filesToFix) {
    totalFiles++;
    const result = fixFile(file);
    if (result.fixed) {
      filesFixed++;
      totalChanges += result.changes;
    }
  }
  
  console.log('=' .repeat(60));
  console.log(`\n?? Resumen:`);
  console.log(`   - Archivos procesados: ${totalFiles}`);
  console.log(`   - Archivos corregidos: ${filesFixed}`);
  console.log(`   - Total de correcciones: ${totalChanges}`);
  console.log('\n? Proceso completado');
}

main();

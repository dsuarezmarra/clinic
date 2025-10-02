#!/usr/bin/env node

/**
 * Script Mejorado: Fix ALL table references in bridge.js
 * 
 * Este script encuentra y reemplaza TODAS las referencias a tablas
 * incluyendo las que el script anterior no encontró
 */

const fs = require('fs');
const path = require('path');

const BRIDGE_FILE = path.join(__dirname, '..', 'src', 'routes', 'bridge.js');

console.log('🔧 Corrigiendo referencias faltantes...\n');

let content = fs.readFileSync(BRIDGE_FILE, 'utf8');
const originalContent = content;

// Tablas a reemplazar
const TABLES = ['patients', 'appointments', 'credit_packs', 'credit_redemptions', 'configurations', 'backups'];

let totalReplacements = 0;

for (const table of TABLES) {
  let tableReplacements = 0;
  
  // Patrón 1: `tabla?... (dentro de template strings sin $)
  const regex1 = new RegExp(`([^$])\`${table}\\?`, 'g');
  const matches1 = content.match(regex1);
  if (matches1) {
    content = content.replace(regex1, `$1\`\${req.getTable('${table}')}?`);
    tableReplacements += matches1.length;
  }
  
  // Patrón 2: 'tabla?... (comillas simples)
  const regex2 = new RegExp(`'${table}\\?`, 'g');
  const matches2 = content.match(regex2);
  if (matches2) {
    content = content.replace(regex2, `'\${req.getTable('${table}')}?`);
    tableReplacements += matches2.length;
  }
  
  // Patrón 3: "tabla?... (comillas dobles)
  const regex3 = new RegExp(`"${table}\\?`, 'g');
  const matches3 = content.match(regex3);
  if (matches3) {
    content = content.replace(regex3, `"\${req.getTable('${table}')}?`);
    tableReplacements += matches3.length;
  }
  
  // Patrón 4: ( 'tabla?) o ('tabla') sin ? (para supabaseFetch)
  const regex4 = new RegExp(`\\('${table}'\\)`, 'g');
  const matches4 = content.match(regex4);
  if (matches4) {
    content = content.replace(regex4, `(\`\${req.getTable('${table}')}\`)`);
    tableReplacements += matches4.length;
  }
  
  if (tableReplacements > 0) {
    totalReplacements += tableReplacements;
    console.log(`✅ ${table.padEnd(20)} ${tableReplacements} reemplazos adicionales`);
  }
}

console.log(`\n📊 Total de reemplazos adicionales: ${totalReplacements}\n`);

if (totalReplacements > 0) {
  fs.writeFileSync(BRIDGE_FILE, content, 'utf8');
  console.log('✅ Archivo actualizado exitosamente\n');
} else {
  console.log('ℹ️  No se encontraron referencias adicionales para corregir\n');
}

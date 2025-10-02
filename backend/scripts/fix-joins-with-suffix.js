#!/usr/bin/env node

/**
 * Script: Corregir JOINs en consultas Supabase para usar nombres de tabla con sufijo
 * 
 * Reemplaza referencias a tablas en JOINs (ej: ,patients(*)) con nombres dinámicos usando req.getTable()
 */

const fs = require('fs');
const path = require('path');

const BRIDGE_FILE = path.join(__dirname, '..', 'src', 'routes', 'bridge.js');

console.log('🔧 Corrigiendo JOINs con sufijos de tabla...\n');

let content = fs.readFileSync(BRIDGE_FILE, 'utf8');
const originalContent = content;

// Tablas a reemplazar en JOINs
const TABLES = ['patients', 'appointments', 'credit_packs', 'credit_redemptions'];

let totalReplacements = 0;

for (const table of TABLES) {
  let tableReplacements = 0;
  
  // Patrón 1: ,tabla(*) - JOIN simple con todos los campos
  const regex1 = new RegExp(`,${table}\\(\\*\\)`, 'g');
  const matches1 = content.match(regex1);
  if (matches1) {
    content = content.replace(regex1, `,\${req.getTable('${table}')}(*)`);
    tableReplacements += matches1.length;
  }
  
  // Patrón 2: ,tabla(campo) - JOIN con campo específico
  const regex2 = new RegExp(`,${table}\\(([^)]+)\\)`, 'g');
  const matches2 = content.match(regex2);
  if (matches2) {
    content = content.replace(regex2, `,\${req.getTable('${table}')}($1)`);
    tableReplacements += matches2.length;
  }
  
  // Patrón 3: ,tabla!inner( - JOIN con modificador !inner
  const regex3 = new RegExp(`,${table}!inner\\(`, 'g');
  const matches3 = content.match(regex3);
  if (matches3) {
    content = content.replace(regex3, `,\${req.getTable('${table}')}!inner(`);
    tableReplacements += matches3.length;
  }
  
  if (tableReplacements > 0) {
    totalReplacements += tableReplacements;
    console.log(`✅ ${table.padEnd(20)} ${tableReplacements} reemplazos en JOINs`);
  }
}

console.log(`\n📊 Total de reemplazos: ${totalReplacements}\n`);

if (content !== originalContent && totalReplacements > 0) {
  fs.writeFileSync(BRIDGE_FILE, content, 'utf8');
  console.log('✅ Archivo actualizado exitosamente\n');
} else {
  console.log('ℹ️  No se encontraron JOINs para corregir\n');
}

#!/usr/bin/env node

/**
 * Script FINAL: Corregir template strings mal formados
 * 
 * Convierte '${req.getTable(...)}...' a `${req.getTable(...)}...`
 */

const fs = require('fs');
const path = require('path');

const BRIDGE_FILE = path.join(__dirname, '..', 'src', 'routes', 'bridge.js');

console.log('🔧 Corrigiendo template strings mal formados...\n');

let content = fs.readFileSync(BRIDGE_FILE, 'utf8');

// Patrón: buscar '${req.getTable y reemplazar por `${req.getTable
// Necesitamos encontrar el cierre de la cadena también
const regex = /'(\$\{req\.getTable\([^)]+\)\}[^']*?)'/g;

let matches = content.match(regex);
if (matches) {
  console.log(`📊 Encontradas ${matches.length} cadenas mal formadas\n`);
  
  // Mostrar primeras 5 como ejemplo
  matches.slice(0, 5).forEach((match, i) => {
    console.log(`  ${i + 1}. ${match.substring(0, 80)}...`);
  });
  
  if (matches.length > 5) {
    console.log(`  ... y ${matches.length - 5} más\n`);
  } else {
    console.log('');
  }
  
  // Reemplazar ' con ` al inicio y final
  content = content.replace(regex, '`$1`');
  
  fs.writeFileSync(BRIDGE_FILE, content, 'utf8');
  console.log(`✅ ${matches.length} cadenas corregidas\n`);
} else {
  console.log('ℹ️  No se encontraron cadenas mal formadas\n');
}

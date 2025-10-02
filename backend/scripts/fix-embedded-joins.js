// Script para corregir JOINs embedded en consultas PostgREST para multi-tenant
// Los JOINs de PostgREST usan sintaxis: select=*,tabla_relacionada(*)
// Necesitamos convertirlos a: select=*,${req.getTable('tabla_relacionada')}(*)

const fs = require('fs');
const path = require('path');

const bridgeFile = path.join(__dirname, '../src/routes/bridge.js');
let content = fs.readFileSync(bridgeFile, 'utf-8');

console.log('🔧 Corrigiendo JOINs embedded en bridge.js...\n');

// Patrones a buscar y reemplazar
const patterns = [
  // Patrón 1: ,credit_packs(*) → ,${req.getTable('credit_packs')}(*)
  {
    search: /,credit_packs\(\*\)/g,
    replace: `,\${req.getTable('credit_packs')}(*)`,
    description: 'JOIN a credit_packs'
  },
  // Patrón 2: ,patients(*) → ,${req.getTable('patients')}(*)
  {
    search: /,patients\(\*\)/g,
    replace: `,\${req.getTable('patients')}(*)`,
    description: 'JOIN a patients'
  },
  // Patrón 3: ,appointments(*) → ,${req.getTable('appointments')}(*)
  {
    search: /,appointments\(\*\)/g,
    replace: `,\${req.getTable('appointments')}(*)`,
    description: 'JOIN a appointments'
  },
  // Patrón 4: ,credit_redemptions(*) → ,${req.getTable('credit_redemptions')}(*)
  {
    search: /,credit_redemptions\(\*\)/g,
    replace: `,\${req.getTable('credit_redemptions')}(*)`,
    description: 'JOIN a credit_redemptions'
  },
  // Patrón 5: credit_packs!inner(...) - JOINs con filtros
  {
    search: /credit_packs!inner\(/g,
    replace: `\${req.getTable('credit_packs')}!inner(`,
    description: 'JOIN inner a credit_packs'
  },
  // Patrón 6: .credit_packs. en filtros (ej: &credit_packs.patientId=eq.${patientId})
  {
    search: /&credit_packs\./g,
    replace: `&\${req.getTable('credit_packs')}.`,
    description: 'Filtros en credit_packs'
  }
];

let totalReplacements = 0;

patterns.forEach(pattern => {
  const matches = content.match(pattern.search);
  const count = matches ? matches.length : 0;
  
  if (count > 0) {
    content = content.replace(pattern.search, pattern.replace);
    console.log(`✅ ${pattern.description}: ${count} reemplazos`);
    totalReplacements += count;
  } else {
    console.log(`⚪ ${pattern.description}: 0 reemplazos`);
  }
});

// Guardar el archivo
fs.writeFileSync(bridgeFile, content, 'utf-8');

console.log(`\n🎉 Total de reemplazos: ${totalReplacements}`);
console.log('✅ Archivo bridge.js actualizado correctamente');

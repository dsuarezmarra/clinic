#!/usr/bin/env node

/**
 * Script para inyectar CLIENT_ID en index.html despuÃ©s del build de Angular
 * 
 * Uso:
 *   VITE_CLIENT_ID=actifisio node scripts/inject-client-id.js dist/actifisio-build/browser
 */

import fs from 'fs';
import path from 'path';

// Obtener el CLIENT_ID de las variables de entorno
const clientId = process.env.VITE_CLIENT_ID || 'masajecorporaldeportivo';
const distPath = process.argv[2] || 'dist/clinic-frontend/browser';

console.log(`\nð§ Inyectando CLIENT_ID en index.html...`);
console.log(`   Cliente: ${clientId}`);
console.log(`   Dist path: ${distPath}\n`);

// Leer index.html
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error(`â Error: No se encontrÃ³ ${indexPath}`);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Inyectar variable global antes del cierre de </head>
const injection = `  <script>window.__CLIENT_ID = '${clientId}';</script>\n`;

if (html.includes('window.__CLIENT_ID')) {
  console.log('â ï¸  Ya existe window.__CLIENT_ID en index.html, reemplazando...');
  html = html.replace(/<script>window\.__CLIENT_ID = '.*?';<\/script>/, injection.trim());
} else {
  html = html.replace('</head>', `${injection}</head>`);
}

// Guardar el archivo modificado
fs.writeFileSync(indexPath, html, 'utf8');

console.log('â CLIENT_ID inyectado exitosamente en index.html');
console.log(`   <script>window.__CLIENT_ID = '${clientId}';</script>\n`);

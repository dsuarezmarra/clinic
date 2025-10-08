/**
 * Script post-build para inyectar CLIENT_ID en index.html y index.csr.html
 * 
 * Este script se ejecuta DESPUÉS del build de Angular y reemplaza
 * el placeholder __VITE_CLIENT_ID__ con el valor real.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientId = process.env.VITE_CLIENT_ID || 'masajecorporaldeportivo';
const distPath = join(__dirname, '..', 'dist', 'clinic-frontend', 'browser');

console.log('\n🔧 ============================================');
console.log('   Post-Build: Inyección de CLIENT_ID');
console.log('============================================\n');
console.log(`📌 CLIENT_ID: ${clientId}`);
console.log(`📁 Dist path: ${distPath}\n`);

// Archivos a procesar
const files = ['index.html', 'index.csr.html'];

files.forEach(fileName => {
  const filePath = join(distPath, fileName);
  
  if (!existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${fileName}`);
    return;
  }
  
  try {
    // Leer archivo
    let content = readFileSync(filePath, 'utf8');
    
    // Reemplazar placeholder
    const originalContent = content;
    content = content.replace(/__VITE_CLIENT_ID__/g, clientId);
    
    // Verificar que se hizo el reemplazo
    if (content === originalContent) {
      console.log(`⚠️  ${fileName}: No se encontró el placeholder __VITE_CLIENT_ID__`);
    } else {
      // Guardar archivo modificado
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${fileName}: CLIENT_ID inyectado correctamente`);
      
      // Verificar que el reemplazo fue exitoso
      const verification = readFileSync(filePath, 'utf8');
      if (verification.includes(`window.__CLIENT_ID = '${clientId}'`)) {
        console.log(`   ✓ Verificado: window.__CLIENT_ID = '${clientId}'`);
      } else {
        console.log(`   ⚠️  Advertencia: No se pudo verificar la inyección`);
      }
    }
  } catch (error) {
    console.error(`❌ Error procesando ${fileName}:`, error.message);
  }
});

console.log('\n🎉 Inyección completada\n');

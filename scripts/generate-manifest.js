#!/usr/bin/env node

/**
 * 🎨 Script para generar manifest.json dinámico basado en configuración del cliente
 * 
 * USO:
 *   node scripts/generate-manifest.js [clientId]
 * 
 * EJEMPLOS:
 *   node scripts/generate-manifest.js masajecorporaldeportivo
 *   node scripts/generate-manifest.js fisioterapiacentro
 * 
 * Si no se proporciona clientId, usa VITE_CLIENT_ID del entorno o 'masajecorporaldeportivo' por defecto
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalente a __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CLIENT_CONFIGS = {
  masajecorporaldeportivo: {
    name: 'Masaje Corporal Deportivo',
    shortName: 'Clínica MCD',
    description: 'Sistema de gestión para clínica de masaje corporal deportivo',
    themeColor: '#667eea', // Azul/morado
    logoPath: 'assets/clients/masajecorporaldeportivo/logo.png'
  },
  actifisio: {
    name: 'Actifisio',
    shortName: 'Actifisio',
    description: 'Sistema de gestión para centro de fisioterapia Actifisio',
    themeColor: '#ff6b35', // Naranja/amarillo
    logoPath: 'assets/clients/actifisio/logo.png'
  }
};

// ============================================================================
// FUNCIONES
// ============================================================================

/**
 * Obtener ID del cliente desde argumentos CLI o variable de entorno
 */
function getClientId() {
  // 1. Desde argumentos de línea de comandos
  const cliArg = process.argv[2];
  if (cliArg && CLIENT_CONFIGS[cliArg]) {
    console.log(`✅ Usando cliente desde CLI: ${cliArg}`);
    return cliArg;
  }

  // 2. Desde variable de entorno VITE_CLIENT_ID
  const envClientId = process.env.VITE_CLIENT_ID;
  if (envClientId && CLIENT_CONFIGS[envClientId]) {
    console.log(`✅ Usando cliente desde VITE_CLIENT_ID: ${envClientId}`);
    return envClientId;
  }

  // 3. Fallback al cliente por defecto
  const defaultClient = 'masajecorporaldeportivo';
  console.log(`⚠️  No se especificó cliente, usando por defecto: ${defaultClient}`);
  return defaultClient;
}

/**
 * Cargar template del manifest
 */
function loadTemplate() {
  const templatePath = path.join(__dirname, '../frontend/src/manifest.template.json');
  
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ No se encontró el template: ${templatePath}`);
    process.exit(1);
  }

  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  console.log(`✅ Template cargado: ${templatePath}`);
  return templateContent;
}

/**
 * Reemplazar placeholders en el template
 */
function generateManifest(template, clientId) {
  const config = CLIENT_CONFIGS[clientId];

  if (!config) {
    console.error(`❌ Configuración no encontrada para cliente: ${clientId}`);
    console.log(`Clientes disponibles: ${Object.keys(CLIENT_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n📋 Generando manifest para: ${config.name}`);
  console.log(`   - Nombre corto: ${config.shortName}`);
  console.log(`   - Color tema: ${config.themeColor}`);
  console.log(`   - Logo: ${config.logoPath}`);

  let manifest = template;
  manifest = manifest.replace(/{{APP_NAME}}/g, config.name);
  manifest = manifest.replace(/{{SHORT_NAME}}/g, config.shortName);
  manifest = manifest.replace(/{{DESCRIPTION}}/g, config.description);
  manifest = manifest.replace(/{{THEME_COLOR}}/g, config.themeColor);
  manifest = manifest.replace(/{{LOGO_PATH}}/g, config.logoPath);

  return manifest;
}

/**
 * Guardar manifest generado
 */
function saveManifest(manifestContent) {
  const outputPath = path.join(__dirname, '../frontend/src/manifest.json');
  
  // Validar que sea JSON válido antes de guardar
  try {
    JSON.parse(manifestContent);
  } catch (error) {
    console.error('❌ Error: El manifest generado no es JSON válido');
    console.error(error.message);
    process.exit(1);
  }

  fs.writeFileSync(outputPath, manifestContent, 'utf-8');
  console.log(`\n✅ Manifest generado exitosamente: ${outputPath}`);
}

/**
 * Verificar que exista el logo del cliente
 */
function verifyLogo(clientId) {
  const config = CLIENT_CONFIGS[clientId];
  const logoPath = path.join(__dirname, '../frontend/src', config.logoPath);
  
  if (!fs.existsSync(logoPath)) {
    console.warn(`⚠️  ADVERTENCIA: No se encontró el logo: ${logoPath}`);
    console.warn(`   El PWA puede no funcionar correctamente sin el logo`);
    console.warn(`   Por favor, copia el logo a: frontend/src/${config.logoPath}`);
  } else {
    console.log(`✅ Logo verificado: ${config.logoPath}`);
  }
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

function main() {
  console.log('🎨 ============================================');
  console.log('   Generador de Manifest PWA Multi-Cliente');
  console.log('============================================\n');

  // 1. Obtener ID del cliente
  const clientId = getClientId();

  // 2. Verificar logo
  verifyLogo(clientId);

  // 3. Cargar template
  const template = loadTemplate();

  // 4. Generar manifest con valores del cliente
  const manifest = generateManifest(template, clientId);

  // 5. Guardar manifest.json
  saveManifest(manifest);

  console.log('\n🎉 ¡Proceso completado exitosamente!\n');
}

// Ejecutar
main();

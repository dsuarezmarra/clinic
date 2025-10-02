#!/usr/bin/env node

/**
 * Script para crear un nuevo tenant (cliente)
 * 
 * Uso:
 *   node create-tenant.js
 * 
 * Este script:
 * 1. Solicita información del nuevo cliente
 * 2. Crea el registro en la tabla tenants
 * 3. Genera el SQL para crear las tablas del cliente
 * 4. Opcionalmente ejecuta el SQL directamente en Supabase
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función helper para hacer preguntas
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Función para convertir texto a slug
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
    .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
}

// Función para convertir slug a table_suffix
function toTableSuffix(slug) {
  return slug.replace(/-/g, '_');
}

// Función para validar color hex
function isValidHex(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

async function main() {
  console.log('🏢 ===================================');
  console.log('   Creador de Nuevo Tenant/Cliente');
  console.log('   ===================================\n');

  try {
    // 1. Solicitar información
    const name = await question('📝 Nombre completo del negocio/clínica: ');
    if (!name) {
      throw new Error('El nombre es obligatorio');
    }

    const slugSuggestion = slugify(name);
    const slug = await question(`🔗 Slug para URL (Enter para usar "${slugSuggestion}"): `) || slugSuggestion;
    
    const tableSuffix = toTableSuffix(slug);
    console.log(`📊 Table suffix: ${tableSuffix}\n`);

    // 2. Configuración opcional
    console.log('⚙️  Configuración (Enter para omitir):\n');
    
    const logo = await question('🎨 URL del logo: ');
    const primaryColor = await question('🎨 Color primario (hex, ej: #4F46E5): ');
    const secondaryColor = await question('🎨 Color secundario (hex, ej: #10B981): ');
    const contactEmail = await question('📧 Email de contacto: ');
    const contactPhone = await question('📞 Teléfono de contacto: ');
    const address = await question('📍 Dirección física: ');
    const description = await question('📄 Descripción breve: ');

    // Validar colores si se proporcionaron
    if (primaryColor && !isValidHex(primaryColor)) {
      throw new Error('Color primario debe ser formato hex (#RRGGBB)');
    }
    if (secondaryColor && !isValidHex(secondaryColor)) {
      throw new Error('Color secundario debe ser formato hex (#RRGGBB)');
    }

    // 3. Construir configuración
    const config = {};
    if (logo) config.logo = logo;
    if (primaryColor) config.primaryColor = primaryColor;
    if (secondaryColor) config.secondaryColor = secondaryColor;
    if (contactEmail) config.contactEmail = contactEmail;
    if (contactPhone) config.contactPhone = contactPhone;
    if (address) config.address = address;
    if (description) config.description = description;

    // 4. Generar SQL para INSERT en tenants
    const tenantInsertSQL = `
-- ============================================================
-- Insertar nuevo tenant: ${name}
-- ============================================================
INSERT INTO tenants (slug, name, table_suffix, config, active) VALUES (
  '${slug}',
  '${name}',
  '${tableSuffix}',
  '${JSON.stringify(config, null, 2)}'::jsonb,
  true
);

-- Verificar inserción
SELECT * FROM tenants WHERE slug = '${slug}';
`;

    // 5. Generar SQL para crear tablas (reemplazar {{SUFFIX}} en template)
    const templatePath = path.join(__dirname, '..', 'sql', '03-template-create-tenant-tables.sql');
    let tableCreationSQL = '';
    
    if (fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf8');
      tableCreationSQL = template.replace(/\{\{SUFFIX\}\}/g, tableSuffix);
    } else {
      console.log('⚠️  Template no encontrado en:', templatePath);
    }

    // 6. Guardar SQL generado
    const outputDir = path.join(__dirname, '..', 'sql', 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `create-tenant-${slug}.sql`);
    const fullSQL = `${tenantInsertSQL}\n\n${tableCreationSQL}`;
    
    fs.writeFileSync(outputFile, fullSQL, 'utf8');

    // 7. Mostrar resumen
    console.log('\n✅ ===================================');
    console.log('   Tenant creado exitosamente');
    console.log('   ===================================\n');
    console.log(`📋 Nombre: ${name}`);
    console.log(`🔗 Slug: ${slug}`);
    console.log(`📊 Table suffix: ${tableSuffix}`);
    console.log(`🌐 URL sugerida: https://${slug}.vercel.app`);
    console.log(`\n📄 SQL generado en:\n   ${outputFile}\n`);
    
    console.log('📝 PRÓXIMOS PASOS:\n');
    console.log('1. Revisar el archivo SQL generado');
    console.log('2. Ejecutar el SQL en Supabase SQL Editor:');
    console.log(`   ${outputFile}`);
    console.log('3. Desplegar frontend para este tenant:');
    console.log(`   cd frontend`);
    console.log(`   vercel --prod`);
    console.log(`   vercel alias set <deployment-url> ${slug}.vercel.app`);
    console.log('4. Actualizar backend con el middleware de tenant');
    console.log('\n✨ ¡Listo!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar
main();

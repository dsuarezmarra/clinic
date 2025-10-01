#!/usr/bin/env node

/**
 * Script para ejecutar backup manual de la base de datos
 * Uso: node backup-manual.js
 */

const { runBackup } = require('./scripts/backup');

console.log('🏥 Sistema de Backup - Clínica');
console.log('================================\n');

runBackup()
    .then(result => {
        console.log('\n✅ ¡Backup completado exitosamente!');
        console.log(`📁 Archivo: ${result.fileName}`);
        console.log(`📏 Tamaño: ${result.size} MB`);
        console.log(`⏰ Timestamp: ${result.timestamp}`);
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error durante el backup:', error.message);
        process.exit(1);
    });

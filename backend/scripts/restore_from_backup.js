const path = require('path');
const fs = require('fs');
const { DatabaseBackup } = require('./backup');

(async function run() {
  try {
    const backup = new DatabaseBackup();
    const backupsDir = backup.backupDir;
    if (!fs.existsSync(backupsDir)) {
      console.error('No hay directorio de backups:', backupsDir);
      process.exit(1);
    }

    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('clinic_backup_') && f.endsWith('.json'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(backupsDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
      console.error('No se encontró ningún backup JSON en', backupsDir);
      process.exit(1);
    }

    const latest = files[0].name;
    console.log('🔎 Restaurando desde backup más reciente:', latest);

    // Forzar allowAutoRestore true para este script
    const result = await backup.restoreBackup(latest, { allowAutoRestore: true });
    console.log('✅ Resultado de restauración:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('❌ Error en restore_from_backup.js:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();

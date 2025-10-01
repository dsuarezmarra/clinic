const express = require('express');
const { DatabaseBackup } = require('../../scripts/backup');

const router = express.Router();

// GET /api/backup/list - Listar todos los backups
router.get('/list', async (req, res, next) => {
    try {
        const backup = new DatabaseBackup();
        const backups = backup.listBackups();

        res.json(backups);
    } catch (error) {
        next(error);
    }
});

// GET /api/backup/grouped - Listar backups agrupados por fecha
router.get('/grouped', async (req, res, next) => {
    try {
        const backup = new DatabaseBackup();
        const groupedBackups = backup.getBackupsByDate();

        res.json(groupedBackups);
    } catch (error) {
        next(error);
    }
});

// POST /api/backup/create - Crear backup manual
router.post('/create', async (req, res, next) => {
    try {
        const backup = new DatabaseBackup();
        const result = await backup.createBackup();

        res.status(201).json({
            message: 'Backup creado exitosamente',
            ...result
        });
    } catch (error) {
        console.error('Error en POST /api/backup/create:', error && error.message ? error.message : error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : 'Error al crear backup' });
    }
});

// GET /api/backup/stats - Obtener estadísticas de backups
router.get('/stats', async (req, res, next) => {
    try {
        const backup = new DatabaseBackup();
        const stats = backup.getBackupStats();

        res.json({
            ...stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/backup/restore/:fileName - Restaurar desde backup
router.post('/restore/:fileName', async (req, res, next) => {
    try {
        const { fileName } = req.params;
        const backup = new DatabaseBackup();
    // Allow force via query (?force=true), JSON body { force: true }, or header X-Force-Restore: true
    const q = req.query && (req.query.force === 'true' || req.query.force === '1');
    const b = req.body && (req.body.force === true || req.body.force === 'true' || req.body.force === '1');
    const h = req.get && (req.get('X-Force-Restore') === 'true' || req.get('X-Force-Restore') === '1');
    const force = q || b || h;
    const allowEnv = process.env.ALLOW_AUTO_RESTORE === 'true';
    const isDev = (process.env.NODE_ENV === 'development');
    // Support a RESTORE_SECRET to allow manual restores in production without enabling ALLOW_AUTO_RESTORE globaly.
    const restoreSecret = process.env.RESTORE_SECRET;
    const secretOk = !!(restoreSecret && ((req.get && req.get('X-Restore-Secret') === restoreSecret) || (req.body && (req.body.restoreSecret === restoreSecret || req.body.restore_secret === restoreSecret))));
    // In development allow automatic restore by default to simplify local workflows.
    // In production, allow if ALLOW_AUTO_RESTORE=true or a valid RESTORE_SECRET is provided.
    const allowAutoRestore = allowEnv || isDev || !!force || secretOk;
    console.log('🔁 restore request:', { fileName, allowEnv, NODE_ENV: process.env.NODE_ENV, force, allowAutoRestore });
    const result = await backup.restoreBackup(fileName, { allowAutoRestore });

    // If restoreBackup imported data, return success; otherwise return 400 with diagnostics and instructions
    if (result && (result.imported === true || result.success === true)) {
        return res.json({
            success: true,
            message: 'Base de datos restaurada exitosamente',
            ...result
        });
    }

    // Not imported
    return res.status(400).json({
        success: false,
        message: 'No se realizó la restauración automática. Descargue el archivo e importe manualmente (pg_restore, psql o revise el JSON). Para permitir importación automática en producción, establezca ALLOW_AUTO_RESTORE=true en el entorno o configure RESTORE_SECRET y envíe X-Restore-Secret en la petición. En desarrollo puede usar ?force=true o enviar {"force":true}.',
        restoredFrom: fileName,
        parsedPresent: !!(result && result.parsedPresent),
        allowAutoRestoreEnv: allowEnv,
        nodeEnv: process.env.NODE_ENV || 'unknown',
        diagnostics: result && result.diagnostics ? result.diagnostics : result,
        secretProvided: !!(req.get && req.get('X-Restore-Secret')) || (req.body && (req.body.restoreSecret || req.body.restore_secret))
    });
    } catch (error) {
        console.error('Error en POST /api/backup/restore:', error && error.message ? error.message : error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : 'Error al restaurar backup' });
    }
});

// GET /api/backup/download/:fileName - Descargar archivo de backup
router.get('/download/:fileName', async (req, res, next) => {
    try {
        const { fileName } = req.params;
        const backup = new DatabaseBackup();
        const backupPath = backup.getBackupPath(fileName);

        // Verificar que el archivo existe
        const fs = require('fs');
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({
                success: false,
                message: 'Archivo de backup no encontrado'
            });
        }

        // Configurar headers para descarga
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Enviar el archivo
        res.sendFile(backupPath);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/backup/delete/:fileName - Eliminar archivo de backup
router.delete('/delete/:fileName', async (req, res, next) => {
    try {
        const { fileName } = req.params;
        const backup = new DatabaseBackup();
        const result = backup.deleteBackup(fileName);

        if (result.success) {
            res.json({
                success: true,
                message: 'Backup eliminado exitosamente',
                fileName
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Error al eliminar el backup'
            });
        }
    } catch (error) {
        next(error);
    }
});

// GET /api/backup/status - Estado del servicio de backup
router.get('/status', async (req, res, next) => {
    try {
        const backup = new DatabaseBackup();
        const stats = backup.getBackupStats();

        res.json({
            status: 'active',
            isRunning: true,
            nextRun: 'Diariamente a las 2:00 AM',
            totalBackups: stats.totalBackups || 0,
            lastBackup: stats.lastBackup || null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

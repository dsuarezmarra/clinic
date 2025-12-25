const express = require('express');
const path = require('path');
const { DatabaseBackup } = require('../../scripts/backup');

const router = express.Router();

/**
 * Valida que el nombre de archivo sea seguro (sin path traversal)
 * Solo permite: letras, números, guiones, guiones bajos, puntos
 */
function isValidFileName(fileName) {
    if (!fileName || typeof fileName !== 'string') return false;
    // Solo permitir caracteres seguros
    const safePattern = /^[a-zA-Z0-9_\-\.]+$/;
    if (!safePattern.test(fileName)) return false;
    // No permitir path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) return false;
    // Debe terminar en .json o .sql
    if (!fileName.endsWith('.json') && !fileName.endsWith('.sql')) return false;
    // Longitud razonable
    if (fileName.length > 100) return false;
    return true;
}

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
        
        // Validar nombre de archivo para prevenir path traversal
        if (!isValidFileName(fileName)) {
            console.warn(`?? Intento de restore con fileName inválido: ${fileName}`);
            return res.status(400).json({
                success: false,
                message: 'Nombre de archivo inválido'
            });
        }
        
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
    console.log('ð restore request:', { fileName, allowEnv, NODE_ENV: process.env.NODE_ENV, force, allowAutoRestore });
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
        
        // Validar nombre de archivo para prevenir path traversal
        if (!isValidFileName(fileName)) {
            console.warn(`?? Intento de download con fileName inválido: ${fileName}`);
            return res.status(400).json({
                success: false,
                message: 'Nombre de archivo inválido'
            });
        }
        
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
        
        // Verificar que el path resuelto está dentro del directorio de backups
        const backupsDir = path.resolve(__dirname, '../../backups');
        const resolvedPath = path.resolve(backupPath);
        if (!resolvedPath.startsWith(backupsDir)) {
            console.warn(`?? Path traversal detectado en download: ${resolvedPath}`);
            return res.status(400).json({
                success: false,
                message: 'Ruta de archivo inválida'
            });
        }

        // Sanitizar nombre en header para prevenir header injection
        const safeName = path.basename(fileName).replace(/["\n\r]/g, '_');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
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
        
        // Validar nombre de archivo para prevenir path traversal
        if (!isValidFileName(fileName)) {
            console.warn(`?? Intento de delete con fileName inválido: ${fileName}`);
            return res.status(400).json({
                success: false,
                message: 'Nombre de archivo inválido'
            });
        }
        
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

// GET /api/backup/cron - Endpoint para Vercel Cron Jobs (backup automático semanal)
// Este endpoint es llamado automáticamente por Vercel Cron según la configuración en vercel.json
router.get('/cron', async (req, res, next) => {
    try {
        // Verificar que la llamada viene de Vercel Cron o tiene la clave correcta
        const authHeader = req.headers['authorization'];
        const cronSecret = process.env.CRON_SECRET;
        
        // Vercel envía el header Authorization con el valor Bearer <CRON_SECRET>
        // Si no hay CRON_SECRET configurado, permitimos la ejecución (para desarrollo)
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.log('[CRON] Acceso no autorizado al endpoint de cron');
            return res.status(401).json({
                success: false,
                message: 'No autorizado'
            });
        }

        console.log('[CRON] Ejecutando backup semanal automático...');
        
        const backup = new DatabaseBackup();
        const result = await backup.createBackup('weekly');
        
        console.log('[CRON] Backup semanal completado:', result);
        
        res.json({
            success: true,
            message: 'Backup semanal automático completado',
            type: 'weekly',
            timestamp: new Date().toISOString(),
            ...result
        });
    } catch (error) {
        console.error('[CRON] Error en backup semanal:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear backup automático'
        });
    }
});

module.exports = router;

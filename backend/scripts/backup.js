const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DatabaseBackup {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'prisma', 'clinic.db');
        this.backupDir = path.join(__dirname, '..', 'backups');
        this.maxBackups = 30; // Mantener 30 días de backups
    }

    /**
     * Genera el nombre del archivo de backup con timestamp
     */
    generateBackupFileName(type = 'manual') {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const typePrefix = type === 'daily' ? 'daily' :
            type === 'weekly' ? 'weekly' :
                'manual';

        // Use JSON extension because backups are Supabase JSON exports now
        return `clinic_backup_${typePrefix}_${year}${month}${day}_${hours}${minutes}${seconds}.json`;
    }

    /**
     * Verifica que la base de datos existe
     */
    checkDatabaseExists() {
        if (!fs.existsSync(this.dbPath)) {
            throw new Error(`Base de datos no encontrada: ${this.dbPath}`);
        }
    }

    /**
     * Crea el directorio de backups si no existe
     */
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`📁 Directorio de backups creado: ${this.backupDir}`);
        }
    }

    /**
     * Crea una copia de seguridad de la base de datos
     */
    async createBackup(type = 'manual') {
        try {
            console.log(`🔄 Iniciando backup ${type} de la base de datos (Supabase JSON export)...`);
            this.ensureBackupDirectory();

            const backupFileName = this.generateBackupFileName(type);
            const backupPath = path.join(this.backupDir, backupFileName);

            // Always export via Supabase REST as JSON
            let createdVia = 'supabase-json';
            await this._exportViaSupabase(backupPath);

            // Verificar que el backup se creó correctamente
            if (fs.existsSync(backupPath)) {
                const backupStats = fs.statSync(backupPath);
                const backupSizeInMB = (backupStats.size / (1024 * 1024)).toFixed(2);

                console.log(`✅ Backup ${type} creado exitosamente (via=${createdVia}):`);
                console.log(`   📁 Archivo: ${backupFileName}`);
                console.log(`   📏 Tamaño: ${backupSizeInMB} MB`);
                console.log(`   📍 Ubicación: ${backupPath}`);

                // Limpiar backups antiguos solo si es automático
                if (type !== 'manual') {
                    await this.cleanOldBackups();
                }

                return {
                    success: true,
                    fileName: backupFileName,
                    filePath: backupPath,
                    size: backupSizeInMB,
                    timestamp: new Date().toISOString(),
                    type: type,
                    createdVia
                };
            } else {
                throw new Error('El archivo de backup no se pudo verificar');
            }

        } catch (error) {
            console.error(`❌ Error al crear backup ${type}:`, error.message);
            throw error;
        }
    }

    /**
     * Lista todos los backups existentes
     */
    listBackups() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                return [];
            }

            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('clinic_backup_') && (file.endsWith('.db') || file.endsWith('.json')))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);

                    // Extraer información del nombre del archivo
                    const backupInfo = this.parseBackupFileName(file);

                    return {
                        fileName: file,
                        filePath: filePath,
                        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                        created: stats.birthtime,
                        modified: stats.mtime,
                        type: backupInfo.type,
                        date: backupInfo.date,
                        time: backupInfo.time,
                        displayName: this.getDisplayName(backupInfo)
                    };
                })
                .sort((a, b) => b.created - a.created); // Más recientes primero

            return files;
        } catch (error) {
            console.error('❌ Error al listar backups:', error.message);
            return [];
        }
    }

    /**
     * Limpia backups antiguos manteniendo solo los más recientes
     */
    async cleanOldBackups() {
        try {
            const backups = this.listBackups();

            if (backups.length > this.maxBackups) {
                const toDelete = backups.slice(this.maxBackups);

                console.log(`🧹 Limpiando ${toDelete.length} backups antiguos...`);

                for (const backup of toDelete) {
                    fs.unlinkSync(backup.filePath);
                    console.log(`   🗑️  Eliminado: ${backup.fileName}`);
                }

                console.log(`✅ Limpieza completada. Mantenidos ${this.maxBackups} backups más recientes.`);
            } else {
                console.log(`📊 Total de backups: ${backups.length}/${this.maxBackups}`);
            }
        } catch (error) {
            console.error('⚠️  Error durante la limpieza de backups:', error.message);
        }
    }

    /**
     * Restaura una base de datos desde un backup
     */
    async restoreBackup(backupFileName, options = {}) {
        try {
            const backupPath = path.join(this.backupDir, backupFileName);

            if (!fs.existsSync(backupPath)) {
                throw new Error(`Backup no encontrado: ${backupFileName}`);
            }

            // Crear backup de la base de datos actual antes de restaurar
            const currentBackupName = `current_backup_${Date.now()}.db`;
            const currentBackupPath = path.join(this.backupDir, currentBackupName);

            if (fs.existsSync(this.dbPath)) {
                fs.copyFileSync(this.dbPath, currentBackupPath);
                console.log(`💾 Backup de seguridad de la BD actual creado: ${currentBackupName}`);
            }

            // If it's a JSON export produced by _exportViaSupabase, attempt to import when allowed
            const content = fs.readFileSync(backupPath, 'utf-8');
            let parsed = null;
            try {
                parsed = JSON.parse(content);
            } catch (e) {
                parsed = null;
            }

            const allowAutoRestore = options.allowAutoRestore === true || process.env.ALLOW_AUTO_RESTORE === 'true';
            if (parsed && parsed.data && allowAutoRestore) {
                console.log('🔁 Detected JSON export backup and allowAutoRestore=true: attempting import to Supabase');
                const SUPABASE_URL = process.env.SUPABASE_URL;
                const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
                if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('No hay credenciales SUPABASE para restaurar');

                const fetchFn = await this._getFetch();
                // For each table, try to upsert rows (this is best-effort)
                const importResults = {};
                const chunkSize = 500; // chunk to avoid huge payloads
                for (const [table, rows] of Object.entries(parsed.data)) {
                    if (!Array.isArray(rows)) continue;
                    console.log(`   ↪ Importing ${rows.length} rows into ${table}...`);
                    importResults[table] = { attempted: rows.length, inserted: 0, warnings: [] };
                    try {
                        // infer on_conflict key
                        let onConflict = null;
                        if (rows.length > 0) {
                            const first = rows[0];
                            if (first.hasOwnProperty('id')) onConflict = 'id';
                            else if (first.hasOwnProperty('key')) onConflict = 'key';
                        }

                        // chunk rows
                        for (let i = 0; i < rows.length; i += chunkSize) {
                            const chunk = rows.slice(i, i + chunkSize);
                            let url = `${SUPABASE_URL}/rest/v1/${table}`;
                            const headers = {
                                'Content-Type': 'application/json',
                                apikey: SUPABASE_KEY,
                                Authorization: `Bearer ${SUPABASE_KEY}`
                            };

                            if (onConflict) {
                                url += `?on_conflict=${onConflict}`;
                                headers.Prefer = 'return=representation,resolution=merge-duplicates';
                            } else {
                                headers.Prefer = 'return=representation';
                            }

                            try {
                                const res = await fetchFn(url, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify(chunk)
                                });
                                if (!res.ok) {
                                    const text = await res.text().catch(() => '');
                                    const msg = `status ${res.status} ${text}`;
                                    console.warn(`⚠️ Import to ${table} chunk returned: ${msg}`);
                                    importResults[table].warnings.push(msg);
                                } else {
                                    // count inserted rows from returned representation if any
                                    const returned = await res.json().catch(() => null);
                                    if (Array.isArray(returned)) importResults[table].inserted += returned.length;
                                    else importResults[table].inserted += chunk.length;
                                }
                            } catch (e) {
                                const emsg = e && e.message ? e.message : String(e);
                                const estack = e && e.stack ? e.stack : null;
                                const full = estack ? `${emsg}\n${estack}` : emsg;
                                console.warn(`⚠️ Error importing chunk to ${table}:`, full);
                                importResults[table].warnings.push(full);
                            }
                        }
                        console.log(`   ✅ Import attempts for ${table} completed: inserted=${importResults[table].inserted}`);
                    } catch (e) {
                        console.warn(`⚠️ Error importing ${table}:`, e && e.message ? e.message : e);
                        importResults[table].warnings.push(e && e.message ? e.message : String(e));
                    }
                }

                console.log(`✅ Import desde JSON completado: ${backupFileName}`);
                return {
                    success: true,
                    restoredFrom: backupFileName,
                    currentBackup: currentBackupName,
                    timestamp: new Date().toISOString(),
                    imported: true,
                    importResults
                };
            }

            // Otherwise fallback to sqlite copy (if exists) or return instructions
            if (fs.existsSync(this.dbPath)) {
                fs.copyFileSync(backupPath, this.dbPath);
                console.log(`✅ Base de datos restaurada desde: ${backupFileName}`);
                return {
                    success: true,
                    restoredFrom: backupFileName,
                    currentBackup: currentBackupName,
                    timestamp: new Date().toISOString()
                };
            }

            // If we reach here, we couldn't auto-restore. Provide helpful diagnostics and instructions.
            const parsedPresent = !!(parsed && parsed.data);
            const allowEnv = process.env.ALLOW_AUTO_RESTORE === 'true';
            const nodeEnv = process.env.NODE_ENV || 'unknown';

            // Build a small diagnostics object if we have parsed JSON
            let diagnostics = null;
            if (parsedPresent) {
                diagnostics = {};
                try {
                    for (const [table, rows] of Object.entries(parsed.data)) {
                        if (Array.isArray(rows)) diagnostics[table] = { rows: rows.length };
                        else if (rows && rows.error) diagnostics[table] = { error: rows.error };
                        else diagnostics[table] = { info: typeof rows };
                    }
                } catch (e) {
                    diagnostics._error = String(e && e.message ? e.message : e);
                }
            }

            console.log(`⚠️ No se pudo restaurar automáticamente. parsed=${parsedPresent} ALLOW_AUTO_RESTORE=${allowEnv} NODE_ENV=${nodeEnv}. Para permitir importación automática establezca ALLOW_AUTO_RESTORE=true o, en desarrollo, use ?force=true en la ruta de restauración.`);

            return {
                success: false,
                message: 'No se realizó la restauración automática. Descargue el archivo e importe manualmente (pg_restore, psql o revise el JSON). Para permitir importación automática, establezca ALLOW_AUTO_RESTORE=true en el entorno, o en desarrollo llame a la ruta con ?force=true.',
                restoredFrom: backupFileName,
                timestamp: new Date().toISOString(),
                parsedPresent,
                allowAutoRestoreEnv: allowEnv,
                nodeEnv,
                diagnostics
            };

        } catch (error) {
            console.error('❌ Error al restaurar backup:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de los backups
     */
    getBackupStats() {
        const backups = this.listBackups();

        if (backups.length === 0) {
            return {
                totalBackups: 0,
                totalSize: '0 MB',
                lastBackup: null,
                oldestBackup: null,
                nextScheduled: this.getNextScheduledBackup()
            };
        }

        const totalSizeBytes = backups.reduce((total, backup) => {
            // backup.size is like '12.34 MB' - parseFloat handles it
            return total + (parseFloat(backup.size) || 0) * 1024 * 1024;
        }, 0);

        return {
            totalBackups: backups.length,
            totalSize: (totalSizeBytes / (1024 * 1024)).toFixed(2) + ' MB',
            lastBackup: backups[0].created,
            oldestBackup: backups[backups.length - 1].created,
            nextScheduled: this.getNextScheduledBackup()
        };
    }

    /**
     * Obtiene la ruta completa de un archivo de backup
     */
    getBackupPath(fileName) {
        return path.join(this.backupDir, fileName);
    }

    /**
     * Elimina un archivo de backup específico
     */
    deleteBackup(fileName) {
        try {
            const backupPath = this.getBackupPath(fileName);

            if (!fs.existsSync(backupPath)) {
                return {
                    success: false,
                    message: 'Archivo de backup no encontrado'
                };
            }

            // No permitir eliminar el backup más reciente
            const backups = this.listBackups();
            if (backups.length > 0 && backups[0].fileName === fileName) {
                return {
                    success: false,
                    message: 'No se puede eliminar el backup más reciente'
                };
            }

            fs.unlinkSync(backupPath);
            console.log(`🗑️ Backup eliminado: ${fileName}`);

            return {
                success: true,
                message: 'Backup eliminado exitosamente',
                fileName
            };
        } catch (error) {
            console.error('❌ Error al eliminar backup:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Calcula la próxima fecha de backup programado
     */
    getNextScheduledBackup() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0); // 2:00 AM

        return tomorrow.toISOString();
    }

    /**
     * Parsea el nombre del archivo de backup para extraer información
     */
    parseBackupFileName(fileName) {
    // Formato: clinic_backup_[type]_YYYYMMDD_HHMMSS.json
    const regex = /clinic_backup_(?:(daily|weekly|manual)_)?(\d{8})_(\d{6})\.(?:db|json)/;
        const match = fileName.match(regex);

        if (!match) {
            return {
                type: 'unknown',
                date: '',
                time: '',
                dateObj: new Date()
            };
        }

        const type = match[1] || 'legacy';
        const dateStr = match[2]; // YYYYMMDD
        const timeStr = match[3]; // HHMMSS

        const year = parseInt(dateStr.substr(0, 4));
        const month = parseInt(dateStr.substr(4, 2)) - 1; // Mes base 0
        const day = parseInt(dateStr.substr(6, 2));
        const hour = parseInt(timeStr.substr(0, 2));
        const minute = parseInt(timeStr.substr(2, 2));
        const second = parseInt(timeStr.substr(4, 2));

        const dateObj = new Date(year, month, day, hour, minute, second);

        return {
            type: type,
            date: dateStr,
            time: timeStr,
            dateObj: dateObj
        };
    }

    /**
     * Genera un nombre descriptivo para mostrar en la interfaz
     */
    getDisplayName(backupInfo) {
        const typeNames = {
            'daily': 'Diario',
            'weekly': 'Semanal',
            'manual': 'Manual',
            'legacy': 'Manual',
            'unknown': 'Desconocido'
        };

        const date = backupInfo.dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const time = backupInfo.dateObj.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `${typeNames[backupInfo.type]} - ${date} ${time}`;
    }

    /**
     * Obtiene backups agrupados por fecha para la interfaz
     */
    getBackupsByDate() {
        const backups = this.listBackups();
        const grouped = {};

        backups.forEach(backup => {
            const backupInfo = this.parseBackupFileName(backup.fileName);
            const dateKey = backupInfo.dateObj.toISOString().split('T')[0];

            if (!grouped[dateKey]) {
                grouped[dateKey] = {
                    date: backupInfo.dateObj.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    backups: []
                };
            }

            // Agregar la información parseada al backup
            backup.type = backupInfo.type;
            backup.date = backupInfo.date;
            backup.time = backupInfo.time;
            backup.displayName = this.getDisplayName(backupInfo);

            grouped[dateKey].backups.push(backup);
        });

        return grouped;
    }
}

// Función principal para ejecutar backup
async function runBackup() {
    const backup = new DatabaseBackup();

    try {
        const result = await backup.createBackup();
        console.log('\n🎉 Proceso de backup completado exitosamente!');
        return result;
    } catch (error) {
        console.error('\n💥 Proceso de backup falló:', error.message);
        throw error; // No usar process.exit para que el servidor siga funcionando
    }
}

// Helper: export key tables via Supabase REST (using SUPABASE env vars)
DatabaseBackup.prototype._getFetch = async function () {
    // Return a fetch function compatible with node. Try global fetch, then require/import node-fetch.
    if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis);
    try {
        // Try require for node-fetch v2 compatibility
        // eslint-disable-next-line global-require
        const nf = require('node-fetch');
        if (typeof nf === 'function') return nf;
        if (nf && nf.default) return nf.default;
    } catch (e) {
        // ignore
    }
    try {
        // dynamic import for node-fetch v3 (ESM)
        const mod = await import('node-fetch');
        if (mod && mod.default) return mod.default;
    } catch (e) {
        // ignore
    }
    throw new Error('No fetch implementation available (install node-fetch)');
};

DatabaseBackup.prototype._exportViaSupabase = async function (backupPath) {
    try {
        console.log('🔁 Exportando datos vía Supabase API (JSON)...');
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            throw new Error('No hay credenciales SUPABASE disponibles para exportar');
        }

        const fetchFn = await this._getFetch();
    const tables = ['patients', 'appointments', 'credit_packs', 'credit_redemptions', 'configurations'];
        const exportObj = {};

        for (const table of tables) {
            try {
                // Prepare candidate names to try: original, plural (add 's' when missing), and camelCase->snake_case
                const candidates = [table];
                if (!table.endsWith('s')) candidates.push(table + 's');
                const camelToSnake = table.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
                if (camelToSnake !== table) candidates.push(camelToSnake);

                let succeeded = false;
                let usedName = null;
                for (const candidate of candidates) {
                    try {
                        const url = `${SUPABASE_URL}/rest/v1/${candidate}?select=*`;
                        const res = await fetchFn(url, {
                            headers: {
                                apikey: SUPABASE_KEY,
                                Authorization: `Bearer ${SUPABASE_KEY}`
                            }
                        });

                        if (!res.ok) {
                            // if 404, try next candidate; otherwise record the error and stop trying
                            if (res.status === 404) {
                                console.warn(`⚠️ Supabase export ${candidate} responded with status 404`);
                                continue;
                            }
                            const text = await res.text().catch(() => '');
                            console.warn(`⚠️ Supabase export ${candidate} responded with status ${res.status} ${text}`);
                            exportObj[table] = { error: `status ${res.status} ${text}` };
                            succeeded = true; // mark as handled
                            usedName = candidate;
                            break;
                        }

                        const json = await res.json();
                        exportObj[table] = json;
                        succeeded = true;
                        usedName = candidate;
                        break;
                    } catch (err) {
                        console.warn('⚠️ Error exporting table candidate', candidate, err && err.message ? err.message : err);
                        // try next candidate
                    }
                }

                if (!succeeded) {
                    exportObj[table] = { error: `status 404 (tried: ${candidates.join(',')})` };
                } else if (usedName && usedName !== table) {
                    console.log(`ℹ️ Supabase table fallback: requested='${table}' used='${usedName}'`);
                    // store mapping for diagnostics (kept in export object under a meta key)
                    // Normalize meta key name when table is 'configurations'
                    const metaKey = `__usedName_${table}`;
                    exportObj[metaKey] = usedName;
                }
            } catch (e) {
                console.warn('⚠️ Error exporting table', table, e && e.message ? e.message : e);
                exportObj[table] = { error: e.message || String(e) };
            }
        }

        fs.writeFileSync(backupPath, JSON.stringify({ exportedAt: new Date().toISOString(), data: exportObj }, null, 2), 'utf-8');
        console.log('✅ Export via Supabase saved to', backupPath);
    } catch (e) {
        console.error('❌ _exportViaSupabase failed:', e && e.message ? e.message : e);
        throw e;
    }
};

// Si el script se ejecuta directamente
if (require.main === module) {
    runBackup();
}

module.exports = { DatabaseBackup, runBackup };

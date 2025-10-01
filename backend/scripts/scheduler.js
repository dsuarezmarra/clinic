const cron = require('node-cron');
const { DatabaseBackup, runBackup } = require('./backup');
const { getDbManager } = require('../src/database/database-manager');

class BackupScheduler {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Inicia el programador de backups automáticos
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  El programador de backups ya está ejecutándose');
            return;
        }

        console.log('🕐 Iniciando programador de backups automáticos...');

        // Programar backup diario a las 2:00 AM
        this.dailyJob = cron.schedule('0 2 * * *', async () => {
            console.log('\n⏰ Ejecutando backup diario automático programado...');
            try {
                const backup = new DatabaseBackup();
                await backup.createBackup('daily');
                console.log('✅ Backup diario automático completado exitosamente');
            } catch (error) {
                console.error('❌ Error en backup diario automático:', error.message);
            }
        }, {
            scheduled: false,
            timezone: "Europe/Madrid"
        });

        // Programar backup semanal los domingos a las 3:00 AM
        this.weeklyJob = cron.schedule('0 3 * * 0', async () => {
            console.log('\n📅 Ejecutando backup semanal programado...');
            try {
                const backup = new DatabaseBackup();
                await backup.createBackup('weekly');
                console.log('✅ Backup semanal completado exitosamente');
            } catch (error) {
                console.error('❌ Error en backup semanal:', error.message);
            }
        }, {
            scheduled: false,
            timezone: "Europe/Madrid"
        });

        // Iniciar las tareas programadas
        this.dailyJob.start();
        this.weeklyJob.start();

        // Keepalive: consulta ligera para evitar que Supabase entre en inactividad
        // Ejecutar cada 6 horas y un job diario poco antes del backup
        this.keepAliveJob = cron.schedule('0 */6 * * *', async () => {
            console.log('\n⏳ Ejecutando keepalive periódico para Supabase...');
            try {
                // Obtain dbManager instance lazily
                const dbManager = await getDbManager();
                if (!dbManager || !dbManager.isConnected) {
                    console.log('🔁 Keepalive: dbManager no conectado, reintentando initialize()...');
                    try {
                        await dbManager.initialize();
                    } catch (e) {
                        // ignore init error, will warn below
                    }
                }

                if (dbManager && dbManager.isConnected) {
                    // create a compatible client
                    const client = dbManager.createPrismaCompatibleInterface();
                    // Consulta ligera
                    const rows = await client.patient.findMany({ skip: 0, take: 1 });
                    console.log(`✅ Keepalive: consulta OK, filas obtenidas=${(rows || []).length}`);
                } else {
                    console.warn('⚠️ Keepalive: sigue sin conexión a Supabase');
                }
            } catch (error) {
                console.error('❌ Keepalive error:', error.message);
            }
        }, {
            scheduled: false,
            timezone: 'Europe/Madrid'
        });

        // Job diario de keepalive 5 minutos antes del backup diario (01:55)
        this.dailyKeepAlive = cron.schedule('55 1 * * *', async () => {
            console.log('\n⏳ Ejecutando keepalive diario antes del backup...');
            try {
                const dbManager = await getDbManager();
                if (!dbManager.isConnected) await dbManager.initialize();
                if (dbManager.isConnected) {
                    const client = dbManager.createPrismaCompatibleInterface();
                    const rows = await client.patient.findMany({ skip: 0, take: 1 });
                    console.log(`✅ Keepalive diario: filas=${(rows || []).length}`);
                } else console.warn('⚠️ Keepalive diario: no conectado');
            } catch (error) {
                console.error('❌ Keepalive diario error:', error.message);
            }
        }, { scheduled: false, timezone: 'Europe/Madrid' });

        this.keepAliveJob.start();
        this.dailyKeepAlive.start();

        this.isRunning = true;

        console.log('✅ Programador de backups iniciado:');
        console.log('   📅 Backup diario: Todos los días a las 2:00 AM');
        console.log('   📅 Backup semanal: Domingos a las 3:00 AM');
        console.log('   🌍 Zona horaria: Europe/Madrid');
    }

    /**
     * Detiene el programador de backups
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  El programador de backups no está ejecutándose');
            return;
        }

        if (this.dailyJob) {
            this.dailyJob.stop();
        }

        if (this.weeklyJob) {
            this.weeklyJob.stop();
        }

        this.isRunning = false;
        console.log('🛑 Programador de backups detenido');
    }

    /**
     * Obtiene el estado del programador
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            dailySchedule: '0 2 * * *',
            weeklySchedule: '0 3 * * 0',
            timezone: 'Europe/Madrid',
            nextDaily: this.dailyJob ? 'Todos los días a las 2:00 AM' : 'No programado',
            nextWeekly: this.weeklyJob ? 'Domingos a las 3:00 AM' : 'No programado'
        };
    }

    /**
     * Ejecuta un backup inmediato
     */
    async runImmediateBackup() {
        console.log('🚀 Ejecutando backup inmediato...');
        try {
            const result = await runBackup();
            console.log('✅ Backup inmediato completado');
            return result;
        } catch (error) {
            console.error('❌ Error en backup inmediato:', error.message);
            throw error;
        }
    }
}

// Exportar instancia singleton
const backupScheduler = new BackupScheduler();

module.exports = { BackupScheduler, backupScheduler };

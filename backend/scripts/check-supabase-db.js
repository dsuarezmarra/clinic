#!/usr/bin/env node
/* check-supabase-db.js
   Conecta a la DATABASE_URL (lee backend/.env) y ejecuta comprobaciones:
   - conteos por tabla
   - orfandades entre tablas
   - muestra de filas

   Uso:
     node scripts/check-supabase-db.js
*/

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const sql = require('../src/sql');

async function run() {
    try {
        console.log('Conectando usando DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : 'no disponible');

        const counts = await sql`SELECT 'patients' AS tabla, COUNT(*) AS filas FROM patients
    UNION ALL
    SELECT 'patient_files', COUNT(*) FROM patient_files
    UNION ALL
    SELECT 'credit_packs', COUNT(*) FROM credit_packs
    UNION ALL
    SELECT 'appointments', COUNT(*) FROM appointments
    UNION ALL
    SELECT 'credit_redemptions', COUNT(*) FROM credit_redemptions
    UNION ALL
    SELECT 'configurations', COUNT(*) FROM configurations;`;
        console.log('\nConteos por tabla:');
        console.table(counts);

        const orphans = await sql`SELECT cr.id, cr."creditPackId", cr."appointmentId"
    FROM credit_redemptions cr
    LEFT JOIN credit_packs cp ON cr."creditPackId" = cp.id
    LEFT JOIN appointments a ON cr."appointmentId" = a.id
    WHERE cp.id IS NULL OR a.id IS NULL
    LIMIT 50;`;
        console.log('\nRedenciones con referencias rotas (max 50):');
        console.table(orphans);

        const samplePatients = await sql`SELECT id, "firstName", "lastName", phone, email FROM patients ORDER BY "createdAt" DESC LIMIT 10`;
        console.log('\nMuestra patients:');
        console.table(samplePatients);

        const sampleAppointments = await sql`SELECT id, "patientId", start, "end", "durationMinutes", status FROM appointments ORDER BY start DESC LIMIT 10`;
        console.log('\nMuestra appointments:');
        console.table(sampleAppointments);

        const samplePacks = await sql`SELECT id, "patientId", label, "unitsTotal", "unitsRemaining", "unitMinutes", paid, "createdAt" FROM credit_packs ORDER BY "createdAt" DESC LIMIT 10`;
        console.log('\nMuestra credit_packs:');
        const normalizedSamplePacks = (samplePacks || []).map(p => ({
            ...p,
            unitsTotal: Number(p.unitsTotal) || 0,
            unitsRemaining: Number(p.unitsRemaining) || 0,
            unitMinutes: Number(p.unitMinutes) || 30,
            paid: !!p.paid,
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null
        }));
        console.table(normalizedSamplePacks);

        await sql.end({ timeout: 3 });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err && err.message ? err.message : err);
        try { await sql.end(); } catch (e) { }
        process.exit(10);
    }
}

run();

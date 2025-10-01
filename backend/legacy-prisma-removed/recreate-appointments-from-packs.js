const fs = require('fs');
const prisma = require('../src/services/database');

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function randomStartForPatient(usedIntervals, durationMinutes) {
    // pick a random date/time in 2025 between 8:00 and 19:30, half-hour increments
    for (let tries = 0; tries < 200; tries++) {
        const month = randomInt(0, 11); // Jan=0
        const day = randomInt(1, 28);
        const hour = randomInt(8, 19);
        const minute = randomFrom([0, 30]);
        const dt = new Date(2025, month, day, hour, minute, 0, 0);
        const startMs = dt.getTime();
        const endMs = startMs + durationMinutes * 60000;

        // check overlap with existing intervals
        let overlap = false;
        for (const iv of usedIntervals) {
            if (startMs < iv.end && endMs > iv.start) {
                overlap = true; break;
            }
        }
        if (!overlap) {
            usedIntervals.push({ start: startMs, end: endMs });
            return new Date(startMs);
        }
    }

    // fallback: sequentially pick next available half-hour from Jan 1 2025 08:00
    let dt = new Date(2025, 0, 1, 8, 0, 0, 0);
    while (true) {
        const startMs = dt.getTime();
        const endMs = startMs + durationMinutes * 60000;
        let overlap = false;
        for (const iv of usedIntervals) {
            if (startMs < iv.end && endMs > iv.start) { overlap = true; break; }
        }
        if (!overlap) {
            usedIntervals.push({ start: startMs, end: endMs });
            return new Date(startMs);
        }
        dt = new Date(dt.getTime() + 30 * 60000);
    }
}

async function main() {
    console.log('🚧 recreate-appointments-from-packs: iniciando...');

    // 1) borrar redenciones y citas actuales
    console.log('🗑️  Borrando creditRedemptions y appointments existentes...');
    await prisma.creditRedemption.deleteMany();
    await prisma.appointment.deleteMany();

    // 2) obtener todos los packs con unitsRemaining > 0
    const packs = await prisma.creditPack.findMany({
        where: { unitsRemaining: { gt: 0 } },
        include: { patient: true }
    });

    console.log(`🔎 Encontrados ${packs.length} packs con unidades disponibles.`);

    // Group by patient to avoid overlapping times per patient
    const packsByPatient = new Map();
    for (const pack of packs) {
        const list = packsByPatient.get(pack.patientId) || [];
        list.push(pack);
        packsByPatient.set(pack.patientId, list);
    }

    let totalCreated = 0;
    const csvRows = [];

    for (const [patientId, patientPacks] of packsByPatient.entries()) {
        const usedIntervals = [];

        // For each pack, create appointments consuming unitsRemaining
        for (const pack of patientPacks) {
            let unitsLeft = pack.unitsRemaining;
            if (!unitsLeft || unitsLeft <= 0) continue;

            while (unitsLeft > 0) {
                let durationMinutes;
                if (unitsLeft >= 2) {
                    durationMinutes = Math.random() < 0.4 ? 60 : 30;
                } else {
                    durationMinutes = 30;
                }
                const unitsUsed = durationMinutes === 60 ? 2 : 1;
                if (unitsUsed > unitsLeft) durationMinutes = 30;

                const start = await randomStartForPatient(usedIntervals, durationMinutes);
                const end = new Date(start.getTime() + durationMinutes * 60000);
                const status = Math.random() < 0.2 ? 'COMPLETED' : 'BOOKED';
                const notes = 'Cita generada a partir de bono/sesión existente';

                const pricePerUnit = pack.unitsTotal > 0 ? Math.round(pack.priceCents / pack.unitsTotal) : 0;
                const apptPriceCents = pricePerUnit * (durationMinutes === 60 ? 2 : 1);

                try {
                    const createdAppt = await prisma.appointment.create({
                        data: {
                            patientId: patientId,
                            start,
                            end,
                            durationMinutes,
                            status,
                            notes,
                            consumesCredit: true,
                            priceCents: apptPriceCents
                        }
                    });

                    const redemption = await prisma.creditRedemption.create({
                        data: {
                            creditPackId: pack.id,
                            appointmentId: createdAppt.id,
                            unitsUsed: durationMinutes === 60 ? 2 : 1
                        }
                    });

                    await prisma.creditPack.update({
                        where: { id: pack.id },
                        data: { unitsRemaining: unitsLeft - (durationMinutes === 60 ? 2 : 1) }
                    });

                    // push CSV row
                    csvRows.push({
                        appointmentId: createdAppt.id,
                        patientId,
                        start: createdAppt.start.toISOString(),
                        end: createdAppt.end.toISOString(),
                        durationMinutes: createdAppt.durationMinutes,
                        priceCents: createdAppt.priceCents || apptPriceCents,
                        creditPackId: pack.id,
                        unitsUsed: durationMinutes === 60 ? 2 : 1,
                        status: createdAppt.status,
                        notes: createdAppt.notes || notes
                    });

                    unitsLeft -= (durationMinutes === 60 ? 2 : 1);
                    totalCreated++;
                } catch (e) {
                    console.error('Error creando cita/redención para pack', pack.id, e);
                    break;
                }
            }
        }
    }

    // write CSV
    const csvPath = require('path').join(__dirname, 'appointments-from-packs-2025.csv');
    const header = 'appointmentId;patientId;start;end;durationMinutes;priceCents;creditPackId;unitsUsed;status;notes\n';
    const lines = csvRows.map(r => [r.appointmentId, r.patientId, r.start, r.end, r.durationMinutes, r.priceCents, r.creditPackId, r.unitsUsed, r.status, `"${(r.notes || '').replace(/"/g, '""')}"`].join(';'));
    try {
        fs.writeFileSync(csvPath, header + lines.join('\n'), { encoding: 'utf8' });
        console.log(`📄 CSV escrito en: ${csvPath}`);
    } catch (e) {
        console.error('No se pudo escribir CSV:', e);
    }

    console.log(`✅ Generadas ${totalCreated} citas a partir de packs.`);
    try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch(e) {}
}

main().catch(e => {
    console.error('❌ Error en recreate-appointments-from-packs:', e);
    try { if (prisma && typeof prisma.$disconnect === 'function') prisma.$disconnect(); } catch(e) {}
    process.exit(1);
});

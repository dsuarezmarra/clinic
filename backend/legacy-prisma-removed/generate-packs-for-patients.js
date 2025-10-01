const prisma = require('../src/services/database');

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

(async () => {
    try {
        console.log('🚧 generate-packs-for-patients: iniciando...');
        const patients = await prisma.patient.findMany({ select: { id: true } });
        console.log(`🔎 Pacientes encontrados: ${patients.length}`);

        let createdCount = 0;

        for (const p of patients) {
            const packsCount = randomInt(1, 3); // 1-3 packs por paciente
            for (let i = 0; i < packsCount; i++) {
                const packType = Math.random() < 0.6 ? 'sesion' : 'bono';
                const unitsOptions = packType === 'sesion' ? [1, 2] : [5, 10];
                const units = randomFrom(unitsOptions);
                const unitMinutes = (units === 2 || units === 10) ? 60 : 30;
                const base = unitMinutes === 30 ? 3000 : 5500; // per session in cents
                // Compute total pack price (priceCents must be the total amount for the whole pack)
                let priceCents = 0;
                if (units === 1) {
                    // single 30m session = 30€
                    priceCents = 3000;
                } else if (units === 2) {
                    // single 60m session = 55€
                    priceCents = 5500;
                } else {
                    // bonos: map to canonical total prices
                    // 5x30m => 13500 cents, 5x60m => 24800 cents
                    if (unitMinutes === 60) {
                        // units for 60m bonos are multiples of 10 (10 == 5x60m)
                        const bonos = Math.round(units / 10);
                        priceCents = Math.round(24800 * bonos);
                    } else {
                        const bonos = Math.round(units / 5);
                        priceCents = Math.round(13500 * bonos);
                    }
                }
                const label = units === 1 ? `Sesión 30m` : units === 2 ? `Sesión 60m` : `Bono ${units}×30m`;
                const unitsTotal = units === 2 ? 2 : units;
                const unitsRemaining = unitsTotal; // pack completo
                const paid = Math.random() < 0.7;

                await prisma.creditPack.create({
                    data: {
                        patientId: p.id,
                        label,
                        unitsTotal,
                        unitMinutes,
                        priceCents,
                        unitsRemaining,
                        paid,
                        notes: 'Generado aleatoriamente para pruebas'
                    }
                });
                createdCount++;
            }
        }

        console.log(`✅ Packs creados: ${createdCount}`);
    } catch (e) {
        console.error('Error en generate-packs-for-patients:', e);
        process.exitCode = 1;
    } finally {
        try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) { }
    }
})();

(async () => {
    const db = require('../src/services/database');
    try {
        const patients = await db.patient.count();
        const appointments = await db.appointment.count();
        const creditPacks = await db.creditPack.count();
        const creditRedemptions = await db.creditRedemption.count();

        console.log('patients:', patients);
        console.log('appointments:', appointments);
        console.log('credit_packs:', creditPacks);
        console.log('credit_redemptions:', creditRedemptions);

        // show up to 5 patients ids and dnIs
        const samplePatients = await db.patient.findMany({ take: 5, select: { id: true, dni: true, firstName: true, lastName: true } });
        console.log('\nSample patients:');
        console.table(samplePatients);

    } catch (e) {
        console.error('ERROR', e);
        process.exitCode = 2;
    } finally {
        try { if (db && typeof db.$disconnect === 'function') await db.$disconnect(); } catch (e) {}
    }
})();

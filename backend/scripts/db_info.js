(async () => {
    const db = require('../src/services/database');
    try {
        const info = await db.$queryRawUnsafe("SELECT current_database() AS db, current_user AS user, inet_server_addr() AS server_addr, inet_server_port() AS server_port, version() AS version");
        console.log('Connection info:');
        console.table(info);

        const counts = {};
        counts.patients = await db.patient.count();
        counts.appointments = await db.appointment.count();
        counts.credit_packs = await db.creditPack.count();
        counts.credit_redemptions = await db.creditRedemption.count();
        console.log('\nCounts:');
        console.table(counts);

        const sample = await db.patient.findMany({ take: 10, select: { id: true, dni: true, firstName: true, lastName: true } });
        console.log('\nSample patients:');
        console.table(sample);

    } catch (e) {
        console.error('ERROR', e.message || e);
        process.exitCode = 2;
    } finally {
        try { if (db && typeof db.$disconnect === 'function') await db.$disconnect(); } catch (e) {}
    }
})();

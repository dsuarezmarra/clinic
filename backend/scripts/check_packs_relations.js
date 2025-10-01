(async () => {
    const db = require('../src/services/database');
    try {
        const total = await db.creditPack.count();
        console.log('total_credit_packs:', total);

        // Use quoted identifiers because Prisma/DB created mixed-case column names
        const orphan = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM credit_packs cp LEFT JOIN patients p ON cp."patientId" = p.id WHERE p.id IS NULL`);
        console.log('orphan_packs_count:', orphan[0].c);

        const top = await db.$queryRawUnsafe(`
      SELECT p.id, p.dni, p."firstName" AS "firstName", p."lastName" AS "lastName", COUNT(cp.*) AS packs
      FROM patients p
      LEFT JOIN credit_packs cp ON cp."patientId" = p.id
      GROUP BY p.id
      HAVING COUNT(cp.*) > 0
      ORDER BY packs DESC
      LIMIT 20
    `);
        console.log('\nTop patients by pack count:');
        console.table(top);

        // check existence for some patient ids you provided
        const sampleIds = [
            '0e12e092-fdb5-4439-9c18-3359e7075537',
            'c2030321-2623-4b28-a44a-b401df675a10',
            'cb4296d2-1cf7-463f-9765-cc1de096dd2f'
        ];
        console.log('\nSample patients existence and packs:');
        for (const id of sampleIds) {
            const p = await db.patient.findUnique({ where: { id }, select: { id: true, dni: true, firstName: true, lastName: true } });
            const packs = await db.creditPack.findMany({ where: { patientId: id }, select: { id: true, label: true, unitsRemaining: true, createdAt: true } });
            console.log('\npatient:', id, p ? `${p.firstName} ${p.lastName} (${p.dni})` : 'NOT FOUND');
            console.table(packs);
        }

    } catch (e) {
        console.error('ERROR', e.message || e);
    } finally {
        try { if (db && typeof db.$disconnect === 'function') await db.$disconnect(); } catch (e) {}
    }
})();

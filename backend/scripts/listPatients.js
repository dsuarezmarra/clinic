const prisma = require('../src/services/database');

(async () => {
    try {
        const patients = await prisma.patient.findMany();
        console.log(JSON.stringify(patients, null, 2));
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) {}
    }
})();

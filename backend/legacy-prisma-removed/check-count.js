const prisma = require('../src/services/database');
(async () => {
    try {
        const c = await prisma.patient.count();
        console.log('Patients in DB:', c);
    } catch (e) {
        console.error('Error counting patients:', e);
        process.exit(1);
    } finally {
        try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) {}
    }
})();

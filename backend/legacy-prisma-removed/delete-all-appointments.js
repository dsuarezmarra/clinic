const prisma = require('../src/services/database');
(async () => {
    try {
        const beforeAppointments = await prisma.appointment.count();
        const beforeRedemptions = await prisma.creditRedemption.count();
        console.log(`Antes: appointments=${beforeAppointments}, creditRedemptions=${beforeRedemptions}`);

        await prisma.creditRedemption.deleteMany();
        await prisma.appointment.deleteMany();

        const afterAppointments = await prisma.appointment.count();
        const afterRedemptions = await prisma.creditRedemption.count();
        console.log(`Después: appointments=${afterAppointments}, creditRedemptions=${afterRedemptions}`);
    } catch (e) {
        console.error('Error borrando citas/redenciones:', e);
        process.exitCode = 1;
    } finally {
        try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) { /* ignore */ }
    }
})();

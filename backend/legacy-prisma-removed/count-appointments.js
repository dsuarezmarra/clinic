const prisma = require('../src/services/database');
(async () => {
    const p = prisma;
    try {
        const c = await p.appointment.count();
        console.log('Appointments in DB:', c);
        const samples = await p.appointment.findMany({ take: 8, orderBy: { start: 'asc' } });
        console.log('Sample appointments (first up to 8):');
        for (const s of samples) {
            console.log({ id: s.id, patientId: s.patientId, start: s.start.toISOString(), end: s.end.toISOString(), duration: s.durationMinutes, status: s.status });
        }
    } catch (e) {
        console.error('Error counting appointments:', e);
        process.exit(1);
    } finally {
        try { if (p && typeof p.$disconnect === 'function') await p.$disconnect(); } catch (e) { }
    }
})();

const prisma = require('../src/services/database');
(async () => {
    try {
        const res = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`;
        console.log('Tables in DB:', res.map(r => r.table_name));
    } catch (e) {
        console.error('Error listing tables:', e);
    } finally {
        try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) {}
    }
})();

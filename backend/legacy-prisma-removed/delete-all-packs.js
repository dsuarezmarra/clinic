const prisma = require('../src/services/database');
(async () => {
    try {
        const beforePacks = await prisma.creditPack.count();
        const beforeRedemptions = await prisma.creditRedemption.count();
        console.log(`Antes: creditPacks=${beforePacks}, creditRedemptions=${beforeRedemptions}`);

        // Borrar redenciones primero para evitar conflictos de FK
        await prisma.creditRedemption.deleteMany();
        await prisma.creditPack.deleteMany();

        const afterPacks = await prisma.creditPack.count();
        const afterRedemptions = await prisma.creditRedemption.count();
        console.log(`Después: creditPacks=${afterPacks}, creditRedemptions=${afterRedemptions}`);
    } catch (e) {
        console.error('Error borrando packs/redenciones:', e);
        process.exitCode = 1;
    } finally {
        try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) { }
    }
})();

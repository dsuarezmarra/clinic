const prisma = require('../src/services/database');

(async () => {
    try {
        console.log('🚧 reset-packs-unitsRemaining: iniciando...');
        const packs = await prisma.creditPack.findMany({ select: { id: true, unitsTotal: true, unitsRemaining: true } });
        console.log(`🔎 Encontrados ${packs.length} packs`);
        let updated = 0;
        for (const pack of packs) {
            const total = Number(pack.unitsTotal || 0);
            if (pack.unitsRemaining !== total) {
                await prisma.creditPack.update({ where: { id: pack.id }, data: { unitsRemaining: total } });
                updated++;
            }
        }
        console.log(`✅ Packs actualizados (unitsRemaining restaurado): ${updated}`);
    } catch (e) {
        console.error('Error en reset-packs-unitsRemaining:', e);
        process.exitCode = 1;
    } finally {
        try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) { }
    }
})();

const prisma = require('../src/services/database');

function computeTotalPriceCents(unitsTotal, unitMinutes) {
    const base = unitMinutes === 30 ? 3000 : 5500;
    if (!unitsTotal || unitsTotal <= 0) return 0;
    if (unitsTotal === 1) return 3000; // 30€
    if (unitsTotal === 2) return 5500; // 60m session = 55€

    // bonos mapping: 5x30m -> 13500, 5x60m -> 24800
    if (unitMinutes === 60) {
        const bonos = Math.round(unitsTotal / 10); // 10 units == 5x60m
        return Math.round(24800 * bonos);
    } else {
        const bonos = Math.round(unitsTotal / 5); // 5 units == 5x30m
        return Math.round(13500 * bonos);
    }
}

(async () => {
    try {
        console.log('🚧 fix-pack-prices: iniciando...');
        const packs = await prisma.creditPack.findMany({ select: { id: true, unitsTotal: true, unitMinutes: true, priceCents: true } });
        console.log(`🔎 Packs encontrados: ${packs.length}`);

        let updated = 0;
        const changed = [];

        for (const p of packs) {
            const expected = computeTotalPriceCents(Number(p.unitsTotal), Number(p.unitMinutes || 30));
            const current = Number(p.priceCents || 0);
            if (current !== expected) {
                await prisma.creditPack.update({ where: { id: p.id }, data: { priceCents: expected } });
                updated++;
                changed.push({ id: p.id, before: current, after: expected });
            }
        }

        console.log(`✅ Packs actualizados: ${updated}`);
        if (changed.length > 0) console.log('Muestra de cambios:', changed.slice(0, 20));
    } catch (e) {
        console.error('Error en fix-pack-prices:', e);
        process.exitCode = 1;
    } finally {
        try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) { }
    }
})();

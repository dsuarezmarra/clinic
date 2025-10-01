const p = require('../src/services/database');
(async () => {
    try {
        const packs = await p.creditPack.findMany({
            select: { id: true, patientId: true, unitsTotal: true, unitsRemaining: true, priceCents: true, paid: true },
            orderBy: { patientId: 'asc' }
        });
        console.log('Total packs:', packs.length);
        let nonZero = 0;
        for (const pk of packs) {
            if (pk.unitsRemaining > 0) nonZero++;
        }
        console.log('Packs with unitsRemaining>0:', nonZero);
        console.log('First 10 packs sample:');
        console.log(packs.slice(0, 10));
    } catch (e) {
        console.error(e);
    } finally {
        try { if (p && typeof p.$disconnect === 'function') await p.$disconnect(); } catch (e) { }
    }
})();

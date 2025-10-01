#!/usr/bin/env node
const prisma = require('../src/services/database');

/**
 * Script seguro para detectar y opcionalmente marcar packs como unitMinutes = 60.
 * - Dry-run (por defecto): lista candidatos y muestra una recomendación.
 * - Para aplicar los cambios: node backfill-unitMinutes.js --apply
 *
 * Heurística usada:
 *  - Si el label contiene '60m' se marca como 60
 *  - Si el label contiene 'Sesión' y unitsTotal es divisible por 2 y unitMinutes !== 60
 *  - Se muestra la lista completa y no se actualiza sin --apply
 */

async function main() {
    const apply = process.argv.includes('--apply');

    console.log('Backfill unitMinutes script — dry run mode (use --apply to persist)');

    const packs = await prisma.creditPack.findMany({
        orderBy: { createdAt: 'asc' }
    });

    const candidates = [];

    for (const p of packs) {
        const unitMinutes = p.unitMinutes || 30;
        const label = (p.label || '').toLowerCase();

        // Skip packs already with 60
        if (unitMinutes === 60) continue;

        // Heurísticas
        let score = 0;
        if (label.includes('60m')) score += 10;
        if (label.startsWith('sesión') && (p.unitsTotal % 2 === 0)) score += 5;
        // Bono de 60min prior heuristic: large even unitsTotal (like multiples of 10)
        if (label.startsWith('bono') && (p.unitsTotal % 10 === 0) && p.unitsTotal >= 10) score += 3;

        if (score > 0) {
            candidates.push({ pack: p, score });
        }
    }

    if (candidates.length === 0) {
        console.log('No se encontraron packs candidatos para marcar como 60 minutos. Nada que hacer.');
        try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) {}
        return;
    }

    console.log(`Encontrados ${candidates.length} packs candidatos:`);
    for (const c of candidates) {
        const p = c.pack;
        console.log(`- id=${p.id} | label="${p.label}" | unitsTotal=${p.unitsTotal} | unitMinutes=${p.unitMinutes} | createdAt=${p.createdAt.toISOString()} | score=${c.score}`);
    }

    if (!apply) {
        console.log('\nDry-run completo. Ejecuta con --apply para marcar los packs anteriores como unitMinutes = 60.');
        await prisma.$disconnect();
        return;
    }

    console.log('\nAplicando cambios...');
    for (const c of candidates) {
        const p = c.pack;
        try {
            await prisma.creditPack.update({
                where: { id: p.id },
                data: { unitMinutes: 60 }
            });
            console.log(`Actualizado pack ${p.id} -> unitMinutes=60`);
        } catch (err) {
            console.error(`Error actualizando pack ${p.id}:`, err.message || err);
        }
    }

    console.log('Backfill completado.');
    try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) {}
}

main().catch(err => {
    console.error('Error en backfill:', err);
    try { if (prisma && typeof prisma.$disconnect === 'function') prisma.$disconnect(); } catch(e) {}
    process.exit(1);
});

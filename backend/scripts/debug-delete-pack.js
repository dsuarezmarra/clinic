require('dotenv').config();
const prisma = require('../src/services/database');

(async () => {
  try {
    const packs = await prisma.credit_packs.findMany({ orderBy: { createdAt: 'desc' } });
    const normalizePack = p => ({
        ...p,
        unitsRemaining: Number(p.unitsRemaining) || 0,
        unitsTotal: Number(p.unitsTotal) || 0,
        unitMinutes: Number(p.unitMinutes) || 30,
        paid: !!p.paid,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null
    });
    if (!packs || packs.length === 0) {
      console.log('No hay packs para borrar.');
      process.exit(0);
    }
    const pack = normalizePack(packs[0]);
    console.log('Intentando borrar pack:', pack.id, 'label:', pack.label);
    await prisma.credit_packs.delete({ where: { id: pack.id } });
    console.log('Borrado OK');
    process.exit(0);
  } catch (err) {
    console.error('Error borrando pack:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();

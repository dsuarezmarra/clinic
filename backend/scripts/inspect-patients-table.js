const prisma = require('../src/services/database');
(async () => {
  try {
    const result = await prisma.$queryRawUnsafe("SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name='patients';");
    console.log('Table patients columns:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error querying information_schema:', e.message || e);
  } finally {
    try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) {}
  }
})();

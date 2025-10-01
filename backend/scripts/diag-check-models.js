require('dotenv').config();
const prisma = require('../src/services/database');

(async function(){
  const models = ['patients','appointments','credit_packs','credit_redemptions','patient_files','configuration'];
  for (const m of models) {
    try {
      console.log(`🔎 Probando modelo: ${m}`);
      const res = await prisma[m].findMany ? await prisma[m].findMany({ take: 1 }) : 'MISSING_METHOD';
      console.log(`✅ ${m}: OK ->`, Array.isArray(res) ? `rows=${res.length}` : res);
    } catch (err) {
      console.error(`❌ ${m}: ERROR ->`, err && err.message ? err.message : err);
    }
  }
  process.exit(0);
})();

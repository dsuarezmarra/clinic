// Script para ver todos los packs del paciente de prueba
const SUPABASE_URL = 'https://skukyfkrwqsfnkbxedty.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ2MTE2OCwiZXhwIjoyMDcyMDM3MTY4fQ.Df8E2G--ulzTVUXeSBHgNRm9qQTeZDi_TYlG1UD02BQ';
const PATIENT_ID = '2db94a43-7641-4c0b-9d6c-cbb01f62e276';

async function checkPacks() {
  console.log('🔍 Verificando packs del paciente de prueba...\n');

  try {
    // Obtener todos los packs (con y sin unidades)
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/credit_packs?patientId=eq.${PATIENT_ID}&select=*&order=paid.desc,createdAt.asc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const packs = await response.json();
    console.log(`📦 Total de packs encontrados: ${packs.length}\n`);

    console.log('Orden de packs (como los ve el backend con paid.desc,createdAt.asc):\n');
    packs.forEach((pack, index) => {
      const paidIcon = pack.paid ? '✅' : '❌';
      const unitsIcon = pack.unitsRemaining > 0 ? '🟢' : '🔴';
      console.log(`${index + 1}. ${paidIcon} ${unitsIcon} ${pack.label}`);
      console.log(`   ID: ${pack.id}`);
      console.log(`   Paid: ${pack.paid}`);
      console.log(`   Units: ${pack.unitsRemaining}/${pack.unitsTotal}`);
      console.log(`   Unit minutes: ${pack.unitMinutes}`);
      console.log(`   Price: ${pack.priceCents}¢ (${((pack.priceCents || 0)/100).toFixed(2)}€)`);
      console.log(`   Created: ${pack.createdAt}`);
      console.log('');
    });

    // Mostrar solo los que tienen unidades disponibles
    const available = packs.filter(p => p.unitsRemaining > 0);
    console.log(`\n🟢 Packs DISPONIBLES (con unidades > 0): ${available.length}\n`);
    available.forEach((pack, index) => {
      const paidIcon = pack.paid ? '✅ PAGADO' : '❌ PENDIENTE';
      console.log(`${index + 1}. ${paidIcon} - ${pack.label} (${pack.unitsRemaining} unidades de ${pack.unitMinutes}min)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPacks().catch(console.error);

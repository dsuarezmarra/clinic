// Script para verificar todos los bonos/sesiones y sus precios
const SUPABASE_URL = 'https://skukyfkrwqsfnkbxedty.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ2MTE2OCwiZXhwIjoyMDcyMDM3MTY4fQ.Df8E2G--ulzTVUXeSBHgNRm9qQTeZDi_TYlG1UD02BQ';

async function checkAllPacksPrices() {
  console.log('🔍 Verificando precios de todos los bonos/sesiones...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/credit_packs?select=*&order=createdAt.desc`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const packs = await response.json();
    console.log(`📦 Total de bonos/sesiones encontrados: ${packs.length}\n`);

    // Separar por tipo
    const withPrice = packs.filter(p => p.priceCents > 0);
    const withoutPrice = packs.filter(p => !p.priceCents || p.priceCents === 0);

    console.log('✅ Bonos/Sesiones CON precio:', withPrice.length);
    console.log('❌ Bonos/Sesiones SIN precio (0€):', withoutPrice.length);
    console.log('');

    if (withoutPrice.length > 0) {
      console.log('❌ Bonos/Sesiones que necesitan corrección de precio:\n');
      withoutPrice.forEach((pack, index) => {
        console.log(`${index + 1}. ID: ${pack.id}`);
        console.log(`   Label: ${pack.label}`);
        console.log(`   Precio actual: ${pack.priceCents || 0}¢ (${((pack.priceCents || 0)/100).toFixed(2)}€)`);
        console.log(`   Unidades: ${pack.unitsTotal} × ${pack.unitMinutes}min`);
        console.log(`   Pagado: ${pack.paid ? 'Sí' : 'No'}`);
        console.log(`   Creado: ${pack.createdAt}`);
        console.log('');
      });

      console.log('💡 Precios sugeridos según el tipo:');
      console.log('');
      withoutPrice.forEach((pack, index) => {
        let suggestedPrice = 0;
        let explanation = '';

        // Detectar tipo de pack por el label
        if (pack.label.includes('Sesión') && pack.unitMinutes === 30) {
          suggestedPrice = 3000; // 30€
          explanation = 'Sesión individual de 30min';
        } else if (pack.label.includes('Sesión') && pack.unitMinutes === 60) {
          suggestedPrice = 5500; // 55€
          explanation = 'Sesión individual de 60min';
        } else if (pack.label.includes('Bono') && pack.unitMinutes === 30) {
          // Bono de 30min: calcular según número de sesiones
          const sessions = pack.unitsTotal;
          suggestedPrice = sessions * 2700; // 27€ por sesión de 30min
          explanation = `Bono de ${sessions} sesiones × 30min (27€ cada una)`;
        } else if (pack.label.includes('Bono') && pack.unitMinutes === 60) {
          // Bono de 60min: calcular según número de sesiones
          const sessions = pack.unitsTotal / 2; // 2 unidades = 1 sesión de 60min
          suggestedPrice = sessions * 4960; // 49.60€ por sesión de 60min
          explanation = `Bono de ${sessions} sesiones × 60min (49.60€ cada una)`;
        }

        console.log(`${index + 1}. ${pack.label} (ID: ${pack.id.substring(0, 8)}...)`);
        console.log(`   Precio sugerido: ${suggestedPrice}¢ (${(suggestedPrice/100).toFixed(2)}€)`);
        console.log(`   Explicación: ${explanation}`);
        console.log('');
      });

      console.log('⚠️  IMPORTANTE: Estos son precios sugeridos. Ajusta según tus tarifas reales.');
      console.log('');
    }

    if (withPrice.length > 0) {
      console.log('✅ Bonos/Sesiones con precio correcto:\n');
      withPrice.forEach((pack, index) => {
        console.log(`${index + 1}. ${pack.label}: ${pack.priceCents}¢ (${(pack.priceCents/100).toFixed(2)}€) - ${pack.unitsTotal} unidades × ${pack.unitMinutes}min`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllPacksPrices().catch(console.error);

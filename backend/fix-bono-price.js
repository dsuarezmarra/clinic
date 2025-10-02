// Script para actualizar el precio del bono a 248€ (24800 céntimos) usando Supabase directo
const SUPABASE_URL = 'https://skukyfkrwqsfnkbxedty.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ2MTE2OCwiZXhwIjoyMDcyMDM3MTY4fQ.Df8E2G--ulzTVUXeSBHgNRm9qQTeZDi_TYlG1UD02BQ';
const PACK_ID = '0f0ce2f6-3275-4c49-a33e-110307215f94'; // ID del nuevo bono del log
const NEW_PRICE_CENTS = 24800; // 248€

async function fixBonoPrice() {
  console.log('🔧 Actualizando precio del bono usando Supabase directo...\n');
  console.log('ID del bono:', PACK_ID);
  console.log('Nuevo precio:', NEW_PRICE_CENTS, 'céntimos (', (NEW_PRICE_CENTS/100).toFixed(2), '€)\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/credit_packs?id=eq.${PACK_ID}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        priceCents: NEW_PRICE_CENTS
      })
    });

    console.log('📊 Status:', response.status);
    console.log('');

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bono actualizado correctamente:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      console.log('💰 Precio actualizado a:', data.priceCents, 'céntimos (', (data.priceCents/100).toFixed(2), '€)');
      console.log('');
      console.log('✅ Ahora recarga la aplicación y crea una nueva cita.');
      console.log('   El precio debería calcularse correctamente:');
      console.log('   2 unidades × (24800¢ / 10 unidades) = 4960¢ = 49,60€');
    } else {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

fixBonoPrice().catch(console.error);

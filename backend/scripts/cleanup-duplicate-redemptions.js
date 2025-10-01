// Script para limpiar redemptions duplicados y corregir unitsRemaining
require('dotenv').config();

// ✨ BYPASS CORPORATIVO  
const { setupGlobalAgents, patchFetchForSupabase } = require('../src/corporate-bypass');

// Configurar bypass antes de cualquier operación de red
patchFetchForSupabase();
setupGlobalAgents();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function cleanupDuplicateRedemptions() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔍 Analyzing duplicate redemptions...');

  // Buscar redemptions duplicados por appointmentId
  const { data: redemptions, error } = await supabase
    .from('credit_redemptions')
    .select('*')
    .order('createdAt', { ascending: true });

  if (error) {
    throw error;
  }

  // Agrupar por appointmentId
  const byAppointment = {};
  for (const redemption of redemptions) {
    if (!byAppointment[redemption.appointmentId]) {
      byAppointment[redemption.appointmentId] = [];
    }
    byAppointment[redemption.appointmentId].push(redemption);
  }

  // Identificar duplicados
  const duplicates = Object.entries(byAppointment)
    .filter(([appointmentId, redemptionList]) => redemptionList.length > 1)
    .map(([appointmentId, redemptionList]) => ({
      appointmentId,
      redemptions: redemptionList,
      count: redemptionList.length,
      totalUnits: redemptionList.reduce((sum, r) => sum + r.unitsUsed, 0)
    }));

  console.log(`Found ${duplicates.length} appointments with duplicate redemptions:`);
  
  for (const dup of duplicates) {
    console.log(`  - Appointment ${dup.appointmentId}: ${dup.count} redemptions, ${dup.totalUnits} units total`);
    
    // Mantener solo el primer redemption (más antiguo)
    const toKeep = dup.redemptions[0];
    const toDelete = dup.redemptions.slice(1);
    
    console.log(`    Keep: ${toKeep.id} (${toKeep.unitsUsed} units, ${toKeep.createdAt})`);
    
    let totalToRestore = 0;
    for (const redemption of toDelete) {
      console.log(`    Delete: ${redemption.id} (${redemption.unitsUsed} units, ${redemption.createdAt})`);
      totalToRestore += redemption.unitsUsed;
      
      // Eliminar redemption duplicado
      const { error: deleteError } = await supabase
        .from('credit_redemptions')
        .delete()
        .eq('id', redemption.id);
        
      if (deleteError) {
        console.error(`❌ Error deleting redemption ${redemption.id}:`, deleteError);
      } else {
        console.log(`    ✅ Deleted redemption ${redemption.id}`);
      }
    }
    
    // Restaurar unidades en el pack
    if (totalToRestore > 0 && toKeep.creditPackId) {
      const { data: pack, error: packError } = await supabase
        .from('credit_packs')
        .select('unitsRemaining')
        .eq('id', toKeep.creditPackId)
        .single();
        
      if (packError) {
        console.error(`❌ Error fetching pack ${toKeep.creditPackId}:`, packError);
      } else {
        const newUnitsRemaining = pack.unitsRemaining + totalToRestore;
        
        const { error: updateError } = await supabase
          .from('credit_packs')
          .update({ unitsRemaining: newUnitsRemaining })
          .eq('id', toKeep.creditPackId);
          
        if (updateError) {
          console.error(`❌ Error updating pack ${toKeep.creditPackId}:`, updateError);
        } else {
          console.log(`    ✅ Restored ${totalToRestore} units to pack ${toKeep.creditPackId} (${pack.unitsRemaining} → ${newUnitsRemaining})`);
        }
      }
    }
    
    console.log('');
  }

  console.log('✅ Cleanup completed');
}

cleanupDuplicateRedemptions().catch(console.error);
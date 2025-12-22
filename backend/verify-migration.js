const { createClient } = require('@supabase/supabase-js');

const src = createClient(
  'https://skukyfkrwqsfnkbxedty.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ2MTE2OCwiZXhwIjoyMDcyMDM3MTY4fQ.Df8E2G--ulzTVUXeSBHgNRm9qQTeZDi_TYlG1UD02BQ'
);

const dst = createClient(
  'https://kctoxebchyrgkwofdkht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdG94ZWJjaHlyZ2t3b2Zka2h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxODE0NiwiZXhwIjoyMDgxOTk0MTQ2fQ.flxX_nhymMXBVMtkQe0MpcjM1fzZF6t_-_vgKkhx06c'
);

const tables = [
  'tenants',
  'patients_masajecorporaldeportivo',
  'patients_actifisio',
  'appointments_masajecorporaldeportivo',
  'appointments_actifisio',
  'credit_packs_masajecorporaldeportivo',
  'credit_packs_actifisio',
  'credit_redemptions_masajecorporaldeportivo',
  'credit_redemptions_actifisio',
  'invoices_masajecorporaldeportivo',
  'invoices_actifisio',
  'invoice_items_masajecorporaldeportivo',
  'invoice_items_actifisio',
  'configurations_masajecorporaldeportivo',
  'configurations_actifisio',
  'backups_masajecorporaldeportivo',
  'backups_actifisio',
  'patient_files_masajecorporaldeportivo',
  'patient_files_actifisio'
];

async function verify() {
  console.log('=== VERIFICACION DE MIGRACION ===');
  console.log('ORIGEN: skukyfkrwqsfnkbxedty (trabajo)');
  console.log('DESTINO: kctoxebchyrgkwofdkht (personal)');
  console.log('');
  console.log('TABLA'.padEnd(45) + 'ORIGEN'.padStart(8) + 'DESTINO'.padStart(10) + '  ESTADO');
  console.log('-'.repeat(75));
  
  let srcTotal = 0;
  let dstTotal = 0;
  let diffs = 0;
  
  for (const table of tables) {
    const { count: srcCount } = await src.from(table).select('*', { count: 'exact', head: true });
    const { count: dstCount } = await dst.from(table).select('*', { count: 'exact', head: true });
    
    srcTotal += srcCount || 0;
    dstTotal += dstCount || 0;
    
    const status = srcCount === dstCount ? '? OK' : '? DIFERENTE';
    if (srcCount !== dstCount) diffs++;
    
    console.log(
      table.padEnd(45) + 
      String(srcCount || 0).padStart(8) + 
      String(dstCount || 0).padStart(10) + 
      '  ' + status
    );
  }
  
  console.log('-'.repeat(75));
  console.log('TOTAL'.padEnd(45) + String(srcTotal).padStart(8) + String(dstTotal).padStart(10));
  console.log('');
  
  if (diffs === 0) {
    console.log('? RESULTADO: MIGRACION 100% IDENTICA - ' + srcTotal + ' registros');
  } else {
    console.log('? RESULTADO: ' + diffs + ' tabla(s) con diferencias');
  }
}

verify();

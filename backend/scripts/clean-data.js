/**
 * Script de Limpieza de Datos
 * ============================
 * Elimina todas las citas, créditos/bonos y archivos de pacientes,
 * manteniendo los pacientes y la configuración.
 * 
 * USO:
 *   node scripts/clean-data.js [tenant]
 * 
 * Ejemplos:
 *   node scripts/clean-data.js masajecorporaldeportivo
 *   node scripts/clean-data.js actifisio
 *   node scripts/clean-data.js all
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en el archivo .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const TENANTS = ['masajecorporaldeportivo', 'actifisio'];

async function cleanTenantData(tenantSlug) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧹 Limpiando datos del tenant: ${tenantSlug}`);
    console.log(`${'='.repeat(60)}`);

    const tables = {
        appointments: `appointments_${tenantSlug}`,
        creditPacks: `credit_packs_${tenantSlug}`,
        patientFiles: `patient_files_${tenantSlug}`,
        creditConsumptions: `credit_consumptions_${tenantSlug}`
    };

    try {
        // 1. Contar registros antes de eliminar
        console.log('\n📊 Contando registros actuales...');
        
        const { count: appointmentsCount } = await supabase
            .from(tables.appointments)
            .select('*', { count: 'exact', head: true });
        
        const { count: creditsCount } = await supabase
            .from(tables.creditPacks)
            .select('*', { count: 'exact', head: true });
        
        const { count: filesCount } = await supabase
            .from(tables.patientFiles)
            .select('*', { count: 'exact', head: true });

        let consumptionsCount = 0;
        try {
            const { count } = await supabase
                .from(tables.creditConsumptions)
                .select('*', { count: 'exact', head: true });
            consumptionsCount = count || 0;
        } catch (e) {
            // Tabla puede no existir
        }

        console.log(`   📅 Citas: ${appointmentsCount || 0}`);
        console.log(`   💳 Packs de créditos: ${creditsCount || 0}`);
        console.log(`   📁 Archivos: ${filesCount || 0}`);
        console.log(`   🔄 Consumos de créditos: ${consumptionsCount}`);

        // 2. Obtener rutas de archivos físicos para eliminarlos
        console.log('\n📁 Obteniendo rutas de archivos físicos...');
        const { data: files } = await supabase
            .from(tables.patientFiles)
            .select('storedPath');
        
        const filePaths = (files || []).map(f => f.storedPath).filter(Boolean);
        console.log(`   Archivos físicos a eliminar: ${filePaths.length}`);

        // 3. Eliminar consumos de créditos (si existe la tabla)
        console.log('\n🗑️  Eliminando consumos de créditos...');
        try {
            const { error: consumptionsError } = await supabase
                .from(tables.creditConsumptions)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Elimina todos
            
            if (consumptionsError && !consumptionsError.message.includes('does not exist')) {
                console.warn(`   ⚠️ Error eliminando consumos: ${consumptionsError.message}`);
            } else {
                console.log('   ✅ Consumos eliminados');
            }
        } catch (e) {
            console.log('   ℹ️ Tabla de consumos no existe o está vacía');
        }

        // 4. Eliminar packs de créditos
        console.log('\n🗑️  Eliminando packs de créditos (bonos y sesiones)...');
        const { error: creditsError } = await supabase
            .from(tables.creditPacks)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (creditsError) {
            console.error(`   ❌ Error: ${creditsError.message}`);
        } else {
            console.log(`   ✅ ${creditsCount || 0} packs eliminados`);
        }

        // 5. Eliminar archivos de pacientes (registros en BD)
        console.log('\n🗑️  Eliminando registros de archivos...');
        const { error: filesError } = await supabase
            .from(tables.patientFiles)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (filesError) {
            console.error(`   ❌ Error: ${filesError.message}`);
        } else {
            console.log(`   ✅ ${filesCount || 0} registros de archivos eliminados`);
        }

        // 6. Eliminar archivos físicos del servidor
        console.log('\n🗑️  Eliminando archivos físicos del servidor...');
        let deletedFiles = 0;
        let failedFiles = 0;
        
        for (const filePath of filePaths) {
            try {
                // Intentar con la ruta tal cual
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    deletedFiles++;
                } else {
                    // Intentar ruta relativa desde backend
                    const relativePath = path.join(__dirname, '..', filePath);
                    if (fs.existsSync(relativePath)) {
                        fs.unlinkSync(relativePath);
                        deletedFiles++;
                    } else {
                        failedFiles++;
                    }
                }
            } catch (e) {
                failedFiles++;
            }
        }
        console.log(`   ✅ Archivos eliminados: ${deletedFiles}`);
        if (failedFiles > 0) {
            console.log(`   ⚠️ Archivos no encontrados: ${failedFiles}`);
        }

        // 7. Eliminar citas
        console.log('\n🗑️  Eliminando citas...');
        const { error: appointmentsError } = await supabase
            .from(tables.appointments)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (appointmentsError) {
            console.error(`   ❌ Error: ${appointmentsError.message}`);
        } else {
            console.log(`   ✅ ${appointmentsCount || 0} citas eliminadas`);
        }

        // 8. Verificar que todo se eliminó
        console.log('\n✅ Verificando limpieza...');
        
        const { count: finalAppointments } = await supabase
            .from(tables.appointments)
            .select('*', { count: 'exact', head: true });
        
        const { count: finalCredits } = await supabase
            .from(tables.creditPacks)
            .select('*', { count: 'exact', head: true });
        
        const { count: finalFiles } = await supabase
            .from(tables.patientFiles)
            .select('*', { count: 'exact', head: true });

        console.log(`   📅 Citas restantes: ${finalAppointments || 0}`);
        console.log(`   💳 Packs restantes: ${finalCredits || 0}`);
        console.log(`   📁 Archivos restantes: ${finalFiles || 0}`);

        if ((finalAppointments || 0) === 0 && (finalCredits || 0) === 0 && (finalFiles || 0) === 0) {
            console.log('\n🎉 ¡Limpieza completada exitosamente!');
        } else {
            console.log('\n⚠️ Algunos registros no se pudieron eliminar');
        }

        return true;

    } catch (error) {
        console.error(`\n❌ Error durante la limpieza: ${error.message}`);
        return false;
    }
}

async function main() {
    const arg = process.argv[2];
    
    if (!arg) {
        console.log('');
        console.log('🧹 Script de Limpieza de Datos');
        console.log('==============================');
        console.log('');
        console.log('USO: node scripts/clean-data.js [tenant]');
        console.log('');
        console.log('Tenants disponibles:');
        TENANTS.forEach(t => console.log(`  - ${t}`));
        console.log('  - all (limpia todos los tenants)');
        console.log('');
        console.log('Este script eliminará:');
        console.log('  ❌ Todas las citas');
        console.log('  ❌ Todos los bonos y sesiones');
        console.log('  ❌ Todos los archivos de pacientes');
        console.log('');
        console.log('Se mantendrán:');
        console.log('  ✅ Configuración');
        console.log('  ✅ Pacientes (datos básicos)');
        console.log('');
        process.exit(0);
    }

    const tenantsToClean = arg === 'all' ? TENANTS : [arg];
    
    // Validar tenant
    for (const tenant of tenantsToClean) {
        if (!TENANTS.includes(tenant)) {
            console.error(`❌ Tenant no válido: ${tenant}`);
            console.log(`Tenants válidos: ${TENANTS.join(', ')}`);
            process.exit(1);
        }
    }

    console.log('');
    console.log('⚠️  ADVERTENCIA: Esta operación es IRREVERSIBLE');
    console.log('   Se eliminarán todos los datos de citas, créditos y archivos.');
    console.log('');
    console.log('   Tenants a limpiar:', tenantsToClean.join(', '));
    console.log('');
    console.log('   Presiona Ctrl+C en los próximos 5 segundos para cancelar...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🚀 Iniciando limpieza...');

    for (const tenant of tenantsToClean) {
        await cleanTenantData(tenant);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Proceso de limpieza finalizado');
    console.log('='.repeat(60));
}

main().catch(console.error);

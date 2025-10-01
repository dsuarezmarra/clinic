const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ✨ BYPASS CORPORATIVO
const { setupGlobalAgents, patchFetchForSupabase } = require('./src/corporate-bypass');

async function verifySupabaseSetup() {
    console.log('🔍 Verificando configuración de Supabase...');
    
    // Configurar bypass ANTES de crear cliente
    patchFetchForSupabase();
    setupGlobalAgents();
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Service Key configurado:', !!serviceKey);
    
    try {
        const supabase = createClient(supabaseUrl, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        console.log('✅ Cliente Supabase creado');
        
        // 1. Verificar acceso a tablas
        console.log('\n📋 1. Verificando tablas existentes...');
        const tables = ['Patient', 'Appointment', 'CreditPack', 'CreditRedemption'];
        
        for (const table of tables) {
            try {
                const { data, error, count } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    console.log(`❌ ${table}:`, error.message);
                } else {
                    console.log(`✅ ${table}: acceso exitoso (${count} registros)`);
                }
            } catch (err) {
                console.log(`❌ ${table}:`, err.message);
            }
        }
        
        // 2. Probar inserción de datos de prueba
        console.log('\n👤 2. Probando inserción de paciente de prueba...');
        const { data: newPatient, error: insertError } = await supabase
            .from('Patient')
            .insert({
                firstName: 'Test',
                lastName: 'Patient',
                phone: '123456789',
                email: 'test@example.com'
            })
            .select();
            
        if (insertError) {
            console.log('❌ Error insertando paciente:', insertError.message);
        } else {
            console.log('✅ Paciente creado:', newPatient[0]);
            
            // Limpiar después de la prueba
            const { error: deleteError } = await supabase
                .from('Patient')
                .delete()
                .eq('id', newPatient[0].id);
                
            if (!deleteError) {
                console.log('✅ Paciente de prueba eliminado');
            }
        }
        
        // 3. Verificar políticas RLS
        console.log('\n🔒 3. Verificando políticas RLS...');
        const { data: policies, error: policiesError } = await supabase
            .rpc('get_policies_info');
            
        if (policiesError) {
            console.log('⚠️ No se pudieron verificar políticas:', policiesError.message);
        } else {
            console.log('✅ Políticas verificadas:', policies?.length || 'N/A');
        }
        
        console.log('\n🎉 Verificación completa!');
        
    } catch (error) {
        console.log('💥 Error general:', error.message);
    }
}

verifySupabaseSetup();
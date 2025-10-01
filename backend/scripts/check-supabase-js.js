#!/usr/bin/env node
// check-supabase-js.js
// Comprueba conteos y muestras de tablas usando @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Define SUPABASE_URL y SUPABASE_SERVICE_KEY en variables de entorno o backend/.env');
    process.exit(2);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const tables = ['patients', 'patient_files', 'credit_packs', 'appointments', 'credit_redemptions', 'configurations'];

async function run() {
    try {
        console.log('Comprobando', SUPABASE_URL);
        for (const t of tables) {
            const { count, error: cErr } = await sb.from(t).select('*', { count: 'exact', head: true });
            if (cErr) {
                console.error(t, 'error al contar:', cErr.message || cErr);
            } else {
                console.log(`${t}: ${count ?? 0} filas`);
            }
            const { data, error } = await sb.from(t).select('*').limit(5);
            if (error) console.error(t, 'error muestra:', error.message || error);
            else console.table(data || []);
        }
        process.exit(0);
    } catch (e) {
        console.error('Error en comprobación:', e && e.message ? e.message : e);
        process.exit(10);
    }
}

run();

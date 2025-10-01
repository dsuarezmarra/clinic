#!/usr/bin/env node
// force-wipe-supabase.js
// Intenta eliminar todas las filas de las tablas listadas de forma robusta.

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Define SUPABASE_URL y SUPABASE_SERVICE_KEY en backend/.env o variables de entorno');
    process.exit(2);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const tables = ['credit_redemptions', 'appointments', 'credit_packs', 'patient_files', 'patients', 'configurations'];

async function wipeTable(t) {
    console.log('\n-- Wiping table', t);
    try {
        const { data, error: selErr } = await sb.from(t).select('*').limit(10000);
        if (selErr) {
            console.warn('Select error for', t, selErr.message || selErr);
            return;
        }
        if (!data || data.length === 0) { console.log('No rows in', t); return; }
        // prefer id
        const keys = Object.keys(data[0]);
        const pk = keys.includes('id') ? 'id' : (keys.includes('key') ? 'key' : keys[0]);
        const hasAllPk = data.every(r => r[pk] !== undefined && r[pk] !== null);
        if (hasAllPk) {
            const ids = data.map(r => r[pk]);
            for (let i = 0; i < ids.length; i += 200) {
                const chunk = ids.slice(i, i + 200);
                const { error } = await sb.from(t).delete().in(pk, chunk);
                if (error) console.error('Error deleting chunk from', t, error.message || error);
                else console.log('Deleted chunk', i, '->', Math.min(i + 200, ids.length));
            }
            return;
        }
        // fallback: delete rows one-by-one using match
        console.log('Deleting', data.length, 'rows one-by-one from', t);
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                const { error } = await sb.from(t).delete().match(row);
                if (error) console.error('Row delete error', i, t, error.message || error);
                else if (i % 50 === 0) console.log('Deleted', i + 1, 'of', data.length);
            } catch (e) { console.error('Exception deleting row', i, e && e.message ? e.message : e); }
        }
    } catch (e) { console.error('Fatal error wiping', t, e && e.message ? e.message : e); }
}

(async () => {
    for (const t of tables) await wipeTable(t);
    console.log('\nForce wipe finished.');
    process.exit(0);
})();

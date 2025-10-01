#!/usr/bin/env node
// wipe-and-seed-supabase.js
// Borra datos de las tablas principales en Supabase y genera 50 pacientes de prueba
// USO (ejemplo):
// CONFIRM_WIPE=true NODE_TLS_REJECT_UNAUTHORIZED=0 SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_KEY=xxx node scripts/wipe-and-seed-supabase.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY;
const CONFIRM_WIPE = process.env.CONFIRM_WIPE === 'true';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Define SUPABASE_URL y SUPABASE_SERVICE_KEY en variables de entorno o backend/.env');
    process.exit(2);
}
if (!CONFIRM_WIPE) {
    console.error('This is a destructive operation. Set CONFIRM_WIPE=true to proceed.');
    process.exit(3);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

function uid() { return require('crypto').randomUUID(); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sample(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const firstNames = ['Pedro', 'Silvia', 'Miguel', 'Juan', 'Nuria', 'Javier', 'María', 'Isabel', 'Ana', 'Elena', 'Raúl', 'Fernando', 'Carmen', 'Laura', 'Andrés', 'Diego', 'Pablo', 'Lucía', 'Marta', 'Sofía'];
const lastNames = ['Navarro', 'Torres', 'López', 'Iglesias', 'Martínez', 'Castillo', 'Pérez', 'Ortega', 'Suárez', 'Gómez', 'Sánchez', 'Vega', 'Ruiz', 'Fernández'];

function makePatient(i) {
    const id = uid();
    const firstName = sample(firstNames);
    const lastName = sample(lastNames);
    const dni = String(30000000 + i);
    const phone = '+34 ' + (600000000 + i).toString().slice(-9);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const ts = Date.now();
    return { id, dni, firstName, lastName, phone, email, address: `${i} Calle Falsa`, cp: '00000', city: 'Ciudad', province: 'Provincia', birthDate: null, notes: null, createdAt: new Date(ts).toISOString(), updatedAt: new Date(ts).toISOString() };
}

async function wipeTables() {
    console.log('Deleting data from tables (credit_redemptions, appointments, credit_packs, patient_files, patients, configurations)');
    const tables = ['credit_redemptions', 'appointments', 'credit_packs', 'patient_files', 'patients', 'configurations'];
    for (const t of tables) {
        console.log('Deleting', t);
        try {
            const { error } = await supabase.from(t).delete().neq('id', '');
            if (error) throw error;
        } catch (e) {
            console.warn('Primary delete failed for', t, '- attempting fallback delete by ids:', e && e.message ? e.message : e);
            try {
                // try to fetch ids and delete by chunk
                const { data: rows, error: selectErr } = await supabase.from(t).select('id').limit(1000);
                if (selectErr) {
                    console.warn('Could not select id from', t, '-', selectErr.message || selectErr);
                    continue;
                }
                const ids = (rows || []).map(r => r.id).filter(Boolean);
                if (!ids.length) { console.log('No ids found to delete for', t); continue; }
                for (let i = 0; i < ids.length; i += 200) {
                    const chunk = ids.slice(i, i + 200);
                    const { error: delErr } = await supabase.from(t).delete().in('id', chunk);
                    if (delErr) console.error('Chunk delete error for', t, delErr.message || delErr);
                }
            } catch (e3) {
                console.error('Fallback delete exception for', t, e3 && e3.message ? e3.message : e3);
            }
        }
    }
}

async function seed() {
    console.log('Seeding test data: 50 patients, packs, appointments, redemptions');
    const patients = [];
    for (let i = 1; i <= 50; i++) patients.push(makePatient(i));
    // insert patients in batches (minimal fields)
    for (let i = 0; i < patients.length; i += 25) {
        const chunk = patients.slice(i, i + 25).map(p => ({ id: p.id, dni: p.dni, firstName: p.firstName, lastName: p.lastName, phone: p.phone, email: p.email, address: p.address }));
        const { error } = await supabase.from('patients').insert(chunk, { returning: 'minimal' });
        if (error) { console.error('Error inserting patients chunk', error); throw error; }
    }

    // credit_packs: each patient 1-3 packs
    const packs = [];
    for (const p of patients) {
        const n = randInt(1, 3);
        for (let j = 0; j < n; j++) {
            const units = sample([5, 6, 10]);
            packs.push({ id: uid(), patientId: p.id, label: `Bono ${units}x60m`, unitsTotal: units, unitsRemaining: units });
        }
    }
    for (let i = 0; i < packs.length; i += 100) { const chunk = packs.slice(i, i + 100); const { error } = await supabase.from('credit_packs').insert(chunk, { returning: 'minimal' }); if (error) { console.error('Error inserting packs', error); throw error; } }

    // appointments: create 0-5 per patient, link to a pack randomly when available
    const appointments = [];
    const redemptions = [];
    for (const p of patients) {
        const apn = randInt(0, 5);
        const patientPacks = packs.filter(x => x.patientId === p.id);
        for (let k = 0; k < apn; k++) {
            const id = uid();
            const start = Date.now() + randInt(-1000000000, 1000000000);
            const duration = sample([30, 60]);
            const end = start + duration * 60000;
            const priceCents = duration === 60 ? 5000 : 2500;
            const consumesCredit = patientPacks.length > 0 ? 1 : 0;
            appointments.push({ id, patientId: p.id, start: new Date(start).toISOString(), end: new Date(end).toISOString(), durationMinutes: duration, priceCents, status: 'BOOKED', notes: '', consumesCredit });
            if (consumesCredit) {
                // pick a pack and reduce unitsRemaining
                const pack = sample(patientPacks);
                redemptions.push({ id: uid(), creditPackId: pack.id, appointmentId: id, unitsUsed: 1 });
                pack.unitsRemaining = Math.max(0, pack.unitsRemaining - 1);
            }
        }
    }
    for (let i = 0; i < appointments.length; i += 200) { const chunk = appointments.slice(i, i + 200); const { error } = await supabase.from('appointments').insert(chunk, { returning: 'minimal' }); if (error) { console.error('Error inserting appointments', error); throw error; } }
    for (let i = 0; i < redemptions.length; i += 200) { const chunk = redemptions.slice(i, i + 200); const { error } = await supabase.from('credit_redemptions').insert(chunk, { returning: 'minimal' }); if (error) { console.error('Error inserting redemptions', error); throw error; } }

    // update packs unitsRemaining
    // update packs unitsRemaining (safer per-pack updates)
    for (const pack of packs) {
        try {
            const { error } = await supabase.from('credit_packs').update({ unitsRemaining: pack.unitsRemaining }).eq('id', pack.id);
            if (error) console.error('Error updating pack unitsRemaining', pack.id, error.message || error);
        } catch (e) {
            console.error('Exception updating pack', pack.id, e && e.message ? e.message : e);
        }
    }

    console.log('Seeding completed: patients', patients.length, 'packs', packs.length, 'appointments', appointments.length, 'redemptions', redemptions.length);
}

(async () => {
    try {
        await wipeTables();
        await seed();
        console.log('Wipe and seed finished successfully.');
        process.exit(0);
    } catch (e) { console.error('Wipe and seed failed', e && e.message ? e.message : e); process.exit(10); }
})();

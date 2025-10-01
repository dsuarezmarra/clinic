#!/usr/bin/env node
// retry-import-errors.js
// Lee backend/exports/import_errors_*.json, aplica correcciones seguras y reintenta las inserciones.

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Define SUPABASE_URL y SUPABASE_SERVICE_KEY en backend/.env o variables de entorno antes de ejecutar este script');
    process.exit(2);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const exportDir = path.join(__dirname, '..', 'exports');

function isNumericString(s) { return typeof s === 'string' && /^-?\d+$/.test(s); }

function normalizeDateValue(key, val) {
    if (val === null || val === undefined || val === '') return null;
    if (isNumericString(val)) {
        const n = Number(val);
        // ms-ish
        if (Math.abs(n) > 1e11) {
            const d = new Date(n);
            const y = d.getUTCFullYear();
            if (y < 1900 || y > 2100) return null;
            return d.toISOString();
        }
        if (Math.abs(n) > 1e9) {
            const d = new Date(n * 1000);
            const y = d.getUTCFullYear();
            if (y < 1900 || y > 2100) return null;
            return d.toISOString();
        }
        return n;
    }
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) {
        const d = new Date(parsed);
        const y = d.getUTCFullYear();
        if (y < 1900 || y > 2100) return null;
        return d.toISOString();
    }
    return null;
}

async function ensurePatientExists(patientId, rowData) {
    if (!patientId) return null;
    const { data: exists } = await sb.from('patients').select('id').eq('id', patientId).limit(1).maybeSingle();
    if (exists && exists.id) return exists.id;
    // create minimal patient using available fields from rowData
    const minimal = { id: patientId };
    ['firstName', 'lastName', 'phone', 'email', 'dni', 'address'].forEach(k => {
        if (rowData[k]) minimal[k] = rowData[k];
    });
    // set createdAt if absent
    minimal.createdAt = new Date().toISOString();
    try {
        const { error } = await sb.from('patients').insert([minimal], { returning: 'minimal' });
        if (error) {
            console.error('Failed to create minimal patient', patientId, error.message || error);
            return null;
        }
        console.log('Created minimal patient', patientId);
        return patientId;
    } catch (e) {
        console.error('Exception creating patient', e && e.message ? e.message : e);
        return null;
    }
}

async function processErrorFile(filePath) {
    const base = path.basename(filePath).replace('import_errors_', '').replace('.json', '');
    let rows;
    try {
        rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.error('Failed to read', filePath, e.message || e);
        return;
    }
    if (!Array.isArray(rows) || rows.length === 0) return;

    const retryFailures = [];
    for (const entry of rows) {
        const row = entry.row || entry;
        // apply fixes
        const fixed = { ...row };
        // normalize date-like fields
        Object.keys(fixed).forEach(k => {
            if (/start|end|createdAt|updatedAt|birth/i.test(k)) {
                const norm = normalizeDateValue(k, fixed[k]);
                if (norm === null) delete fixed[k]; else fixed[k] = norm;
            }
            // empty strings -> null
            if (fixed[k] === '') fixed[k] = null;
            if (fixed[k] === 'true') fixed[k] = true;
            if (fixed[k] === 'false') fixed[k] = false;
        });

        try {
            // resolve FKs if needed
            if (base === 'credit_packs') {
                // ensure patient exists
                if (fixed.patientId) {
                    const pid = await ensurePatientExists(fixed.patientId, fixed);
                    if (!pid) {
                        retryFailures.push({ row: fixed, reason: 'missing patient' });
                        continue;
                    }
                }
            }
            if (base === 'appointments') {
                if (fixed.patientId) {
                    const pid = await ensurePatientExists(fixed.patientId, fixed);
                    if (!pid) { retryFailures.push({ row: fixed, reason: 'missing patient' }); continue; }
                }
            }
            if (base === 'credit_redemptions') {
                // ensure creditPack exists
                if (fixed.creditPackId) {
                    const { data: cp } = await sb.from('credit_packs').select('id').eq('id', fixed.creditPackId).limit(1).maybeSingle();
                    if (!cp || !cp.id) {
                        // try to ensure patient then skip or fail
                        retryFailures.push({ row: fixed, reason: 'missing credit_pack' });
                        continue;
                    }
                }
            }

            const { error } = await sb.from(base).insert([fixed], { returning: 'minimal' });
            if (error) {
                console.error('Retry insert error for', base, error.message || error);
                retryFailures.push({ row: fixed, error: error.message || error });
            } else {
                console.log('Reinserted row into', base);
            }
        } catch (e) {
            console.error('Exception while retrying', e && e.message ? e.message : e);
            retryFailures.push({ row: fixed, error: e && e.message ? e.message : e });
        }
    }

    if (retryFailures.length) {
        const out = path.join(exportDir, `retry_failed_${base}.json`);
        fs.writeFileSync(out, JSON.stringify(retryFailures, null, 2), 'utf8');
        console.log(`Wrote ${retryFailures.length} retry failures to ${out}`);
    } else {
        console.log(`All rows from ${filePath} reinserted successfully (or handled).`);
    }
}

async function main() {
    const files = fs.readdirSync(exportDir).filter(f => f.startsWith('import_errors_') && f.endsWith('.json'));
    if (!files.length) { console.log('No import_errors_*.json files found in exports'); return; }
    for (const f of files) {
        await processErrorFile(path.join(exportDir, f));
    }
    console.log('Retry process finished.');
    process.exit(0);
}

main().catch(e => { console.error('Fatal error', e && e.message ? e.message : e); process.exit(10); });

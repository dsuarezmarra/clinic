#!/usr/bin/env node
// import-csv-to-supabase.js
// Importa los CSV desde backend/exports/ a Supabase usando una Service Role key.
// Uso:
//   - añade SUPABASE_URL y SUPABASE_SERVICE_KEY en backend/.env o exporta como variables de entorno
//   - cd backend
//   - npm install @supabase/supabase-js csv-parse dotenv
//   - node scripts/import-csv-to-supabase.js [--dry-run]

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en backend/.env o en variables de entorno');
    process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

const exportDir = path.join(__dirname, '..', 'exports');
const order = [
    'patients',
    'credit_packs',
    'patient_files',
    'appointments',
    'credit_redemptions',
    'configurations'
];

function readCsv(table) {
    const p = path.join(exportDir, `${table}.csv`);
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf8');
    const records = parse(raw, { columns: true, skip_empty_lines: true });
    return records;
}

function isNumericString(s) {
    return typeof s === 'string' && /^-?\d+$/.test(s);
}

function normalizeValue(key, val) {
    if (val === null || val === undefined) return null;
    // empty string -> null
    if (val === '') return null;
    // booleans
    if (val === 'true') return true;
    if (val === 'false') return false;

    // numeric timestamps in ms (large integers) -> ISO date
    if (isNumericString(val)) {
        try {
            const n = Number(val);
            // If value looks like milliseconds epoch (>= 1e12) or plausibly negative ms
            if (Math.abs(n) > 1e11) {
                const d = new Date(n);
                if (!isNaN(d.getTime())) {
                    const year = d.getUTCFullYear();
                    // reject clearly out-of-range years
                    if (year < 1900 || year > 2100) {
                        // return null to avoid DB errors
                        return null;
                    }
                    // If key looks like a birth date, return date-only
                    if (/birth/i.test(key)) return d.toISOString().slice(0, 10);
                    return d.toISOString();
                }
            }
            // If looks like seconds epoch (10 digits), convert to ISO too
            if (Math.abs(n) > 1e9 && Math.abs(n) <= 1e11) {
                const d = new Date(n * 1000);
                if (!isNaN(d.getTime())) return d.toISOString();
            }
            // otherwise leave numeric as number
            return n;
        } catch (e) {
            return val;
        }
    }

    // For known date-like keys that may be non-numeric, try parse
    if (typeof val === 'string') {
        if (/start|end|createdAt|updatedAt/i.test(key)) {
            const parsed = Date.parse(val);
            if (!isNaN(parsed)) {
                const d = new Date(parsed);
                const year = d.getUTCFullYear();
                if (year < 1900 || year > 2100) return null;
                return d.toISOString();
            }
        }

        // handle birthDate strings separately (date-only)
        if (/birth/i.test(key)) {
            const parsed = Date.parse(val);
            if (!isNaN(parsed)) {
                const d = new Date(parsed);
                const year = d.getUTCFullYear();
                if (year < 1900 || year > 2100) return null;
                return d.toISOString().slice(0, 10);
            }
        }
    }

    return val;
}

async function insertBatch(table, rows) {
    if (rows.length === 0) return { count: 0 };
    const batchSize = 200;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize).map(r => {
            // normalize values: empty -> null, booleans, and timestamps -> ISO
            const out = {};
            Object.keys(r).forEach(k => {
                out[k] = normalizeValue(k, r[k]);
            });
            return out;
        });
        if (DRY) {
            console.log(`[dry] would insert ${chunk.length} rows into ${table}`);
            inserted += chunk.length;
            continue;
        }
        // try batch insert first
        const { error } = await supabase.from(table).insert(chunk, { returning: 'minimal' });
        if (error) {
            console.error(`Batch insert error into ${table}:`, error.message || error);
            // fallback: try inserting rows one-by-one to find/skip bad rows
            const errorRows = [];
            for (let j = 0; j < chunk.length; j++) {
                const row = chunk[j];
                try {
                    const { error: singleErr } = await supabase.from(table).insert([row], { returning: 'minimal' });
                    if (singleErr) {
                        console.error(`Row insert failed (index ${i + j}) into ${table}:`, singleErr.message || singleErr);
                        errorRows.push({ index: i + j, row, error: singleErr });
                    } else {
                        inserted += 1;
                    }
                } catch (e) {
                    console.error(`Exception inserting row (index ${i + j}) into ${table}:`, e && e.message ? e.message : e);
                    errorRows.push({ index: i + j, row, error: e && e.message ? e.message : e });
                }
            }
            if (errorRows.length) {
                const errPath = path.join(exportDir, `import_errors_${table}.json`);
                try { fs.writeFileSync(errPath, JSON.stringify(errorRows, null, 2), 'utf8'); console.log(`Wrote ${errorRows.length} error rows to ${errPath}`); } catch (e) { console.error('Failed to write error rows file', e); }
            }
            console.log(`Inserted ${inserted}/${rows.length} into ${table} (with ${errorRows.length} skipped)`);
            continue;
        }
        inserted += chunk.length;
        console.log(`Inserted ${inserted}/${rows.length} into ${table}`);
    }
    return { count: inserted };
}

(async () => {
    console.log('Import CSV to Supabase - order:', order.join(', '));
    for (const table of order) {
        const rows = readCsv(table);
        if (rows === null) {
            console.log(`No CSV found for ${table}, skipping`);
            continue;
        }
        console.log(`Table ${table}: ${rows.length} rows found in CSV`);
        const res = await insertBatch(table, rows);
        if (res && res.error) {
            console.error('Aborting due to error.');
            process.exit(5);
        }
    }
    console.log('Import finished. Run validation queries in Supabase SQL editor to confirm.');
    process.exit(0);
})();

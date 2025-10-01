const express = require('express');
const router = express.Router();
const supabaseAdapter = require('../services/supabase');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const util = require('util');

// GET /api/_debug/supabase-count
router.get('/supabase-count', async (req, res, next) => {
    try {
        // intentar con el adapter (normalmente usa la clave de .env usada por la app)
        let countResult = { count: null };
        try {
            const c = await supabaseAdapter.patient.count();
            countResult.count = c;
        } catch (err) {
            // serializar error del adapter sin perder información
            if (err && typeof err === 'object') {
                let asJson = null;
                try { asJson = JSON.parse(JSON.stringify(err)); } catch (e) { /* ignore */ }
                countResult.error = {
                    message: err.message || String(err),
                    keys: Object.keys(err),
                    asJson,
                    inspected: util.inspect(err, { depth: 4, showHidden: true })
                };
            } else {
                countResult.error = { message: String(err) };
            }
        }

        // ejecutar probe REST proporcionado por el adaptador (si existe)
        const probe = await (supabaseAdapter._checkRest ? supabaseAdapter._checkRest() : Promise.resolve({ error: 'no_probe' }));

        // Si hay una clave de servicio en el entorno, reintentar el conteo con un cliente temporal
        const serviceKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE;
        let serviceRoleAttempt = null;
        if (serviceKey && process.env.SUPABASE_URL) {
            try {
                const tmp = createClient(process.env.SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
                // usar head select para obtener el count exacto
                const resp = await tmp.from('patients').select('id', { count: 'exact', head: true });
                // resp puede contener { data, error, count, status }
                if (resp && resp.error) {
                    serviceRoleAttempt = {
                        error: {
                            message: resp.error.message || String(resp.error),
                            details: resp.error.details || null,
                            hint: resp.error.hint || null,
                            code: resp.error.code || null,
                            status: resp.status || null,
                            raw: (() => { try { return JSON.parse(JSON.stringify(resp)); } catch (e) { return resp; } })()
                        }
                    };
                } else if (typeof resp.count !== 'undefined') {
                    serviceRoleAttempt = { count: resp.count };
                } else {
                    // forma inesperada, adjuntar raw
                    serviceRoleAttempt = { raw: (() => { try { return JSON.parse(JSON.stringify(resp)); } catch (e) { return resp; } })() };
                }
            } catch (err) {
                let asJson = null;
                try { asJson = JSON.parse(JSON.stringify(err)); } catch (e) { /* ignore */ }
                serviceRoleAttempt = { error: { message: err && err.message ? err.message : String(err), asJson, inspected: util.inspect(err, { depth: 4, showHidden: true }) } };
            }
        }

        // Además, ejecutar una comprobación REST directa usando la service key (muestra status/body)
        let serviceRoleRest = null;
        if (serviceKey && process.env.SUPABASE_URL) {
            serviceRoleRest = await new Promise((resolve) => {
                try {
                    const url = new URL('/rest/v1/patients?select=id&limit=1', process.env.SUPABASE_URL).toString();
                    const opts = new URL(url);
                    const headers = {
                        'apikey': serviceKey,
                        'Authorization': `Bearer ${serviceKey}`,
                        'Accept': 'application/json'
                    };
                    const reqOpts = {
                        hostname: opts.hostname,
                        port: opts.port || 443,
                        path: opts.pathname + (opts.search || ''),
                        method: 'GET',
                        headers,
                        timeout: 10000
                    };
                    if ((process.env.SUPABASE_IGNORE_TLS || '').toLowerCase() === 'true' && process.env.NODE_ENV !== 'production') {
                        reqOpts.agent = new https.Agent({ rejectUnauthorized: false });
                    }

                    const req = https.request(reqOpts, (r) => {
                        const chunks = [];
                        r.on('data', c => chunks.push(c));
                        r.on('end', () => {
                            const body = Buffer.concat(chunks).toString('utf8');
                            resolve({ ok: true, statusCode: r.statusCode, statusMessage: r.statusMessage, bodyPreview: body && body.slice(0, 500), headers: { 'content-type': r.headers['content-type'] } });
                        });
                    });
                    req.on('timeout', () => { req.destroy(new Error('timeout')); resolve({ error: 'timeout' }); });
                    req.on('error', (err) => { resolve({ error: 'request_error', message: err && err.message ? err.message : String(err), inspected: util.inspect(err, { depth: 2 }) }); });
                    req.end();
                } catch (err) {
                    resolve({ error: 'threw', message: err && err.message ? err.message : String(err) });
                }
            });
        }

        res.json({ ok: true, countResult, probe, serviceRoleAttempt, serviceRoleRest });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

const http = require('http');
const https = require('https');
const fs = require('fs');

function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const u = new URL(url);
        const opts = {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = lib.request(opts, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data || '{}');
                    resolve({ status: res.statusCode, body: parsed });
                } catch (err) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }

        req.end();
    });
}

(async () => {
    try {
        const headers = { 'Content-Type': 'application/json' };
        // 1) Crear paciente
    // Use a unique DNI to avoid unique constraint collisions during repeated tests
    const uniqueDni = 'F' + Date.now().toString().slice(-8);
    const patientPayload = { firstName: 'Fallback', lastName: 'Tester', phone: '600000003', dni: uniqueDni, cp: '28001' };
    const pRes = await request('http://localhost:3000/api/patients', { method: 'POST', headers, body: JSON.stringify(patientPayload) });
    console.log('POST /api/patients status', pRes.status);
    console.log('POST /api/patients body', JSON.stringify(pRes.body));
    const patient = pRes.body;
    fs.writeFileSync('patient_fallback.json', JSON.stringify(patient, null, 2));
    console.log('Patient created', patient && patient.id);

        // 2) Crear bono 30min (cantidad 1 -> 5 sesiones de 30min)
        const packPayload = { patientId: patient.id, type: 'bono', minutes: 30, quantity: 1, paid: true };
    const packRes = await request('http://localhost:3000/api/credits/packs', { method: 'POST', headers, body: JSON.stringify(packPayload) });
    console.log('POST /api/credits/packs status', packRes.status);
    // Mostrar pack normalizado en logs
    try {
        const rawPack = packRes.body || {};
        const normPack = {
            ...rawPack,
            unitsRemaining: Number(rawPack.unitsRemaining) || 0,
            unitsTotal: Number(rawPack.unitsTotal) || 0,
            unitMinutes: Number(rawPack.unitMinutes) || 30,
            paid: !!rawPack.paid
        };
        console.log('POST /api/credits/packs body (normalized)', JSON.stringify(normPack));
    } catch (e) {
        console.log('POST /api/credits/packs body', JSON.stringify(packRes.body));
    }
    const pack = packRes.body;
    fs.writeFileSync('pack_fallback.json', JSON.stringify(pack, null, 2));
    console.log('Pack created', pack && pack.id, 'unitsTotal', pack && pack.unitsTotal, 'unitMinutes', pack && pack.unitMinutes);

        // 3) Crear cita 60min (usar franja libre: +24h)
        const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const end = new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString();
        const aptPayload = { start, end, patientId: patient.id, durationMinutes: 60, consumesCredit: true };
        const aptRes = await request('http://localhost:3000/api/appointments', { method: 'POST', headers, body: JSON.stringify(aptPayload) });
        const apt = aptRes.body;
        fs.writeFileSync('apt_fallback.json', JSON.stringify(apt, null, 2));
        console.log('Appointment created', apt.id);

        // 4) Consultar créditos
        const creditsRes = await request(`http://localhost:3000/api/credits?patientId=${patient.id}`);
    const credits = creditsRes.body;
    fs.writeFileSync('credits_fallback.json', JSON.stringify(credits, null, 2));
    // Normalize credit packs list for debug
    try {
        if (credits && credits.creditPacks && Array.isArray(credits.creditPacks)) {
            credits.creditPacks = credits.creditPacks.map(p => ({
                ...p,
                unitsRemaining: Number(p.unitsRemaining) || 0,
                unitsTotal: Number(p.unitsTotal) || 0,
                unitMinutes: Number(p.unitMinutes) || 30,
                paid: !!p.paid
            }));
        }
    } catch (e) {
        // ignore
    }
    console.log('Credits fetched:', JSON.stringify(credits, null, 2));

    } catch (err) {
        console.error('Error in fallback smoke test', err);
        fs.writeFileSync('smoke_fallback_error.txt', String(err));
    }
})();

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
        const unique = Date.now().toString().slice(-6);
        const patientPayload = { firstName: 'BonoTest', lastName: 'User', phone: '6000000' + (Math.floor(Math.random() * 900) + 100), dni: `BT${unique}`, cp: '28001' };
        const pRes = await request('http://localhost:3000/api/patients', { method: 'POST', headers, body: JSON.stringify(patientPayload) });
        const patient = pRes.body;
        fs.writeFileSync('patient_bono.json', JSON.stringify(patient, null, 2));
        console.log('Patient created', patient.id);

        // Crear bono 10x30m -> quantity=2, minutes=30 -> totalSessions=10 -> should label as Bono 5×60m
        const packPayload = { patientId: patient.id, type: 'bono', minutes: 30, quantity: 2, paid: true };
        const packRes = await request('http://localhost:3000/api/credits/packs', { method: 'POST', headers, body: JSON.stringify(packPayload) });
        const pack = packRes.body;
        fs.writeFileSync('pack_bono.json', JSON.stringify(pack, null, 2));
        console.log('Pack created', pack.id || JSON.stringify(pack));

    } catch (err) {
        console.error('Error creating bono pack', err);
        fs.writeFileSync('create_bono_error.txt', String(err));
    }
})();

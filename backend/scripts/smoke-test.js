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
        const unique = Date.now().toString().slice(-6);
        const patientPayload = { firstName: 'Smoke', lastName: 'Tester', phone: '60000000' + (Math.floor(Math.random() * 90) + 10), dni: `SMK${unique}`, cp: '28001' };
        const pRes = await request('http://localhost:3000/api/patients', { method: 'POST', headers, body: JSON.stringify(patientPayload) });
        const patient = pRes.body;
        fs.writeFileSync('patient.json', JSON.stringify(patient, null, 2));
        console.log('Patient created', patient.id);

        // 2) Crear pack 60min (sesion)
        const packPayload = { patientId: patient.id, type: 'sesion', minutes: 60, quantity: 1, paid: true };
        const packRes = await request('http://localhost:3000/api/credits/packs', { method: 'POST', headers, body: JSON.stringify(packPayload) });
        const pack = packRes.body;
        fs.writeFileSync('pack.json', JSON.stringify(pack, null, 2));
        console.log('Pack created', pack.id);

        // 3) Crear cita 60min
        // Programar la cita 24 horas en el futuro para evitar solapamientos con datos de prueba previos
        const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const end = new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString();
        const aptPayload = { start, end, patientId: patient.id, durationMinutes: 60, consumesCredit: true };
        const aptRes = await request('http://localhost:3000/api/appointments', { method: 'POST', headers, body: JSON.stringify(aptPayload) });
        const apt = aptRes.body;
        fs.writeFileSync('apt.json', JSON.stringify(apt, null, 2));
        console.log('Appointment created', apt.id || apt.id);

        // 4) Consultar créditos
        const creditsRes = await request(`http://localhost:3000/api/credits?patientId=${patient.id}`);
        const credits = creditsRes.body;
        fs.writeFileSync('credits.json', JSON.stringify(credits, null, 2));
        console.log('Credits fetched');

    } catch (err) {
        console.error('Error in smoke test', err);
        fs.writeFileSync('smoke_error.txt', String(err));
    }
})();

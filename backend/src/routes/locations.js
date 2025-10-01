const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Cargar archivo JSON con provincias y localidades desde /backend/assets/locations.json
const locationsPath = path.join(__dirname, '..', '..', 'assets', 'locations.json');
let locations = null;
try {
    if (fs.existsSync(locationsPath)) {
        const raw = fs.readFileSync(locationsPath, 'utf-8');
        locations = JSON.parse(raw);
    }
} catch (err) {
    console.warn('No se pudo cargar locations.json:', err.message);
}

// GET /api/meta/locations - devolver lista de provincias y ciudades
router.get('/', (req, res) => {
    if (locations) return res.json({ locations });

    // Fallback: devolver lista mínima de provincias y localidades comunes en España
    const fallback = {
        provinces: [
            { code: 'MD', name: 'Madrid' },
            { code: 'BA', name: 'Barcelona' },
            { code: 'VA', name: 'Valencia' }
        ],
        cities: {
            Madrid: ['Madrid', 'Alcalá de Henares', 'Leganés'],
            Barcelona: ['Barcelona', 'Hospitalet de Llobregat', 'Badalona'],
            Valencia: ['Valencia', 'Gandia', 'Torrent']
        }
    };

    res.json({ locations: fallback });
});

// GET /api/meta/locations/by-cp/:cp - intentar resolver provincia/localidades por código postal
router.get('/by-cp/:cp', (req, res) => {
    const cp = (req.params.cp || '').toString().trim();
    if (!cp || !/^[0-9]{5}$/.test(cp)) return res.status(400).json({ error: 'Código postal inválido' });

    // En España, los dos primeros dígitos identifican la provincia (01..52)
    const prefix = cp.substring(0, 2);

    if (locations) {
        // Buscar provincia cuyo code o nombre coincida con el prefijo si existe mapeo
        // Aquí asumimos que `locations.provinces` contiene códigos personalizados; hacemos heurística por nombre
        const provinces = locations.provinces || [];
        // Intento simple: buscar provincia cuyo nombre empiece por un nombre conocido en nuestra data
        // Si no hay mapeo directo, devolvemos listado completo de provincias como fallback
        // (Mejorar con un mapa real provincia->prefijo si se añade dataset completo)

        // Buscar coincidencias por prefijo numérico en un mapa opcional
        const provinceByPrefix = (locations.prefixMap && locations.prefixMap[prefix]) ? locations.prefixMap[prefix] : null;

        if (provinceByPrefix) {
            const provName = provinceByPrefix;
            const cities = (locations.cities && locations.cities[provName]) ? locations.cities[provName] : [];
            return res.json({ province: provName, cities });
        }

        // Si no hay mapa, devolver sólo listado de provincias para que el frontend no falle
        return res.json({ provinces, prefix });
    }

    // fallback: no tenemos dataset completo
    res.json({ provinces: [], prefix });
});

module.exports = router;

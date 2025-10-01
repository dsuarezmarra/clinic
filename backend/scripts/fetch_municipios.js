#!/usr/bin/env node
/**
 * fetch_municipios.js
 *
 * Descarga y normaliza un dataset público de municipios por provincia
 * y lo escribe en backend/assets/locations.json
 *
 * Comportamiento:
 * - descarga un JSON público (por defecto usa un mirror conocido en github)
 * - construye: { provinces: [{code,name}], prefixMap: { '28': 'Madrid', ... }, cities: { provinceName: [municipios...] } }
 * - hace backup del locations.json existente como locations.json.bak
 *
 * Uso:
 *   node backend/scripts/fetch_municipios.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Lista de fuentes públicas candidatas (raw GitHub). El script probará en orden y usará la primera que responda 200.
const CANDIDATE_URLS = [
    'https://raw.githubusercontent.com/datasets-spain/municipios/master/data/municipios.json',
    'https://raw.githubusercontent.com/jmcar/municipios-json/master/municipios.json',
    'https://raw.githubusercontent.com/ajapa/municipios-json/master/municipios.json',
    'https://raw.githubusercontent.com/IAGO-LOPEZ/spain-municipios-json/main/municipios.json'
];

// También aceptamos una ruta local JSON como argumento al script: node fetch_municipios.js ./datos/municipios.json
const localArg = process.argv[2];

const assetsDir = path.join(__dirname, '..', 'assets');
const locationsPath = path.join(assetsDir, 'locations.json');
const backupPath = path.join(assetsDir, 'locations.json.bak');

function downloadJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

function buildLocationsFromSource(source) {
    // source puede ser o bien un objeto {provincia: [munes]} o un array de registros con campo PROVINCIA y NOMBRE_ACTUAL
    const provinces = [];
    const cities = {};
    const prefixMap = {};

    // Mapeo de prefijos conocido por provincia (2 primeros dígitos)
    const knownPrefix = {
        'Álava': '01', 'Albacete': '02', 'Alicante': '03', 'Almería': '04', 'Ávila': '05', 'Badajoz': '06', 'Islas Baleares': '07', 'Barcelona': '08', 'Burgos': '09', 'Cáceres': '10', 'Cádiz': '11', 'Castellón': '12', 'Ciudad Real': '13', 'Córdoba': '14', 'A Coruña': '15', 'Cuenca': '16', 'Girona': '17', 'Granada': '18', 'Guadalajara': '19', 'Guipúzcoa': '20', 'Huelva': '21', 'Huesca': '22', 'Jaén': '23', 'León': '24', 'Lleida': '25', 'La Rioja': '26', 'Lugo': '27', 'Madrid': '28', 'Málaga': '29', 'Murcia': '30', 'Navarra': '31', 'Ourense': '32', 'Asturias': '33', 'Palencia': '34', 'Las Palmas': '35', 'Pontevedra': '36', 'Salamanca': '37', 'Santa Cruz de Tenerife': '38', 'Cantabria': '39', 'Segovia': '40', 'Sevilla': '41', 'Soria': '42', 'Tarragona': '43', 'Teruel': '44', 'Toledo': '45', 'Valencia': '46', 'Valladolid': '47', 'Vizcaya': '48', 'Zamora': '49', 'Zaragoza': '50', 'Ceuta': '51', 'Melilla': '52'
    };

    function normalizeProvName(raw) {
        if (!raw) return raw;
        // si tiene formato 'Local/Provincia' tomar la parte tras la barra
        const parts = raw.split('/');
        let name = parts[parts.length - 1].trim();
        // normalizar espacios y capitalización leve
        name = name.replace(/\s+/g, ' ');
        return name;
    }

    const map = {}; // provName -> Set of municipios

    if (Array.isArray(source)) {
        source.forEach((rec) => {
            const provRaw = rec.PROVINCIA || rec.provincia || rec.PROV || rec.Provincia || '';
            const provName = normalizeProvName(provRaw);
            const muni = rec.NOMBRE_ACTUAL || rec.NOMBRE || rec.CAPITAL || rec.nombre || rec.CAP || null;
            if (!provName) return;
            if (!map[provName]) map[provName] = new Set();
            if (muni) map[provName].add(muni);
        });
    } else if (source && typeof source === 'object') {
        Object.keys(source).forEach((k) => {
            const provName = normalizeProvName(k);
            const list = Array.isArray(source[k]) ? source[k] : [];
            map[provName] = new Set(list.filter(Boolean));
        });
    }

    Object.keys(map).sort().forEach((provName) => {
        const code = knownPrefix[provName] || null;
        provinces.push({ code: code || provName.slice(0, 2), name: provName });
        cities[provName] = Array.from(map[provName]).sort();
        if (code) prefixMap[code] = provName;
    });

    return { provinces, prefixMap, cities };
}

async function main() {
    try {
        let source = null;

        if (localArg) {
            // intentar leer archivo local
            const localPath = path.isAbsolute(localArg) ? localArg : path.join(process.cwd(), localArg);
            if (fs.existsSync(localPath)) {
                console.log('Usando archivo local:', localPath);
                source = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
            } else {
                console.warn('Archivo local no encontrado:', localPath);
            }
        }

        if (!source) {
            for (const u of CANDIDATE_URLS) {
                try {
                    console.log('Probando URL:', u);
                    const candidate = await downloadJson(u);
                    if (candidate && Object.keys(candidate).length > 0) {
                        source = candidate;
                        console.log('Fuente válida encontrada en', u);
                        break;
                    }
                } catch (err) {
                    console.warn('No disponible:', u, err.message);
                }
            }
        }

        if (!source) throw new Error('No se pudo descargar ninguna fuente pública ni se encontró archivo local');

        console.log('Fuente descargada. Provincias encontradas:', Object.keys(source).length);

        const locations = buildLocationsFromSource(source);

        // asegurarnos de que assets existe
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        // backup
        if (fs.existsSync(locationsPath)) {
            fs.copyFileSync(locationsPath, backupPath);
            console.log('Backup realizado en', backupPath);
        }

        fs.writeFileSync(locationsPath, JSON.stringify(locations, null, 2), 'utf-8');
        console.log('locations.json actualizado en', locationsPath);
    } catch (err) {
        console.error('Error descargando o procesando municipios:', err.message);
        process.exit(1);
    }
}

if (require.main === module) main();


const fs = require('fs');
const iconv = require('iconv-lite');
const path = require('path');

const files = [
    'frontend/src/app/pages/agenda/calendar/calendar.component.ts',
    'frontend/src/app/pages/configuracion/configuracion.component.ts',
    'frontend/src/app/pages/inicio/dashboard/dashboard.component.ts'
];

const basePath = 'c:\\git\\clinic';

files.forEach(file => {
    const fullPath = path.join(basePath, file);
    
    // Leer bytes crudos
    const buffer = fs.readFileSync(fullPath);
    
    // Intentar decodificar como latin1 y re-encodificar como UTF-8
    // Esto arregla el problema de doble encoding
    let content = buffer.toString('latin1');
    
    // Contar problemas antes
    const problemsBefore = (content.match(/[\xC3][\x80-\xBF]/g) || []).length;
    
    // Reemplazar secuencias mojibake comunes
    const replacements = {
        '\xC3\xA1': '\u00E1', // a
        '\xC3\xA9': '\u00E9', // e
        '\xC3\xAD': '\u00ED', // i
        '\xC3\xB3': '\u00F3', // o
        '\xC3\xBA': '\u00FA', // u
        '\xC3\xB1': '\u00F1', // n
        '\xC3\x81': '\u00C1', // A
        '\xC3\x89': '\u00C9', // E
        '\xC3\x8D': '\u00CD', // I
        '\xC3\x93': '\u00D3', // O
        '\xC3\x9A': '\u00DA', // U
        '\xC3\x91': '\u00D1', // N
        '\xC3\xBC': '\u00FC', // u con dieresis
        '\xC3\x9C': '\u00DC', // U con dieresis
        '\xC2\xBF': '\u00BF', // ?
        '\xC2\xA1': '\u00A1', // !
    };
    
    for (const [mojibake, correct] of Object.entries(replacements)) {
        content = content.split(mojibake).join(correct);
    }
    
    // Contar problemas despues
    const problemsAfter = (content.match(/[\xC3][\x80-\xBF]/g) || []).length;
    
    const fixed = problemsBefore - problemsAfter;
    
    // Guardar como UTF-8
    fs.writeFileSync(fullPath, content, 'utf8');
    
    console.log(path.basename(file) + ': ' + fixed + ' correcciones');
});

console.log('\nArchivos corregidos.');

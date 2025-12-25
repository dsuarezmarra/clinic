const fs = require('fs');

const file = 'c:/git/clinic/frontend/src/app/pages/agenda/calendar/calendar.component.ts';

// Leer archivo
let content = fs.readFileSync(file, 'utf8');

// Mapeo de caracteres corruptos a emojis correctos
const replacements = [
    // Emojis 4 bytes que se corrompieron
    ['ðŸ"¦', '📦'],
    ['ðŸ"Š', '📊'],
    ['ðŸ•', '🕐'],
    ['ðŸ"‹', '📋'],
    // Checkmarks y warnings
    ['âœ…', '✅'],
    ['âš ï¸', '⚠️'],
    ['âš¡', '⚡'],
    ['âŒ', '❌'],
    // También buscar patrones con diferentes corrupciones
    ['\u00f0\u0178"\u00a6', '📦'],
    ['\u00f0\u0178"\u0160', '📊'],
    ['\u00e2\u0153\u2026', '✅'],
    ['\u00e2\u0161\u00a0\u00ef\u00b8', '⚠️'],
    ['\u00e2\u0161\u00a1', '⚡'],
];

// Aplicar reemplazos
for (const [corrupted, correct] of replacements) {
    if (content.includes(corrupted)) {
        console.log(`Reemplazando: "${corrupted}" -> "${correct}"`);
        content = content.split(corrupted).join(correct);
    }
}

// Guardar archivo
fs.writeFileSync(file, content, 'utf8');
console.log('Archivo guardado correctamente');

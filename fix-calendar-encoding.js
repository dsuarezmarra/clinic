const fs = require('fs');

const file = 'c:/git/clinic/frontend/src/app/pages/agenda/calendar/calendar.component.ts';

// Leer como buffer
const buffer = fs.readFileSync(file);
let content = buffer.toString('utf8');

console.log('Buscando caracteres corruptos en calendar.component.ts...');

const replacements = [
    // Carácter de reemplazo UTF-8 (U+FFFD) seguido de texto
    ['a\uFFFDadido', 'añadido'],
    // Comentarios con caracteres corruptos
    ['est\uFFFD seleccionado', 'está seleccionado'],
    ['tambi\uFFFDn', 'también'],
    // Interrogación corrupta
    ['\uFFFD Error', '❌ Error'],
];

let totalChanges = 0;
for (const [pattern, replacement] of replacements) {
    const count = content.split(pattern).length - 1;
    if (count > 0) {
        content = content.split(pattern).join(replacement);
        console.log(`Reemplazado: ${count}x "${pattern}" -> "${replacement}"`);
        totalChanges += count;
    }
}

// También buscar patrones específicos hex
const hexReplacements = [
    // efbfbd = U+FFFD (replacement character)
    [Buffer.from('efbfbd', 'hex').toString('utf8'), 'ñ'], // Para casos donde solo está el carácter corrupto
];

for (const [pattern, replacement] of hexReplacements) {
    // Solo reemplazar si está en contexto de "a_adido"
    if (content.includes('a' + pattern + 'adido')) {
        content = content.replace(new RegExp('a' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 'adido', 'g'), 'añadido');
        console.log('Reemplazado patrón hex: añadido');
        totalChanges++;
    }
}

if (totalChanges > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`\nArchivo guardado con ${totalChanges} cambios`);
} else {
    console.log('\nNo se encontraron patrones conocidos. Buscando manualmente...');
    
    // Buscar cualquier U+FFFD
    const fffdCount = (content.match(/\uFFFD/g) || []).length;
    console.log(`Caracteres U+FFFD encontrados: ${fffdCount}`);
    
    if (fffdCount > 0) {
        // Mostrar contexto
        const regex = /.{0,20}\uFFFD.{0,20}/g;
        const contexts = content.match(regex);
        if (contexts) {
            console.log('Contextos:');
            contexts.forEach(c => console.log('  ' + JSON.stringify(c)));
        }
    }
}

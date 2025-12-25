const fs = require('fs');

const file = 'c:/git/clinic/frontend/src/app/pages/agenda/calendar/calendar.component.ts';

// Leer como buffer
const buffer = fs.readFileSync(file);
let content = buffer.toString('utf8');

console.log('Corrigiendo caracteres con tilde corruptos...');

const replacements = [
    // Ó corrupto -> Ó (c383e2809c -> C3 93)
    [Buffer.from('c383e2809c', 'hex').toString('utf8'), 'Ó'],
    // É corrupto -> É (c383e280b0 -> C3 89)
    [Buffer.from('c383e280b0', 'hex').toString('utf8'), 'É'],
    // × (multiplicación) corrupto -> × (c383e28094 -> C3 97)
    [Buffer.from('c383e28094', 'hex').toString('utf8'), '×'],
];

let totalChanges = 0;
for (const [pattern, replacement] of replacements) {
    const count = content.split(pattern).length - 1;
    if (count > 0) {
        content = content.split(pattern).join(replacement);
        console.log(`Reemplazado: ${count}x -> "${replacement}"`);
        totalChanges += count;
    }
}

if (totalChanges > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`\nArchivo guardado con ${totalChanges} cambios`);
} else {
    console.log('\nNo se encontraron más patrones');
}

const fs = require('fs');

const file = 'c:/git/clinic/frontend/src/app/pages/agenda/calendar/calendar.component.ts';

// Leer como buffer
const buffer = fs.readFileSync(file);
let content = buffer.toString('utf8');

console.log('Buscando patrones corruptos adicionales...');

const replacements = [
    // âœ… -> ✅ (hex: c3a2c593e280a6)
    [Buffer.from('c3a2c593e280a6', 'hex').toString('utf8'), '✅'],
    // âŒ -> ❌ (hex: c3a2c29dc592)
    [Buffer.from('c3a2c29dc592', 'hex').toString('utf8'), '❌'],
    // â† -> ← (hex: c3a2e280a0c290) - este es una flecha
    [Buffer.from('c3a2e280a0c290', 'hex').toString('utf8'), '←'],
];

let totalChanges = 0;
for (const [pattern, replacement] of replacements) {
    const count = content.split(pattern).length - 1;
    if (count > 0) {
        content = content.split(pattern).join(replacement);
        console.log(`Reemplazado: ${count}x -> ${replacement}`);
        totalChanges += count;
    }
}

if (totalChanges > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`\nArchivo guardado con ${totalChanges} cambios`);
} else {
    console.log('\nNo se encontraron más patrones');
}

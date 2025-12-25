const fs = require('fs');

const file = 'c:/git/clinic/frontend/src/app/pages/agenda/calendar/calendar.component.ts';

// Leer como buffer
const buffer = fs.readFileSync(file);
let content = buffer.toString('utf8');

console.log('Buscando patrones corruptos...');

// El patrón c3b0c5b8e2809cc2a6 corresponde al emoji de paquete corrupto
// Esto es UTF-8 leído como Latin-1 y luego guardado como UTF-8 (double encoding)

// Patrones encontrados en hex:
// c3b0c5b8e2809cc2a6 = ðŸ"¦ (debería ser 📦)
// c3b0c5b8e2809cc5a0 = ðŸ"Š (debería ser 📊)
// c3b0c5b8e280a2 = ðŸ• (debería ser 🕐)
// c3b0c5b8e2809ce280b9 = ðŸ"‹ (debería ser 📋)
// c3a2c593c285 = âœ… (debería ser ✅)
// c3a2c5a1c2a0c3afc2b8 = âš ï¸ (debería ser ⚠️)
// c3a2c5a1c2a1 = âš¡ (debería ser ⚡)
// c3a2c592 = âŒ (debería ser ❌)

const replacements = [
    // Package 📦
    [Buffer.from('c3b0c5b8e2809cc2a6', 'hex').toString('utf8'), '📦'],
    // Chart 📊
    [Buffer.from('c3b0c5b8e2809cc5a0', 'hex').toString('utf8'), '📊'],
    // Clock 🕐 - probar varias variantes
    [Buffer.from('c3b0c5b8e280a2', 'hex').toString('utf8'), '🕐'],
    // Clipboard 📋
    [Buffer.from('c3b0c5b8e2809ce280b9', 'hex').toString('utf8'), '📋'],
    // Check ✅
    [Buffer.from('c3a2c593c285', 'hex').toString('utf8'), '✅'],
    // Warning ⚠️
    [Buffer.from('c3a2c5a1c2a0c3afc2b8', 'hex').toString('utf8'), '⚠️'],
    // Lightning ⚡
    [Buffer.from('c3a2c5a1c2a1', 'hex').toString('utf8'), '⚡'],
    // X ❌
    [Buffer.from('c3a2c592', 'hex').toString('utf8'), '❌'],
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
    console.log('\nNo se encontraron patrones (probando búsqueda alternativa)...');
    
    // Busqueda alternativa - encontrar cualquier secuencia que empiece con ð
    const regex = /ð[^\s]{1,10}/g;
    const matches = content.match(regex);
    if (matches) {
        console.log('Secuencias encontradas que empiezan con ð:');
        const unique = [...new Set(matches)];
        unique.forEach(m => {
            console.log(`  "${m}" - hex: ${Buffer.from(m).toString('hex')}`);
        });
    }
}

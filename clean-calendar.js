const fs = require('fs');

const file = 'c:\\git\\clinic\\frontend\\src\\app\\pages\\agenda\\calendar\\calendar.component.ts';
let content = fs.readFileSync(file, 'utf8');

// Patrones a limpiar (emojis corruptos y símbolos)
const patterns = [
    [/ÃÅâ[^\s]*/g, ''],  // emojis 4-byte corruptos
    [/ÃÅâ/g, ''],        // checkmark corrupto
    [/ÃÅ¡Â\s*ÃÂÂ/g, ''], // warning corrupto
    [/ÃÅ¡¡/g, ''],        // otro emoji
    [/ÃÂÂ/g, ''],        // variante selector
    [/ÃÂÅ/g, ''],         // otro checkmark
    [/ÃâÂ¬/g, '€'],       // euro
    [/â¬/g, '€'],          // euro partial
    [/Ãâ(?=\d)/g, 'x'],    // multiplicador (5x60)
    [/ÃâN/g, 'ÓN'],        // CREACIÓN etc
];

let count = 0;
for (const [pattern, replacement] of patterns) {
    const matches = content.match(pattern);
    if (matches) {
        count += matches.length;
        content = content.replace(pattern, replacement);
    }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Corregidos: ' + count + ' patrones');
console.log('Ã restantes: ' + (content.match(/Ã/g) || []).length);

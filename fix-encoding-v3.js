const fs = require('fs');
const path = require('path');

// Archivos a procesar
const files = [
    'c:/git/clinic/frontend/src/app/pages/agenda/calendar/calendar.component.ts'
];

// Patrones corruptos conocidos (usando hex bytes para evitar problemas de encoding)
// Los mojibake típicos ocurren cuando UTF-8 se lee como Latin-1

const replacements = {
    // Package emoji 📦 (U+1F4E6) -> UTF-8: F0 9F 93 A6
    // Cuando se corrompe como Latin-1: ðŸ"¦ 
    '\xc3\xb0\xc5\xb8\xe2\x80\x9d\xc2\xa6': '\u{1F4E6}', // 📦
    
    // Chart emoji 📊 (U+1F4CA) -> UTF-8: F0 9F 93 8A
    '\xc3\xb0\xc5\xb8\xe2\x80\x9d\xc5\xa0': '\u{1F4CA}', // 📊
    
    // Clock emoji 🕐 (U+1F550) -> UTF-8: F0 9F 95 90
    '\xc3\xb0\xc5\xb8\xe2\x80\xa2': '\u{1F550}', // 🕐
    
    // Clipboard emoji 📋 (U+1F4CB) -> UTF-8: F0 9F 93 8B  
    '\xc3\xb0\xc5\xb8\xe2\x80\x9d\xe2\x80\xb9': '\u{1F4CB}', // 📋
    
    // Checkmark ✅ (U+2705)
    '\xc3\xa2\xc5\x93\xc2\x85': '\u2705', // ✅
    
    // Warning ⚠️ (U+26A0 + FE0F)
    '\xc3\xa2\xc5\xa1\xc2\xa0\xc3\xaf\xc2\xb8\x8f': '\u26A0\uFE0F', // ⚠️
    
    // Lightning ⚡ (U+26A1)
    '\xc3\xa2\xc5\xa1\xc2\xa1': '\u26A1', // ⚡
    
    // X mark ❌ (U+274C)
    '\xc3\xa2\xc5\x92': '\u274C', // ❌
};

for (const file of files) {
    console.log(`Processing: ${file}`);
    
    // Leer como buffer
    const buffer = fs.readFileSync(file);
    let content = buffer.toString('utf8');
    
    // Aplicar reemplazos
    let changes = 0;
    for (const [pattern, replacement] of Object.entries(replacements)) {
        const count = (content.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        if (count > 0) {
            content = content.split(pattern).join(replacement);
            console.log(`  Replaced ${count} occurrences of corrupted pattern -> ${replacement}`);
            changes += count;
        }
    }
    
    if (changes > 0) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  Saved with ${changes} total changes`);
    } else {
        console.log('  No corrupted patterns found with this approach');
    }
}

console.log('\nDone!');

const fs = require('fs');
const path = require('path');

let found = 0;
const issues = [];

function scan(dir) {
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const p = path.join(dir, item);
            const st = fs.statSync(p);
            if (st.isDirectory() && !item.includes('node_modules')) {
                scan(p);
            } else if (st.isFile() && /\.(ts|html|scss)$/.test(item)) {
                const content = fs.readFileSync(p, 'utf8');
                
                // Patrones de mojibake conocidos
                const patterns = [
                    { name: 'emoji corrupto (box)', regex: /\xc3\xb0\xc5\xb8/g },
                    { name: 'checkmark corrupto', regex: /\xc3\xa2\xc5\x93/g },
                    { name: 'warning corrupto', regex: /\xc3\xa2\xc5\xa1/g },
                    { name: 'acento corrupto', regex: /Ã[³¡éíóúñ]/g },
                    { name: 'simbolo 3/4', regex: /¾/g }
                ];
                
                for (const { name, regex } of patterns) {
                    const matches = content.match(regex);
                    if (matches) {
                        issues.push({ file: p, pattern: name, count: matches.length });
                        found++;
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error scanning:', e.message);
    }
}

console.log('Escaneando archivos en frontend/src...\n');
scan('c:/git/clinic/frontend/src');

if (issues.length > 0) {
    console.log('Problemas encontrados:');
    issues.forEach(i => console.log(`  ${i.file}: ${i.pattern} (${i.count}x)`));
} else {
    console.log('✅ No se encontraron patrones de encoding corruptos');
}

console.log(`\nTotal de archivos con problemas: ${found}`);

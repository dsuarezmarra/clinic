const fs = require('fs');
const path = require('path');

const files = [
    'frontend/src/app/pages/agenda/calendar/calendar.component.ts',
    'frontend/src/app/pages/configuracion/configuracion.component.ts',
];

let totalFixed = 0;

files.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let fileFixed = 0;
    
    // Fix emoji patterns by replacing them with simple text alternatives
    const emojiReplacements = [
        // Charts/stats emoji -> simple text
        [/Ã°Å¸â??Å /g, '[??] '],
        [/Ã°Å¸â??Â¦/g, '[??] '],
        [/Ã°Â?Â"Â?/g, '[??] '],
        [/Ã°Â?ÂÂ·ï¸/g, '[??] '],
        [/Ã°Â?Â"Â/g, '[??] '],
        [/Ã°Â?Â'Â¾/g, '[??] '],
        // Checkmarks -> [OK]
        [/Ã¢Å"â?¦/g, '[OK] '],
        [/Ã¢Åâ¦/g, '[OK] '],
        // Warning -> [WARN]
        [/Ã¢Å¡Â Ã¯Â¸Â/g, '[WARN] '],
        // Error -> [ERROR]
        [/Ã¢ÂÅ'/g, '[ERROR] '],
        [/Ã¢ÂÅ/g, '[ERROR] '],
        // Other mojibake patterns that might be left
        [/Ã¢â??Â¬/g, '?'],
        [/â?"/g, '?'],
    ];
    
    emojiReplacements.forEach(([pattern, replacement]) => {
        const matches = content.match(pattern);
        if (matches) {
            fileFixed += matches.length;
            content = content.replace(pattern, replacement);
            console.log(`  Replaced pattern with "${replacement}" (${matches.length} times)`);
        }
    });
    
    if (fileFixed > 0) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed ${fileFixed} emoji issues in ${filePath}\n`);
        totalFixed += fileFixed;
    } else {
        console.log(`No emoji issues found in ${filePath}\n`);
    }
});

console.log(`Total emoji fixes: ${totalFixed}`);

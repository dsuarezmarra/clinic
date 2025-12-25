const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/pages/agenda/calendar/calendar.component.ts');

let content = fs.readFileSync(filePath, 'utf8');

// Map of corrupted sequences to correct UTF-8 characters
const replacements = [
    // Emojis
    ['ÃÂÃÂ°ÃÂÃÂ¸ÃÂ¢??ÃÂ ', '??'],
    ['ÃÂÃÂ°ÃÂÃÂ¸ÃÂ¢??ÃÂÃÂ¦', '??'],
    ['ÃÂÃÂ¢ÃÂ"ÃÂ¢?ÃÂ¦', '?'],
    ['ÃÂÃÂ¢ÃÂ�ÃÂ ÃÂÃÂ¯ÃÂÃÂ¸ÃÂ', '??'],
    ['ÃÂÃÂ¢ÃÂÃÂ'', '?'],
    ['ÃÂÃÂ¢ÃÂ��', '?'],
    ['ÃÂÃÂ°ÃÂÃÂ¸ÃÂ¢?ÃÂ¢ÃÂ', '??'],
    ['ÃÂÃÂ°ÃÂÃÂ¸ÃÂ¢??ÃÂ¢?ÃÂ¹', '??'],
    
    // Spanish accents
    ['qu�', 'qu�'],
    ['duraci�n', 'duraci�n'],
    ['validaci�n', 'validaci�n'],
    ['m�s', 'm�s'],
    ['seg�n', 'seg�n'],
    ['est�', 'est�'],
    ['CREACIÃÂ?ÃÂ¢??N', 'CREACI�N'],
];

let changeCount = 0;
for (const [corrupted, correct] of replacements) {
    const before = content;
    content = content.split(corrupted).join(correct);
    if (content !== before) {
        const count = (before.split(corrupted).length - 1);
        console.log(`Replaced "${corrupted}" with "${correct}" (${count} occurrences)`);
        changeCount += count;
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\nTotal replacements: ${changeCount}`);
console.log('File saved:', filePath);

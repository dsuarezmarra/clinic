const fs = require('fs');

const filePath = 'frontend/src/app/pages/agenda/calendar/calendar.component.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replacements using escaped sequences only - no special chars in source
const replacements = [
    // Emojis (hex patterns to avoid encoding issues)
    ['\u00C3\u00B0\u0178\u201C\u0160', '\uD83D\uDCCA'],  // chart
    ['\u00C3\u00B0\u0178\u201C\u00A6', '\uD83D\uDCE6'],  // package
    ['\u00C3\u00A2\u0153\u2026', '\u2705'],              // checkmark
    ['\u00C3\u00A2\u0160\u00A0\u00C3\u00AF\u00B8\u0178', '\u26A0\uFE0F'], // warning
    ['\u00C3\u00A2\u0178\u0152', '\u274C'],              // X mark
    ['\u00C3\u00B0\u0178\u2022\u0178', '\uD83D\uDD50'],  // clock
    ['\u00C3\u00B0\u0178\u201C\u2039', '\uD83D\uDCCB'],  // clipboard
    ['\u00C3\u00A2\u0160\u00A1', '\u26A1'],              // lightning
    ['\u00C3\u00A2\u2020\u00A9', '\u21A9'],              // return arrow
    
    // Spanish accented vowels (lowercase)
    ['\u00C3\u00A1', '\u00E1'],  // a acute
    ['\u00C3\u00A9', '\u00E9'],  // e acute
    ['\u00C3\u00AD', '\u00ED'],  // i acute
    ['\u00C3\u00B3', '\u00F3'],  // o acute
    ['\u00C3\u00BA', '\u00FA'],  // u acute
    ['\u00C3\u00B1', '\u00F1'],  // n tilde
    
    // Punctuation
    ['\u00C2\u00BF', '\u00BF'],  // inverted ?
    ['\u00C2\u00A1', '\u00A1'],  // inverted !
    
    // Euro
    ['\u20AC', '\u20AC'],        // euro (might be doubled)
    
    // Replacement char
    ['\uFFFD', ''],
];

let totalCount = 0;

for (const [pattern, replacement] of replacements) {
    let count = 0;
    while (content.includes(pattern)) {
        content = content.replace(pattern, replacement);
        count++;
    }
    if (count > 0) {
        totalCount += count;
        console.log('Replaced ' + count + 'x');
    }
}

console.log('Total replacements: ' + totalCount);

fs.writeFileSync(filePath, content, 'utf8');
console.log('File saved successfully');

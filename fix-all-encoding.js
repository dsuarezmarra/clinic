const fs = require('fs');
const path = require('path');

// Archivos a procesar
const files = [
    'c:/git/clinic/frontend/src/app/pages/agenda/calendar/calendar.component.ts'
];

// Mapeo de caracteres corruptos a correctos
const replacements = {
    'r�pidamente': 'rápidamente',
    'sesi�n': 'sesión',
    'Sesi�n': 'Sesión',
    'selecci�n': 'selección',
    'a�adir': 'añadir',
    'cr�dito': 'crédito',
    'm�ltiples': 'múltiples',
    'Duraci�n': 'Duración',
    'duraci�n': 'duración',
    'N�mero': 'Número',
    'n�mero': 'número',
    'est�': 'está',
    'propagaci�n': 'propagación',
    'despu�s': 'después',
    'l�gica': 'lógica',
    'Tambi�n': 'También',
    'tambi�n': 'también',
    'a�adido': 'añadido',
    // También buscar el carácter de reemplazo suelto
    '\uFFFD': 'ñ', // Esto es un fallback, pero mejor ser específico
};

for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log(`Archivo no existe: ${file}`);
        continue;
    }
    
    console.log(`Procesando: ${file}`);
    let content = fs.readFileSync(file, 'utf8');
    let totalChanges = 0;
    
    for (const [corrupted, correct] of Object.entries(replacements)) {
        const regex = new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
            content = content.replace(regex, correct);
            console.log(`  Reemplazado: ${matches.length}x "${corrupted}" -> "${correct}"`);
            totalChanges += matches.length;
        }
    }
    
    if (totalChanges > 0) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  Guardado con ${totalChanges} cambios\n`);
    } else {
        console.log('  No se encontraron patrones\n');
    }
}

console.log('Hecho!');

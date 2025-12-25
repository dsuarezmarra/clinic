/**
 * Script para corregir encoding en archivos del proyecto
 * Solo convierte bytes Latin-1 que NO son parte de secuencias UTF-8 válidas
 */

const fs = require('fs');
const path = require('path');

const extensions = ['.html', '.ts', '.scss', '.css'];
const srcDir = path.join(__dirname, '..', 'frontend', 'src');

let modifiedCount = 0;
let totalFiles = 0;

/**
 * Verifica si un byte en una posición es parte de una secuencia UTF-8 válida
 */
function isPartOfUtf8Sequence(buffer, index) {
    const byte = buffer[index];
    
    // Si es un byte de continuación UTF-8 (10xxxxxx = 0x80-0xBF)
    if (byte >= 0x80 && byte <= 0xBF) {
        // Verificar si hay un byte de inicio UTF-8 antes
        if (index > 0) {
            const prev = buffer[index - 1];
            // 2-byte sequence: 110xxxxx (0xC0-0xDF)
            if (prev >= 0xC0 && prev <= 0xDF) {
                return true;
            }
            // Check for 3-byte or 4-byte sequence leaders further back
            if (index > 1) {
                const prev2 = buffer[index - 2];
                // 3-byte sequence: 1110xxxx (0xE0-0xEF)
                if (prev2 >= 0xE0 && prev2 <= 0xEF && prev >= 0x80 && prev <= 0xBF) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Si es un byte de inicio UTF-8 (110xxxxx = 0xC0-0xDF)
    if (byte >= 0xC0 && byte <= 0xDF) {
        // Verificar si el siguiente byte es un byte de continuación válido
        if (index + 1 < buffer.length) {
            const next = buffer[index + 1];
            if (next >= 0x80 && next <= 0xBF) {
                return true;
            }
        }
        return false;
    }
    
    // Si es un byte de inicio de 3 bytes (1110xxxx = 0xE0-0xEF)
    if (byte >= 0xE0 && byte <= 0xEF) {
        if (index + 2 < buffer.length) {
            const next1 = buffer[index + 1];
            const next2 = buffer[index + 2];
            if (next1 >= 0x80 && next1 <= 0xBF && next2 >= 0x80 && next2 <= 0xBF) {
                return true;
            }
        }
        return false;
    }
    
    return false;
}

/**
 * Corrige bytes Latin-1 aislados (no parte de secuencias UTF-8) a UTF-8
 */
function fixIsolatedLatin1Bytes(buffer) {
    const result = [];
    let modified = false;
    let i = 0;
    
    while (i < buffer.length) {
        const byte = buffer[i];
        
        // Byte ASCII normal (0x00-0x7F)
        if (byte < 0x80) {
            result.push(byte);
            i++;
            continue;
        }
        
        // Byte de inicio UTF-8 de 2 bytes (0xC0-0xDF)
        if (byte >= 0xC0 && byte <= 0xDF && i + 1 < buffer.length) {
            const next = buffer[i + 1];
            if (next >= 0x80 && next <= 0xBF) {
                // Secuencia UTF-8 válida, mantener ambos bytes
                result.push(byte);
                result.push(next);
                i += 2;
                continue;
            }
        }
        
        // Byte de inicio UTF-8 de 3 bytes (0xE0-0xEF)
        if (byte >= 0xE0 && byte <= 0xEF && i + 2 < buffer.length) {
            const next1 = buffer[i + 1];
            const next2 = buffer[i + 2];
            if (next1 >= 0x80 && next1 <= 0xBF && next2 >= 0x80 && next2 <= 0xBF) {
                // Secuencia UTF-8 válida de 3 bytes
                result.push(byte);
                result.push(next1);
                result.push(next2);
                i += 3;
                continue;
            }
        }
        
        // Byte alto aislado (Latin-1) - convertir a UTF-8
        if (byte >= 0x80 && byte <= 0xFF) {
            // Caracteres Latin-1 0x80-0xBF -> UTF-8: C2 XX
            // Caracteres Latin-1 0xC0-0xFF -> UTF-8: C3 (XX-0x40)
            if (byte < 0xC0) {
                result.push(0xC2);
                result.push(byte);
            } else {
                result.push(0xC3);
                result.push(byte - 0x40);
            }
            modified = true;
            i++;
            continue;
        }
        
        // Otros bytes
        result.push(byte);
        i++;
    }
    
    return { buffer: Buffer.from(result), modified };
}

function processFile(filePath) {
    totalFiles++;
    
    try {
        const buffer = fs.readFileSync(filePath);
        
        // Verificar si tiene bytes Latin-1 aislados
        let hasIsolatedLatin1 = false;
        for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i];
            if (byte >= 0x80 && byte <= 0xFF && !isPartOfUtf8Sequence(buffer, i)) {
                hasIsolatedLatin1 = true;
                break;
            }
        }
        
        if (hasIsolatedLatin1) {
            const { buffer: fixedBuffer, modified } = fixIsolatedLatin1Bytes(buffer);
            
            if (modified) {
                modifiedCount++;
                console.log(`[CORREGIDO] ${filePath}`);
                fs.writeFileSync(filePath, fixedBuffer);
            }
        }
    } catch (err) {
        console.error(`[ERROR] ${filePath}: ${err.message}`);
    }
}

function processDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!['node_modules', 'dist', '.git', '.angular'].includes(item)) {
                processDirectory(fullPath);
            }
        } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (extensions.includes(ext)) {
                processFile(fullPath);
            }
        }
    }
}

console.log('========================================');
console.log('  FIX ISOLATED LATIN-1 BYTES');
console.log('========================================\n');
console.log(`Processing: ${srcDir}\n`);

processDirectory(srcDir);

console.log('\n========================================');
console.log('  SUMMARY');
console.log('========================================');
console.log(`Files processed: ${totalFiles}`);
console.log(`Files fixed: ${modifiedCount}`);

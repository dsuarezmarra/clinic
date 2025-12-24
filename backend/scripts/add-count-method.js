const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'database', 'database-manager.js');
let content = fs.readFileSync(filePath, 'utf8');

const countMethod = `                },

                count: async (options = {}) => {
                    try {
                        let query = this.supabase
                            .from(this.getTableName('credit_packs'))
                            .select('id', { count: 'exact', head: true });

                        if (options.where) {
                            for (const [key, value] of Object.entries(options.where)) {
                                if (value && typeof value === 'object') {
                                    if (value.gt !== undefined) query = query.gt(key, value.gt);
                                    else if (value.gte !== undefined) query = query.gte(key, value.gte);
                                    else if (value.lt !== undefined) query = query.lt(key, value.lt);
                                    else if (value.lte !== undefined) query = query.lte(key, value.lte);
                                    else if (value.in) query = query.in(key, value.in);
                                    else if (value.not !== undefined) query = query.neq(key, value.not);
                                    else query = query.eq(key, value);
                                } else {
                                    query = query.eq(key, value);
                                }
                            }
                        }

                        const { count, error } = await query;

                        if (error) {
                            console.log('Warning: Error en credit_packs.count:', error.message);
                            const { data: fallbackData } = await this.supabase
                                .from(this.getTableName('credit_packs'))
                                .select('id');
                            return fallbackData ? fallbackData.length : 0;
                        }

                        return count || 0;
                    } catch (error) {
                        console.error('Error en credit_packs.count:', error);
                        return 0;
                    }
                }
            },

            // Tabla credit_redemptions`;

const pattern = /                }\r?\n            },\r?\n\r?\n            \/\/ Tabla credit_redemptions/;

if (pattern.test(content)) {
    content = content.replace(pattern, countMethod);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('? SUCCESS: Método count agregado a credit_packs');
} else {
    console.log('? ERROR: No se encontró el patrón. Verificando contenido...');
    
    // Buscar la sección de credit_packs para debugging
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        if (line.includes('credit_redemptions')) {
            console.log(`Línea ${idx + 1}: ${line.substring(0, 80)}`);
        }
    });
}

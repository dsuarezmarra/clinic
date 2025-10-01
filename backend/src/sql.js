// sql.js - adaptador ligero para usar el paquete 'postgres'
const postgres = require('postgres');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!connectionString) {
    console.error('DATABASE_URL no encontrada en backend/.env');
    // No salir aquí: dejar que los scripts que importen manejen el error.
}

const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false }
});

module.exports = sql;

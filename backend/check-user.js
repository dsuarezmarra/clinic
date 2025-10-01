require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const url = process.env.DATABASE_URL;
if (url) {
    // Extraer el usuario de la URL
    const match = url.match(/postgresql:\/\/([^:]+):/);
    if (match) {
        console.log('Usuario en DATABASE_URL:', match[1]);
    }
}

// Detectar si estamos en desarrollo local
const isLocalDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const environment = {
  production: !isLocalDev,
  // Backend: local en desarrollo, Vercel en producción
  apiUrl: isLocalDev 
    ? 'http://localhost:3000/api' 
    : 'https://api-clinic-personal.vercel.app/api'
};

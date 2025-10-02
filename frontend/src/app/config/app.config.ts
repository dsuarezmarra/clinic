/**
 * Configuración única de la aplicación
 * No necesitamos múltiples entornos porque todo se despliega en producción
 */
export const APP_CONFIG = {
  apiUrl: 'https://clinic-backend-q7hie00fl-davids-projects-8fa96e54.vercel.app/api',
  appName: 'Clínica Masaje Corporal Deportivo',
  version: '1.0.0',
  production: true
} as const;

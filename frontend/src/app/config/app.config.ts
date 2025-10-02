import { CURRENT_CLIENT_CONFIG } from './client.config';

/**
 * Configuración de la aplicación basada en el cliente actual
 * Se carga automáticamente según VITE_CLIENT_ID
 */
export const APP_CONFIG = {
  // Configuración específica del cliente
  ...CURRENT_CLIENT_CONFIG,
  
  // Configuración general de la aplicación
  version: '1.0.0',
  production: true
} as const;

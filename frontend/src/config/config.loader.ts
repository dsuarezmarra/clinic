import { ClientConfig } from './client-config.interface';
import { actifisioConfig } from './clients/actifisio.config';
import { masajecorporaldeportivoConfig } from './clients/masajecorporaldeportivo.config';

/**
 * Mapa de todas las configuraciones de clientes disponibles
 * Para agregar un nuevo cliente, importar su config y agregarlo aquí
 */
const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  'masajecorporaldeportivo': masajecorporaldeportivoConfig,
  'actifisio': actifisioConfig,
  // Agregar nuevos clientes aquí:
  // 'nuevocliente': nuevoclienteConfig,
};

/**
 * Carga la configuración del cliente basado en variable de entorno
 * 
 * Flujo de detección:
 * 1. Lee VITE_CLIENT_ID de las variables de entorno de Vite
 * 2. Si no existe o es inválida, usa 'masajecorporaldeportivo' como default
 * 
 * En Vercel, configurar en cada proyecto:
 * Environment Variables → VITE_CLIENT_ID → 'masajecorporaldeportivo' (o el slug del cliente)
 */
export function loadClientConfig(): ClientConfig {
  // Opción 1: Variable de entorno (definida en build time por Vite/Vercel)
  const clientId = import.meta.env.VITE_CLIENT_ID as string;
  
  if (clientId && CLIENT_CONFIGS[clientId]) {
    console.log(`✅ Configuración cargada para cliente: ${clientId}`);
    return CLIENT_CONFIGS[clientId];
  }
  
  // Opción 2: Fallback a masajecorporaldeportivo (cliente por defecto)
  if (!clientId) {
    console.warn('⚠️ VITE_CLIENT_ID no definida, usando configuración por defecto: masajecorporaldeportivo');
  } else {
    console.error(`❌ Cliente '${clientId}' no encontrado en CLIENT_CONFIGS, usando configuración por defecto`);
  }
  
  return masajecorporaldeportivoConfig;
}

/**
 * Configuración activa de la aplicación
 * Esta es la instancia que deben usar todos los componentes y servicios
 */
export const APP_CONFIG = loadClientConfig();

/**
 * Lista de todos los clientes disponibles (útil para debugging)
 */
export const AVAILABLE_CLIENTS = Object.keys(CLIENT_CONFIGS);

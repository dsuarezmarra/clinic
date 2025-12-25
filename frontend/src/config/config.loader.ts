import { isDevMode } from '@angular/core';
import { ClientConfig } from './client-config.interface';
import { actifisioConfig } from './clients/actifisio.config';
import { masajecorporaldeportivoConfig } from './clients/masajecorporaldeportivo.config';

/**
 * Logging condicional (solo en desarrollo)
 */
const devLog = (...args: unknown[]) => {
  if (typeof isDevMode === 'function') {
    try {
      if (isDevMode()) console.log(...args);
    } catch {
      // isDevMode puede fallar fuera del contexto Angular
    }
  }
};

const devWarn = (...args: unknown[]) => {
  if (typeof isDevMode === 'function') {
    try {
      if (isDevMode()) console.warn(...args);
    } catch {
      // isDevMode puede fallar fuera del contexto Angular
    }
  }
};

/**
 * Mapa de todas las configuraciones de clientes disponibles
 * Para agregar un nuevo cliente, importar su config y agregarlo aqui
 */
const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  'masajecorporaldeportivo': masajecorporaldeportivoConfig,
  'actifisio': actifisioConfig,
  // Agregar nuevos clientes aqui:
  // 'nuevocliente': nuevoclienteConfig,
};

/**
 * Verifica si estamos en entorno browser (no SSR)
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Detecta si estamos en entorno de desarrollo local
 */
function isLocalDevelopment(): boolean {
  if (!isBrowser()) return false;
  try {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Obtiene el CLIENT_ID del entorno
 * Solo accede a window si estamos en browser
 */
function getClientIdFromEnvironment(): string {
  // Si no estamos en browser, devolver default
  if (!isBrowser()) {
    return 'masajecorporaldeportivo';
  }
  
  // En desarrollo local, siempre usar el cliente por defecto
  // (ng serve no inyecta __CLIENT_ID)
  if (isLocalDevelopment()) {
    devLog('[Config] Desarrollo local detectado, usando cliente: masajecorporaldeportivo');
    return 'masajecorporaldeportivo';
  }
  
  // En producción, intentar obtener el CLIENT_ID inyectado
  try {
    const windowClientId = (window as any).__CLIENT_ID;
    if (typeof windowClientId === 'string' && windowClientId.length > 0) {
      return windowClientId;
    }
  } catch {
    // Ignorar errores de acceso a window
  }
  
  return 'masajecorporaldeportivo';
}

/**
 * Cache para la configuracion del cliente
 * Evita recalcular en cada acceso
 */
let _cachedConfig: ClientConfig | null = null;

/**
 * Carga la configuracion del cliente
 * Es lazy y SSR-safe
 */
export function loadClientConfig(): ClientConfig {
  // Si ya tenemos cache, devolverlo
  if (_cachedConfig) {
    return _cachedConfig;
  }
  
  const clientId = getClientIdFromEnvironment();
  
  // Buscar configuracion del cliente
  const config = CLIENT_CONFIGS[clientId];
  
  if (config) {
    if (isBrowser()) {
      devLog(`[Config] Configuracion cargada para cliente: ${clientId}`);
    }
    _cachedConfig = config;
    return config;
  }
  
  // Fallback: si el cliente no existe, usar default
  devWarn(`[Config] Cliente '${clientId}' no encontrado, usando masajecorporaldeportivo`);
  _cachedConfig = masajecorporaldeportivoConfig;
  return masajecorporaldeportivoConfig;
}

/**
 * Configuracion activa de la aplicacion
 * NOTA: Esta constante es lazy - la configuracion real se carga
 * la primera vez que se accede via loadClientConfig()
 * 
 * En SSR siempre devuelve la configuracion por defecto
 */
export const APP_CONFIG: ClientConfig = masajecorporaldeportivoConfig;

/**
 * Obtiene la configuracion actual (usar esto en servicios Angular)
 * Esta funcion es SSR-safe y devuelve la configuracion correcta en browser
 */
export function getAppConfig(): ClientConfig {
  return loadClientConfig();
}

/**
 * Lista de todos los clientes disponibles (util para debugging)
 */
export const AVAILABLE_CLIENTS = Object.keys(CLIENT_CONFIGS);

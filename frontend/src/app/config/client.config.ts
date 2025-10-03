/**
 * Configuración específica por cliente
 * Cada cliente tiene su propia configuración que se carga según VITE_CLIENT_ID
 */

export interface ClientConfig {
  // Identificación del cliente
  clientId: string;
  
  // Branding
  appName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  
  // Base de datos (Supabase)
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // API Backend
  apiUrl: string;
  
  // Información de la clínica (valores por defecto)
  defaultClinicInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

// ========================================
// CONFIGURACIONES POR CLIENTE
// ========================================

const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  // Cliente 1: Masaje Corporal Deportivo (actual)
  'masajecorporaldeportivo': {
    clientId: 'masajecorporaldeportivo',
    appName: 'Masaje Corporal Deportivo',
    logoUrl: '/assets/logo-masaje.png',
    faviconUrl: '/favicon-masaje.ico',
    primaryColor: '#0066cc',
    supabaseUrl: 'https://nnfxzgvplvavgdfmgrrb.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZnh6Z3ZwbHZhdmdkZm1ncnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MjgzMDQsImV4cCI6MjA1MzMwNDMwNH0.nEVlE8MJOlBcEqPIDcD3Y8L6gGIMNn5EInBFAkmzIQQ',
    apiUrl: 'https://clinic-backend-qha5apm2u-davids-projects-8fa96e54.vercel.app/api',
    defaultClinicInfo: {
      name: 'Masaje Corporal Deportivo',
      address: '',
      phone: '',
      email: ''
    }
  },
  
  // Cliente 2: Ejemplo (plantilla para nuevos clientes)
  'fisioterapia-ejemplo': {
    clientId: 'fisioterapia-ejemplo',
    appName: 'Fisioterapia Ejemplo',
    logoUrl: '/assets/logo-fisio.png',
    faviconUrl: '/favicon-fisio.ico',
    primaryColor: '#00aa66',
    supabaseUrl: 'https://TU_PROYECTO.supabase.co',
    supabaseAnonKey: 'TU_ANON_KEY',
    apiUrl: 'https://fisioterapia-ejemplo-api.vercel.app/api',
    defaultClinicInfo: {
      name: 'Fisioterapia Ejemplo',
      address: 'Calle Ejemplo 123',
      phone: '912345678',
      email: 'info@fisio-ejemplo.com'
    }
  }
};

// ========================================
// DETECTAR CLIENTE ACTIVO
// ========================================

/**
 * Obtiene el ID del cliente actual desde variables de entorno
 * En desarrollo: se puede cambiar manualmente aquí
 * En producción: se define en el código antes del build
 */
function getCurrentClientId(): string {
  // CONFIGURACIÓN: Cambiar esto al hacer build para cada cliente
  // En Vercel, usa el hook de build para reemplazar este valor
  const clientId = 'masajecorporaldeportivo';  // <-- Cambiar según el cliente
  
  if (clientId && CLIENT_CONFIGS[clientId]) {
    return clientId;
  }
  
  // Fallback al cliente por defecto
  console.warn('⚠️ Cliente no configurado, usando por defecto');
  return 'masajecorporaldeportivo';
}

/**
 * Configuración del cliente actual
 * Esta es la única variable que necesitas importar en tu app
 */
export const CURRENT_CLIENT_CONFIG: ClientConfig = CLIENT_CONFIGS[getCurrentClientId()];

/**
 * Helper para verificar si la configuración está correctamente cargada
 */
export function validateClientConfig(): void {
  const config = CURRENT_CLIENT_CONFIG;
  
  if (!config.supabaseUrl || config.supabaseUrl.includes('TU_PROYECTO')) {
    console.error('❌ Configuración de Supabase no válida para cliente:', config.clientId);
    throw new Error('Configuración de cliente incompleta. Revisa client.config.ts');
  }
  
  console.log('✅ Cliente cargado:', config.clientId, '-', config.appName);
}

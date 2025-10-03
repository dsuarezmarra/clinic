import { ClientConfig } from '../client-config.interface';

/**
 * Configuración del Cliente: Masaje Corporal Deportivo
 * Tema: Azul/Morado
 */
export const masajecorporaldeportivoConfig: ClientConfig = {
  // Identificador único para el backend (X-Tenant-Slug)
  tenantSlug: 'masajecorporaldeportivo',
  
  // Información de la clínica
  info: {
    name: 'Masaje Corporal Deportivo',
    shortName: 'MCD',
    phone: '+34 XXX XXX XXX',  // TODO: Actualizar con teléfono real
    email: 'info@masajecorporaldeportivo.com',
    address: 'Calle Ejemplo, 123',  // TODO: Actualizar con dirección real
    city: 'Madrid',
    postalCode: '28001',
    province: 'Madrid',
    website: 'https://masajecorporaldeportivo.com',
    socialMedia: {
      facebook: 'https://facebook.com/masajecorporaldeportivo',
      instagram: 'https://instagram.com/masajecorporaldeportivo'
    }
  },
  
  // Tema visual: Azul y Morado (actual)
  theme: {
    primary: '#667eea',        // Azul
    secondary: '#764ba2',      // Morado
    accent: '#48c774',         // Verde de acento
    headerGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    buttonColor: '#667eea',
    buttonHover: '#5a6fd8'
  },
  
  // Rutas de assets
  assets: {
    logo: 'assets/clients/masajecorporaldeportivo/logo.png',
    favicon: 'assets/clients/masajecorporaldeportivo/favicon.ico',
    appleTouchIcon: 'assets/clients/masajecorporaldeportivo/apple-touch-icon.png'
  },
  
  // Configuración de backend (API compartida)
  backend: {
    apiUrl: 'http://localhost:3000/api'  // Desarrollo local
    // apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api'  // Producción
  },
  
  // Configuración de PWA
  pwa: {
    name: 'Masaje Corporal Deportivo',
    shortName: 'MCD',
    description: 'Gestión de citas y pacientes para Masaje Corporal Deportivo',
    themeColor: '#667eea',
    backgroundColor: '#ffffff'
  }
};

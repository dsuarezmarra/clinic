import { ClientConfig } from '../client-config.interface';

// Detectar si estamos en desarrollo local
const isLocalDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/**
 * Configuración del Cliente: Actifisio
 * Tema: Naranja/Amarillo
 */
export const actifisioConfig: ClientConfig = {
  // Identificador único para el backend (X-Tenant-Slug)
  tenantSlug: 'actifisio',
  
  // Información de la clínica
  info: {
    name: 'Actifisio',
    shortName: 'Actifisio',
    phone: '+34 YYY YYY YYY',  // TODO: Actualizar con teléfono real del cliente
    email: 'contacto@actifisio.com',
    address: 'Avenida Principal, 456',  // TODO: Actualizar con dirección real
    city: 'Barcelona',
    postalCode: '08001',
    province: 'Barcelona',
    website: 'https://actifisio.com',
    socialMedia: {
      instagram: 'https://instagram.com/actifisio'
    }
  },
  
  // Tema visual: Naranja y Amarillo
  theme: {
    primary: '#ff6b35',        // Naranja vibrante
    secondary: '#f7b731',      // Amarillo cálido
    accent: '#5f27cd',         // Morado oscuro de acento
    headerGradient: 'linear-gradient(135deg, #ff6b35 0%, #f7b731 100%)',
    buttonColor: '#ff6b35',
    buttonHover: '#e55a2b'
  },
  
  // Rutas de assets
  assets: {
    logo: 'assets/clients/actifisio/logo.png',
    favicon: 'assets/clients/actifisio/logo.png',  // Usar logo.png como favicon temporalmente
    appleTouchIcon: 'assets/clients/actifisio/logo.png'
  },
  
  // Configuración de backend (API compartida multi-tenant)
  // En desarrollo local usa localhost, en producción usa Vercel
  backend: {
    apiUrl: isLocalDev ? 'http://localhost:3000/api' : 'https://api-clinic-personal.vercel.app/api'
  },
  
  // Configuración de PWA
  pwa: {
    name: 'Actifisio',
    shortName: 'Actifisio',
    description: 'Sistema de gestión para centro de fisioterapia Actifisio',
    themeColor: '#ff6b35',
    backgroundColor: '#ffffff'
  }
};

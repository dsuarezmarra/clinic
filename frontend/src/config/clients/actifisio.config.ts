import { ClientConfig } from '../client-config.interface';

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
    favicon: 'assets/clients/actifisio/favicon.ico',
    appleTouchIcon: 'assets/clients/actifisio/apple-touch-icon.png'
  },
  
  // Configuración de backend (API compartida)
  backend: {
    apiUrl: 'http://localhost:3000/api'  // Desarrollo local
    // apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api'  // Producción
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

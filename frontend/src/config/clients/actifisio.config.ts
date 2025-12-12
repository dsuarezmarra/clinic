import { ClientConfig } from '../client-config.interface';

/**
 * Configuraci贸n del Cliente: Actifisio
 * Tema: Naranja/Amarillo
 */
export const actifisioConfig: ClientConfig = {
  // Identificador 煤nico para el backend (X-Tenant-Slug)
  tenantSlug: 'actifisio',
  
  // Informaci贸n de la cl铆nica
  info: {
    name: 'Actifisio',
    shortName: 'Actifisio',
    phone: '+34 YYY YYY YYY',  // TODO: Actualizar con tel茅fono real del cliente
    email: 'contacto@actifisio.com',
    address: 'Avenida Principal, 456',  // TODO: Actualizar con direcci贸n real
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
    secondary: '#f7b731',      // Amarillo c谩lido
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
  
  // Configuraci髇 de backend (API compartida multi-tenant)
  backend: {
    apiUrl: 'https://clinic-backend-nu.vercel.app/api'
  },
  
  // Configuraci贸n de PWA
  pwa: {
    name: 'Actifisio',
    shortName: 'Actifisio',
    description: 'Sistema de gesti贸n para centro de fisioterapia Actifisio',
    themeColor: '#ff6b35',
    backgroundColor: '#ffffff'
  }
};

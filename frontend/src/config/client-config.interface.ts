/**
 * Interfaz de configuración para sistema multi-cliente
 * Define la estructura de configuración que cada cliente debe implementar
 */

export interface ClientTheme {
  primary: string;        // Color primario (ej: #667eea azul, #ff6b35 naranja)
  secondary: string;      // Color secundario (ej: #764ba2 morado, #f7b731 amarillo)
  accent: string;         // Color de acento
  headerGradient: string; // Gradiente del header CSS
  buttonColor: string;    // Color de botones principales
  buttonHover: string;    // Color hover de botones
}

export interface ClientInfo {
  name: string;           // Nombre completo de la clínica
  shortName: string;      // Nombre corto (para título y header)
  phone: string;          // Teléfono de contacto
  email: string;          // Email de contacto
  address: string;        // Dirección física
  city: string;           // Ciudad
  postalCode: string;     // Código postal
  province: string;       // Provincia
  website?: string;       // Sitio web (opcional)
  socialMedia?: {         // Redes sociales (opcional)
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface ClientConfig {
  // Identificador único (slug para backend multi-tenant)
  tenantSlug: string;
  
  // Información de la clínica
  info: ClientInfo;
  
  // Tema visual
  theme: ClientTheme;
  
  // Rutas de assets
  assets: {
    logo: string;           // Ruta al logo (ej: 'assets/clients/masaje/logo.png')
    favicon: string;        // Ruta al favicon
    appleTouchIcon: string; // Icono para iOS
  };
  
  // Configuración de backend
  backend: {
    apiUrl: string;         // URL del backend API (compartido)
  };
  
  // Configuración de PWA
  pwa: {
    name: string;           // Nombre completo de la PWA
    shortName: string;      // Nombre corto (max 12 caracteres)
    description: string;    // Descripción de la app
    themeColor: string;     // Color del tema (para Android)
    backgroundColor: string; // Color de fondo de splash screen
  };
}

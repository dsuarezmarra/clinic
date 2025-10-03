import { Injectable } from '@angular/core';
import { ClientConfig, ClientInfo, ClientTheme } from '../../config/client-config.interface';
import { APP_CONFIG } from '../../config/config.loader';

/**
 * Servicio de configuración multi-cliente
 * Proporciona acceso a la configuración del cliente actual (tenantSlug, tema, info, etc.)
 * 
 * Este servicio es diferente a ConfigService que maneja la configuración de horarios/precios.
 * Este servicio maneja la configuración visual y de identidad del cliente.
 */
@Injectable({
  providedIn: 'root'
})
export class ClientConfigService {
  private config: ClientConfig = APP_CONFIG;

  constructor() {
    console.log('🏢 ClientConfigService inicializado');
    console.log('   Cliente:', this.config.info.name);
    console.log('   Tenant Slug:', this.config.tenantSlug);
    console.log('   Tema primario:', this.config.theme.primary);
  }

  /**
   * Obtiene la configuración completa del cliente
   */
  getConfig(): ClientConfig {
    return this.config;
  }

  /**
   * Obtiene el tenant slug (identificador para el backend)
   */
  getTenantSlug(): string {
    return this.config.tenantSlug;
  }

  /**
   * Obtiene la URL del backend API
   */
  getApiUrl(): string {
    return this.config.backend.apiUrl;
  }

  /**
   * Obtiene el tema visual del cliente
   */
  getTheme(): ClientTheme {
    return this.config.theme;
  }

  /**
   * Obtiene la información del cliente (nombre, dirección, contacto, etc.)
   */
  getClientInfo(): ClientInfo {
    return this.config.info;
  }

  /**
   * Obtiene las rutas de assets (logo, favicon, etc.)
   */
  getAssets() {
    return this.config.assets;
  }

  /**
   * Obtiene la configuración de PWA
   */
  getPwaConfig() {
    return this.config.pwa;
  }

  /**
   * Aplica los colores del tema al documento usando CSS variables
   * Debe llamarse en app.component.ts al iniciar la aplicación
   */
  applyTheme(): void {
    const theme = this.config.theme;
    const root = document.documentElement;

    // Definir CSS variables en :root
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--secondary-color', theme.secondary);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--header-gradient', theme.headerGradient);
    root.style.setProperty('--button-color', theme.buttonColor);
    root.style.setProperty('--button-hover', theme.buttonHover);

    console.log('🎨 Tema aplicado:', {
      primary: theme.primary,
      secondary: theme.secondary,
      gradient: theme.headerGradient
    });
  }

  /**
   * Actualiza el título de la página con el nombre corto del cliente
   */
  setPageTitle(suffix?: string): void {
    const title = suffix 
      ? `${this.config.info.shortName} - ${suffix}`
      : this.config.info.shortName;
    
    document.title = title;
  }

  /**
   * Actualiza el favicon de la página
   */
  setFavicon(): void {
    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = this.config.assets.favicon;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  /**
   * Obtiene el header HTTP para multi-tenant (X-Tenant-Slug)
   * Usar en servicios HTTP que necesiten identificar al cliente
   */
  getTenantHeader(): { [key: string]: string } {
    return {
      'X-Tenant-Slug': this.config.tenantSlug
    };
  }
}

import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, isDevMode, PLATFORM_ID } from '@angular/core';
import { ClientConfig, ClientInfo, ClientTheme } from '../../config/client-config.interface';
import { getAppConfig } from '../../config/config.loader';

/**
 * Servicio de configuracion multi-cliente
 * Proporciona acceso a la configuracion del cliente actual (tenantSlug, tema, info, etc.)
 * 
 * Este servicio es diferente a ConfigService que maneja la configuracion de horarios/precios.
 * Este servicio maneja la configuracion visual y de identidad del cliente.
 */
@Injectable({
  providedIn: 'root'
})
export class ClientConfigService {
  private config: ClientConfig;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Cargar configuracion de forma SSR-safe
    this.config = getAppConfig();
    
    // Logs solo en desarrollo
    if (this.isBrowser && isDevMode()) {
      console.log('[ClientConfigService] Inicializado');
      console.log('   Cliente:', this.config.info.name);
      console.log('   Tenant Slug:', this.config.tenantSlug);
    }
  }

  /**
   * Obtiene la configuracion completa del cliente
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
   * Obtiene la informacion del cliente
   */
  getClientInfo(): ClientInfo {
    return this.config.info;
  }

  /**
   * Obtiene los assets (logo, iconos)
   */
  getAssets(): ClientConfig['assets'] {
    return this.config.assets;
  }

  /**
   * Obtiene el header HTTP necesario para identificar el tenant
   * Este header debe incluirse en todas las peticiones HTTP al backend
   */
  getTenantHeader(): { [key: string]: string } {
    return {
      'X-Tenant-Slug': this.config.tenantSlug
    };
  }

  /**
   * Aplica el tema del cliente al documento
   * Establece las variables CSS customizables
   */
  applyTheme(): void {
    // Solo aplicar tema en browser
    if (!this.isBrowser) {
      return;
    }

    const theme = this.config.theme;
    const root = document.documentElement;

    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--secondary-color', theme.secondary);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--header-gradient', theme.headerGradient);
    root.style.setProperty('--button-color', theme.buttonColor);
    root.style.setProperty('--button-hover', theme.buttonHover);

    // Log solo en desarrollo
    if (isDevMode()) {
      console.log('[ClientConfigService] Tema aplicado:', theme.primary);
    }
  }

  /**
   * Actualiza el titulo de la pagina con el nombre del cliente
   */
  setPageTitle(suffix?: string): void {
    // Solo en browser
    if (!this.isBrowser) {
      return;
    }

    const baseTitle = this.config.info.name;
    document.title = suffix ? `${suffix} | ${baseTitle}` : baseTitle;
  }

  /**
   * Actualiza el favicon con el logo del cliente
   */
  setFavicon(): void {
    // Solo en browser
    if (!this.isBrowser) {
      return;
    }

    const existingFavicon = document.querySelector('link[rel="icon"]');
    if (existingFavicon) {
      existingFavicon.setAttribute('href', this.config.assets.logo);
    } else {
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = this.config.assets.logo;
      document.head.appendChild(favicon);
    }
  }
}

import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor HTTP para agregar automáticamente el header X-Tenant-Slug
 * a todas las peticiones al backend.
 * 
 * Detecta el tenant desde:
 * 1. La URL del navegador (ej: masajecorporaldeportivo.vercel.app -> slug: masajecorporaldeportivo)
 * 2. Variable de entorno VITE_CLIENT_ID (fallback)
 * 3. Configuración del cliente (último fallback)
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo agregar header a peticiones a nuestro backend API
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // Obtener tenant slug desde diferentes fuentes
  const tenantSlug = getTenantSlug();
  
  if (!tenantSlug) {
    console.warn('[TenantInterceptor] No se pudo detectar tenant slug');
    return next(req);
  }

  // Clonar request y agregar header X-Tenant-Slug
  const clonedRequest = req.clone({
    setHeaders: {
      'X-Tenant-Slug': tenantSlug
    }
  });

  console.log(`[TenantInterceptor] Agregando header X-Tenant-Slug: ${tenantSlug}`);
  
  return next(clonedRequest);
};

/**
 * Detecta el tenant slug desde la URL del navegador o configuración
 */
function getTenantSlug(): string {
  // 1. PRIORIDAD MÁXIMA: Usar window.__CLIENT_ID inyectado en el HTML
  // Este valor se inyecta en tiempo de build para cada cliente
  const injectedClientId = (window as any).__CLIENT_ID;
  if (injectedClientId && typeof injectedClientId === 'string') {
    return injectedClientId;
  }

  // 2. Intentar desde variable de entorno de Vite (desarrollo)
  const envClientId = getClientIdFromEnv();
  if (envClientId && envClientId !== 'masajecorporaldeportivo') {
    return envClientId;
  }

  // 3. Intentar desde hostname de la URL actual
  const hostname = window.location.hostname;
  
  // Casos comunes:
  // - masajecorporaldeportivo.vercel.app -> masajecorporaldeportivo
  // - actifisio.vercel.app -> actifisio
  // - localhost -> usar VITE_CLIENT_ID
  
  if (hostname.includes('.vercel.app')) {
    // Extraer primera parte del dominio
    const parts = hostname.split('.');
    const firstPart = parts[0];
    
    // Si es un deployment temporal de Vercel (browser-xyz, clinic-frontend-xyz),
    // NO usar como tenant slug, usar el inyectado
    if (firstPart.startsWith('clinic-frontend') || 
        firstPart.startsWith('browser') || 
        firstPart.includes('-') && firstPart.split('-').length > 2) {
      // Es un deployment temporal, usar variable de entorno
      return getClientIdFromEnv();
    }
    
    // Si es un dominio personalizado, usar la primera parte como slug
    // Ej: masajecorporaldeportivo.vercel.app -> masajecorporaldeportivo
    //     actifisio.vercel.app -> actifisio
    return firstPart;
  }
  
  // 4. Para localhost, usar VITE_CLIENT_ID
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return getClientIdFromEnv();
  }
  
  // 5. Para otros dominios, intentar extraer de la URL
  // Ej: www.clinica-juan.com -> clinica-juan
  const domainWithoutWww = hostname.replace('www.', '');
  const domainParts = domainWithoutWww.split('.');
  
  if (domainParts.length > 0) {
    return domainParts[0];
  }
  
  // 6. Último fallback: variable de entorno
  return getClientIdFromEnv();
}

/**
 * Obtiene el CLIENT_ID desde variables de entorno de Vite
 */
function getClientIdFromEnv(): string {
  // @ts-ignore - import.meta.env es proporcionado por Vite
  return import.meta.env?.VITE_CLIENT_ID || 'masajecorporaldeportivo';
}

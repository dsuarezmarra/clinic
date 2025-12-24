import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor HTTP para agregar automáticamente el header X-Tenant-Slug
 * a todas las peticiones al backend.
 * 
 * Detecta el tenant desde:
 * 1. La URL del navegador (ej: masajecorporaldeportivo.vercel.app -> slug: masajecorporaldeportivo)
 * 2. Variable window.__CLIENT_ID inyectada en el HTML
 * 3. Default: masajecorporaldeportivo
 * 
 * [Actualizado: 24/12/2025] - Fix para desarrollo local
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
 * Detecta el tenant slug desde la URL del navegador o configuracion
 */
function getTenantSlug(): string {
  const hostname = window.location.hostname;
  
  // DESARROLLO LOCAL: Siempre usar masajecorporaldeportivo
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('[TenantInterceptor] Desarrollo local detectado');
    return 'masajecorporaldeportivo';
  }
  
  // 1. PRIORIDAD MAXIMA: Usar window.__CLIENT_ID inyectado en el HTML
  // Este valor se inyecta en tiempo de build para cada cliente
  const injectedClientId = (window as any).__CLIENT_ID;
  if (injectedClientId && typeof injectedClientId === 'string' && !injectedClientId.includes('__')) {
    return injectedClientId;
  }

  // 2. Intentar desde hostname de la URL actual
  // Casos comunes:
  // - masajecorporaldeportivo.vercel.app -> masajecorporaldeportivo
  // - actifisio.vercel.app -> actifisio
  
  if (hostname.includes('.vercel.app')) {
    // Extraer primera parte del dominio
    const parts = hostname.split('.');
    const firstPart = parts[0];
    
    // Si es un deployment temporal de Vercel (browser-xyz, clinic-frontend-xyz),
    // NO usar como tenant slug, usar el default
    if (firstPart.startsWith('clinic-frontend') || 
        firstPart.startsWith('browser') || 
        firstPart.includes('-') && firstPart.split('-').length > 2) {
      return 'masajecorporaldeportivo';
    }
    
    // Si es un dominio personalizado, usar la primera parte como slug
    return firstPart;
  }
  
  // 3. Para otros dominios, intentar extraer de la URL
  // Ej: www.clinica-juan.com -> clinica-juan
  const domainWithoutWww = hostname.replace('www.', '');
  const domainParts = domainWithoutWww.split('.');
  
  if (domainParts.length > 0 && domainParts[0] !== '') {
    return domainParts[0];
  }
  
  // Ultimo fallback
  return 'masajecorporaldeportivo';
}

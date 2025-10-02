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
  // 1. Intentar desde hostname de la URL actual
  const hostname = window.location.hostname;
  
  // Casos comunes:
  // - masajecorporaldeportivo.vercel.app -> masajecorporaldeportivo
  // - clinic-frontend-xyz.vercel.app -> usar VITE_CLIENT_ID
  // - localhost -> usar VITE_CLIENT_ID
  
  if (hostname.includes('.vercel.app')) {
    // Extraer primera parte del dominio
    const parts = hostname.split('.');
    const firstPart = parts[0];
    
    // Si es un deployment de Vercel tipo "clinic-frontend-xyz", usar variable de entorno
    if (firstPart.startsWith('clinic-frontend')) {
      return getClientIdFromEnv();
    }
    
    // Si es un dominio personalizado, usar la primera parte como slug
    // Ej: masajecorporaldeportivo.vercel.app -> masajecorporaldeportivo
    return firstPart;
  }
  
  // 2. Para localhost o dominios personalizados, usar VITE_CLIENT_ID
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return getClientIdFromEnv();
  }
  
  // 3. Para otros dominios, intentar extraer de la URL
  // Ej: www.clinica-juan.com -> clinica-juan
  const domainWithoutWww = hostname.replace('www.', '');
  const domainParts = domainWithoutWww.split('.');
  
  if (domainParts.length > 0) {
    return domainParts[0];
  }
  
  // 4. Último fallback: variable de entorno
  return getClientIdFromEnv();
}

/**
 * Obtiene el CLIENT_ID desde variables de entorno de Vite
 */
function getClientIdFromEnv(): string {
  // @ts-ignore - import.meta.env es proporcionado por Vite
  return import.meta.env?.VITE_CLIENT_ID || 'masajecorporaldeportivo';
}

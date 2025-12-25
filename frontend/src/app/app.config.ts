import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEs from '@angular/common/locales/es';
import { ApplicationConfig, LOCALE_ID, isDevMode } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { EncodingInterceptor } from './interceptors/encoding.interceptor';
import { tenantInterceptor } from './interceptors/tenant.interceptor';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(
      withFetch(),
      withInterceptors([tenantInterceptor])  // Solo tenant interceptor (sin auth)
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EncodingInterceptor,
      multi: true
    },
    { provide: LOCALE_ID, useValue: 'es' },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Registrar inmediatamente para evitar bloqueos en PWA
      registrationStrategy: 'registerImmediately'
    })
  ]
};

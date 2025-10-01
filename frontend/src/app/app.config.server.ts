import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch } from '@angular/common/http';
import localeEs from '@angular/common/locales/es';
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { EncodingInterceptor } from './interceptors/encoding.interceptor';

// Server-specific application config: replicate necessary providers from the client
// config but do NOT include provideClientHydration() here. Add provideServerRendering()
// as the server rendering provider to avoid duplicate provider registration.
export const config: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EncodingInterceptor,
      multi: true
    },
    { provide: LOCALE_ID, useValue: 'es' },
    provideServerRendering()
  ]
};

// Registrar datos de localización para español en el entorno de servidor
registerLocaleData(localeEs);

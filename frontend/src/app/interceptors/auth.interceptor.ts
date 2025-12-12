import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP que agrega el token JWT de Supabase Auth
 * a todas las peticiones al backend API.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Solo agregar token a peticiones a nuestra API
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // Obtener el token de forma asíncrona
  return from(authService.getAccessToken()).pipe(
    switchMap(token => {
      let clonedRequest = req;

      if (token) {
        // Clonar la petición y agregar el header Authorization
        clonedRequest = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('[AuthInterceptor] Added Authorization header');
      } else {
        console.log('[AuthInterceptor] No token available');
      }

      return next(clonedRequest);
    }),
    catchError((error: HttpErrorResponse) => {
      // Si el servidor responde con 401, cerrar sesión y redirigir a login
      if (error.status === 401) {
        console.log('[AuthInterceptor] 401 Unauthorized - logging out');
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { sessionExpired: 'true' }
        });
      }

      return throwError(() => error);
    })
  );
};

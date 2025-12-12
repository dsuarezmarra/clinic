import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guard que protege rutas que requieren autenticación.
 * Redirige a /login si el usuario no está autenticado.
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que termine de cargar la autenticación
  return authService.isLoading$.pipe(
    filter(isLoading => !isLoading), // Esperar hasta que no esté cargando
    take(1),
    map(() => {
      if (authService.isAuthenticated()) {
        console.log('[AuthGuard] User authenticated, allowing access to:', state.url);
        return true;
      }

      console.log('[AuthGuard] User not authenticated, redirecting to login');
      
      // Guardar la URL intentada para redirigir después del login
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      
      return false;
    })
  );
};

/**
 * Guard que evita acceder a /login si ya está autenticado.
 * Redirige a /inicio si el usuario ya está logueado.
 */
export const noAuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoading$.pipe(
    filter(isLoading => !isLoading),
    take(1),
    map(() => {
      if (!authService.isAuthenticated()) {
        console.log('[NoAuthGuard] User not authenticated, allowing access to login');
        return true;
      }

      console.log('[NoAuthGuard] User already authenticated, redirecting to inicio');
      router.navigate(['/inicio']);
      return false;
    })
  );
};

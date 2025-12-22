import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { ClientConfigService } from './client-config.service';

export interface AuthUser {
  id: string;
  email: string;
  tenantSlug: string;
  displayName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(true);

  // Observable público para el usuario actual
  currentUser$ = this.currentUserSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  // URLs de Supabase (las mismas que usa el backend) - Cuenta Personal
  private readonly SUPABASE_URL = 'https://kctoxebchyrgkwofdkht.supabase.co';
  private readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdG94ZWJjaHlyZ2t3b2Zka2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTgxNDYsImV4cCI6MjA4MTk5NDE0Nn0.WAvvg89qBQ_APPR4TKeVMd9ARBn2tbkRoW3kVLCOTJ0';

  constructor(
    private router: Router,
    private clientConfig: ClientConfigService
  ) {
    // Inicializar cliente Supabase con la anon key (para auth)
    this.supabase = createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    });

    // Verificar sesión existente al cargar
    this.initializeAuth();
  }

  /**
   * Inicializa la autenticación verificando si hay una sesión guardada
   */
  private async initializeAuth(): Promise<void> {
    try {
      this.isLoadingSubject.next(true);

      // Obtener sesión actual
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('[AuthService] Error getting session:', error);
        this.currentUserSubject.next(null);
        return;
      }

      if (session?.user) {
        const authUser = this.mapUserToAuthUser(session.user);
        this.currentUserSubject.next(authUser);
        console.log('[AuthService] Session restored for:', authUser.email);
      } else {
        this.currentUserSubject.next(null);
        console.log('[AuthService] No existing session');
      }

      // Escuchar cambios de autenticación
      this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AuthService] Auth state changed:', event);
        
        if (session?.user) {
          const authUser = this.mapUserToAuthUser(session.user);
          this.currentUserSubject.next(authUser);
        } else {
          this.currentUserSubject.next(null);
        }
      });

    } catch (error) {
      console.error('[AuthService] Init error:', error);
      this.currentUserSubject.next(null);
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  /**
   * Login con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Attempting login for:', credentials.email);

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('[AuthService] Login error:', error);
        return {
          success: false,
          message: this.translateAuthError(error.message)
        };
      }

      if (!data.user) {
        return {
          success: false,
          message: 'No se pudo obtener información del usuario'
        };
      }

      // Verificar que el usuario pertenece al tenant actual
      const tenantSlug = this.clientConfig.getTenantSlug();
      const userTenant = data.user.user_metadata?.['tenant_slug'];

      if (userTenant && userTenant !== tenantSlug) {
        // Usuario no pertenece a este tenant
        await this.supabase.auth.signOut();
        return {
          success: false,
          message: 'Este usuario no tiene acceso a esta clínica'
        };
      }

      const authUser = this.mapUserToAuthUser(data.user);
      this.currentUserSubject.next(authUser);

      console.log('[AuthService] Login successful:', authUser.email);

      return {
        success: true,
        message: 'Inicio de sesión exitoso',
        user: authUser
      };

    } catch (error: any) {
      console.error('[AuthService] Unexpected login error:', error);
      return {
        success: false,
        message: 'Error inesperado al iniciar sesión'
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
      console.log('[AuthService] Logout successful');
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
    }
  }

  /**
   * Solicitar recuperación de contraseña por email
   */
  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return {
          success: false,
          message: this.translateAuthError(error.message)
        };
      }

      return {
        success: true,
        message: 'Se ha enviado un email con las instrucciones para restablecer tu contraseña'
      };

    } catch (error) {
      console.error('[AuthService] Password reset error:', error);
      return {
        success: false,
        message: 'Error al solicitar recuperación de contraseña'
      };
    }
  }

  /**
   * Actualizar contraseña (cuando el usuario hace clic en el link del email)
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          success: false,
          message: this.translateAuthError(error.message)
        };
      }

      return {
        success: true,
        message: 'Contraseña actualizada correctamente'
      };

    } catch (error) {
      console.error('[AuthService] Update password error:', error);
      return {
        success: false,
        message: 'Error al actualizar la contraseña'
      };
    }
  }

  /**
   * Obtener el token JWT actual para las peticiones al backend
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('[AuthService] Error getting access token:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Obtener usuario actual (síncrono)
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Mapear usuario de Supabase a AuthUser
   */
  private mapUserToAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      tenantSlug: user.user_metadata?.['tenant_slug'] || this.clientConfig.getTenantSlug(),
      displayName: user.user_metadata?.['display_name'] || user.email?.split('@')[0]
    };
  }

  /**
   * Traducir errores de Supabase Auth al español
   */
  private translateAuthError(message: string): string {
    const translations: Record<string, string> = {
      'Invalid login credentials': 'Email o contraseña incorrectos',
      'Email not confirmed': 'Debes confirmar tu email antes de iniciar sesión',
      'User not found': 'Usuario no encontrado',
      'Invalid email or password': 'Email o contraseña incorrectos',
      'Too many requests': 'Demasiados intentos. Espera unos minutos',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
      'User already registered': 'Este email ya está registrado',
      'Network error': 'Error de conexión. Verifica tu internet'
    };

    return translations[message] || message;
  }
}

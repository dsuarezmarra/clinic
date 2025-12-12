import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService, LoginCredentials } from '../../services/auth.service';
import { ClientConfigService } from '../../services/client-config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Formulario de login
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };

  // Estados
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showForgotPassword = false;
  forgotPasswordEmail = '';
  showPassword = false;
  currentYear = new Date().getFullYear();

  // ReturnUrl para redirigir después del login
  private returnUrl = '/inicio';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public clientConfig: ClientConfigService
  ) {}

  ngOnInit(): void {
    // Aplicar tema del cliente
    this.clientConfig.applyTheme();
    this.clientConfig.setPageTitle('Iniciar Sesión');

    // Obtener returnUrl de los query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/inicio';

    // Mostrar mensaje si la sesión expiró
    if (this.route.snapshot.queryParams['sessionExpired'] === 'true') {
      this.errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }
  }

  /**
   * Iniciar sesión
   */
  async onLogin(): Promise<void> {
    // Validar campos
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await this.authService.login(this.credentials);

      if (response.success) {
        console.log('[LoginComponent] Login successful, redirecting to:', this.returnUrl);
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.errorMessage = response.message;
      }
    } catch (error: any) {
      console.error('[LoginComponent] Login error:', error);
      this.errorMessage = 'Error al iniciar sesión. Inténtalo de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Mostrar formulario de recuperar contraseña
   */
  toggleForgotPassword(): void {
    this.showForgotPassword = !this.showForgotPassword;
    this.errorMessage = '';
    this.successMessage = '';
    this.forgotPasswordEmail = this.credentials.email; // Pre-rellenar con el email si ya lo escribió
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async onForgotPassword(): Promise<void> {
    if (!this.forgotPasswordEmail) {
      this.errorMessage = 'Por favor, introduce tu email';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await this.authService.requestPasswordReset(this.forgotPasswordEmail);

      if (response.success) {
        this.successMessage = response.message;
        // Volver al formulario de login después de unos segundos
        setTimeout(() => {
          this.showForgotPassword = false;
          this.successMessage = '';
        }, 5000);
      } else {
        this.errorMessage = response.message;
      }
    } catch (error) {
      console.error('[LoginComponent] Forgot password error:', error);
      this.errorMessage = 'Error al solicitar recuperación de contraseña';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Alternar visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Obtener nombre del cliente para mostrar en el login
   */
  getClientName(): string {
    return this.clientConfig.getClientInfo().name;
  }

  /**
   * Obtener logo del cliente
   */
  getLogoUrl(): string {
    return this.clientConfig.getAssets().logo;
  }
}

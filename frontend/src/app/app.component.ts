import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ClientConfigService } from './services/client-config.service';
import { PwaUpdateService } from './services/pwa-update.service';

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        RouterOutlet,
        RouterModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Masaje Corporal Deportivo';

  constructor(
    private router: Router,
    public clientConfig: ClientConfigService,
    public authService: AuthService,
    private pwaUpdateService: PwaUpdateService
  ) { }

  ngOnInit(): void {
    // Inicializar servicio de actualizaciones PWA
    // Esto evita que la app se congele cuando hay nuevas versiones
    this.pwaUpdateService.initialize();
    
    // Aplicar tema del cliente (colores, gradientes)
    this.clientConfig.applyTheme();
    
    // Actualizar titulo de la pagina con el nombre del cliente
    this.clientConfig.setPageTitle();
    
    // Actualizar favicon con el logo del cliente
    this.clientConfig.setFavicon();
    
    // Log de informacion del cliente cargado
    const clientInfo = this.clientConfig.getClientInfo();
    console.log('Cliente cargado:', clientInfo.name);
    console.log('Tema aplicado:', this.clientConfig.getTheme().primary);
    console.log('Tenant Slug:', this.clientConfig.getTenantSlug());
  }

  navigateToAgenda() {
    this.router.navigate(['/agenda']);
  }

  navigateToPacientes() {
    this.router.navigate(['/pacientes']);
  }

  navigateToConfiguracion() {
    this.router.navigate(['/configuracion']);
  }

  navigateToInicio() {
    this.router.navigate(['/inicio']);
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  /**
   * Cerrar sesion
   */
  async logout(): Promise<void> {
    await this.authService.logout();
  }

  /**
   * Verificar si esta en la pagina de login (para ocultar header)
   */
  isLoginPage(): boolean {
    return this.router.url.startsWith('/login') || this.router.url.startsWith('/reset-password');
  }
}

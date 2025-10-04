import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { ClientConfigService } from './services/client-config.service';

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
    public clientConfig: ClientConfigService  // ✅ Cambiado a public para usar en template
  ) { }

  ngOnInit(): void {
    // 🎨 Aplicar tema del cliente (colores, gradientes)
    this.clientConfig.applyTheme();
    
    // 📝 Actualizar título de la página con el nombre del cliente
    this.clientConfig.setPageTitle();
    
    // �️ Actualizar favicon con el logo del cliente
    this.clientConfig.setFavicon();
    
    // �📊 Log de información del cliente cargado
    const clientInfo = this.clientConfig.getClientInfo();
    console.log('🏢 Cliente cargado:', clientInfo.name);
    console.log('🎨 Tema aplicado:', this.clientConfig.getTheme().primary);
    console.log('🔑 Tenant Slug:', this.clientConfig.getTenantSlug());
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
}

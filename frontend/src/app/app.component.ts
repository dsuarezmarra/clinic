import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

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
export class AppComponent {
  title = 'Masaje Corporal Deportivo';

  constructor(private router: Router) { }

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

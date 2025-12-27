import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';

@Component({
    selector: 'app-inicio',
    standalone: true,
    imports: [CommonModule, DashboardComponent],
    templateUrl: './inicio.component.html',
    styleUrls: ['./inicio.component.scss']
})
export class InicioComponent {

    constructor(private router: Router) { }

    // Navegar a pacientes
    goToPatients() {
        this.router.navigate(['/pacientes']);
    }

    // Navegar al calendario
    goToCalendar() {
        this.router.navigate(['/agenda']);
    }

    // Navegar a configuración
    goToConfig() {
        this.router.navigate(['/configuracion']);
    }

    // Navegar a agenda
    goToAgenda() {
        this.router.navigate(['/agenda']);
    }

    // Navegar a configuración
    goToSettings() {
        this.router.navigate(['/configuracion']);
    }
}

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UtilsService {
    formatTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    formatDateTime(date: string | Date | null): string {
        if (!date) return 'Sin fecha';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleString('es-ES');
    }
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getCreditTypeLabel(type: string): string {
        return type === 'sesion' ? 'Sesión' : 'Bono';
    }

    getMinutesLabel(minutes: number): string {
        return `${minutes} minutos`;
    }
}

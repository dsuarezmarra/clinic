import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  showSuccess(message: string, duration = 3000): void {
    console.log('â Success:', message);
    // Solo usar alert si estamos en el navegador
    if (typeof window !== 'undefined') {
      alert(`â ${message}`);
    }
  }

  showError(message: string, duration = 5000): void {
    console.error('â Error:', message);
    // Solo usar alert si estamos en el navegador
    if (typeof window !== 'undefined') {
      alert(`â ${message}`);
    }
  }

  showWarning(message: string, duration = 4000): void {
    console.warn('â ï¸ Warning:', message);
    // Solo usar alert si estamos en el navegador
    if (typeof window !== 'undefined') {
      alert(`â ï¸ ${message}`);
    }
  }

  showInfo(message: string, duration = 3000): void {
    console.info('â¹ï¸ Info:', message);
    // AquÃ­ puedes implementar Bootstrap toasts o una notificaciÃ³n personalizada
    alert(`â¹ï¸ ${message}`);
  }
}

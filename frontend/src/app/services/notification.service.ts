import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  showSuccess(message: string, duration = 3000): void {
    console.log('✅ Success:', message);
    // Solo usar alert si estamos en el navegador
    if (typeof window !== 'undefined') {
      alert(`✅ ${message}`);
    }
  }

  showError(message: string, duration = 5000): void {
    console.error('❌ Error:', message);
    // Solo usar alert si estamos en el navegador
    if (typeof window !== 'undefined') {
      alert(`❌ ${message}`);
    }
  }

  showWarning(message: string, duration = 4000): void {
    console.warn('⚠️ Warning:', message);
    // Solo usar alert si estamos en el navegador
    if (typeof window !== 'undefined') {
      alert(`⚠️ ${message}`);
    }
  }

  showInfo(message: string, duration = 3000): void {
    console.info('ℹ️ Info:', message);
    // Aquí puedes implementar Bootstrap toasts o una notificación personalizada
    alert(`ℹ️ ${message}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ClientConfigService } from './client-config.service';

export interface WhatsAppReminder {
  id: string;
  dateTime: string;
  patientName: string;
  phone: string;
  whatsappReminders: boolean;
  // Campos calculados en el frontend
  formattedDate?: string;
  formattedTime?: string;
  message?: string;
  whatsappLink?: string;
}

export interface PendingRemindersResponse {
  totalAppointments: number;
  eligibleForReminder: number;
  appointments: WhatsAppReminder[];
}

@Injectable({
  providedIn: 'root'
})
export class WhatsAppReminderService {
  
  constructor(
    private http: HttpClient,
    private clientConfig: ClientConfigService
  ) {}

  private getTenantHeader(): { [key: string]: string } {
    return { 'X-Tenant-Slug': this.clientConfig.getTenantSlug() };
  }

  /**
   * Obtener recordatorios pendientes de enviar
   */
  getPendingReminders(): Observable<PendingRemindersResponse> {
    const apiUrl = this.clientConfig.getApiUrl();
    return this.http.get<PendingRemindersResponse>(
      `${apiUrl}/whatsapp-reminders/pending`,
      { headers: this.getTenantHeader() }
    ).pipe(
      map(response => {
        // Procesar cada recordatorio para agregar campos calculados
        response.appointments = response.appointments.map(apt => this.enrichReminder(apt));
        return response;
      })
    );
  }

  /**
   * Enriquecer un recordatorio con datos calculados
   */
  private enrichReminder(reminder: WhatsAppReminder): WhatsAppReminder {
    const dateTime = new Date(reminder.dateTime);
    
    // Formatear fecha y hora
    reminder.formattedDate = dateTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    
    reminder.formattedTime = dateTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Obtener solo el primer nombre
    const firstName = reminder.patientName.split(' ')[0];
    
    // Crear mensaje personalizado (sin emojis para compatibilidad)
    reminder.message = `Hola ${firstName}!\n\nTe recuerdo tu cita de masaje para el ${reminder.formattedDate} a las ${reminder.formattedTime}.\n\nSi necesitas cambiarla o no puedes venir, por favor escríbeme.\n\nGracias!`;
    
    // Crear enlace de WhatsApp Web directo
    const phoneFormatted = this.formatPhoneForWhatsApp(reminder.phone);
    reminder.whatsappLink = `https://web.whatsapp.com/send?phone=${phoneFormatted}&text=${encodeURIComponent(reminder.message)}`;
    
    return reminder;
  }

  /**
   * Formatear teléfono para WhatsApp (añadir prefijo español si es necesario)
   */
  private formatPhoneForWhatsApp(phone: string): string {
    if (!phone) return '';
    
    // Limpiar caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Si tiene 9 dígitos, añadir prefijo español
    if (cleaned.length === 9) {
      return '34' + cleaned;
    }
    
    // Si ya tiene prefijo, devolverlo tal cual
    if (cleaned.startsWith('34')) {
      return cleaned;
    }
    
    return cleaned;
  }

  /**
   * Obtener estado del sistema de recordatorios
   */
  getSystemStatus(): Observable<any> {
    const apiUrl = this.clientConfig.getApiUrl();
    return this.http.get(`${apiUrl}/whatsapp-reminders/status`);
  }
}

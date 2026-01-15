import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
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
  sent?: boolean; // Indica si ya se envió el recordatorio
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
  
  private readonly SENT_REMINDERS_KEY = 'whatsapp_sent_reminders';
  
  // Observable para notificar cambios en el contador
  private pendingCountSubject = new BehaviorSubject<number>(0);
  public pendingCount$ = this.pendingCountSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private clientConfig: ClientConfigService
  ) {
    // Limpiar recordatorios antiguos al iniciar
    this.cleanOldSentReminders();
  }

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
        const sentIds = this.getSentReminderIds();
        // Procesar cada recordatorio para agregar campos calculados
        response.appointments = response.appointments.map(apt => {
          const enriched = this.enrichReminder(apt);
          enriched.sent = sentIds.includes(apt.id);
          return enriched;
        });
        // Contar solo los no enviados
        const pendingCount = response.appointments.filter(apt => !apt.sent).length;
        response.eligibleForReminder = pendingCount;
        this.pendingCountSubject.next(pendingCount);
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
    // IMPORTANTE: Especificar timezone Europe/Madrid para garantizar hora correcta
    reminder.formattedDate = dateTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Madrid'
    });
    
    reminder.formattedTime = dateTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    });

    // Obtener solo el primer nombre
    const firstName = reminder.patientName.split(' ')[0];
    
    // Crear mensaje personalizado CON emojis (usando Unicode directamente)
    // Los emojis se codifican correctamente con encodeURIComponent
    const waveEmoji = '\u{1F44B}'; // 👋
    const calendarEmoji = '\u{1F4C5}'; // 📅
    const clockEmoji = '\u{1F552}'; // 🕒
    const starEmoji = '\u{2B50}'; // ⭐
    const thumbsUpEmoji = '\u{1F44D}'; // 👍
    
    reminder.message = `${waveEmoji} Hola ${firstName}!\n\n${calendarEmoji} Te recuerdo tu cita de masaje para el ${reminder.formattedDate} a las ${clockEmoji} ${reminder.formattedTime}.\n\nSi necesitas cambiarla o no puedes venir, por favor escríbeme.\n\n${starEmoji} Gracias! ${thumbsUpEmoji}`;
    
    // Crear enlace de WhatsApp Web directo
    const phoneFormatted = this.formatPhoneForWhatsApp(reminder.phone);
    reminder.whatsappLink = `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(reminder.message)}`;
    
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

  /**
   * Marcar un recordatorio como enviado
   */
  markAsSent(reminderId: string): void {
    const sentIds = this.getSentReminderIds();
    if (!sentIds.includes(reminderId)) {
      sentIds.push(reminderId);
      localStorage.setItem(this.SENT_REMINDERS_KEY, JSON.stringify({
        ids: sentIds,
        lastUpdated: new Date().toISOString()
      }));
      // Actualizar el contador
      const newCount = Math.max(0, this.pendingCountSubject.value - 1);
      this.pendingCountSubject.next(newCount);
    }
  }

  /**
   * Obtener IDs de recordatorios ya enviados
   */
  private getSentReminderIds(): string[] {
    try {
      const stored = localStorage.getItem(this.SENT_REMINDERS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.ids || [];
      }
    } catch (e) {
      console.error('Error reading sent reminders:', e);
    }
    return [];
  }

  /**
   * Limpiar recordatorios antiguos (más de 48 horas)
   */
  private cleanOldSentReminders(): void {
    try {
      const stored = localStorage.getItem(this.SENT_REMINDERS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const lastUpdated = new Date(data.lastUpdated);
        const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        // Si han pasado más de 48 horas, limpiar
        if (hoursSinceUpdate > 48) {
          localStorage.removeItem(this.SENT_REMINDERS_KEY);
        }
      }
    } catch (e) {
      console.error('Error cleaning old reminders:', e);
    }
  }

  /**
   * Verificar si un recordatorio ya fue enviado
   */
  isReminderSent(reminderId: string): boolean {
    return this.getSentReminderIds().includes(reminderId);
  }
}

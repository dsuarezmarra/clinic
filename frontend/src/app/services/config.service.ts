import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Configuration, WorkingDayInfo } from '../models/config.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private apiUrl = `${environment.apiUrl}/meta/config`;

  constructor(private http: HttpClient) { }

  // Obtener configuración
  getConfiguration(): Observable<Configuration> {
    return this.http.get<Configuration>(this.apiUrl);
  }

  // Alias para getConfiguration (para compatibilidad)
  getConfig(): Observable<Configuration> {
    return this.getConfiguration();
  }

  // Actualizar configuración
  updateConfiguration(config: Partial<Configuration>): Observable<Configuration> {
    return this.http.put<Configuration>(this.apiUrl, config);
  }

  // Restablecer configuración por defecto
  resetConfiguration(): Observable<{ message: string; config: Configuration }> {
    return this.http.post<{ message: string; config: Configuration }>(`${this.apiUrl}/reset`, {});
  }

  // Verificar si una fecha es laborable
  checkWorkingDay(date: string): Observable<WorkingDayInfo> {
    return this.http.get<WorkingDayInfo>(`${this.apiUrl}/working-hours/${date}`);
  }

  // Generar slots de tiempo para un día
  generateTimeSlots(date: string, workingDay: WorkingDayInfo, slotDuration = 30): string[] {
    if (!workingDay.isWorkingDay || !workingDay.workingHours) {
      return [];
    }

    const slots: string[] = [];
    const { morning, afternoon } = workingDay.workingHours;

    // Generar slots de la mañana
    this.addSlotsForPeriod(date, morning.start, morning.end, slotDuration, slots);

    // Generar slots de la tarde
    this.addSlotsForPeriod(date, afternoon.start, afternoon.end, slotDuration, slots);

    return slots;
  }

  private addSlotsForPeriod(date: string, startTime: string, endTime: string, slotDuration: number, slots: string[]): void {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    let current = new Date(start);

    while (current < end) {
      slots.push(current.toISOString());
      current = new Date(current.getTime() + slotDuration * 60000);
    }
  }

  // Verificar si un horario está dentro de las horas laborables
  isTimeWithinWorkingHours(dateTime: string, workingDay: WorkingDayInfo): boolean {
    if (!workingDay.isWorkingDay || !workingDay.workingHours) {
      return false;
    }

    const time = new Date(dateTime);
    const timeStr = time.toTimeString().substring(0, 5); // HH:mm
    const { morning, afternoon } = workingDay.workingHours;

    return (
      (timeStr >= morning.start && timeStr < morning.end) ||
      (timeStr >= afternoon.start && timeStr < afternoon.end)
    );
  }

  // ============================================================================
  // MÉTODOS PARA GESTIÓN DE PRECIOS
  // ============================================================================

  // Obtener precios actuales
  getPrices(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/meta/config/prices`);
  }

  // Actualizar precios
  updatePrices(prices: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/meta/config/prices`, prices);
  }
}

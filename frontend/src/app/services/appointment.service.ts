// ...existing code...
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
    Appointment,
    AppointmentConflictCheck,
    CreateAppointmentRequest,
    UpdateAppointmentRequest
} from '../models/appointment.model';
import { ClientConfigService } from './client-config.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl: string;
  private httpOptions: { headers: HttpHeaders };

  constructor(
    private http: HttpClient,
    private clientConfig: ClientConfigService
  ) {
    // Obtener URL del backend desde la configuración del cliente
    this.apiUrl = `${this.clientConfig.getApiUrl()}/appointments`;
    
    // Configurar headers incluyendo X-Tenant-Slug para multi-tenant
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...this.clientConfig.getTenantHeader()
      })
    };
  }

  // Obtener todas las citas sin filtrar por fecha
  getAllAppointments(): Observable<Appointment[]> {
    const url = `${this.apiUrl}/all`;
    return this.http.get<Appointment[]>(url, this.httpOptions).pipe(
      tap((appointments: Appointment[]) => {
        // Debug solo en desarrollo
        if (isDevMode()) {
          console.log('[AppointmentService] getAllAppointments:', appointments?.length || 0);
        }
      })
    );
  }

  // Obtener citas por rango de fechas
  getAppointments(from: string, to: string): Observable<Appointment[]> {
    let params = new HttpParams()
      .set('from', from)
      .set('to', to);
    return this.http.get<Appointment[]>(this.apiUrl, { params, ...this.httpOptions });
  }

  // Obtener citas por paciente
  getAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}`, this.httpOptions);
  }

  // Obtener citas de un día específico
  getAppointmentsByDate(date: string): Observable<Appointment[]> {
    return this.getAppointments(date, date);
  }

  // Obtener cita por ID
  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`, this.httpOptions);
  }

  // Crear nueva cita
  createAppointment(appointment: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment, this.httpOptions);
  }

  // Actualizar cita
  updateAppointment(id: string, appointment: UpdateAppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment, this.httpOptions);
  }

  // Cancelar cita
  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.apiUrl}/${id}?action=cancel`, this.httpOptions);
  }

  // Eliminar cita completamente
  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}?action=delete`, this.httpOptions);
  }

  // Verificar conflictos de horario
  checkConflicts(start: string, end: string, excludeId?: string): Observable<AppointmentConflictCheck> {
    let params = new HttpParams()
      .set('start', start)
      .set('end', end);

    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }

    return this.http.get<AppointmentConflictCheck>(`${this.apiUrl}/conflicts/check`, { params });
  }
}

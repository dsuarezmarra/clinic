// ...existing code...
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { APP_CONFIG } from '../config/app.config';
import {
  Appointment,
  AppointmentConflictCheck,
  CreateAppointmentRequest,
  UpdateAppointmentRequest
} from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = `${APP_CONFIG.apiUrl}/appointments`;

  constructor(private http: HttpClient) { }

  // Obtener todas las citas sin filtrar por fecha
  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/all`).pipe(
      tap((appointments: Appointment[]) => {
        console.log('🔍 [AppointmentService] getAllAppointments response:', appointments);
        if (appointments && appointments.length > 0) {
          console.log('🔍 [AppointmentService] Primera cita:', appointments[0]);
          console.log('🔍 [AppointmentService] creditRedemptions de primera cita:', appointments[0].creditRedemptions);
        }
      })
    );
  }

  // Obtener citas por rango de fechas
  getAppointments(from: string, to: string): Observable<Appointment[]> {
    let params = new HttpParams()
      .set('from', from)
      .set('to', to);
    return this.http.get<Appointment[]>(this.apiUrl, { params });
  }

  // Obtener citas por paciente
  getAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  // Obtener citas de un día específico
  getAppointmentsByDate(date: string): Observable<Appointment[]> {
    return this.getAppointments(date, date);
  }

  // Obtener cita por ID
  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  // Crear nueva cita
  createAppointment(appointment: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment);
  }

  // Actualizar cita
  updateAppointment(id: string, appointment: UpdateAppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment);
  }

  // Cancelar cita
  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.apiUrl}/${id}?action=cancel`);
  }

  // Eliminar cita completamente
  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}?action=delete`);
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

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import {
  CreateCreditPackRequest,
  CreditHistoryResponse,
  CreditSummary
} from '../models/credit.model';

@Injectable({
  providedIn: 'root'
})
export class CreditService {
  private apiUrl = `${APP_CONFIG.apiUrl}/credits`;

  constructor(private http: HttpClient) { }

  // Obtener resumen de Sesiones de un paciente
  getPatientCredits(patientId: string): Observable<CreditSummary> {
    const params = new HttpParams().set('patientId', patientId);
    return this.http.get<CreditSummary>(this.apiUrl, { params });
  }

  // Crear nuevo pack de créditos (sesión o bono)
  createCreditPack(creditPack: CreateCreditPackRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/packs`, creditPack);
  }

  // Consumir Sesiones manualmente
  redeemCredits(patientId: string, appointmentId: string, units: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/redeem`, {
      patientId,
      appointmentId,
      units
    });
  }

  // Obtener historial de consumos
  getCreditHistory(patientId: string, page = 1, limit = 20): Observable<CreditHistoryResponse> {
    const params = new HttpParams()
      .set('patientId', patientId)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<CreditHistoryResponse>(`${this.apiUrl}/history`, { params });
  }

  // Eliminar pack de Sesiones
  deleteCreditPack(packId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/packs/${packId}`);
  }

  // Actualizar estado de pago de un pack
  updatePackPaymentStatus(packId: string, paid: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/packs/${packId}/payment`, { paid });
  }

  // Actualizar unidades restantes de un pack
  updatePackUnits(packId: string, unitsRemaining: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/packs/${packId}/units`, { unitsRemaining });
  }

  // Convertir unidades a tiempo legible
  formatUnitsToTime(units: number): string {
    const hours = Math.floor(units / 2);
    const minutes = (units % 2) * 30;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }

  // Convertir tiempo en minutos a unidades
  minutesToUnits(minutes: number): number {
    return minutes / 30;
  }

  // Convertir unidades a minutos
  unitsToMinutes(units: number): number {
    return units * 30;
  }
}

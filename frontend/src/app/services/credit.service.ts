import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    CreateCreditPackRequest,
    CreditHistoryResponse,
    CreditSummary
} from '../models/credit.model';
import { ClientConfigService } from './client-config.service';

// Interfaz para el resultado del batch
export interface BatchCreditResult {
  totalCredits: number;
  activeCredits: number;
  totalPriceCents: number;
  hasPendingPayment: boolean;
}

export interface BatchCreditsResponse {
  credits: { [patientId: string]: BatchCreditResult };
}

@Injectable({
  providedIn: 'root'
})
export class CreditService {
  private apiUrl: string;
  private httpOptions: { headers: HttpHeaders };

  constructor(
    private http: HttpClient,
    private clientConfig: ClientConfigService
  ) {
    // Obtener URL del backend desde la configuraciÃ³n del cliente
    this.apiUrl = `${this.clientConfig.getApiUrl()}/credits`;
    
    // Configurar headers incluyendo X-Tenant-Slug para multi-tenant
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...this.clientConfig.getTenantHeader()
      })
    };
  }

  // Obtener créditos de múltiples pacientes en una sola petición (optimización)
  getBatchCredits(patientIds: string[]): Observable<BatchCreditsResponse> {
    return this.http.post<BatchCreditsResponse>(
      `${this.apiUrl}/batch`, 
      { patientIds }, 
      this.httpOptions
    );
  }

  // Obtener resumen de Sesiones de un paciente
  getPatientCredits(patientId: string): Observable<CreditSummary> {
    const params = new HttpParams().set('patientId', patientId);
    return this.http.get<CreditSummary>(this.apiUrl, { params, ...this.httpOptions });
  }

  // Crear nuevo pack de crÃ©ditos (sesiÃ³n o bono)
  createCreditPack(creditPack: CreateCreditPackRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/packs`, creditPack, this.httpOptions);
  }

  // Consumir Sesiones manualmente
  redeemCredits(patientId: string, appointmentId: string, units: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/redeem`, {
      patientId,
      appointmentId,
      units
    }, this.httpOptions);
  }

  // Obtener historial de consumos
  getCreditHistory(patientId: string, page = 1, limit = 20): Observable<CreditHistoryResponse> {
    const params = new HttpParams()
      .set('patientId', patientId)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<CreditHistoryResponse>(`${this.apiUrl}/history`, { params, ...this.httpOptions });
  }

  // Eliminar pack de Sesiones
  deleteCreditPack(packId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/packs/${packId}`, this.httpOptions);
  }

  // Actualizar estado de pago de un pack
  updatePackPaymentStatus(packId: string, paid: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/packs/${packId}/payment`, { paid }, this.httpOptions);
  }

  // Actualizar unidades restantes de un pack
  updatePackUnits(packId: string, unitsRemaining: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/packs/${packId}/units`, { unitsRemaining }, this.httpOptions);
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

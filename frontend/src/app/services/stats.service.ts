import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ClientConfigService } from './client-config.service';

export interface DashboardStats {
  period: {
    start: string;
    end: string;
    label: string;
  };
  appointments: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  revenue: {
    totalCents: number;
    paidCents: number;
    pendingCents: number;
    totalFormatted: string;
    paidFormatted: string;
    pendingFormatted: string;
  };
  patients: {
    total: number;
    newInPeriod: number;
  };
  creditPacks: {
    active: number;
    withUnpaidBalance: number;
  };
  charts: {
    appointmentsByDay: Array<{ date: string; count: number }>;
    revenueByWeek: Array<{ week: string; amount: number }>;
  };
  upcomingToday: Array<{
    id: string;
    time: string;
    patientName: string;
    duration: number;
    type: string;
  }>;
}

export type StatsPeriod = 'today' | 'week' | 'month' | 'year';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private clientConfig = inject(ClientConfigService);

  private get apiUrl(): string {
    return this.clientConfig.getApiUrl();
  }

  private getTenantHeader(): { [key: string]: string } {
    return {
      'X-Tenant-Slug': this.clientConfig.getTenantSlug()
    };
  }

  getDashboardStats(period: StatsPeriod = 'month'): Observable<DashboardStats> {
    const params = new HttpParams().set('period', period);
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats/dashboard`, {
      headers: this.getTenantHeader(),
      params
    });
  }
}

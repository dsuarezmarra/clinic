import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClientConfigService } from './client-config.service';

export interface BackupFile {
    fileName: string;
    filePath: string;
    size: string;
    created: string;
    modified: string;
    type: string;
    date: string;
    time: string;
    displayName: string;
}

export interface BackupsByDate {
    [date: string]: {
        date: string;
        backups: BackupFile[];
    };
}

export interface BackupStats {
    totalBackups: number;
    totalSize: string;
    lastBackup: string;
    nextScheduled: string;
    oldestBackup: string;
}export interface BackupResponse {
    success: boolean;
    message: string;
    backup?: {
        fileName: string;
        filePath: string;
        size: string;
        timestamp: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class BackupService {
    private readonly apiUrl: string;
    private httpOptions: { headers: HttpHeaders };

    constructor(
        private http: HttpClient,
        private clientConfig: ClientConfigService
    ) {
        // Obtener URL del backend desde la configuración del cliente
        this.apiUrl = `${this.clientConfig.getApiUrl()}/backup`;
        
        // Configurar headers incluyendo X-Tenant-Slug para multi-tenant
        this.httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                ...this.clientConfig.getTenantHeader()
            })
        };
    }

    /**
     * Obtener la lista de todos los backups disponibles
     */
    getBackups(): Observable<BackupFile[]> {
        return this.http.get<BackupFile[]>(`${this.apiUrl}/list`, this.httpOptions);
    }

    /**
     * Obtener backups agrupados por fecha
     */
    getBackupsByDate(): Observable<BackupsByDate> {
        return this.http.get<BackupsByDate>(`${this.apiUrl}/grouped`, this.httpOptions);
    }

    /**
     * Crear un nuevo backup manual
     */
    createBackup(): Observable<BackupResponse> {
        return this.http.post<BackupResponse>(`${this.apiUrl}/create`, {}, this.httpOptions);
    }

    /**
     * Obtener estadísticas del sistema de backup
     */
    getBackupStats(): Observable<BackupStats> {
        return this.http.get<BackupStats>(`${this.apiUrl}/stats`, this.httpOptions);
    }

    /**
     * Restaurar un backup específico
     */
    restoreBackup(fileName: string): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/restore/${fileName}`, {}, this.httpOptions);
    }

    /**
     * Descargar un archivo de backup
     */
    downloadBackup(fileName: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download/${fileName}`, {
            ...this.httpOptions,
            responseType: 'blob'
        });
    }

    /**
     * Eliminar un backup específico
     */
    deleteBackup(fileName: string): Observable<{ success: boolean; message: string }> {
        return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/delete/${fileName}`, this.httpOptions);
    }

    /**
     * Verificar el estado del servicio de backup
     */
    getBackupStatus(): Observable<{ status: string; isRunning: boolean; nextRun: string }> {
        return this.http.get<{ status: string; isRunning: boolean; nextRun: string }>(`${this.apiUrl}/status`, this.httpOptions);
    }
}

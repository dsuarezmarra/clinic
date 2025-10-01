import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
    private readonly apiUrl = `${environment.apiUrl}/backup`;

    constructor(private http: HttpClient) { }

    /**
     * Obtener la lista de todos los backups disponibles
     */
    getBackups(): Observable<BackupFile[]> {
        return this.http.get<BackupFile[]>(`${this.apiUrl}/list`);
    }

    /**
     * Obtener backups agrupados por fecha
     */
    getBackupsByDate(): Observable<BackupsByDate> {
        return this.http.get<BackupsByDate>(`${this.apiUrl}/grouped`);
    }    /**
     * Crear un nuevo backup manual
     */
    createBackup(): Observable<BackupResponse> {
        return this.http.post<BackupResponse>(`${this.apiUrl}/create`, {});
    }

    /**
     * Obtener estadísticas del sistema de backup
     */
    getBackupStats(): Observable<BackupStats> {
        return this.http.get<BackupStats>(`${this.apiUrl}/stats`);
    }

    /**
     * Restaurar un backup específico
     */
    restoreBackup(fileName: string): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/restore/${fileName}`, {});
    }

    /**
     * Descargar un archivo de backup
     */
    downloadBackup(fileName: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download/${fileName}`, {
            responseType: 'blob'
        });
    }

    /**
     * Eliminar un backup específico
     */
    deleteBackup(fileName: string): Observable<{ success: boolean; message: string }> {
        return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/delete/${fileName}`);
    }

    /**
     * Verificar el estado del servicio de backup
     */
    getBackupStatus(): Observable<{ status: string; isRunning: boolean; nextRun: string }> {
        return this.http.get<{ status: string; isRunning: boolean; nextRun: string }>(`${this.apiUrl}/status`);
    }
}

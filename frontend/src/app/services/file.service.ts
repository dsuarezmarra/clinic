import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FileUploadData, PatientFile } from '../models/file.model';
import { ClientConfigService } from './client-config.service';

@Injectable({
    providedIn: 'root'
})
export class FileService {
    private apiUrl: string;
    private httpOptions: { headers: HttpHeaders };

    constructor(
        private http: HttpClient,
        private clientConfig: ClientConfigService
    ) {
        // Obtener URL del backend desde la configuración del cliente
        this.apiUrl = `${this.clientConfig.getApiUrl()}/files`;
        
        // Configurar headers incluyendo X-Tenant-Slug para multi-tenant
        this.httpOptions = {
            headers: new HttpHeaders({
                ...this.clientConfig.getTenantHeader()
            })
        };
    }

    // Obtener archivos de un paciente
    getPatientFiles(patientId: string): Observable<PatientFile[]> {
        return this.http.get<PatientFile[]>(`${this.apiUrl}/patient/${patientId}`, this.httpOptions);
    }

    // Subir archivo
    uploadFile(patientId: string, fileData: FileUploadData): Observable<PatientFile> {
        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('category', fileData.category);
        if (fileData.description) {
            formData.append('description', fileData.description);
        }

        // Para FormData, crear headers sin Content-Type (el navegador lo asigna automáticamente)
        const uploadHeaders = new HttpHeaders(this.clientConfig.getTenantHeader());
        return this.http.post<PatientFile>(`${this.apiUrl}/patient/${patientId}`, formData, { headers: uploadHeaders });
    }

    // Descargar archivo
    downloadFile(fileId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${fileId}/download`, {
            responseType: 'blob',
            headers: this.httpOptions.headers
        });
    }

    // Eliminar archivo
    deleteFile(fileId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${fileId}`, this.httpOptions);
    }

    // Obtener URL de vista previa
    getFilePreviewUrl(fileId: string): string {
        return `${this.apiUrl}/${fileId}/preview`;
    }

    // Validar tipo de archivo
    isValidFileType(file: File): boolean {
        const validTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        return validTypes.includes(file.type);
    }

    // Formatear tamaño de archivo
    formatFileSize(bytes: number | undefined | null): string {
        if (bytes === undefined || bytes === null || isNaN(bytes)) return 'Desconocido';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Obtener icono por tipo de archivo
    getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'bi-file-image';
        if (mimeType === 'application/pdf') return 'bi-file-pdf';
        if (mimeType.includes('word')) return 'bi-file-word';
        return 'bi-file-earmark';
    }

    // Obtener color de categoría
    getCategoryColor(category: string): string {
        const colors: { [key: string]: string } = {
            'radiografia': 'text-info',
            'ecografia': 'text-success',
            'analitica': 'text-warning',
            'informe': 'text-primary',
            'otro': 'text-secondary'
        };
        return colors[category] || 'text-secondary';
    }

    // Obtener nombre de categoría
    getCategoryName(category: string): string {
        const names: { [key: string]: string } = {
            'radiografia': 'Radiografía',
            'ecografia': 'Ecografía',
            'analitica': 'Analítica',
            'informe': 'Informe Médico',
            'otro': 'Otro'
        };
        return names[category] || 'Otro';
    }
}

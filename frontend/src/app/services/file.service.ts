import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FileUploadData, PatientFile } from '../models/file.model';

@Injectable({
    providedIn: 'root'
})
export class FileService {
    private apiUrl = `${environment.apiUrl}/files`;

    constructor(private http: HttpClient) { }

    // Obtener archivos de un paciente
    getPatientFiles(patientId: string): Observable<PatientFile[]> {
        return this.http.get<PatientFile[]>(`${this.apiUrl}/patient/${patientId}`);
    }

    // Subir archivo
    uploadFile(patientId: string, fileData: FileUploadData): Observable<PatientFile> {
        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('category', fileData.category);
        if (fileData.description) {
            formData.append('description', fileData.description);
        }

        return this.http.post<PatientFile>(`${this.apiUrl}/patient/${patientId}`, formData);
    }

    // Descargar archivo
    downloadFile(fileId: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${fileId}/download`, {
            responseType: 'blob'
        });
    }

    // Eliminar archivo
    deleteFile(fileId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${fileId}`);
    }

    // Obtener URL de vista previa
    getFilePreviewUrl(fileId: number): string {
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
    formatFileSize(bytes: number): string {
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

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePatientRequest, Patient, PatientFile, PatientListResponse, PatientSearchParams } from '../models/patient.model';
import { ClientConfigService } from './client-config.service';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl: string;
  private httpOptions: { headers: HttpHeaders };

  constructor(
    private http: HttpClient,
    private clientConfig: ClientConfigService
  ) {
    // Obtener URL del backend desde la configuración del cliente
    this.apiUrl = `${this.clientConfig.getApiUrl()}/patients`;
    
    // Configurar headers incluyendo X-Tenant-Slug para multi-tenant
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8',
        ...this.clientConfig.getTenantHeader()
      })
    };
  }

  // Obtener lista de pacientes
  getPatients(params?: PatientSearchParams): Observable<PatientListResponse> {
    let httpParams = new HttpParams();

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<PatientListResponse>(this.apiUrl, {
      params: httpParams,
      ...this.httpOptions
    });
  }

  // Obtener paciente por ID
  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`, this.httpOptions);
  }

  // Crear nuevo paciente
  createPatient(patient: CreatePatientRequest): Observable<Patient> {
    const sanitized = this.sanitizePatientData(patient);
    return this.http.post<Patient>(this.apiUrl, sanitized, this.httpOptions);
  }

  // Actualizar paciente
  updatePatient(id: string, patient: Partial<CreatePatientRequest>): Observable<Patient> {
    const sanitized = this.sanitizePatientData(patient);
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, sanitized, this.httpOptions);
  }

  // Sanitizar datos del paciente (convertir strings vacíos a null)
  private sanitizePatientData(patient: any): any {
    const sanitized = { ...patient };
    // Convertir strings vacíos a null para campos opcionales
    if (sanitized.birthDate === '') sanitized.birthDate = null;
    if (sanitized.email === '') sanitized.email = null;
    if (sanitized.phone2 === '') sanitized.phone2 = null;
    if (sanitized.family_contact === '') sanitized.family_contact = null;
    return sanitized;
  }

  // Eliminar paciente
  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.httpOptions);
  }

  // Obtener provincias y localidades para autocompletar
  getLocations(): Observable<any> {
    return this.http.get<any>(`${this.clientConfig.getApiUrl()}/meta/locations`, this.httpOptions);
  }

  // Buscar provincia/localidades por código postal
  lookupByCp(cp: string): Observable<any> {
    return this.http.get<any>(`${this.clientConfig.getApiUrl()}/meta/locations/by-cp/${encodeURIComponent(cp)}`, this.httpOptions);
  }

  // Obtener archivos del paciente
  getPatientFiles(patientId: string): Observable<PatientFile[]> {
    return this.http.get<PatientFile[]>(`${this.apiUrl}/${patientId}/files`);
  }

  // Subir archivos
  uploadFiles(patientId: string, files: File[]): Observable<{ message: string; files: PatientFile[] }> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    return this.http.post<{ message: string; files: PatientFile[] }>(
      `${this.apiUrl}/${patientId}/files`,
      formData
    );
  }

  // Obtener URL de descarga de archivo
  getFileDownloadUrl(patientId: string, fileId: string): string {
    return `${this.apiUrl}/${patientId}/files/${fileId}/download`;
  }

  // Eliminar archivo
  deleteFile(patientId: string, fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${patientId}/files/${fileId}`);
  }
}

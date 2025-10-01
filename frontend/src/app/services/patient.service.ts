import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { CreatePatientRequest, Patient, PatientFile, PatientListResponse, PatientSearchParams } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${APP_CONFIG.apiUrl}/patients`;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8'
    })
  };

  constructor(private http: HttpClient) { }

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
    return this.http.post<Patient>(this.apiUrl, patient, this.httpOptions);
  }

  // Actualizar paciente
  updatePatient(id: string, patient: Partial<CreatePatientRequest>): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient, this.httpOptions);
  }

  // Eliminar paciente
  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.httpOptions);
  }

  // Obtener provincias y localidades para autocompletar
  getLocations(): Observable<any> {
    return this.http.get<any>(`${APP_CONFIG.apiUrl}/meta/locations`, this.httpOptions);
  }

  // Buscar provincia/localidades por código postal
  lookupByCp(cp: string): Observable<any> {
    return this.http.get<any>(`${APP_CONFIG.apiUrl}/meta/locations/by-cp/${encodeURIComponent(cp)}`, this.httpOptions);
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

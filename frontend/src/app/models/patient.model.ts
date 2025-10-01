import { Appointment } from './appointment.model';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phone2?: string;
  email?: string;
  address?: string;
  dni?: string;
  cp?: string;
  city?: string;
  province?: string;
  birthDate?: string;
  family_contact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalCredits?: number;
  activeSessions?: number; // Nuevo campo para las sesiones activas
  _count?: {
    appointments: number;
    files: number;
    creditPacks: number;
  };
  // ...otras propiedades...
  appointments?: Appointment[];
  // UI-only preview field for small price snippets loaded on list views
  pricePreview?: string;
}

export interface PatientFile {
  id: string;
  patientId: string;
  originalName: string;
  storedPath: string;
  appointments?: Appointment[];
  size: number;
  checksum?: string;
  createdAt: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  phone: string;
  phone2?: string;
  email?: string;
  address?: string;
  dni?: string;
  cp?: string;
  city?: string;
  province?: string;
  birthDate?: string;
  family_contact?: string;
  notes?: string;
}

export interface PatientSearchParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PatientListResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

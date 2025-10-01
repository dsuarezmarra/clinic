export interface Appointment {
  id: string;
  patientId?: string;
  start: string;
  end: string;
  durationMinutes: number;
  priceCents?: number;
  notes?: string;
  consumesCredit: boolean;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  creditRedemptions?: CreditRedemption[];
}

export interface CreateAppointmentRequest {
  start: string;
  end: string;
  patientId?: string;
  durationMinutes?: number;
  consumesCredit?: boolean;
  notes?: string;
  allowWithoutCredit?: boolean;
}

export interface UpdateAppointmentRequest {
  start?: string;
  end?: string;
  patientId?: string;
  durationMinutes?: number;
  consumesCredit?: boolean;
  notes?: string;
  status?: AppointmentStatus;
  paid?: boolean;
}

export interface AppointmentConflictCheck {
  hasConflict: boolean;
  conflictingAppointment?: Appointment;
}

export type AppointmentStatus = 'BOOKED' | 'CANCELLED' | 'NO_SHOW';

export interface CreditRedemption {
  id: string;
  creditPackId: string;
  appointmentId: string;
  unitsUsed: number;
  createdAt: string;
  creditPack?: {
    id: string;
    label: string;
    paid?: boolean;
  };
}

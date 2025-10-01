export interface CreditPack {
  id: string;
  patientId: string;
  label: string;
  unitsTotal: number;
  unitsRemaining: number;
  paid?: boolean; // Estado de pago del pack
  notes?: string;
  createdAt: string;
  timeTotal?: string;
  timeRemaining?: string;
  timeUsed?: string;
  creditRedemptions?: CreditRedemption[];
}

export interface CreditSummary {
  patientId: string;
  summary: {
    totalCreditsOriginal: number;
    totalCreditsRemaining: number;
    totalCreditsUsed: number;
    totalTimeOriginal: string;
    totalTimeRemaining: string;
    totalTimeUsed: string;
  };
  creditPacks: CreditPack[];
}

export interface CreateCreditPackRequest {
  patientId: string;
  type: 'sesion' | 'bono';
  minutes: 30 | 60;
  quantity?: number;
  paid?: boolean; // Estado de pago
  notes?: string;
}

export interface CreditRedemption {
  id: string;
  creditPackId: string;
  appointmentId: string;
  unitsUsed: number;
  createdAt: string;
  creditPack?: {
    id: string;
    label: string;
  };
  appointment?: {
    id: string;
    start: string;
    end: string;
    status: string;
    notes?: string;
  };
}

export interface CreditHistoryResponse {
  redemptions: CreditRedemption[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

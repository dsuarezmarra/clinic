import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface PackPaymentStatusChange {
  packId: string;
  paid: boolean;
  patientId: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private packPaymentStatusSubject = new Subject<PackPaymentStatusChange>();
  
  // Observable para que otros componentes puedan suscribirse a cambios de estado de pago
  packPaymentStatusChanged$ = this.packPaymentStatusSubject.asObservable();
  
  // Emitir un cambio de estado de pago
  notifyPackPaymentStatusChange(change: PackPaymentStatusChange) {
    this.packPaymentStatusSubject.next(change);
  }
}
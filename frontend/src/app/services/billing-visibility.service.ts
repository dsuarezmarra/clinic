import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio para gestionar la visibilidad de los datos de facturación.
 * Por defecto, los datos están ocultos (blur) para mayor privacidad.
 * El estado se persiste en localStorage.
 */
@Injectable({
    providedIn: 'root'
})
export class BillingVisibilityService {
    private readonly STORAGE_KEY = 'billing_visible';
    private visibleSubject: BehaviorSubject<boolean>;

    constructor() {
        // Por defecto oculto (false), cargar de localStorage si existe
        const stored = localStorage.getItem(this.STORAGE_KEY);
        // Si no hay valor guardado, por defecto oculto (false)
        const initialValue = stored === 'true';
        this.visibleSubject = new BehaviorSubject<boolean>(initialValue);
    }

    /**
     * Observable para suscribirse a cambios de visibilidad
     */
    get visible$(): Observable<boolean> {
        return this.visibleSubject.asObservable();
    }

    /**
     * Valor actual de visibilidad
     */
    get isVisible(): boolean {
        return this.visibleSubject.value;
    }

    /**
     * Alternar visibilidad
     */
    toggle(): void {
        const newValue = !this.visibleSubject.value;
        this.visibleSubject.next(newValue);
        localStorage.setItem(this.STORAGE_KEY, String(newValue));
    }

    /**
     * Mostrar datos de facturación
     */
    show(): void {
        this.visibleSubject.next(true);
        localStorage.setItem(this.STORAGE_KEY, 'true');
    }

    /**
     * Ocultar datos de facturación
     */
    hide(): void {
        this.visibleSubject.next(false);
        localStorage.setItem(this.STORAGE_KEY, 'false');
    }
}

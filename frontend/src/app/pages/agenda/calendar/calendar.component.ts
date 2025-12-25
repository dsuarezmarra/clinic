import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// ...existing code... (PatientSelectorComponent removed because it's not used in the template)
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';
import { Appointment, CreateAppointmentRequest } from '../../../models/appointment.model';
import { Patient } from '../../../models/patient.model';
import { AppointmentService } from '../../../services/appointment.service';
import { ClientConfigService } from '../../../services/client-config.service';
import { CreditService } from '../../../services/credit.service';
import { EventBusService } from '../../../services/event-bus.service';
import { NotificationService } from '../../../services/notification.service';
import { PatientService } from '../../../services/patient.service';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CommonModule, FormsModule, ConfirmModalComponent],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
    // Devuelve true si el día es festivo (puedes personalizar la lista de festivos)
    isHoliday(day: Date): boolean {
        const holidays = [
            // Formato: 'MM-DD', ejemplo: '01-01' para Año Nuevo
            '01-01', '12-25', '08-15', '05-01', '10-12', '11-01', '12-06', '12-08'
        ];
        const month = (day.getMonth() + 1).toString().padStart(2, '0');
        const date = day.getDate().toString().padStart(2, '0');
        return holidays.includes(`${month}-${date}`);
    }
    currentYear: number = new Date().getFullYear();

    previousYear() {
        this.currentYear--;
    }

    nextYear() {
        this.currentYear++;
    }

    // Devuelve los días de un mes específico de un año
    getMonthDaysOfYear(year: number, monthIdx: number): Date[] {
        const days: Date[] = [];
        const firstDay = new Date(year, monthIdx, 1);
        const lastDay = new Date(year, monthIdx + 1, 0);
        let startDay = firstDay.getDay();
        startDay = (startDay === 0) ? 6 : startDay - 1;
        for (let i = 0; i < startDay; i++) {
            days.push(null as any);
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, monthIdx, i));
        }
        return days;
    }

    // Verifica si el día pertenece al mes actual mostrado
    isCurrentMonth(day: Date, monthIdx: number): boolean {
        return day.getMonth() === monthIdx;
    }
    // Devuelve 'paid', 'pending' o null según el estado de pago del pack asociado a la cita
    getAppointmentPaymentStatus(appointment: Appointment): 'paid' | 'pending' | null {
        // Si tiene creditRedemptions, usar el estado del pack
        if (appointment.creditRedemptions && appointment.creditRedemptions.length > 0) {
            const redemption = appointment.creditRedemptions[0];
            if (redemption.creditPack && typeof redemption.creditPack.paid !== 'undefined') {
                return redemption.creditPack.paid ? 'paid' : 'pending';
            }
        }
        
        // Si no tiene creditRedemptions pero tiene priceCents, considerar como pagada
        // (estas son citas creadas manualmente o citas independientes)
        if (appointment.priceCents && appointment.priceCents > 0) {
            return 'paid';
        }
        
        return null;
    }
    currentDate = new Date();
    viewMode: 'month' | 'week' | 'day' = 'month';
    @Input() set viewModeInput(mode: 'month' | 'week' | 'day') {
        if (mode) {
            this.viewMode = mode;
        }
    }
    @Input() hideHeader: boolean = false;
    @ViewChild('patientSearchInput') patientSearchInput!: ElementRef;
    
    appointments: Appointment[] = [];
    patients: Patient[] = [];
    filteredPatients: Patient[] = [];
    selectedDate: Date = new Date();
    showPatientModal = false;
    showEditModal = false;
    selectedTimeSlot = '';
    patientSearchTerm = '';
    selectedPatient: Patient | null = null;
    proposedDuration: number = 30;
    editingAppointment: Appointment | null = null;
    // Local editable string for datetime-local so changes aren't applied until Save
    editingStartLocal: string = '';
    // New: separate date and time local fields to use controlled selects
    editingDateLocal: string = '';
    editingTimeLocal: string = '';
    // Nuevo: bandera para marcar la cita como pagada en el modal
    editingPaid: boolean = false;
    // Flag para evitar creación duplicada de citas (race condition)
    isCreatingAppointment: boolean = false;
    // Flag para evitar actualización duplicada de citas (race condition con click + touchstart)
    isUpdatingAppointment: boolean = false;

    // Delete confirmation modal
    showDeleteConfirm = false;
    appointmentToDelete: string | null = null;
    deleteLoading = false;

    timeSlots: string[] = [];
    weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    getDayName(dayIndex: number): string {
        const dayMapping = [6, 0, 1, 2, 3, 4, 5];
        return this.weekDays[dayMapping[dayIndex]];
    }

    constructor(
        private appointmentService: AppointmentService,
        private patientService: PatientService,
        private creditService: CreditService,
        private notificationService: NotificationService,
        private router: Router,
        private eventBusService: EventBusService,
        private clientConfigService: ClientConfigService
    ) {
        this.generateTimeSlots();
    }

    async exportMonthCsv(year: number, monthIdx: number, groupBy: 'appointment' | 'patient' = 'appointment') {
        try {
            const month = monthIdx + 1;
            const apiUrl = this.clientConfigService.getApiUrl();
            const tenantSlug = this.clientConfigService.getTenantSlug();
            const url = `${apiUrl}/reports/billing?year=${year}&month=${month}&groupBy=${groupBy}`;
            
            console.log(`ðŸ“Š Exportando CSV para ${tenantSlug}: ${url}`);
            
            const resp = await fetch(url, { 
                headers: { 
                    'Accept': 'text/csv',
                    'X-Tenant-Slug': tenantSlug
                } 
            });
            if (!resp.ok) throw new Error('Error generando CSV');

            // Validate content-type to detect misrouted HTML responses (dev servers can return index.html)
            const contentType = resp.headers.get('Content-Type') || '';
            if (!contentType.includes('text/csv') && !contentType.includes('application/csv') && !contentType.includes('application/octet-stream')) {
                // Read text for debugging and show first chunk
                const text = await resp.text();
                const preview = text.slice(0, 1000);
                console.error('CSV export returned unexpected Content-Type:', contentType, '\nPreview:', preview);
                this.notificationService.showError('La exportación no devolvió CSV. Revisa la consola para detalles.');
                return;
            }

            const blob = await resp.blob();
            const filename = `facturas-${groupBy}-${year}-${String(month).padStart(2, '0')}.csv`;
            const a = document.createElement('a');
            const objUrl = URL.createObjectURL(blob);
            a.href = objUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objUrl);
        } catch (err) {
            console.error('Error exporting CSV', err);
            this.notificationService.showError('Error al exportar CSV');
        }
    }

    ngOnInit() {
        this.loadAppointments();
        this.loadPatients();
        
        // Suscribirse a cambios de estado de pago
        this.eventBusService.packPaymentStatusChanged$.subscribe(change => {
            console.log('Calendar: Pack payment status changed:', change);
            // Actualizar las citas que usan este pack
            this.updateAppointmentPaymentStatus(change.packId, change.paid);
        });
    }


    generateTimeSlots() {
        this.timeSlots = [];
        // Start at 09:00 and end at 21:30 (last slot)
        for (let hour = 9; hour < 22; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                this.timeSlots.push(timeString);
            }
        }
    }

    loadAppointments() {
        this.appointmentService.getAllAppointments().subscribe({
            next: (appointments) => {
                this.appointments = appointments;
                // DEBUG: mostrar la primera cita para verificar estructura (remover cuando se confirme)
                if (this.appointments && this.appointments.length > 0) {
                    console.info('[DEBUG] Primera cita cargada en CalendarComponent:', this.appointments[0]);
                    console.info('[DEBUG] creditRedemptions:', JSON.stringify(this.appointments[0].creditRedemptions, null, 2));
                    if (this.appointments[0].creditRedemptions && this.appointments[0].creditRedemptions.length > 0) {
                        console.info('[DEBUG] creditPack del primer redemption:', JSON.stringify(this.appointments[0].creditRedemptions[0].creditPack, null, 2));
                    }
                } else {
                    console.info('[DEBUG] No hay citas cargadas en CalendarComponent');
                }
            },
            error: (error) => {
                this.notificationService.showError('Error al cargar las citas');
                console.error('Error loading appointments:', error);
            }
        });
    }

    // Actualizar el estado de pago de las citas que usan un pack específico
    updateAppointmentPaymentStatus(packId: string, paid: boolean) {
        console.log(`Updating payment status for pack ${packId} to ${paid}`);
        
        // Actualizar las citas en memoria
        this.appointments.forEach(appointment => {
            if (appointment.creditRedemptions) {
                appointment.creditRedemptions.forEach(redemption => {
                    if (redemption.creditPackId === packId && redemption.creditPack) {
                        redemption.creditPack.paid = paid;
                        console.log(`Updated appointment ${appointment.id} creditPack paid status to ${paid}`);
                    }
                });
            }
        });
    }

    loadPatients() {
        // Cargar todos los pacientes para el selector del calendario
        this.patientService.getPatients({ limit: 1000 }).subscribe({
            next: (response) => {
                // El backend ya envía los pacientes ordenados por nombre, luego apellido
                this.patients = response.patients;
                this.filteredPatients = response.patients;
            },
            error: (error) => {
                this.notificationService.showError('Error al cargar los pacientes');
                console.error('Error loading patients:', error);
            }
        });
    }

    setViewMode(mode: 'month' | 'week' | 'day') {
        this.viewMode = mode;
    }

    previousPeriod() {
        switch (this.viewMode) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
        }
        this.currentDate = new Date(this.currentDate);
    }

    nextPeriod() {
        switch (this.viewMode) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
        }
        this.currentDate = new Date(this.currentDate);
    }

    goToToday() {
        this.currentDate = new Date();
    }

    getMonthDays(): Date[] {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const daysFromMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysFromMonday);
        const days: Date[] = [];
        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return days;
    }

    getWeekDays(): Date[] {
        const startOfWeek = new Date(this.currentDate);
        const dayOfWeek = this.currentDate.getDay();
        const daysFromMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(this.currentDate.getDate() - daysFromMonday);
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    }

    isWeekend(date: Date): boolean {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    }


    isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    getAppointmentsForDate(date: Date): Appointment[] {
        return this.appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return appointmentDate.toDateString() === date.toDateString();
        });
    }

    getAppointmentForTimeSlot(date: Date, timeSlot: string): Appointment | null {
        const appointments = this.getAppointmentsForDate(date);
        // Construir Date para el slot
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const slotDate = new Date(date);
        slotDate.setHours(hours, minutes, 0, 0);

        // Devolver la primera cita que cubra este slot (start <= slot < end)
        const found = appointments.find(appointment => {
            const aptStart = new Date(appointment.start);
            const aptEnd = new Date(appointment.end);
            return slotDate >= aptStart && slotDate < aptEnd;
        });
        return found || null;
    }

    // Indica si el slot corresponde exactamente al inicio de la cita
    isAppointmentStart(appointment: Appointment, date: Date, timeSlot: string): boolean {
        if (!appointment) return false;
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const slotDate = new Date(date);
        slotDate.setHours(hours, minutes, 0, 0);
        const aptStart = new Date(appointment.start);
        return slotDate.getTime() === aptStart.getTime();
    }

    // Devuelve true si la cita dura más de 30 minutos (ocupará al menos dos slots)
    appointmentSpansMultipleSlots(appointment: Appointment): boolean {
        if (!appointment || !appointment.start || !appointment.end) return false;
        const start = new Date(appointment.start).getTime();
        const end = new Date(appointment.end).getTime();
        return (end - start) > (30 * 60 * 1000);
    }

    // Obtiene la duración de la cita en minutos
    getAppointmentDuration(appointment: Appointment): number {
        if (appointment.durationMinutes) {
            return Number(appointment.durationMinutes);
        }
        if (!appointment.start || !appointment.end) return 30;
        const start = new Date(appointment.start).getTime();
        const end = new Date(appointment.end).getTime();
        return Math.round((end - start) / (60 * 1000));
    }

    // Devuelve 'short' para 30 min, 'long' para 60+ min
    getAppointmentDurationClass(appointment: Appointment): 'short' | 'long' {
        return this.getAppointmentDuration(appointment) > 30 ? 'long' : 'short';
    }

    openCreateAppointmentModal(date: Date, timeSlot: string) {
        this.selectedDate = date;
        this.selectedTimeSlot = timeSlot;
        this.selectedPatient = null;
        this.patientSearchTerm = '';
        this.loadPatients(); // Recarga la lista de pacientes para asegurar datos actualizados
        this.filteredPatients = [...this.patients];
        this.showPatientModal = true;
        
        // Enfocar el input de búsqueda después de que el modal se muestre
        setTimeout(() => {
            if (this.patientSearchInput && this.patientSearchInput.nativeElement) {
                this.patientSearchInput.nativeElement.focus();
                this.patientSearchInput.nativeElement.click();
            }
        }, 100);
    }

    selectPatient(patient: Patient) {
        // Solo selecciona el paciente, no agenda ni consume sesión
        this.selectedPatient = patient;
        this.proposedDuration = 30; // default
        // Consultar packs del paciente para proponer 60min si corresponde
        if (patient && patient.id) {
            this.creditService.getPatientCredits(patient.id).subscribe({
                next: (res: any) => {
                    console.log('ðŸ“¦ Credits received:', res);
                    const packs = res.creditPacks || [];
                    
                    // ACTUALIZAR activeSessions del paciente seleccionado con el total de unidades restantes
                    const totalUnitsRemaining = packs.reduce((sum: number, p: any) => sum + (Number(p.unitsRemaining) || 0), 0);
                    if (this.selectedPatient) {
                        this.selectedPatient.activeSessions = totalUnitsRemaining;
                        console.log(`âœ… activeSessions actualizado a ${totalUnitsRemaining} para ${this.selectedPatient.firstName}`);
                    }
                    
                    // PRIORIDAD 1: Buscar packs PAGADOS
                    const paidPacks = packs.filter((p: any) => p.paid === true && p.unitsRemaining > 0);
                    console.log(`ðŸ“¦ Packs PAGADOS disponibles: ${paidPacks.length}`, paidPacks);
                    
                    // PRIORIDAD 2: Si no hay pagados, buscar packs PENDIENTES
                    const pendingPacks = packs.filter((p: any) => p.paid === false && p.unitsRemaining > 0);
                    console.log(`ðŸ“¦ Packs PENDIENTES disponibles: ${pendingPacks.length}`, pendingPacks);
                    
                    // Determinar qué pack usar para proponer duración
                    let packToUse = null;
                    let isPaid = false;
                    
                    if (paidPacks.length > 0) {
                        packToUse = paidPacks[0]; // Más antiguo pagado
                        isPaid = true;
                    } else if (pendingPacks.length > 0) {
                        packToUse = pendingPacks[0]; // Más antiguo pendiente
                        isPaid = false;
                    }
                    
                    if (!packToUse) {
                        this.proposedDuration = 30;
                        console.log('âš ï¸ No hay packs disponibles, proponiendo 30min por defecto');
                        return;
                    }
                    
                    const unitMin = Number(packToUse.unitMinutes);
                    const unitsRem = Number(packToUse.unitsRemaining);
                    const paidLabel = isPaid ? 'PAGADO' : 'PENDIENTE';
                    
                    console.log(`âœ… Pack ${paidLabel} más antiguo: ${packToUse.label}, ${unitMin}min, ${unitsRem} units disponibles`);
                    
                    // Proponer duración según el pack disponible
                    if (unitMin === 60 && unitsRem >= 2) {
                        this.proposedDuration = 60;
                        console.log(`âœ… Proponiendo 60min (pack ${paidLabel} de 60min con 2+ units)`);
                    } else {
                        this.proposedDuration = 30;
                        console.log(`âœ… Proponiendo 30min (pack ${paidLabel} de 30min o <2 units)`);
                    }
                },
                error: (err) => {
                    console.error('âŒ Error getting credits:', err);
                    this.proposedDuration = 30;
                }
            });
        }
    }

    /**
     * Crea r�pidamente una sesi�n o bono para un paciente desde el modal de selecci�n
     * @param patient Paciente al que a�adir el cr�dito
     * @param type Tipo de cr�dito ('sesion' para 1 unidad, 'bono' para m�ltiples)
     * @param minutes Duraci�n de cada unidad (30 o 60 minutos)
     * @param quantity N�mero de unidades a crear
     * @param paid Si el cr�dito est� pagado o pendiente
     * @param event Evento del click para prevenir propagaci�n
     */
    quickCreateCredit(patient: Patient, type: 'sesion' | 'bono', minutes: 30 | 60, quantity: number, paid: boolean, event: Event) {
        event.stopPropagation(); // Prevenir selecci�n del paciente
        event.preventDefault();
        
        // Marcar que estamos creando para deshabilitar botones
        patient.isCreatingCredit = true;
        
        const paidLabel = paid ? 'pagado' : 'pendiente';
        const sessionsInBono = minutes === 60 ? 5 : 5; // Ambos bonos tienen 5 sesiones
        const label = type === 'sesion' 
            ? `Sesi�n ${minutes}min (${paidLabel})` 
            : `Bono ${sessionsInBono} sesiones de ${minutes}min (${paidLabel})`;
        
        const creditPack = {
            patientId: patient.id!,
            type: type,
            minutes: minutes,
            quantity: quantity,
            paid: paid,
            notes: `Creado r�pidamente desde agenda`,
            priceCents: 0 // Precio por defecto, se puede ajustar despu�s
        };
        
        this.creditService.createCreditPack(creditPack).subscribe({
            next: (result) => {
                console.log('? Credit pack creado:', result);
                
                // Actualizar el contador de sesiones del paciente localmente
                // La l�gica debe coincidir con el backend:
                // - Sesi�n: 1 unidad por sesi�n de 30min, 2 unidades por sesi�n de 60min
                // - Bono 30min: 5 unidades (sesiones de 30min) por cada quantity
                // - Bono 60min: 10 unidades (equivalente a 5 sesiones de 60min) por cada quantity
                let addedUnits: number;
                if (type === 'sesion') {
                    addedUnits = minutes === 60 ? quantity * 2 : quantity;
                } else {
                    // Bono: 5 sesiones de 30min o 10 unidades (5 sesiones de 60min)
                    addedUnits = minutes === 60 ? quantity * 10 : quantity * 5;
                }
                patient.activeSessions = (patient.activeSessions || 0) + addedUnits;
                
                // Tambi�n actualizar en la lista filtrada y principal
                const patientInList = this.patients.find(p => p.id === patient.id);
                if (patientInList) {
                    patientInList.activeSessions = patient.activeSessions;
                }
                const patientInFiltered = this.filteredPatients.find(p => p.id === patient.id);
                if (patientInFiltered) {
                    patientInFiltered.activeSessions = patient.activeSessions;
                }
                
                // Si este paciente est� seleccionado, actualizar tambi�n selectedPatient
                if (this.selectedPatient && this.selectedPatient.id === patient.id) {
                    this.selectedPatient.activeSessions = patient.activeSessions;
                }
                
                patient.isCreatingCredit = false;
                this.notificationService.showSuccess(`${label} a�adido a ${patient.firstName}`);
            },
            error: (err) => {
                console.error('? Error creando credit pack:', err);
                patient.isCreatingCredit = false;
                this.notificationService.showError(`Error al crear ${label}`);
            }
        });
    }

    /**
     * Verifica si hay solapamiento entre dos rangos de tiempo
     */
    hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
        return start1 < end2 && end1 > start2;
    }

    /**
     * Verifica si la nueva cita se solapa con alguna cita existente
     */
    checkAppointmentOverlap(newStart: Date, newEnd: Date, excludeId?: string): Appointment | null {
        for (const apt of this.appointments) {
            // Excluir la cita que estamos editando
            if (excludeId && apt.id === excludeId) continue;
            
            const aptStart = new Date(apt.start);
            const aptEnd = new Date(apt.end);
            
            if (this.hasTimeOverlap(newStart, newEnd, aptStart, aptEnd)) {
                return apt;
            }
        }
        return null;
    }

    createAppointment() {
        // EVITAR CREACIÃ“N DUPLICADA (race condition con click + touchstart)
        if (this.isCreatingAppointment) {
            console.warn('âš ï¸ Ya se está creando una cita, ignorando clic duplicado');
            return;
        }

        // âš¡ ESTABLECER FLAG INMEDIATAMENTE para bloquear eventos duplicados
        this.isCreatingAppointment = true;

        if (!this.selectedPatient) {
            this.notificationService.showError('Selecciona un paciente');
            this.isCreatingAppointment = false; // Reset si falla validación
            return;
        }
        const requiredUnits = 1;
        const availableUnits = this.selectedPatient.activeSessions || 0;
        if (availableUnits < requiredUnits) {
            const createCredit = confirm(
                `${this.selectedPatient.firstName} no tiene sesiones disponibles para agendar. ¿Deseas crear un nuevo bono/sesión?`
            );
            this.isCreatingAppointment = false; // Reset flag antes de salir
            if (createCredit) {
                this.router.navigate(['/pacientes', this.selectedPatient.id], {
                    queryParams: { showCreditForm: 'true' }
                });
                return;
            } else {
                return;
            }
        }

        // Proceed to create appointment
        const [hours, minutes] = this.selectedTimeSlot.split(':').map(Number);
        const startDateTime = new Date(this.selectedDate);
        startDateTime.setHours(hours, minutes, 0, 0);
        const duration = this.proposedDuration || 30;
        console.log(`ðŸ• Creating appointment with duration: ${duration}min (proposedDuration=${this.proposedDuration})`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + duration);
        
        // Validar solapamiento antes de crear
        const overlappingApt = this.checkAppointmentOverlap(startDateTime, endDateTime);
        if (overlappingApt) {
            const overlappingPatient = this.patients.find(p => p.id === overlappingApt.patientId);
            const patientName = overlappingPatient ? `${overlappingPatient.firstName} ${overlappingPatient.lastName}` : 'Desconocido';
            const timeRange = this.formatTimeRange(overlappingApt.start, overlappingApt.end);
            this.notificationService.showError(
                `Ya existe una cita en ese horario: ${patientName} (${timeRange}). Por favor, selecciona otro horario.`
            );
            this.isCreatingAppointment = false; // Reset flag si falla validación
            return;
        }

        const appointmentData: CreateAppointmentRequest = {
            patientId: this.selectedPatient.id,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            durationMinutes: duration,
            consumesCredit: true
        };
        console.log('ðŸ“‹ Appointment data:', appointmentData);
        this.appointmentService.createAppointment(appointmentData).subscribe({
            next: (appointment) => {
                this.notificationService.showSuccess('Cita creada exitosamente');
                this.closeModal();
                this.loadPatients();
                
                // âš¡ ESPERAR a que loadAppointments() termine antes de resetear flag
                // Esto previene errores de validación si el usuario crea otra cita inmediatamente
                this.appointmentService.getAllAppointments().subscribe({
                    next: (appointments) => {
                        this.appointments = appointments;
                        this.isCreatingAppointment = false; // â† RESET FLAG después de recargar
                        console.log('âœ… Appointments reloaded, flag reset');
                    },
                    error: (error) => {
                        console.error('Error reloading appointments:', error);
                        this.isCreatingAppointment = false; // â† RESET FLAG incluso si falla recarga
                    }
                });
            },
            error: (error) => {
                this.notificationService.showError('Error al crear la cita');
                console.error('Error creating appointment:', error);
                this.isCreatingAppointment = false; // â† RESET FLAG TAMBIÃ‰N EN ERROR
            }
        });
    }

    openEditAppointmentModal(appointment: Appointment) {
        this.editingAppointment = appointment;
        // initialize local editing values (date and time parts, local)
        const local = this.formatDateTimeLocal(appointment.start); // YYYY-MM-DDTHH:mm
        if (local && local.includes('T')) {
            const [datePart, timePart] = local.split('T');
            this.editingDateLocal = datePart;
            this.editingTimeLocal = timePart;
            this.editingStartLocal = local;
        } else {
            this.editingDateLocal = '';
            this.editingTimeLocal = '';
            this.editingStartLocal = '';
        }
        this.showEditModal = true;
        // Inicializar flag de pago según si alguna redención vinculada esté marcada como pagada
        const status = this.getAppointmentPaymentStatus(appointment);
        this.editingPaid = (status === 'paid');
    }

    /**
     * Normaliza un texto eliminando acentos y diacr�ticos
     * para b�squeda insensible a acentos
     */
    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    filterPatients() {
        if (!this.patientSearchTerm.trim()) {
            this.filteredPatients = [...this.patients];
            return;
        }
        const searchTerm = this.normalizeText(this.patientSearchTerm);
        this.filteredPatients = this.patients.filter(patient => {
            const firstName = this.normalizeText(patient.firstName || '');
            const lastName = this.normalizeText(patient.lastName || '');
            const phone = patient.phone || '';
            const email = this.normalizeText(patient.email || '');
            
            return firstName.includes(searchTerm) ||
                   lastName.includes(searchTerm) ||
                   phone.includes(searchTerm) ||
                   email.includes(searchTerm);
        });
    }

    updateAppointment() {
        if (!this.editingAppointment) return;

        // EVITAR ACTUALIZACIÃ“N DUPLICADA (race condition con click + touchstart)
        if (this.isUpdatingAppointment) {
            console.warn('âš ï¸ Ya se está actualizando la cita, ignorando clic duplicado');
            return;
        }

        // âš¡ ESTABLECER FLAG INMEDIATAMENTE para bloquear eventos duplicados
        this.isUpdatingAppointment = true;

        // Detectar si cambió el estado de pago comparando con el original
        const originalPaymentStatus = this.getAppointmentPaymentStatus(this.editingAppointment);
        const originalPaid = (originalPaymentStatus === 'paid');
        const paymentStatusChanged = (this.editingPaid !== originalPaid);

        // Detectar si SOLO cambió el estado de pago (checkbox)
        const originalStart = this.formatDateTimeLocal(this.editingAppointment.start);
        const currentDateTime = `${this.editingDateLocal}T${this.editingTimeLocal}`;
        const dateTimeChanged = originalStart !== currentDateTime;

        // Si SOLO cambió el checkbox de pago, actualizar directamente el pack
        if (!dateTimeChanged && paymentStatusChanged && this.editingAppointment?.creditRedemptions?.length) {
            const packId = this.editingAppointment.creditRedemptions[0].creditPackId;
            console.log(`[DEBUG] ONLY payment status changed. Updating pack ${packId} to ${this.editingPaid}`);
            this.creditService.updatePackPaymentStatus(packId, this.editingPaid).subscribe({
                next: () => {
                    console.log(`[DEBUG] Pack payment status updated successfully`);
                    this.notificationService.showSuccess('Estado de pago actualizado exitosamente');
                    this.closeModal();
                    this.loadAppointments();
                    this.loadPatients();
                    this.isUpdatingAppointment = false; // â† RESET FLAG en success
                },
                error: (error) => {
                    console.error('Error updating payment status:', error);
                    this.notificationService.showError('Error al actualizar estado de pago');
                    this.isUpdatingAppointment = false; // â† RESET FLAG en error
                }
            });
            return; // â† IMPORTANTE: Salir aquí sin actualizar la cita
        }

        // Si cambió fecha/hora, continuar con actualización de cita
        const payload: any = {};

        // If user edited the datetime in the modal, use editingDateLocal + editingTimeLocal; otherwise keep existing
        if (this.editingDateLocal && this.editingTimeLocal) {
            const datePart = this.editingDateLocal;
            const timePart = this.editingTimeLocal;
            const [hourStr, minStr] = timePart.split(':');
            const hour = Number(hourStr);
            const minute = Number(minStr);
            // Validate allowed range and step
            const minutesFromMidnight = hour * 60 + minute;
            const minAllowed = 9 * 60; // 09:00
            const maxAllowedStart = 21 * 60 + 30; // 21:30
            if (minutesFromMidnight < minAllowed || minutesFromMidnight > maxAllowedStart || (minute % 30) !== 0) {
                this.notificationService.showError('La hora debe estar entre 09:00 y 22:00 en pasos de 30 minutos');
                this.isUpdatingAppointment = false; // â† RESET FLAG si falla validación
                return;
            }

            // Build a Date in local timezone from parts to avoid timezone shift issues
            const [y, m, d] = datePart.split('-').map(n => Number(n));
            const startDt = new Date(y, Number(m) - 1, Number(d), hour, minute, 0, 0);
            payload.start = startDt.toISOString();
            const mins = (this.editingAppointment!.durationMinutes && Number(this.editingAppointment!.durationMinutes) > 0) ? Number(this.editingAppointment!.durationMinutes) : 30;
            const endDt = new Date(startDt.getTime() + mins * 60000);
            payload.end = endDt.toISOString();
            payload.durationMinutes = mins;

            // Validar solapamiento SOLO si se cambió el horario
            const newStart = new Date(payload.start);
            const newEnd = new Date(payload.end);
            const overlappingApt = this.checkAppointmentOverlap(newStart, newEnd, this.editingAppointment.id);
            if (overlappingApt) {
                const overlappingPatient = this.patients.find(p => p.id === overlappingApt.patientId);
                const patientName = overlappingPatient ? `${overlappingPatient.firstName} ${overlappingPatient.lastName}` : 'Desconocido';
                const timeRange = this.formatTimeRange(overlappingApt.start, overlappingApt.end);
                this.notificationService.showError(
                    `Ya existe una cita en ese horario: ${patientName} (${timeRange}). Por favor, selecciona otro horario.`
                );
                this.isUpdatingAppointment = false; // â† RESET FLAG si falla validación
                return;
            }
        }

        if (this.editingAppointment.patientId !== undefined) payload.patientId = this.editingAppointment.patientId;
        if (this.editingAppointment.consumesCredit !== undefined) payload.consumesCredit = this.editingAppointment.consumesCredit;
        if (this.editingAppointment.notes !== undefined) payload.notes = this.editingAppointment.notes === null ? '' : this.editingAppointment.notes;
        if ((this as any).editingAppointment.status !== undefined) payload.status = (this as any).editingAppointment.status;

        console.info('[DEBUG] updateAppointment payload:', payload);
        
        // Update the appointment only if there are changes
        if (Object.keys(payload).length === 0) {
            this.notificationService.showInfo('No hay cambios para guardar');
            this.isUpdatingAppointment = false; // â† RESET FLAG si no hay cambios
            return;
        }

        this.appointmentService.updateAppointment(this.editingAppointment.id, payload).subscribe({
            next: (appointment) => {
                // Si el pago CAMBIÃ“ (además del datetime), actualizar el pack
                if (paymentStatusChanged && this.editingAppointment?.creditRedemptions?.length) {
                    const packId = this.editingAppointment.creditRedemptions[0].creditPackId;
                    console.log(`[DEBUG] Payment status also changed. Updating pack ${packId} to ${this.editingPaid}`);
                    this.creditService.updatePackPaymentStatus(packId, this.editingPaid).subscribe({
                        next: () => {
                            console.log(`[DEBUG] Pack payment status updated successfully`);
                            // âœ… UN SOLO MENSAJE: Cita actualizada (incluye cambio de pago si hubo)
                            this.notificationService.showSuccess('Cita actualizada exitosamente');
                            this.closeModal();
                            this.loadAppointments();
                            this.loadPatients();
                            this.isUpdatingAppointment = false; // â† RESET FLAG en success
                        },
                        error: (error) => {
                            console.error('Error updating payment status:', error);
                            this.notificationService.showError('Cita actualizada pero error al actualizar estado de pago');
                            this.closeModal();
                            this.loadAppointments();
                            this.loadPatients();
                            this.isUpdatingAppointment = false; // â† RESET FLAG en error
                        }
                    });
                } else {
                    // âœ… UN SOLO MENSAJE: Cita actualizada (pago NO cambió)
                    this.notificationService.showSuccess('Cita actualizada exitosamente');
                    this.closeModal();
                    this.loadAppointments();
                    this.loadPatients();
                    this.isUpdatingAppointment = false; // â† RESET FLAG en success
                }
            },
            error: (error) => {
                console.error('Error updating appointment:', error);
                this.notificationService.showError('Error al actualizar la cita');
                this.isUpdatingAppointment = false; // â† RESET FLAG en error
            }
        });
    }

    deleteAppointment(appointmentId: string) {
        this.appointmentToDelete = appointmentId;
        this.showDeleteConfirm = true;
    }

    confirmDeleteAppointment() {
        if (!this.appointmentToDelete) return;

        this.deleteLoading = true;
        this.appointmentService.deleteAppointment(this.appointmentToDelete).subscribe({
            next: () => {
                this.notificationService.showSuccess('Cita eliminada exitosamente');
                // Cerrar modal de edición si está abierto y refrescar datos
                this.closeModal();
                this.cancelDeleteAppointment();
                this.loadAppointments();
                this.loadPatients();
            },
            error: (error) => {
                this.notificationService.showError('Error al eliminar la cita');
                console.error('Error deleting appointment:', error);
                this.deleteLoading = false;
            }
        });
    }

    cancelDeleteAppointment() {
        this.showDeleteConfirm = false;
        this.appointmentToDelete = null;
        this.deleteLoading = false;
    }

    // Obtener nombre del paciente de la cita a eliminar
    getDeleteAppointmentPatientName(): string {
        if (!this.appointmentToDelete) return '';
        const appointment = this.appointments.find(a => a.id === this.appointmentToDelete);
        if (!appointment) return '';
        return this.getPatientName(appointment);
    }

    closeModal() {
        this.showPatientModal = false;
        this.showEditModal = false;
        this.selectedPatient = null;
        this.editingAppointment = null;
        this.patientSearchTerm = '';
        this.isCreatingAppointment = false; // â† RESET FLAG al cerrar modal
        this.isUpdatingAppointment = false; // â† RESET FLAG al cerrar modal
    }

    getPatientName(appointment: Appointment): string {
        const patient = this.patients.find(p => p.id === appointment.patientId);
        return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente no encontrado';
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    formatTimeOnly(dateTime: string): string {
        return new Date(dateTime).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTimeRange(start: string, end: string): string {
        const startTime = this.formatTimeOnly(start);
        const endTime = this.formatTimeOnly(end);
        return `${startTime} - ${endTime}`;
    }

    // Devuelve un texto corto indicando el origen de la cita: 'Bono 5Ã—60m' o 'Sesión 30m'
    getAppointmentOrigin(appointment: Appointment): string {
        if (!appointment) return '';
        const redemptions = appointment.creditRedemptions || [];
        if (redemptions.length > 0) {
            const r = redemptions[0] as any;
            const pack = r.creditPack || {};
            if (pack && pack.label) {
                // Normalizar etiquetas comunes: si el label ya contiene 'Bono' o 'Sesión', devolver tal cual.
                const lbl: string = String(pack.label || '').trim();
                if (lbl) return lbl;
            }
            // Si no hay label, intentar construirlo a partir de unitsTotal y unitMinutes
            const unitsTotal = Number(pack.unitsTotal ?? pack.units_total ?? 0);
            // Determinar duración por unidad de forma segura: preferir campos camelCase o snake_case
            const rawUnitMinutes = pack.unitMinutes ?? pack.unit_minutes ?? null;
            let unitMinutes = Number(rawUnitMinutes || 0);
            // Si no tenemos un valor válido (30 o 60), usar la duración de la cita como fallback y, por defecto, 30
            if (unitMinutes !== 30 && unitMinutes !== 60) {
                const dur = Number(appointment.durationMinutes || 0);
                unitMinutes = (dur >= 60) ? 60 : 30;
            }
            if (unitsTotal > 0) {
                if (unitsTotal === 1) return `Sesión ${unitMinutes}m`;
                if (unitsTotal === 2) return `Sesión ${unitMinutes}m`;
                // Bonos: mostrar como "Bono XÃ—Ym" donde X es número de sesiones y Ym la duración
                const sessions = unitMinutes === 60 ? Math.round(unitsTotal / 2) : unitsTotal;
                return `Bono ${sessions}Ã—${unitMinutes}m`;
            }
        }

        // Fallback: basar en duración de la cita
        const mins = Number(appointment.durationMinutes || 0);
        if (mins >= 60) return 'Sesión 60m';
        if (mins > 0) return `Sesión ${mins}m`;
        return '';
    }

    formatDateTimeLocal(dateTime: string): string {
        // Return a local datetime string suitable for <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
        if (!dateTime) return '';
        const d = new Date(dateTime);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Precio por duración por defecto (en céntimos)
    private DEFAULT_PRICE_30 = 3000; // 30â‚¬
    private DEFAULT_PRICE_60 = 5500; // 55â‚¬

    // Calcula el precio (en céntimos) estimado para una cita
    appointmentPriceCents(appointment: Appointment): number {
        if (!appointment) return 0;
        // Sólo contabilizamos citas pagadas
        const status = this.getAppointmentPaymentStatus(appointment);
        if (status !== 'paid') return 0;

        // Si la cita tiene priceCents definido directamente, usarlo
        if (appointment.priceCents && appointment.priceCents > 0) {
            return appointment.priceCents;
        }

        // Si existe una redención de pack/bono, calcular el precio proporcional
        // basándose en el precio del pack en el momento de su creación
        const redemptions = appointment.creditRedemptions || [];
        if (redemptions.length > 0) {
            const r = redemptions[0];
            const pack = (r as any).creditPack || {};
            const priceCents = Number(pack?.priceCents ?? pack?.price_cents ?? pack?.price ?? 0) || 0;
            const unitsTotal = Number(pack?.unitsTotal ?? pack?.units_total ?? 0) || 0;
            const unitsUsed = Number(r.unitsUsed || 0);
            
            // Si el pack tiene precio y unidades, calcular proporcionalmente
            // Ejemplo: Bono 5x30min por 135â‚¬ = 27â‚¬ por sesión
            if (priceCents > 0 && unitsTotal > 0 && unitsUsed > 0) {
                return Math.round(unitsUsed * (priceCents / unitsTotal));
            }
        }

        // Fallback: usar precio de sesión individual según duración
        // (esto se aplica cuando se paga sin bono)
        const mins = Number(appointment.durationMinutes || 0);
        if (mins >= 60) return this.DEFAULT_PRICE_60;
        return this.DEFAULT_PRICE_30;
    }

    // Suma total de precios (en céntimos) para un día
    getDayTotal(date: Date): number {
        if (!date) return 0;
        const apts = this.getAppointmentsForDate(date) || [];
        return apts.reduce((sum, ap) => sum + this.appointmentPriceCents(ap), 0);
    }

    // Suma total de precios (en céntimos) para la semana actual (según getWeekDays)
    getWeekTotal(): number {
        const days = this.getWeekDays();
        let total = 0;
        days.forEach(d => {
            total += this.getDayTotal(d);
        });
        return total;
    }

    // Suma total de precios (en céntimos) para un mes y año dados
    getMonthTotal(year: number, monthIdx: number): number {
        let total = 0;
        this.appointments.forEach(ap => {
            if (!ap || !ap.start) return;
            const d = new Date(ap.start);
            if (d.getFullYear() === year && d.getMonth() === monthIdx) {
                total += this.appointmentPriceCents(ap);
            }
        });
        return total;
    }

    // Formatear céntimos a cadena legible (ej: 5500 -> "55 €")
    formatPriceCents(cents: number): string {
        if (cents === null || cents === undefined || !cents) return '0 €';
        const euros = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
        return euros.replace('.', ',') + ' €';
    }

    getMinForDate(dateTime: string): string {
        const d = dateTime ? new Date(dateTime) : new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T09:00`;
    }

    getMaxForDate(dateTime: string): string {
        const d = dateTime ? new Date(dateTime) : new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T22:00`;
    }

    getTimeUntil(dateTime: string): string {
        const now = new Date();
        const appointmentTime = new Date(dateTime);
        const diffMinutes = Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60));
        if (diffMinutes < 60) {
            return `${diffMinutes} min`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            return `${hours}h ${minutes}m`;
        }
    }
}




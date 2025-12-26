import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Appointment, AppointmentStatus, CreateAppointmentRequest } from '../../../models/appointment.model';
import { Patient } from '../../../models/patient.model';
import { AppointmentService } from '../../../services/appointment.service';
import { CreditService } from '../../../services/credit.service';
import { EventBusService } from '../../../services/event-bus.service';
import { NotificationService } from '../../../services/notification.service';
import { PatientService } from '../../../services/patient.service';
import { DashboardStats, StatsPeriod, StatsService } from '../../../services/stats.service';
import { WhatsAppReminder, WhatsAppReminderService } from '../../../services/whatsapp-reminder.service';
import { CalendarComponent } from '../../agenda/calendar/calendar.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, CalendarComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    @ViewChild(CalendarComponent) calendarComponent: CalendarComponent | undefined;
    @ViewChild('patientSearchInput') patientSearchInput!: ElementRef;

    // Dashboard stats
    stats: DashboardStats | null = null;
    statsLoading = false;
    statsPeriod: StatsPeriod = 'month';
    showStats = true;

    // WhatsApp reminders
    whatsappReminders: WhatsAppReminder[] = [];
    whatsappRemindersCount = 0;
    showWhatsAppModal = false;
    whatsappLoading = false;

    previousPeriod() {
        if (this.calendarComponent) {
            this.calendarComponent.previousPeriod();
        }
    }

    nextPeriod() {
        if (this.calendarComponent) {
            this.calendarComponent.nextPeriod();
        }
    }

    appointments: Appointment[] = [];
    // Devuelve 'paid', 'pending' o null según el estado de pago del pack asociado a la cita
    getAppointmentPaymentStatus(appointment: Appointment): 'paid' | 'pending' | null {
        if (!appointment.creditRedemptions || appointment.creditRedemptions.length === 0) return null;
        // Tomar el primer pack asociado (puede haber más de uno, pero normalmente solo uno por cita)
        const redemption = appointment.creditRedemptions[0];
        if (redemption.creditPack && typeof redemption.creditPack.paid !== 'undefined') {
            return redemption.creditPack.paid ? 'paid' : 'pending';
        }
        return null;
    }
    patients: Patient[] = [];
    filteredPatients: Patient[] = [];
    currentDate: Date = new Date();
    selectedDate: Date = new Date();

    // Modal states
    showPatientModal = false;
    showEditModal = false;
    selectedPatient: Patient | null = null;
    editingAppointment: Appointment | null = null;
    selectedTimeSlot = '';
    patientSearchTerm = '';

    constructor(
        private appointmentService: AppointmentService,
        private patientService: PatientService,
        private notificationService: NotificationService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private creditService: CreditService,
        private eventBusService: EventBusService,
        private statsService: StatsService,
        private whatsappReminderService: WhatsAppReminderService
    ) { }
    // export controls removed — use calendar monthly export
    ngAfterViewInit() {
        this.cdr.detectChanges();
    }

    ngOnInit() {
        this.loadAppointments();
        this.loadPatients();
        this.generateTimeSlots();
        this.loadStats();
        this.loadWhatsAppReminders();
        
        // Suscribirse a cambios de estado de pago
        this.eventBusService.packPaymentStatusChanged$.subscribe(change => {
            console.log('Dashboard: Pack payment status changed:', change);
            // Actualizar las citas que usan este pack
            this.updateAppointmentPaymentStatus(change.packId, change.paid);
        });
    }

    // Cargar recordatorios de WhatsApp pendientes
    loadWhatsAppReminders() {
        this.whatsappLoading = true;
        this.whatsappReminderService.getPendingReminders().subscribe({
            next: (response) => {
                this.whatsappReminders = response.appointments;
                this.whatsappRemindersCount = response.eligibleForReminder;
                this.whatsappLoading = false;
            },
            error: (error) => {
                console.error('Error loading WhatsApp reminders:', error);
                this.whatsappLoading = false;
            }
        });
    }

    // Abrir modal de WhatsApp
    openWhatsAppModal() {
        this.loadWhatsAppReminders();
        this.showWhatsAppModal = true;
    }

    // Cerrar modal de WhatsApp
    closeWhatsAppModal() {
        this.showWhatsAppModal = false;
    }

    // Abrir enlace de WhatsApp
    openWhatsAppLink(reminder: WhatsAppReminder) {
        if (reminder.whatsappLink) {
            window.open(reminder.whatsappLink, '_blank');
        }
    }

    // Cargar estadísticas del dashboard
    loadStats() {
        this.statsLoading = true;
        this.statsService.getDashboardStats(this.statsPeriod).subscribe({
            next: (stats) => {
                this.stats = stats;
                this.statsLoading = false;
            },
            error: (error) => {
                console.error('Error loading stats:', error);
                this.statsLoading = false;
            }
        });
    }

    // Cambiar período de estadísticas
    changeStatsPeriod(period: StatsPeriod) {
        this.statsPeriod = period;
        this.loadStats();
    }

    // Toggle mostrar/ocultar estadísticas
    toggleStats() {
        this.showStats = !this.showStats;
    }

    // Generar slots de tiempo cada 30 minutos para horario laboral
    generateTimeSlots() {
        const slots: string[] = [];
        for (let hour = 8; hour < 22; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeSlot);
            }
        }
        return slots;
    }

    loadAppointments() {
        // Obtener citas de una semana alrededor del día seleccionado
        const startDate = new Date(this.selectedDate);
        startDate.setDate(startDate.getDate() - 3); // 3 días antes

        const endDate = new Date(this.selectedDate);
        endDate.setDate(endDate.getDate() + 3); // 3 días después

        const fromDate = startDate.toISOString().split('T')[0];
        const toDate = endDate.toISOString().split('T')[0];

        this.appointmentService.getAppointments(fromDate, toDate).subscribe({
            next: (appointments) => {
                this.appointments = appointments;
            },
            error: (error) => {
                console.error('Error loading appointments:', error);
                this.notificationService.showError('Error al cargar las citas');
            }
        });
    }

    loadPatients() {
        this.patientService.getPatients().subscribe({
            next: (response) => {
                this.patients = response.patients || response;
                this.filteredPatients = [...this.patients];
            },
            error: (error) => {
                console.error('Error loading patients:', error);
                this.notificationService.showError('Error al cargar los pacientes');
            }
        });
    }

    // Actualizar el estado de pago de las citas que usan un pack específico
    updateAppointmentPaymentStatus(packId: string, paid: boolean) {
        console.log(`Dashboard: Updating payment status for pack ${packId} to ${paid}`);
        
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

    getAppointmentsForDate(date: Date): Appointment[] {
        return this.appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return appointmentDate.toDateString() === date.toDateString();
        });
    }

    // Obtener cita para un slot de tiempo específico
    getAppointmentForTimeSlot(date: Date, timeSlot: string): Appointment | null {
        const appointments = this.getAppointmentsForDate(date);
        return appointments.find(appointment => {
            const appointmentTime = new Date(appointment.start).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            return appointmentTime === timeSlot;
        }) || null;
    } getTimeSlots(): string[] {
        return this.generateTimeSlots();
    }

    // Abrir modal para crear cita
    openCreateAppointmentModal(date: Date, timeSlot: string) {
        this.selectedDate = date;
        this.selectedTimeSlot = timeSlot;
        this.selectedPatient = null;
        this.patientSearchTerm = '';
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

    // Abrir modal para editar cita
    openEditAppointmentModal(appointment: Appointment) {
        this.editingAppointment = { ...appointment };
        this.showEditModal = true;
    }

    // Normalizar acentos para búsqueda (elimina tildes y diacríticos)
    private normalizeAccents(str: string): string {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    // Filtrar pacientes por búsqueda (insensible a acentos)
    filterPatients() {
        if (!this.patientSearchTerm.trim()) {
            this.filteredPatients = [...this.patients];
            return;
        }

        const searchTerm = this.normalizeAccents(this.patientSearchTerm);
        this.filteredPatients = this.patients.filter(patient =>
            this.normalizeAccents(patient.firstName).includes(searchTerm) ||
            this.normalizeAccents(patient.lastName).includes(searchTerm) ||
            patient.phone.includes(searchTerm) ||
            (patient.email && this.normalizeAccents(patient.email).includes(searchTerm))
        );
    }

    // Seleccionar paciente
    selectPatient(patient: Patient) {
        this.selectedPatient = patient;
    }

    // Crear nueva cita
    createAppointment() {
        if (!this.selectedPatient) {
            this.notificationService.showError('Selecciona un paciente');
            return;
        }

        // Verificar si el paciente tiene sesiones activas
        if ((this.selectedPatient.activeSessions || 0) <= 0) {
            const createCredit = confirm(
                `${this.selectedPatient.firstName} no tiene sesiones activas. ¿Deseas crear un nuevo bono/sesión?`
            );

            if (createCredit) {
                // Redirigir al detalle del paciente con el formulario de créditos abierto
                this.router.navigate(['/pacientes', this.selectedPatient.id], {
                    queryParams: { showCreditForm: 'true' }
                });
                return;
            } else {
                return;
            }
        }

        // Crear fecha y hora de inicio y fin
        const [hours, minutes] = this.selectedTimeSlot.split(':').map(Number);
        const startDateTime = new Date(this.selectedDate);
        startDateTime.setHours(hours, minutes, 0, 0);

        // Determinar si el paciente tiene packs de 60min con al menos 2 unidades
        let duration = 30;
        if (this.selectedPatient && this.selectedPatient.id) {
            this.creditService.getPatientCredits(this.selectedPatient.id).subscribe({
                next: (res: any) => {
                    const packs = res.creditPacks || [];
                    const has60 = packs.some((p: any) => Number(p.unitMinutes) === 60 && Number(p.unitsRemaining) >= 2);
                    duration = has60 ? 60 : 30;

                    const endDateTime = new Date(startDateTime);
                    endDateTime.setMinutes(endDateTime.getMinutes() + duration);

                    const appointmentData: CreateAppointmentRequest = {
                        patientId: this.selectedPatient!.id,
                        start: startDateTime.toISOString(),
                        end: endDateTime.toISOString(),
                        durationMinutes: duration,
                        consumesCredit: true
                    };

                    this.appointmentService.createAppointment(appointmentData).subscribe({
                        next: (appointment) => {
                            this.notificationService.showSuccess('Cita creada exitosamente');
                            this.closeModal();
                            this.loadAppointments(); // Recargar citas
                        },
                        error: (error) => {
                            this.notificationService.showError('Error al crear la cita');
                            console.error('Error creating appointment:', error);
                        }
                    });
                },
                error: (err) => {
                    // Fallback: crear con 30 minutos si falla la consulta
                    const endDateTime = new Date(startDateTime);
                    endDateTime.setMinutes(endDateTime.getMinutes() + 30);
                    const appointmentData: CreateAppointmentRequest = {
                        patientId: this.selectedPatient!.id,
                        start: startDateTime.toISOString(),
                        end: endDateTime.toISOString(),
                        durationMinutes: 30,
                        consumesCredit: true
                    };
                    this.appointmentService.createAppointment(appointmentData).subscribe({
                        next: (appointment) => {
                            this.notificationService.showSuccess('Cita creada exitosamente');
                            this.closeModal();
                            this.loadAppointments(); // Recargar citas
                        },
                        error: (error) => {
                            this.notificationService.showError('Error al crear la cita');
                            console.error('Error creating appointment:', error);
                        }
                    });
                }
            });
            return; // hemos delegado la creación dentro del subscribe
        }
    }

    // Actualizar cita
    updateAppointment() {
        if (!this.editingAppointment) return;

        this.appointmentService.updateAppointment(this.editingAppointment.id, this.editingAppointment).subscribe({
            next: (appointment) => {
                this.notificationService.showSuccess('Cita actualizada exitosamente');
                this.closeModal();
                this.loadAppointments(); // Recargar citas
            },
            error: (error) => {
                this.notificationService.showError('Error al actualizar la cita');
                console.error('Error updating appointment:', error);
            }
        });
    }

    // Eliminar cita
    deleteAppointment(appointmentId: string) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
            return;
        }

        this.appointmentService.deleteAppointment(appointmentId).subscribe({
            next: () => {
                this.notificationService.showSuccess('Cita eliminada exitosamente');
                this.closeModal();
                this.loadAppointments(); // Recargar citas
            },
            error: (error) => {
                this.notificationService.showError('Error al eliminar la cita');
                console.error('Error deleting appointment:', error);
            }
        });
    }

    // Cerrar modales
    closeModal() {
        this.showPatientModal = false;
        this.showEditModal = false;
        this.selectedPatient = null;
        this.editingAppointment = null;
        this.patientSearchTerm = '';
    }

    // Obtener nombre completo del paciente
    getPatientName(appointment: Appointment): string {
        const patient = this.patients.find(p => p.id === appointment.patientId);
        return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente no encontrado';
    }

    // Export removed from Dashboard; use the monthly export buttons in the Calendar view instead.

    formatDate(date: Date): string {
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    formatDateShort(date: Date): string {
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    }

    formatTime(dateTime: string): string {
        return new Date(dateTime).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Funciones auxiliares para el template
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

    // Formatear céntimos a cadena legible (ej: 5500 -> "55 €")
    formatPriceCents(cents: number): string {
        if (cents === null || cents === undefined || !cents) return '0 €';
        const euros = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
        return euros.replace('.', ',') + ' €';
    }

    // Obtener total del día consultando el CalendarComponent
    getDayTotalCents(): number {
        if (!this.calendarComponent) return 0;
        try {
            return this.calendarComponent.getDayTotal(this.calendarComponent.currentDate);
        } catch (e) {
            return 0;
        }
    }

    formatDateTimeLocal(dateTime: string): string {
        return new Date(dateTime).toISOString().slice(0, 16);
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

    getStatusClass(status: AppointmentStatus): string {
        switch (status) {
            case 'BOOKED':
                return 'bg-primary';
            case 'CANCELLED':
                return 'bg-secondary';
            case 'NO_SHOW':
                return 'bg-warning';
            default:
                return 'bg-light';
        }
    }

    goToToday() {
        if (this.calendarComponent) {
            this.calendarComponent.goToToday();
        }
    }

    previousDay() {
        if (this.calendarComponent) {
            this.calendarComponent.previousPeriod();
        }
    }

    nextDay() {
        if (this.calendarComponent) {
            this.calendarComponent.nextPeriod();
        }
    }

    getDayName(date: Date): string {
        return date.toLocaleDateString('es-ES', { weekday: 'long' });
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
}

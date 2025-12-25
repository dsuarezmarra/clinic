import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateCreditPackRequest, CreditSummary } from '../../models/credit.model';
import { FileUploadData, PatientFile } from '../../models/file.model';
import { Patient } from '../../models/patient.model';
import { AppointmentService } from '../../services/appointment.service';
import { ConfigService } from '../../services/config.service';
import { CreditService } from '../../services/credit.service';
import { EventBusService } from '../../services/event-bus.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';
import { PatientService } from '../../services/patient.service';
import { UtilsService } from '../../services/utils.service';

@Component({
    selector: 'app-paciente-detalle',
    imports: [CommonModule, FormsModule],
    templateUrl: './paciente-detalle.component.html',
    styleUrls: ['./paciente-detalle.component.scss']
})
export class PacienteDetalleComponent implements OnInit {
    patient: Patient | null = null;
    activeTab = 'historial-tab';
    creditSummary: CreditSummary | null = null;
    showAddCreditForm = false;
    loading = false;

    // Estado para la carga de citas
    loadingAppointments = false;

    // Estado para edición de unidades restantes
    editingPackId: string | null = null;
    editingUnitsRemaining: number = 0;

    // Estado para archivos
    patientFiles: PatientFile[] = [];
    loadingFiles = false;
    selectedFile: File | null = null;
    uploadCategory = 'otro';
    uploadDescription = '';
    uploading = false;

    // Precios de configuración
    prices: any = {
        sessionPrice30: 30,
        sessionPrice60: 55,
        bonoPrice30: 135,
        bonoPrice60: 248
    };

    newCredit = {
        type: 'sesion' as 'sesion' | 'bono',
        quantity: 1,
        minutes: 30 as 60 | 30,
        paid: false,
        notes: ''
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private patientService: PatientService,
        private creditService: CreditService,
        private configService: ConfigService,
        private fileService: FileService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef,
        private utils: UtilsService,
        private appointmentService: AppointmentService,
        private eventBusService: EventBusService
    ) { }

    ngOnInit() {
        console.log('PacienteDetalleComponent ngOnInit called');
        const patientId = this.route.snapshot.paramMap.get('id');
        console.log('Patient ID from route:', patientId);

        // activeTab inicializado arriba
        // Verificar si se debe abrir el formulario de créditos automáticamente
        this.route.queryParams.subscribe(params => {
            if (params['showCreditForm'] === 'true') {
                this.showCreditForm();
            }
        });

        if (patientId) {
            this.loadPatientData(patientId);
            this.loadCredits(patientId);
            // loadAppointments se llama desde loadPatientData después de cargar el paciente
        } else {
            console.error('No patient ID found in route');
        }
    }

    loadAppointments(patientId: string) {
        console.log('ð Loading appointments for patient:', patientId);
        this.loadingAppointments = true;
        this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
            next: (appointments: any[]) => {
                console.log('ð Appointments received:', appointments.length, 'appointments');
                
                // Mapear los datos para asegurar formato correcto
                const mapped = appointments.map(app => {
                    return {
                        ...app,
                        date: app.start ? app.start.split('T')[0] : '',
                        time: app.start ? app.start.split('T')[1]?.substring(0, 5) : '',
                        duration: app.durationMinutes || 30,
                        notes: app.notes || ''
                    };
                });
                
                if (this.patient) {
                    console.log('✅ Assigning', mapped.length, 'appointments to patient');
                    this.patient.appointments = mapped;
                } else {
                    console.log('❌ No patient object available for assignment');
                }
                this.loadingAppointments = false;
                // Log para depuración de sesiones
                console.log('creditSummary:', this.creditSummary?.summary);
            },
            error: (error: any) => {
                console.error('Error loading appointments:', error);
                this.loadingAppointments = false;
            }
        });
    }

    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    get appointments(): any[] {
        if (!this.patient?.appointments) {
            return [];
        }
        return this.patient.appointments.map((app: any) => {
            let fecha = '-';
            let hora = '-';
            if (app.start) {
                const d = new Date(app.start);
                if (!isNaN(d.getTime())) {
                    fecha = d.toLocaleDateString('es-ES');
                    hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                }
            }
            return {
                date: fecha,
                time: hora,
                notes: app.notes || '-'
            };
        });
    }

    loadPatientData(id: string) {
        console.log('Loading patient data for ID:', id);
        this.loading = true;
        this.patientService.getPatientById(id).subscribe({
            next: (patient: Patient) => {
                console.log('Patient data loaded:', patient);
                this.patient = patient;
                this.loading = false;
                // Cargar archivos del paciente
                this.loadPatientFiles();
                // Cargar citas del paciente DESPUÉS de tener el objeto patient
                this.loadAppointments(id);
            },
            error: (error: any) => {
                console.error('Error loading patient:', error);
                this.loading = false;
            }
        });
    }

    loadCredits(patientId: string) {
        this.creditService.getPatientCredits(patientId).subscribe({
            next: (creditSummary: CreditSummary) => {
                this.creditSummary = creditSummary;
            },
            error: (error: any) => {
                console.error('Error loading credits:', error);
            }
        });
    }

    showCreditForm() {
        this.showAddCreditForm = true;
        this.resetNewCreditForm();
        this.loadPricesForForm();
    }

    loadPricesForForm() {
        console.log('ð Cargando precios de configuración...');
        this.configService.getPrices().subscribe({
            next: (prices: any) => {
                console.log('✅ Precios cargados:', prices);
                this.prices = {
                    sessionPrice30: prices.sessionPrice30 ?? 30,
                    sessionPrice60: prices.sessionPrice60 ?? 55,
                    bonoPrice30: prices.bonoPrice30 ?? 135,
                    bonoPrice60: prices.bonoPrice60 ?? 248
                };
            },
            error: (error: any) => {
                console.error('❌ Error cargando precios, usando valores por defecto:', error);
                // Mantener valores por defecto ya inicializados
            }
        });
    }

    hideCreditForm() {
        this.showAddCreditForm = false;
        this.resetNewCreditForm();
    }

    resetNewCreditForm() {
        this.newCredit = {
            type: 'sesion',
            quantity: 1,
            minutes: 30,
            paid: false,
            notes: ''
        };
    }

    calculatePackPrice(): number {
        const type = this.newCredit.type;
        const minutes = Number(this.newCredit.minutes);
        const quantity = Number(this.newCredit.quantity) || 1;

        let pricePerUnit = 0;

        if (type === 'sesion') {
            // Sesión individual: usar precio de sesión
            pricePerUnit = minutes === 60 ? this.prices.sessionPrice60 : this.prices.sessionPrice30;
        } else {
            // Bono: usar precio de bono (precio total del bono dividido por cantidad de sesiones)
            const totalBonoPrice = minutes === 60 ? this.prices.bonoPrice60 : this.prices.bonoPrice30;
            // Para bonos, el precio total es el precio configurado (que ya incluye todas las sesiones)
            return Math.round(totalBonoPrice * 100); // Convertir a céntimos
        }

        // Para sesiones individuales, multiplicar por cantidad
        return Math.round(pricePerUnit * quantity * 100); // Convertir a céntimos
    }

    createCreditPack() {
        if (!this.patient) return;
        
        const priceCents = this.calculatePackPrice();
        
        const request: CreateCreditPackRequest = {
            patientId: this.patient.id,
            type: this.newCredit.type === 'sesion' ? 'sesion' : 'bono',
            minutes: Number(this.newCredit.minutes) as 30 | 60,
            quantity: Number(this.newCredit.quantity) || 1,
            paid: !!this.newCredit.paid,
            notes: this.newCredit.notes || undefined,
            priceCents: priceCents
        };

        console.log('createCreditPack request (normalized):', request);
        console.log('ð° Precio calculado:', priceCents, 'céntimos (', (priceCents/100).toFixed(2), '€)');

        this.creditService.createCreditPack(request).subscribe({
            next: (res: any) => {
                console.log('Credit pack created successfully:', res);
                this.hideCreditForm();
                // Recargar la página para actualizar la vista completamente
                window.location.reload();
            },
            error: (error: any) => {
                console.error('Error creating credit pack (detailed):', error);
                const errMsg = (error && (error.error?.message || error.message || error.statusText || error.status)) || 'Error desconocido';
                this.notificationService.showError(`Error al crear pack: ${errMsg}`);
            }
        });
    }

    deleteCreditPack(packId: string) {
        if (confirm('¿Estás seguro de que quieres eliminar este pack de créditos? Esta acción eliminará también todos los consumos registrados del pack.')) {
            this.creditService.deleteCreditPack(packId).subscribe({
                next: () => {
                    console.log('Credit pack deleted successfully');
                    this.notificationService.showSuccess('Pack de créditos eliminado correctamente');
                    window.location.reload();
                },
                error: (error: any) => {
                    console.error('Error deleting credit pack:', error);
                    this.notificationService.showError('Error al eliminar el pack de créditos');
                }
            });
        }
    }

    togglePackPaymentStatus(pack: any) {
        const newStatus = !pack.paid;

        // Si va a cambiar de "Pendiente de pago" a "Pagado", mostrar confirmación
        if (!pack.paid && newStatus) {
            const packType = pack.label.includes('Bono') ? 'bono' : 'sesión';
            const confirmMessage = `¿Confirma que desea marcar este ${packType} como PAGADO?\n\nPack: ${pack.label}`;

            if (!confirm(confirmMessage)) {
                return; // Cancelar el cambio
            }
        }

        this.creditService.updatePackPaymentStatus(pack.id, newStatus).subscribe({
            next: () => {
                pack.paid = newStatus;
                console.log(`Pack payment status updated to: ${newStatus}`);
                
                // Notificar a otros componentes sobre el cambio de estado de pago
                this.eventBusService.notifyPackPaymentStatusChange({
                    packId: pack.id,
                    paid: newStatus,
                    patientId: this.patient?.id || ''
                });
                
                // Recargar los datos de créditos para actualizar la vista local
                if (this.patient?.id) {
                    this.loadCredits(this.patient.id);
                }
                
                this.notificationService.showSuccess(
                    newStatus ? 'Pack marcado como pagado' : 'Pack marcado como pendiente de pago'
                );
            },
            error: (error: any) => {
                console.error('Error updating pack payment status:', error);
                this.notificationService.showError('Error al actualizar el estado de pago');
            }
        });
    }

    getCreditPacks() {
        const packs = this.creditSummary?.creditPacks || [];
        // Ordenar por fecha de creación descendente (más recientes arriba)
        return packs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    getTotalCredits(): number {
        return this.creditSummary?.summary?.totalCreditsOriginal || 0;
    }

    getRemainingCredits(): number {
        return this.creditSummary?.summary?.totalCreditsRemaining || 0;
    }

    getUsedCredits(): number {
        return this.getTotalCredits() - this.getRemainingCredits();
    }

    getActiveSessions(): number {
        return this.getRemainingCredits();
    }

    goBack() {
        this.router.navigate(['/pacientes']);
    }

    formatDate(date: string | Date): string {
        if (typeof date === 'string') {
            return this.utils.formatDate(date);
        } else if (date instanceof Date) {
            return this.utils.formatDate(date.toISOString());
        } else {
            return 'Sin fecha';
        }
    }

    calculateSessionMinutes(unitsTotal: number, unitsRemaining: number, pack: any): { totalMinutes: number, remainingMinutes: number, usedMinutes: number } {
        const isSession = pack.label.includes('Sesión');
        const is60Min = pack.label.includes('60');

        let minutesPerUnit = 30;
        if (is60Min) {
            minutesPerUnit = isSession ? 60 : 30; // Sesión 60m = 60 min, Bono x60m cada sesión son 60 min
        }

        const totalMinutes = unitsTotal * minutesPerUnit;
        const remainingMinutes = unitsRemaining * minutesPerUnit;
        const usedMinutes = totalMinutes - remainingMinutes;

        return { totalMinutes, remainingMinutes, usedMinutes };
    }

    // Métodos para edición de unidades restantes
    startEditingUnits(pack: any) {
        this.editingPackId = pack.id;
        this.editingUnitsRemaining = pack.unitsRemaining;
    }

    cancelEditingUnits() {
        this.editingPackId = null;
        this.editingUnitsRemaining = 0;
    }

    saveUnitsRemaining(pack: any) {
        if (this.editingUnitsRemaining < 0 || this.editingUnitsRemaining > pack.unitsTotal) {
            alert(`El valor debe estar entre 0 y ${pack.unitsTotal}`);
            return;
        }

        this.creditService.updatePackUnits(pack.id, this.editingUnitsRemaining).subscribe({
            next: () => {
                pack.unitsRemaining = this.editingUnitsRemaining;
                this.cancelEditingUnits();
                console.log('Unidades restantes actualizadas');
                window.location.reload();
            },
            error: (error: any) => {
                console.error('Error updating units:', error);
                alert('Error al actualizar las unidades restantes');
            }
        });
    }

    isEditingPack(packId: string): boolean {
        return this.editingPackId === packId;
    }

    getFullName(): string {
        if (!this.patient) return '';
        return `${this.patient.firstName} ${this.patient.lastName}`;
    }

    calculateAge(): number {
        if (!this.patient?.birthDate) return 0;
        const today = new Date();
        const birthDate = new Date(this.patient.birthDate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    formatDateTime(date: string | Date | null): string {
        return this.utils.formatDateTime(date);
    }

    getCreditTypeLabel(type: string): string {
        return this.utils.getCreditTypeLabel(type);
    }

    getMinutesLabel(minutes: number): string {
        return this.utils.getMinutesLabel(minutes);
    }

    formatPrice(pack: any): string {
        const cents = pack?.priceCents ?? pack?.price_cents ?? 0;
        if (!cents) return '';
        const euros = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
        // Use comma as decimal separator in es locale
        return euros.replace('.', ',') + ' €';
    }

    // Métodos requeridos por el HTML

    getTotalSessions(): number {
        return this.getTotalCredits();
    }

    getUsedSessions(): number {
        return this.getUsedCredits();
    }

    getRemainingSessions(): number {
        return this.getRemainingCredits();
    }

    addCredits() {
        this.createCreditPack();
    }

    onFormValueChange() {
        // Forzar la detección de cambios para asegurar que el getter se recalcule
        this.cdr.detectChanges();
    }

    get equivalentSessions(): number {
        if (!this.newCredit) return 0;

        let sessions = 0;

        if (this.newCredit.type === 'bono') {
            // Bono de 30 min = 5 sesiones de media hora
            // Bono de 60 min = 10 sesiones de media hora
            if (Number(this.newCredit.minutes) === 60) {
                sessions = this.newCredit.quantity * 10;
            } else {
                sessions = this.newCredit.quantity * 5;
            }
        } else {
            // Sesión de 60 min = 2 sesiones de media hora
            // Sesión de 30 min = 1 sesión de media hora
            if (Number(this.newCredit.minutes) === 60) {
                sessions = this.newCredit.quantity * 2;
            } else {
                sessions = this.newCredit.quantity;
            }
        }
        return sessions;
    }

    // Métodos para manejo de archivos
    loadPatientFiles() {
        if (!this.patient) return;

        this.loadingFiles = true;
        this.fileService.getPatientFiles(this.patient.id).subscribe({
            next: (files) => {
                this.patientFiles = files;
                this.loadingFiles = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading patient files:', error);
                this.notificationService.showError('Error al cargar los archivos');
                this.loadingFiles = false;
            }
        });
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            if (this.fileService.isValidFileType(file)) {
                if (file.size <= 10 * 1024 * 1024) { // 10MB
                    this.selectedFile = file;
                } else {
                    this.notificationService.showError('El archivo es demasiado grande (máximo 10MB)');
                    event.target.value = '';
                }
            } else {
                this.notificationService.showError('Tipo de archivo no permitido');
                event.target.value = '';
            }
        }
    }

    uploadFile() {
        if (!this.selectedFile || !this.patient) return;

        this.uploading = true;
        const uploadData: FileUploadData = {
            file: this.selectedFile,
            category: this.uploadCategory,
            description: this.uploadDescription || undefined
        };

        this.fileService.uploadFile(this.patient.id, uploadData).subscribe({
            next: (uploadedFile) => {
                this.patientFiles.unshift(uploadedFile);
                this.selectedFile = null;
                this.uploadDescription = '';
                this.uploadCategory = 'otro';
                this.uploading = false;
                this.notificationService.showSuccess('Archivo subido exitosamente');

                // Limpiar el input de archivo
                const fileInput = document.getElementById('fileInput') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error uploading file:', error);
                this.notificationService.showError('Error al subir el archivo');
                this.uploading = false;
            }
        });
    }

    downloadFile(file: PatientFile) {
        this.fileService.downloadFile(file.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = file.originalName;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                console.error('Error downloading file:', error);
                this.notificationService.showError('Error al descargar el archivo');
            }
        });
    }

    deleteFile(file: PatientFile) {
        if (confirm(`¿Está seguro de que desea eliminar el archivo \"${file.originalName}\"?`)) {
            this.fileService.deleteFile(file.id).subscribe({
                next: () => {
                    this.patientFiles = this.patientFiles.filter(f => f.id !== file.id);
                    this.notificationService.showSuccess('Archivo eliminado exitosamente');
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Error deleting file:', error);
                    this.notificationService.showError('Error al eliminar el archivo');
                }
            });
        }
    }

    getFileIcon(mimeType: string): string {
        return this.fileService.getFileIcon(mimeType);
    }

    formatFileSize(bytes: number): string {
        return this.fileService.formatFileSize(bytes);
    }

    getCategoryColor(category: string): string {
        return this.fileService.getCategoryColor(category);
    }

    getCategoryName(category: string): string {
        return this.fileService.getCategoryName(category);
    }

    isImageFile(mimeType: string): boolean {
        return mimeType.startsWith('image/');
    }

    getFilePreviewUrl(fileId: string): string {
        return this.fileService.getFilePreviewUrl(fileId);
    }

    onImageError(event: any) {
        console.error('Error loading image:', event);
        // Ocultar la imagen si falla
        event.target.style.display = 'none';
    }

    // Métodos legacy que aún se usan en el HTML
    togglePackSessions(packId: string) {
        // Método placeholder - ya no necesario
        console.log('togglePackSessions called for pack:', packId);
    }

    isPackExpanded(packId: string): boolean {
        // Método placeholder - ya no necesario
        return false;
    }

    editPatient() {
        if (this.patient) {
            // Volver a la implementación original que funcionaba
            this.router.navigate(['/pacientes'], {
                queryParams: { edit: this.patient.id }
            });
        }
    }
}
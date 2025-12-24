import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';
import { CreateCreditPackRequest } from '../../models/credit.model';
import { CreatePatientRequest, Patient, PatientListResponse } from '../../models/patient.model';
import { CreditService } from '../../services/credit.service';
import { NotificationService } from '../../services/notification.service';
import { PatientService } from '../../services/patient.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-pacientes',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmModalComponent
  ],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.scss'
})
export class PacientesComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = false;
  searchTerm = '';

  // Pagination states
  currentPage = 1;
  pageSize = 10;
  totalPatients = 0;
  totalPages = 0;
  pageSizeOptions = [10, 50, 100];

  // Math para usar en plantilla
  Math = Math;

  // Form states
  showCreateForm = false;
  selectedPatient: Patient | null = null;
  patientFormData: CreatePatientRequest = {
    firstName: '',
    lastName: '',
    phone: '',
    phone2: '',
    email: '',
    address: '',
    dni: '',
    cp: '',
    city: '',
    province: '',
    birthDate: '',
    family_contact: '',
    notes: ''
  };
  locationProvinces: Array<{ code: string; name: string }> = [];
  locationCities: string[] = [];

  // Credit form states
  showAddCreditForm = false;
  selectedPatientForCredits: Patient | null = null;
  creditFormData = {
    type: 'sesion' as 'sesion' | 'bono',
    quantity: 1,
    minutes: 30 as 60 | 30,
    paid: false,
    notes: ''
  };

  // Confirm modal states
  showDeleteConfirm = false;
  patientToDelete: Patient | null = null;
  deleteLoading = false;
  constructor(
    private patientService: PatientService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private creditService: CreditService,
    private cdr: ChangeDetectorRef,
    private utils: UtilsService
  ) { }

  ngOnInit() {
    this.loadPatients();

    // Cargar provincias y localidades para autocompletar
    this.patientService.getLocations().subscribe({
      next: (res: any) => {
        const loc = res.locations || res;
        this.locationProvinces = loc.provinces || [];
        // Default: cargar ciudades de la primera provincia si existe
        if (loc.cities) {
          const first = this.locationProvinces[0]?.name;
          this.locationCities = first ? (loc.cities[first] || []) : [];
        }
      },
      error: (err: any) => {
        console.warn('No se pudieron cargar localizaciones:', err);
      }
    });

    // Mantener compatibilidad con queryParams
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        this.loadPatientsAndEdit(params['edit']);
      }
    });
  }

  loadPatients() {
    this.loading = true;
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm.trim() || undefined
    };

    this.patientService.getPatients(params).subscribe({
      next: (response: PatientListResponse) => {
        // El backend ya envÃ­a los pacientes ordenados por nombre, luego apellido
        this.patients = response.patients;
        this.filteredPatients = response.patients;
        this.totalPatients = response.pagination.total;
        this.totalPages = response.pagination.pages;
        this.loading = false;
        this.cdr.detectChanges();

        // Cargar una previsualizaciÃ³n de precio para los pacientes actuales
        this.loadBatchPricePreview();
      },
      error: (error: any) => {
        console.error('Error loading patients:', error);
        this.notificationService.showError('Error al cargar pacientes');
        this.loading = false;
      }
    });
  }

  formatPriceCents(cents: number | undefined | null): string {
    if (!cents) return '';
    const euros = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
    return euros.replace('.', ',') + ' €';
  }

  // Optimizado: carga créditos de todos los pacientes visibles en una sola petición
  loadBatchPricePreview() {
    const patientIds = this.filteredPatients.map(p => p.id);
    if (patientIds.length === 0) return;

    this.creditService.getBatchCredits(patientIds).subscribe({
      next: (response) => {
        this.filteredPatients.forEach(patient => {
          const creditInfo = response.credits[patient.id];
          if (creditInfo && creditInfo.totalPriceCents > 0) {
            (patient as any)['pricePreview'] = this.formatPriceCents(creditInfo.totalPriceCents);
            (patient as any)['activeCredits'] = creditInfo.activeCredits;
          } else {
            (patient as any)['pricePreview'] = '';
            (patient as any)['activeCredits'] = 0;
          }
        });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.warn('Error loading batch credits:', err);
        // Fallback silencioso - no mostrar precios
        this.filteredPatients.forEach(patient => {
          (patient as any)['pricePreview'] = '';
        });
      }
    });
  }

  loadPricePreview(patient: Patient) {
    // small, best-effort call to fetch patient packs and store first pack price
    this.creditService.getPatientCredits(patient.id).subscribe({
      next: (res: any) => {
        const packs = res.creditPacks || [];
        if (packs.length > 0) {
          // Sum total priceCents of all packs with unitsRemaining > 0
          const active = packs.filter((p: any) => (p.unitsRemaining || 0) > 0);
          const totalCents = active.reduce((s: number, p: any) => s + (Number(p.priceCents) || 0), 0);
          (patient as any)["pricePreview"] = totalCents > 0 ? this.formatPriceCents(totalCents) : '';
        } else {
          (patient as any)["pricePreview"] = '';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        // ignore errors for preview
        (patient as any)["pricePreview"] = '';
      }
    });
  }

  loadPatientsAndEdit(patientId: string) {
    // Primero cargar el paciente especÃ­fico para editarlo
    this.patientService.getPatientById(patientId).subscribe({
      next: (patient: Patient) => {
        // Abrir directamente el modal de ediciÃ³n con el paciente encontrado
        this.editPatient(patient);
        // Limpiar el query parameter
        this.router.navigate(['/pacientes']);
      },
      error: (error: any) => {
        console.error('Error loading patient for edit:', error);
        this.notificationService.showError('Error al cargar el paciente para editar');
        // Si no se puede cargar el paciente especÃ­fico, intentar buscarlo en la lista actual
        const patientToEdit = this.patients.find(p => p.id === patientId);
        if (patientToEdit) {
          this.editPatient(patientToEdit);
          this.router.navigate(['/pacientes']);
        }
      }
    });
  }

  filterPatients() {
    // La bÃºsqueda ahora se maneja en el servidor
    this.onSearchChange();
  }

  savePatient() {
    if (!this.patientFormData.firstName || !this.patientFormData.lastName || !this.patientFormData.phone) {
      this.notificationService.showError('Por favor complete los campos obligatorios');
      return;
    }

    // DNI es obligatorio
    if (!this.patientFormData.dni || !this.patientFormData.dni.trim()) {
      this.notificationService.showError('DNI es obligatorio');
      return;
    }

    console.log('ðŸ“¤ Enviando datos del paciente:', this.patientFormData);

    this.loading = true;

    if (this.selectedPatient) {
      // Actualizar paciente existente
      console.log('ðŸ“ Actualizando paciente ID:', this.selectedPatient.id);
      this.patientService.updatePatient(this.selectedPatient.id, this.patientFormData).subscribe({
        next: (updatedPatient: Patient) => {
          const index = this.patients.findIndex(p => p.id === updatedPatient.id);
          if (index !== -1) {
            this.patients[index] = updatedPatient;
            this.filterPatients();
          }
          this.notificationService.showSuccess('Paciente actualizado exitosamente');
          this.cancelForm();
          // Recargar todos los datos despuÃ©s de actualizar el paciente
          this.loadPatients();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error updating patient:', error);
          this.notificationService.showError('Error al actualizar el paciente');
          this.loading = false;
        }
      });
    } else {
      // Crear nuevo paciente
      console.log('ðŸ†• Creando nuevo paciente');
      this.patientService.createPatient(this.patientFormData).subscribe({
        next: (newPatient: Patient) => {
          this.patients.push(newPatient);
          this.filterPatients();
          this.notificationService.showSuccess('Paciente creado exitosamente');
          this.cancelForm();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error creating patient:', error);
          this.notificationService.showError('Error al crear el paciente');
          this.loading = false;
        }
      });
    }
  }

  // Cuando el usuario introduce/modifica el CP, intentar autocompletar provincia/localidad
  onCpChange(value: string) {
    const cp = (value || '').toString().trim();
    this.patientFormData.cp = cp;
    if (cp.length === 5 && /^\d{5}$/.test(cp)) {
      this.patientService.lookupByCp(cp).subscribe({
        next: (res: any) => {
          if (res && res.province) {
            this.patientFormData.province = res.province;
            this.onProvinceChange(res.province || '');
            // Si sÃ³lo hay una localidad, autoselect
            if (res.cities && res.cities.length === 1) {
              this.patientFormData.city = res.cities[0];
            }
          } else if (res && res.provinces && res.provinces.length === 1) {
            // fallback si backend devuelve sÃ³lo provincias
            this.patientFormData.province = res.provinces[0].name;
            this.onProvinceChange(this.patientFormData.province || '');
          }
        },
        error: (err: any) => {
          // No crÃ­tico; dejar que el usuario seleccione manualmente
          console.debug('Lookup CP fallÃ³:', err?.message || err);
        }
      });
    }
  }

  cancelForm() {
    this.showCreateForm = false;
    this.selectedPatient = null;
    this.resetForm();
  }

  toggleCreateForm() {
    if (this.showCreateForm) {
      // Si el formulario estÃ¡ abierto, cancelar (mismo comportamiento que cancelForm)
      this.cancelForm();
    } else {
      // Si el formulario estÃ¡ cerrado, abrirlo
      this.showCreateForm = true;
    }
  }

  resetForm() {
    this.patientFormData = {
      firstName: '',
      lastName: '',
      phone: '',
      phone2: '',
      email: '',
      address: '',
      dni: '',
      cp: '',
      city: '',
      province: '',
      birthDate: '',
      family_contact: '',
      notes: ''
    };
  }

  // Determine if the Save button should be enabled.
  // Use explicit required-field checks instead of depending on form.valid which may include other validations.
  canSave(): boolean {
    if (this.loading) return false;
    const fn = (this.patientFormData.firstName || '').toString().trim();
    const ln = (this.patientFormData.lastName || '').toString().trim();
    const ph = (this.patientFormData.phone || '').toString().trim();
    const dni = (this.patientFormData.dni || '').toString().trim();
    return !!(fn && ln && ph && dni);
  }

  editPatient(patient: Patient) {
    console.log('ðŸ” Editando paciente:', patient);
    console.log('ðŸ” DNI disponible:', patient.dni);
    console.log('ðŸ” Datos completos:', {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dni: (patient as any).dni,
      cp: (patient as any).cp,
      city: (patient as any).city,
      province: (patient as any).province
    });

    // Si el paciente no tiene todos los datos necesarios (por ejemplo, viene de paginaciÃ³n),
    // necesitamos cargarlo completo desde el servidor
    if (!(patient as any).dni || (patient as any).dni === undefined) {
      console.log('âš ï¸ Paciente no tiene DNI, cargando datos completos...');
      this.loading = true;
      this.patientService.getPatientById(patient.id).subscribe({
        next: (fullPatient: Patient) => {
          console.log('âœ… Datos completos cargados:', fullPatient);
          this.editPatientWithFullData(fullPatient);
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading patient details:', error);
          this.notificationService.showError('Error al cargar los datos del paciente');
          this.loading = false;
        }
      });
    } else {
      // El paciente ya tiene todos los datos necesarios
      console.log('âœ… Paciente tiene todos los datos, editando directamente');
      this.editPatientWithFullData(patient);
    }
  }

  private editPatientWithFullData(patient: Patient) {
    this.selectedPatient = patient;
    this.showCreateForm = true;

    // Convertir fecha para el input HTML date
    let formattedBirthDate = '';
    if (patient.birthDate) {
      try {
        const date = new Date(patient.birthDate);
        if (!isNaN(date.getTime())) {
          formattedBirthDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
      } catch (error) {
        console.error('Error formateando fecha:', error);
      }
    }

    this.patientFormData = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      phone2: (patient as any).phone2 || '',
      email: patient.email || '',
      address: patient.address || '',
      dni: (patient as any).dni || '',
      cp: (patient as any).cp || '',
      city: (patient as any).city || '',
      province: (patient as any).province || '',
      birthDate: formattedBirthDate,
      family_contact: (patient as any).family_contact || '',
      notes: patient.notes || ''
    };

    // Asegurar que las localidades se carguen segÃºn la provincia existente cuando se edita
    if (this.patientFormData.province) {
      // Llamada que poblarÃ¡ `locationCities`
      this.onProvinceChange(this.patientFormData.province);
    }
  }

  onProvinceChange(value: string) {
    const prov = (value || '').toString().trim();
    if (!prov) {
      this.locationCities = [];
      // also clear selected city when province cleared
      this.patientFormData.city = '';
      return;
    }

    // Buscar ciudades para la provincia seleccionada y limpiar la ciudad si no pertenece a la nueva provincia
    this.patientService.getLocations().subscribe({
      next: (res: any) => {
        const loc = res.locations || res;
        this.locationCities = (loc.cities && loc.cities[prov]) ? loc.cities[prov] : [];
        // Si la ciudad actual no estÃ¡ dentro de las ciudades disponibles, limpiarla
        if (this.patientFormData.city && !this.locationCities.includes(this.patientFormData.city)) {
          this.patientFormData.city = '';
        }
      },
      error: () => {
        this.locationCities = [];
        this.patientFormData.city = '';
      }
    });
  }

  viewPatient(patient: Patient) {
    // Navegar a la página de detalle del paciente
    this.router.navigate(['/pacientes', patient.id]);
  }

  // Mostrar modal de confirmación para eliminar paciente
  deletePatient(patient: Patient) {
    this.patientToDelete = patient;
    this.showDeleteConfirm = true;
  }

  // Confirmar eliminación desde el modal
  confirmDeletePatient() {
    if (!this.patientToDelete) return;

    this.deleteLoading = true;
    this.patientService.deletePatient(this.patientToDelete.id).subscribe({
      next: () => {
        this.patients = this.patients.filter(p => p.id !== this.patientToDelete!.id);
        this.filterPatients();
        this.notificationService.showSuccess('Paciente eliminado exitosamente');
        this.cancelDeletePatient();
      },
      error: (error: any) => {
        console.error('Error deleting patient:', error);
        this.notificationService.showError('Error al eliminar el paciente');
        this.deleteLoading = false;
      }
    });
  }

  // Cancelar eliminación
  cancelDeletePatient() {
    this.showDeleteConfirm = false;
    this.patientToDelete = null;
    this.deleteLoading = false;
  }

  // Utility functions
  getFullName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }

  calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  formatDate(dateString: string): string {
    return this.utils.formatDate(dateString);
  }

  trackByPatientId(index: number, patient: Patient): string {
    return patient.id;
  }

  /**
   * Busca el paciente por ID y abre el modal de ediciÃ³n
   */
  openEditPatientModalById(patientId: string) {
    const patient = this.patients.find(p => String(p.id) === String(patientId));
    if (patient) {
      this.editPatient(patient);
    } else {
      // Si no estÃ¡ en la lista actual, buscar el paciente por ID y cargarlo
      this.patientService.getPatientById(patientId).subscribe({
        next: (foundPatient: Patient) => {
          this.editPatient(foundPatient);
        },
        error: (error: any) => {
          console.error('Error finding patient:', error);
          this.notificationService.showError('No se encontrÃ³ el paciente para editar');
        }
      });
    }
  }

  addSessionsToPatient(patient: Patient): void {
    // Abrir el modal de Sesiones para este paciente
    this.selectedPatientForCredits = patient;
    this.showAddCreditForm = true;
    this.resetCreditForm();
  }

  showCreditForm(patient: Patient): void {
    this.selectedPatientForCredits = patient;
    this.showAddCreditForm = true;
    this.resetCreditForm();
  }

  hideCreditForm(): void {
    this.showAddCreditForm = false;
    this.selectedPatientForCredits = null;
    this.resetCreditForm();
  }

  resetCreditForm(): void {
    this.creditFormData = {
      type: 'sesion' as 'sesion' | 'bono',
      quantity: 1,
      minutes: 30 as 60 | 30,
      paid: false,
      notes: ''
    };
  }

  onFormValueChange() {
    console.log('Form value changed:', this.creditFormData);
    // Forzar la detecciÃ³n de cambios para asegurar que el getter se recalcule
    this.cdr.detectChanges();
  }

  // Getter para calcular sesiones equivalentes en tiempo real
  get equivalentSessions(): number {
    if (!this.creditFormData?.quantity) return 0;

    let equivalentSessions = this.creditFormData.quantity;

    console.log('Calculating equivalent sessions:', {
      quantity: this.creditFormData.quantity,
      type: this.creditFormData.type,
      minutes: this.creditFormData.minutes,
      minutesType: typeof this.creditFormData.minutes
    });

    // Si es un bono, multiplicar por 5 (1 bono = 5 sesiones del mismo tipo)
    if (this.creditFormData.type === 'bono') {
      equivalentSessions *= 5;
      console.log('After bono multiplication:', equivalentSessions);
    }

    // Si las sesiones son de 60 minutos, convertir a sesiones de 30 min (multiplicar por 2)
    // Esto se aplica tanto a sesiones individuales como a bonos
    if (Number(this.creditFormData.minutes) === 60) {
      equivalentSessions *= 2;
      console.log('After 60min multiplication:', equivalentSessions);
    }

    console.log('Final result:', equivalentSessions);
    return equivalentSessions;
  }

  // MÃ©todo legacy mantenido para compatibilidad
  calculateEquivalentSessions(): number {
    return this.equivalentSessions;
  }

  addCredits(): void {
    if (!this.selectedPatientForCredits) return;

    // Mapear el tipo del frontend al backend
    const backendType = this.creditFormData.type === 'sesion' ? 'sesion' : 'bono';

    // Asegurar tipos correctos (ngModel puede devolver strings)
    const creditData: CreateCreditPackRequest = {
      patientId: this.selectedPatientForCredits.id,
      type: backendType,
      minutes: Number(this.creditFormData.minutes) as 30 | 60,
      quantity: Number(this.creditFormData.quantity) || 1,
      paid: !!this.creditFormData.paid,
      notes: this.creditFormData.notes || undefined
    };

    console.log('Creating credit pack with data (normalized):', creditData);

    this.creditService.createCreditPack(creditData).subscribe({
      next: (credit: any) => {
        console.log('Credit pack created successfully:', credit);
        this.notificationService.showSuccess('Sesiones aÃ±adidos correctamente');
        this.hideCreditForm();
        // Recargar la lista de pacientes para actualizar los totales
        this.loadPatients();
        // Forzar la detecciÃ³n de cambios
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error adding credit (detailed):', error);
        const errMsg = (error && (error.error?.message || error.message || error.statusText || error.status)) || 'Error desconocido';
        this.notificationService.showError(`Error al aÃ±adir Sesiones: ${errMsg}`);
      }
    });
  }

  getCreditTypeLabel(type: string): string {
    return this.utils.getCreditTypeLabel(type);
  }

  getMinutesLabel(minutes: number): string {
    return this.utils.getMinutesLabel(minutes);
  }

  // MÃ©todos de paginaciÃ³n
  onPageSizeChange() {
    this.currentPage = 1; // Reiniciar a la primera pÃ¡gina
    this.loadPatients();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPatients();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPatients();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPatients();
    }
  }

  // Actualizar bÃºsqueda para reiniciar paginaciÃ³n
  onSearchChange() {
    this.currentPage = 1;
    this.loadPatients();
  }

  // Obtener rango de pÃ¡ginas para mostrar
  getPageRange(): number[] {
    const range = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }
}


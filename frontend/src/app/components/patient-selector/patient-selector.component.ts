import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Patient } from '../../models/patient.model';

@Component({
    selector: 'app-patient-selector',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './patient-selector.component.html',
    styleUrls: ['./patient-selector.component.scss']
})
export class PatientSelectorComponent implements OnChanges {
    @Input() patients: Patient[] = [];
    @Input() show: boolean = false;
    @Output() select = new EventEmitter<Patient>();
    @Output() close = new EventEmitter<void>();
    @ViewChild('searchInput') searchInput!: ElementRef;
    
    searchTerm: string = '';

    ngOnChanges() {
        // Enfocar el input cuando se muestra el modal
        if (this.show) {
            setTimeout(() => {
                if (this.searchInput && this.searchInput.nativeElement) {
                    this.searchInput.nativeElement.focus();
                    this.searchInput.nativeElement.click();
                }
            }, 100);
        }
    }

    get filteredPatients(): Patient[] {
        if (!this.searchTerm.trim()) return this.patients;
        const term = this.searchTerm.toLowerCase();
        return this.patients.filter(p =>
            p.firstName.toLowerCase().includes(term) ||
            p.lastName.toLowerCase().includes(term) ||
            p.phone.includes(term) ||
            (p.email && p.email.toLowerCase().includes(term))
        );
    }

    selectPatient(patient: Patient) {
        this.select.emit(patient);
    }

    closeModal() {
        this.close.emit();
    }
}

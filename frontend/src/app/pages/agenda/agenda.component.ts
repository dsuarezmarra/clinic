import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CalendarComponent } from './calendar/calendar.component';

@Component({
    selector: 'app-agenda',
    imports: [
        CommonModule,
        CalendarComponent
    ],
    templateUrl: './agenda.component.html',
    styleUrl: './agenda.component.scss'
})
export class AgendaComponent {
  constructor() { }
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CovoiturageRoutingModule } from './covoiturage-routing.module';

import { CovoiturageListComponent } from './components/covoiturage-list/covoiturage-list.component';
import { CovoiturageDetailComponent } from './components/covoiturage-detail/covoiturage-detail.component';
import { CovoiturageCreateComponent } from './components/covoiturage-create/covoiturage-create.component';
import { CovoiturageMesTrajetsComponent } from './components/covoiturage-mes-trajets/covoiturage-mes-trajets.component';
import { CovoiturageMesReservationsComponent } from './components/covoiturage-mes-reservations/covoiturage-mes-reservations.component';
import { CovoiturageGestionReservationsComponent } from './components/covoiturage-gestion-reservations/covoiturage-gestion-reservations.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { CovoiturageScheduleCreateComponent } from './components/covoiturage-schedule-create/covoiturage-schedule-create.component';
import { CovoiturageMesSchedulesComponent } from './components/covoiturage-mes-schedules/covoiturage-mes-schedules.component';

@NgModule({
  declarations: [
    CovoiturageListComponent,
    CovoiturageDetailComponent,
    CovoiturageCreateComponent,
    CovoiturageMesTrajetsComponent,
    CovoiturageMesReservationsComponent,
    CovoiturageGestionReservationsComponent,
    ConfirmModalComponent,
    CovoiturageScheduleCreateComponent,
    CovoiturageMesSchedulesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    CovoiturageRoutingModule
  ]
})
export class CovoiturageModule { }

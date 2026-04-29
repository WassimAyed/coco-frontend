import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CovoiturageListComponent } from './components/covoiturage-list/covoiturage-list.component';
import { CovoiturageDetailComponent } from './components/covoiturage-detail/covoiturage-detail.component';
import { CovoiturageCreateComponent } from './components/covoiturage-create/covoiturage-create.component';
import { CovoiturageMesTrajetsComponent } from './components/covoiturage-mes-trajets/covoiturage-mes-trajets.component';
import { CovoiturageMesReservationsComponent } from './components/covoiturage-mes-reservations/covoiturage-mes-reservations.component';
import { CovoiturageGestionReservationsComponent } from './components/covoiturage-gestion-reservations/covoiturage-gestion-reservations.component';
import { CovoiturageScheduleCreateComponent } from './components/covoiturage-schedule-create/covoiturage-schedule-create.component';
import { CovoiturageMesSchedulesComponent } from './components/covoiturage-mes-schedules/covoiturage-mes-schedules.component';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: CovoiturageListComponent },
  { path: 'detail/:id', component: CovoiturageDetailComponent },
  { path: 'create', component: CovoiturageCreateComponent },
  { path: 'mes-trajets', component: CovoiturageMesTrajetsComponent },
  { path: 'mes-reservations', component: CovoiturageMesReservationsComponent },
  { path: 'gestion-reservations', component: CovoiturageGestionReservationsComponent },
  { path: 'schedule/create', component: CovoiturageScheduleCreateComponent },
  { path: 'schedule/edit/:id', component: CovoiturageScheduleCreateComponent },
  { path: 'mes-schedules', component: CovoiturageMesSchedulesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CovoiturageRoutingModule { }

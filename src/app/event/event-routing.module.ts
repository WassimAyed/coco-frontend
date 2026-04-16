import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventDetailComponent } from './components/event-detail/event-detail.component';
import { EventListComponent } from './components/event-list/event-list.component';
import { MyEventsComponent } from './components/my-events/my-events.component';
import { ParticipatedEventsComponent } from './components/participated-events/participated-events.component';
import { authGuard } from '../user-security/guards/auth.guard';

const routes: Routes = [
  { path: '', canActivate: [authGuard], component: EventListComponent },
  { path: 'my-events', component: MyEventsComponent },
  { path: 'participated-events', component: ParticipatedEventsComponent },
  { path: ':id', canActivate: [authGuard], component: EventDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventRoutingModule { }

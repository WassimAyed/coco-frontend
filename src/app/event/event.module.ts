import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventDetailComponent } from './components/event-detail/event-detail.component';
import { EventListComponent } from './components/event-list/event-list.component';
import { EventRoutingModule } from './event-routing.module';

@NgModule({
  declarations: [EventDetailComponent, EventListComponent],
  imports: [
    CommonModule,
    FormsModule,
    EventRoutingModule
  ]
})
export class EventModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubsDetailComponent } from './components/subs-detail/subs-detail.component';
import { SubsListComponent } from './components/subs-list/subs-list.component';
import { SubsPaymentRoutingModule } from './subs-payment-routing.module';

@NgModule({
  declarations: [SubsDetailComponent, SubsListComponent],
  imports: [
    CommonModule,
    SubsPaymentRoutingModule
  ]
})
export class SubsPaymentModule { }

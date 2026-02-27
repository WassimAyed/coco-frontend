import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SubsListComponent } from './components/subs-list/subs-list.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentCancelComponent } from './components/payment-cancel/payment-cancel.component';
import { AdminPlansComponent } from './components/admin-plans/admin-plans.component';
import { AdminSubsComponent } from './components/admin-subs/admin-subs.component';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';

const routes: Routes = [
  { path: '', component: SubsListComponent },
  { path: 'success', component: PaymentSuccessComponent },
  { path: 'cancel', component: PaymentCancelComponent },
  { path: 'admin/plans', component: AdminPlansComponent },
  { path: 'admin/subscriptions', component: AdminSubsComponent },
  { path: 'dashboard', component: UserDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SubsPaymentRoutingModule { }

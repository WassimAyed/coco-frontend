import { Routes } from '@angular/router';
import { HomeUserComponent } from './home-user/home-user.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home-user', pathMatch: 'full' },
  { path: 'home-user', component: HomeUserComponent },
  { path: 'collocation', loadChildren: () => import('./collocation/collocation.module').then(m => m.CollocationModule) },
  { path: 'covoiturage', loadChildren: () => import('./covoiturage/covoiturage.module').then(m => m.CovoiturageModule) },
  { path: 'event', loadChildren: () => import('./event/event.module').then(m => m.EventModule) },
  { path: 'real-estate', loadChildren: () => import('./real-estate/real-estate.module').then(m => m.RealEstateModule) },
  { path: 'subs-payment', loadChildren: () => import('./subs-payment/subs-payment.module').then(m => m.SubsPaymentModule) },
  { path: 'user-security', loadChildren: () => import('./user-security/user-security.module').then(m => m.UserSecurityModule) },
  { path: '**', redirectTo: 'home-user' }
];


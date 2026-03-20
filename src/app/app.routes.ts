import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './shared/layouts/auth-layout/auth-layout.component';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { LandingPageComponent } from './shared/pages/landing-page/landing-page.component';
import { authGuard } from './user-security/guards/auth.guard';
import { guestGuard } from './user-security/guards/guest.guard';
import { LoginPageComponent } from './user-security/pages/login-page/login-page.component';
import { RegisterPageComponent } from './user-security/pages/register-page/register-page.component';
import { UserProfilePageComponent } from './user-security/pages/user-profile-page/user-profile-page.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        component: LandingPageComponent
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        component: UserProfilePageComponent
      }
    ]
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        component: LoginPageComponent
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        component: RegisterPageComponent
      }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent
  },
  { path: 'collocation', loadChildren: () => import('./collocation/collocation.module').then(m => m.CollocationModule) },
  { path: 'covoiturage', loadChildren: () => import('./covoiturage/covoiturage.module').then(m => m.CovoiturageModule) },
  { path: 'event', loadChildren: () => import('./event/event.module').then(m => m.EventModule) },
  { path: 'real-estate', loadChildren: () => import('./real-estate/real-estate.module').then(m => m.RealEstateModule) },
  { path: 'subs-payment', loadChildren: () => import('./subs-payment/subs-payment.module').then(m => m.SubsPaymentModule) },
  { path: 'user-security', loadChildren: () => import('./user-security/user-security.module').then(m => m.UserSecurityModule) },
  { path: '**', redirectTo: '' }
];


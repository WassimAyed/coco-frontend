import { Routes } from '@angular/router';
import { HomeUserComponent } from './home-user/home-user.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home-user', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./shared/pages/landing-page/landing-page.component').then((m) => m.LandingPageComponent)
      }
    ]
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./user-security/pages/login-page/login-page.component').then((m) => m.LoginPageComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./user-security/pages/register-page/register-page.component').then((m) => m.RegisterPageComponent)
      }
    ]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent)
  },
  { path: 'collocation', loadChildren: () => import('./collocation/collocation.module').then(m => m.CollocationModule) },
  { path: 'covoiturage', loadChildren: () => import('./covoiturage/covoiturage.module').then(m => m.CovoiturageModule) },
  { path: 'event', loadChildren: () => import('./event/event.module').then(m => m.EventModule) },
  { path: 'real-estate', loadChildren: () => import('./real-estate/real-estate.module').then(m => m.RealEstateModule) },
  { path: 'subs-payment', loadChildren: () => import('./subs-payment/subs-payment.module').then(m => m.SubsPaymentModule) },
  { path: 'user-security', loadChildren: () => import('./user-security/user-security.module').then(m => m.UserSecurityModule) },
  { path: '**', redirectTo: '' }
];


import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './shared/layouts/auth-layout/auth-layout.component';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { LandingPageComponent } from './shared/pages/landing-page/landing-page.component';
import { adminGuard } from './user-security/guards/admin.guard';
import { guestGuard } from './user-security/guards/guest.guard';
import { EmailVerificationPageComponent } from './user-security/pages/email-verification-page/email-verification-page.component';
import { profileGuard } from './user-security/guards/profile.guard';
import { LoginPageComponent } from './user-security/pages/login-page/login-page.component';
import { OauthCallbackPageComponent } from './user-security/pages/oauth-callback-page/oauth-callback-page.component';
import { RegisterPageComponent } from './user-security/pages/register-page/register-page.component';
import { TwoFactorPageComponent } from './user-security/pages/two-factor-page/two-factor-page.component';
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
        canActivate: [profileGuard],
        component: UserProfilePageComponent
      }
    ]
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login/2fa',
        canActivate: [guestGuard],
        component: TwoFactorPageComponent
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        component: LoginPageComponent
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        component: RegisterPageComponent
      },
      {
        path: 'verify-email',
        canActivate: [guestGuard],
        component: EmailVerificationPageComponent
      },
      {
        path: 'oauth2/callback',
        canActivate: [guestGuard],
        component: OauthCallbackPageComponent
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
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


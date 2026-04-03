import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './shared/layouts/auth-layout/auth-layout.component';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { LandingPageComponent } from './shared/pages/landing-page/landing-page.component';
import { adminGuard } from './user-security/guards/admin.guard';
import { guestGuard } from './user-security/guards/guest.guard';
import { profileGuard } from './user-security/guards/profile.guard';
import { EmailVerificationPageComponent } from './user-security/pages/email-verification-page/email-verification-page.component';
import { LoginPageComponent } from './user-security/pages/login-page/login-page.component';
import { OauthCallbackPageComponent } from './user-security/pages/oauth-callback-page/oauth-callback-page.component';
import { RegisterPageComponent } from './user-security/pages/register-page/register-page.component';
import { TwoFactorPageComponent } from './user-security/pages/two-factor-page/two-factor-page.component';
import { UserProfilePageComponent } from './user-security/pages/user-profile-page/user-profile-page.component';
import { UserDashboardComponent } from './subs-payment/components/user-dashboard/user-dashboard.component';
import { CreateProfileComponent } from './user-security/pages/create-profile/create-profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'auth/login', redirectTo: 'login', pathMatch: 'full' },
  { path: 'auth/register', redirectTo: 'register', pathMatch: 'full' },
{
  path: 'create/profile',
  component: CreateProfileComponent
},
  { path: 'auth/verify-email', redirectTo: 'verify-email', pathMatch: 'full' },
  { path: 'auth/login/2fa', redirectTo: 'login/2fa', pathMatch: 'full' },
  { path: 'auth/oauth2/callback', redirectTo: 'oauth2/callback', pathMatch: 'full' },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login/2fa', canActivate: [guestGuard], component: TwoFactorPageComponent },
      { path: 'login', canActivate: [guestGuard], component: LoginPageComponent },
      { path: 'register', canActivate: [guestGuard], component: RegisterPageComponent },
      { path: 'verify-email', canActivate: [guestGuard], component: EmailVerificationPageComponent },
      { path: 'oauth2/callback', canActivate: [guestGuard], component: OauthCallbackPageComponent },
    ]
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: 'landing', component: LandingPageComponent },
      { path: 'profile', canActivate: [profileGuard], component: UserProfilePageComponent },
      { path: 'collocation', loadChildren: () => import('./collocation/collocation.module').then((m) => m.CollocationModule) },
      { path: 'covoiturage', loadChildren: () => import('./covoiturage/covoiturage.module').then((m) => m.CovoiturageModule) },
      { path: 'event', loadChildren: () => import('./event/event.module').then((m) => m.EventModule) },
      { path: 'real-estate', loadChildren: () => import('./real-estate/real-estate.module').then((m) => m.RealEstateModule) },
      { path: 'subs-payment', loadChildren: () => import('./subs-payment/subs-payment.module').then((m) => m.SubsPaymentModule) },
      { path: 'user-dashboard', component: UserDashboardComponent },
      { path: 'user-security', loadChildren: () => import('./user-security/user-security.module').then((m) => m.UserSecurityModule) },
      { path: 'lost-found', loadChildren: () => import('./lost-found/lost-found.routes').then((m) => m.LOST_FOUND_ROUTES) }
    ]
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    component: AdminLayoutComponent
  },
  { path: '**', redirectTo: 'landing' }
];

// End of routes configuration

import { Routes } from '@angular/router';
import { HomeUserComponent } from './home-user/home-user.component';
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
  // Redirect from root to landing page (which is inside PublicLayout)
  { path: '', redirectTo: 'landing', pathMatch: 'full' },

  // Public routes – all these will display the navbar (PublicLayout)
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: 'landing', component: LandingPageComponent },
      { path: 'profile', canActivate: [profileGuard], component: UserProfilePageComponent },
      // Lazy‑loaded modules (they will also inherit the navbar)
      { path: 'collocation', loadChildren: () => import('./collocation/collocation.module').then(m => m.CollocationModule) },
      { path: 'covoiturage', loadChildren: () => import('./covoiturage/covoiturage.module').then(m => m.CovoiturageModule) },
      { path: 'services/event', redirectTo: 'event', pathMatch: 'full' },
      { path: 'event', loadChildren: () => import('./event/event.module').then(m => m.EventModule) },
      { path: 'real-estate', loadChildren: () => import('./real-estate/real-estate.module').then(m => m.RealEstateModule) },
      { path: 'subs-payment', loadChildren: () => import('./subs-payment/subs-payment.module').then(m => m.SubsPaymentModule) },
      { path: 'user-security', loadChildren: () => import('./user-security/user-security.module').then(m => m.UserSecurityModule) }
    ]
  },

  // Auth routes – these will use AuthLayout (no navbar)
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'login/2fa', canActivate: [guestGuard], component: TwoFactorPageComponent },
      { path: 'login', canActivate: [guestGuard], component: LoginPageComponent },
      { path: 'register', canActivate: [guestGuard], component: RegisterPageComponent },
      { path: 'verify-email', canActivate: [guestGuard], component: EmailVerificationPageComponent },
      { path: 'oauth2/callback', canActivate: [guestGuard], component: OauthCallbackPageComponent },
      // Optional: default redirect within auth
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    component: AdminLayoutComponent
  },

  // Wildcard – redirect to landing (or any 404 page you prefer)
  { path: '**', redirectTo: 'landing' }
];

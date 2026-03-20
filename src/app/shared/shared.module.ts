import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AmbientBackgroundComponent } from './components/ambient-background/ambient-background.component';
import { AppLoadingComponent } from './components/app-loading/app-loading.component';
import { AuthSplashCursorComponent } from './components/auth-splash-cursor/auth-splash-cursor.component';
import { LogoComponent } from './components/logo/logo.component';
import { UserMenuComponent } from './components/user-menu/user-menu.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';

@NgModule({
  declarations: [
    AmbientBackgroundComponent,
    AppLoadingComponent,
    AuthLayoutComponent,
    AuthSplashCursorComponent,
    LandingPageComponent,
    LogoComponent,
    PublicLayoutComponent,
    UserMenuComponent
  ],
  exports: [
    AmbientBackgroundComponent,
    AppLoadingComponent,
    AuthLayoutComponent,
    AuthSplashCursorComponent,
    LandingPageComponent,
    LogoComponent,
    PublicLayoutComponent,
    UserMenuComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule
  ]
})
export class SharedModule { }

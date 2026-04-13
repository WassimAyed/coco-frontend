import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { UserSecurityModule } from './user-security/user-security.module';
import { UserService } from './user-security/services/user.service';
import { AdminLayoutComponent } from './admin/layouts/admin-layout/admin-layout.component';
import { AdminEventsComponent } from './admin/components/admin-events/admin-events.component';


import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './user-security/interceptors/auth.interceptor';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent, AdminLayoutComponent, AdminEventsComponent],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    LucideAngularModule,
    AppRoutingModule,
    SharedModule,
    UserSecurityModule
  ],
  providers: [
    {
      deps: [UserService],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: (userService: UserService) => () => userService.restoreSession()
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // important
    }
  ]
})
export class AppModule {}
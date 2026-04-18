import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AdminModule } from './admin/admin.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { UserSecurityModule } from './user-security/user-security.module';
import { UserService } from './user-security/services/user.service';
import { AuthCookieInterceptor } from './shared/interceptors/auth-cookie.interceptor';
import { AdminEventsComponent } from './admin/components/admin-events/admin-events.component';
import { EventPaginationModule } from './event/event-pagination.module';
import { AdminPlansComponent } from './subs-payment/components/admin-plans/admin-plans.component';
import { AdminCovoiturageComponent } from './covoiturage/components/admin-covoiturage/admin-covoiturage.component';
import { AdminCollocationComponent } from './collocation/components/admin-collocation/admin-collocation.component';
import { AuthInterceptor } from './user-security/interceptors/auth.interceptor';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent, AdminEventsComponent],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    LucideAngularModule,
    AppRoutingModule,
    AdminModule,
    SharedModule,
    EventPaginationModule,
    UserSecurityModule,
    AdminPlansComponent,
    AdminCovoiturageComponent,
    AdminCollocationComponent,
  ],
  providers: [
    {
      multi: true,
      provide: HTTP_INTERCEPTORS,
      useClass: AuthCookieInterceptor,
    },
    {
      deps: [UserService],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: (userService: UserService) => () => userService.restoreSession(),
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
})
export class AppModule {}

import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { UserService } from './user-security/services/user.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './user-security/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      deps: [UserService],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: (userService: UserService) => () => userService.restoreSession()
    },
     provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};

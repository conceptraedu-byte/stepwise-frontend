import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppShell } from './app/app-shell/app-shell';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/auth.interceptor';


bootstrapApplication(AppShell, {
  providers: [
     provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));

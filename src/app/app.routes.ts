import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { paidUserGuard } from './guards/paid-user.guard';

export const routes: Routes = [

{
  path: '',
  loadComponent: () =>
    import('./pages/landing/landing')
      .then(m => m.Landing),
  canActivate: [paidUserGuard]
},

{
  path: 'about',
  loadComponent: () =>
    import('./pages/about/about')
      .then(m => m.About)
},

{
  path: 'login',
  loadComponent: () =>
    import('./pages/login/login')
      .then(m => m.Login)
},

{
  path: 'register',
  loadComponent: () =>
    import('./pages/register/register')
      .then(m => m.Register)
},

{
  path: 'dashboard',
  loadComponent: () =>
    import('./pages/dashboard/dashboard')
      .then(m => m.Dashboard),
  canActivate: [authGuard]
},

{
  path: 'tutor',
  loadComponent: () =>
    import('./tutor-workspace/tutor-workspace')
      .then(m => m.TutorWorkspaceComponent),
  canActivate: [authGuard]
},

{
  path: 'mock-test',
  loadComponent: () =>
    import('./pages/mock-test/mock-test')
      .then(m => m.MockTest),
  canActivate: [authGuard]
},

{
  path: 'mock-history',
  loadComponent: () =>
    import('./pages/mock-history/mock-history')
      .then(m => m.MockHistory),
  canActivate: [authGuard]
},

{
  path: '**',
  redirectTo: ''
}

];
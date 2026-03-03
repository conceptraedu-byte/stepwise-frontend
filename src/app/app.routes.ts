import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [

 {
  path: 'mock-test',
  loadComponent: () =>
    import('./pages/mock-test/mock-test').then(m => m.MockTest),
  canActivate: [authGuard]
},

    {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: 'tutor',
    loadComponent: () =>
      import('./tutor-workspace/tutor-workspace')
        .then(m => m.TutorWorkspaceComponent)
  },

  {
  path: 'login',
  loadComponent: () =>
    import('./pages/login/login').then(m => m.Login)
}
,

{
  path: 'dashboard',
  loadComponent: () =>
    import('./pages/dashboard/dashboard').then(m => m.Dashboard),
  canActivate: [authGuard]
},

{
  path: 'register',
  loadComponent: () => import('./pages/register/register')
    .then(m => m.Register)
},

{
  path: 'mock-history',
  loadComponent: () =>
    import('./pages/mock-history/mock-history')
      .then(m => m.MockHistory)
}



];

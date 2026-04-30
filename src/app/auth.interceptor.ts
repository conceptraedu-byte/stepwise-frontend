import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

console.log("INTERCEPTOR FROM CORE FOLDER LOADED");

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  console.log("INTERCEPTOR EXECUTED");

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(

    catchError((error) => {

      if (error.status === 401) {

        console.log("Token expired. Redirecting to login...");

        localStorage.removeItem('access_token');

        router.navigate(['/login']);
      }

      return throwError(() => error);
    })

  );
};
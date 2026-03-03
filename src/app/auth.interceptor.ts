import { HttpInterceptorFn } from '@angular/common/http';

console.log("INTERCEPTOR FROM CORE FOLDER LOADED");

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');


  console.log("INTERCEPTOR EXECUTED");
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
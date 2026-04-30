import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { BillingService } from './billing.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:8000';

  private userSubject = new BehaviorSubject<any>(this.getStoredUser());
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private billing: BillingService
  ) {}

  /* -------------------------
     PRIVATE HELPERS
  --------------------------*/

  private getStoredUser() {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }

  /* -------------------------
     LOGIN
  --------------------------*/

  login(email: string, password: string) {

    return this.http.post<any>(`${this.baseUrl}/auth/login`, {
      email,
      password
    }).pipe(

      tap(response => {

        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));

        this.userSubject.next(response.user);

        // 🔥 refresh billing after login
        setTimeout(() => {
          this.billing.refreshBilling();
        }, 200);

      })

    );

  }

  /* -------------------------
     REGISTER
  --------------------------*/

  register(data: any) {

    return this.http.post<any>(`${this.baseUrl}/auth/register`, data)
      .pipe(

        tap(response => {

          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));

          this.userSubject.next(response.user);

          // 🔥 refresh billing after signup
          setTimeout(() => {
            this.billing.refreshBilling();
          }, 200);

        })

      );

  }

  /* -------------------------
     LOGOUT
  --------------------------*/

  logout() {

    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    this.userSubject.next(null);

  }

  /* -------------------------
     INITIALIZE AUTH
  --------------------------*/

  initializeAuth() {

    const token = localStorage.getItem('access_token');
    if (!token) return;

    this.http.get<any>(`${this.baseUrl}/auth/me`)
      .subscribe({

        next: (user) => {

          this.userSubject.next(user);

          // 🔥 refresh billing when app loads
          this.billing.refreshBilling();

        },

        error: () => {
          this.logout();
        }

      });

  }

  /* -------------------------
     HELPERS
  --------------------------*/

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

}
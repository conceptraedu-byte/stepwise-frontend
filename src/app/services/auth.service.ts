import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:8000';

  private userSubject = new BehaviorSubject<any>(this.getStoredUser());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

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
          localStorage.setItem('token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.userSubject.next(response.user);
        })
      );
  }

  /* -------------------------
     LOGOUT
  --------------------------*/

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  initializeAuth() {
  const token = localStorage.getItem('token');
  if (!token) return;

  this.http.get<any>(`${this.baseUrl}/auth/me`)
    .subscribe({
      next: (user) => {
        this.userSubject.next(user);
      },
      error: () => {
        this.logout(); // token invalid or expired
      }
    });
}


  /* -------------------------
     HELPERS
  --------------------------*/

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

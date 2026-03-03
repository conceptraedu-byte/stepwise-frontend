import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  classLevel = '';
  board = '';
  errorMessage = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  register() {

    if (this.password !== this.confirmPassword) {
      this.errorMessage = "Passwords do not match";
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.register({
      name: this.name,
      email: this.email,
      password: this.password,
      class_level: Number(this.classLevel),
      board: this.board
    }).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || "Registration failed";
      }
    });
  }
}

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.css'
})
export class TopNav {

  user: any = null;

  constructor(private auth: AuthService) {
    this.auth.user$.subscribe(user => {
      this.user = user;
    });
  }

  logout() {
    this.auth.logout();
  }
}

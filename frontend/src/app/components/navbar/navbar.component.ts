import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  menuOpen = false;

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.auth.isLoggedIn && !this.auth.user) {
      this.auth.loadUser();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}

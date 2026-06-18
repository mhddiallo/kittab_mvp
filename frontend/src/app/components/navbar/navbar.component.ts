import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  moreOpen = false;
  unreadCount = 0;

  private pollInterval: any;

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.auth.isLoggedIn && !this.auth.user) {
      this.auth.loadUser();
    }
    if (this.auth.isLoggedIn) {
      this.fetchUnreadCount();
      this.pollInterval = setInterval(() => this.fetchUnreadCount(), 30000);
    }
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  async fetchUnreadCount() {
    if (!this.auth.isLoggedIn) return;
    try {
      const res = await fetch(`${environment.apiUrl}/api/conversations/unread-count`, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        this.unreadCount = data.count ?? 0;
      }
    } catch {}
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}

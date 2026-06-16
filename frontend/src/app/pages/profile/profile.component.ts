import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  firstName = '';
  lastName = '';
  address = '';
  phone = '';
  newPhone = '';
  email = '';
  loading = false;
  success = false;
  error = '';

  constructor(public auth: AuthService) {}

  ngOnInit() {
    const u = this.auth.user;
    const load = (u: any) => {
      this.firstName = u.first_name || '';
      this.lastName = u.last_name || '';
      this.address = u.address || '';
      this.phone = u.phone || '';
      this.email = u.email || '';
    };
    if (u) {
      load(u);
    } else {
      this.auth.loadUser().then(() => { if (this.auth.user) load(this.auth.user); });
    }
  }

  get isGoogleUser(): boolean {
    return this.phone.startsWith('google_');
  }

  async save() {
    this.loading = true; this.success = false; this.error = '';
    try {
      const body: any = { first_name: this.firstName, last_name: this.lastName, address: this.address };
      if (this.isGoogleUser && this.newPhone.trim()) body.phone = this.newPhone.trim();
      if (this.email.trim()) body.email = this.email.trim();
      const res = await fetch(`${environment.apiUrl}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.auth.token}` },
        body: JSON.stringify({ first_name: this.firstName, last_name: this.lastName, address: this.address }),
      });
      if (res.ok) {
        await this.auth.loadUser();
        this.success = true;
      } else {
        const d = await res.json();
        this.error = d.detail || 'Erreur lors de la mise à jour';
      }
    } catch { this.error = 'Impossible de contacter le serveur'; }
    this.loading = false;
  }
}

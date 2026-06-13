import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  step: 'phone' | 'otp' | 'profile' = 'phone';
  phone = ''; otp = ''; firstName = ''; lastName = ''; address = '';
  loading = false; devCode = ''; error = '';
  private redirectUrl = '/';

  constructor(private auth: AuthService, private router: Router) {
    // Si déjà connecté, redirige vers l'accueil
    if (this.auth.isLoggedIn) this.router.navigate(['/']);
    // Mémorise la page d'origine (si redirigé depuis un guard)
    const nav = this.router.getCurrentNavigation();
    this.redirectUrl = nav?.extras?.state?.['redirectUrl'] ?? '/';
  }

  async requestOtp() {
    if (!this.phone.trim()) { this.error = 'Veuillez saisir votre numéro'; return; }
    this.loading = true; this.error = '';
    try {
      const res = await fetch('http://localhost:8000/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      this.devCode = data.dev_code ?? '';
      this.step = 'otp';
    } catch (e: any) { this.error = e.message || 'Erreur de connexion'; }
    this.loading = false;
  }

  async verifyOtp() {
    if (!this.otp.trim()) { this.error = 'Veuillez saisir le code'; return; }
    this.loading = true; this.error = '';
    try {
      const res = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.phone, code: this.otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      localStorage.setItem('kittab_token', data.access_token);
      await this.auth.loadUser();
      if (data.is_new_user) {
        this.step = 'profile';
      } else {
        this.router.navigate([this.redirectUrl]);
      }
    } catch (e: any) { this.error = e.message || 'Code invalide'; }
    this.loading = false;
  }

  async completeProfile() {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.error = 'Prénom et nom sont obligatoires'; return;
    }
    this.loading = true; this.error = '';
    try {
      const res = await fetch('http://localhost:8000/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.auth.token}`,
        },
        body: JSON.stringify({ first_name: this.firstName, last_name: this.lastName, address: this.address }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      await this.auth.loadUser();
      this.router.navigate([this.redirectUrl]);
    } catch (e: any) { this.error = e.message; }
    this.loading = false;
  }
}

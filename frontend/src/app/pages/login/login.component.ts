import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({ selector: 'app-login', standalone: true, imports: [RouterLink, CommonModule, FormsModule, NavbarComponent, FooterComponent], templateUrl: './login.component.html' })
export class LoginComponent {
  step: 'phone' | 'otp' | 'profile' = 'phone';
  phone = ''; otp = ''; firstName = ''; lastName = ''; address = '';
  loading = false; devCode = ''; error = '';

  async requestOtp() {
    if (!this.phone.trim()) { this.error = 'Veuillez saisir votre numéro'; return; }
    this.loading = true; this.error = '';
    try {
      const res = await fetch('http://localhost:8000/api/auth/request-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: this.phone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      this.devCode = data.dev_code || ''; this.step = 'otp';
    } catch (e: any) { this.error = e.message || 'Erreur de connexion'; }
    this.loading = false;
  }

  async verifyOtp() {
    if (!this.otp.trim()) { this.error = 'Veuillez saisir le code'; return; }
    this.loading = true; this.error = '';
    try {
      const res = await fetch('http://localhost:8000/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: this.phone, code: this.otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      localStorage.setItem('token', data.access_token);
      if (data.is_new_user) { this.step = 'profile'; } else { window.location.href = '/'; }
    } catch (e: any) { this.error = e.message || 'Code invalide'; }
    this.loading = false;
  }

  async completeProfile() {
    this.loading = true; this.error = '';
    try {
      const res = await fetch('http://localhost:8000/api/auth/complete-profile', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ first_name: this.firstName, last_name: this.lastName, address: this.address }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      window.location.href = '/';
    } catch (e: any) { this.error = e.message; }
    this.loading = false;
  }
}

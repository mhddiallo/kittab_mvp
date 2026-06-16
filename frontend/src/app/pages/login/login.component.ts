import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, AfterViewInit {
  step: 'phone' | 'otp' | 'profile' | 'google-otp' = 'phone';
  phone = ''; otp = ''; firstName = ''; lastName = ''; address = ''; email = '';
  profilePhone = ''; googleOtp = ''; googleDevCode = '';
  loading = false; devCode = ''; error = '';
  private redirectUrl = '/';

  constructor(private auth: AuthService, private router: Router, private zone: NgZone) {
    if (this.auth.isLoggedIn) this.router.navigate(['/']);
    const nav = this.router.getCurrentNavigation();
    this.redirectUrl = nav?.extras?.state?.['redirectUrl'] ?? '/';
  }

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => this.initGoogleButton(), 100);
  }

  private initGoogleButton() {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '211698271206-1smssf8ul4pp3dn771sdma0np7boblmu.apps.googleusercontent.com',
        callback: (response: any) => this.zone.run(() => this.handleGoogleCallback(response)),
      });
      const btn = document.getElementById('google-btn');
      const width = btn?.offsetWidth || 360;
      google.accounts.id.renderButton(btn, {
        theme: 'outline', size: 'large', width: width, text: 'continue_with'
      });
    } else {
      setTimeout(() => this.initGoogleButton(), 300);
    }
  }

  async handleGoogleCallback(response: any) {
    this.loading = true; this.error = '';
    try {
      const res = await fetch(`${environment.apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      localStorage.setItem('kittab_token', data.access_token);
      await this.auth.loadUser();
      if (!data.user?.is_profile_complete || data.user?.phone?.startsWith('google_')) {
        this.firstName = data.user?.first_name || '';
        this.lastName = data.user?.last_name || '';
        this.email = data.user?.email || '';
        this.step = 'profile';
      } else {
        this.router.navigate([this.redirectUrl]);
      }
    } catch (e: any) { this.error = e.message || 'Erreur Google'; }
    this.loading = false;
  }

  normalizePhone(phone: string): string {
    let p = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (p.startsWith('00')) p = '+' + p.slice(2);
    if (!p.startsWith('+')) p = '+221' + p;
    return p;
  }

  isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  async requestOtp() {
    if (!this.phone.trim()) { this.error = 'Veuillez saisir votre numéro'; return; }
    this.phone = this.normalizePhone(this.phone);
    if (!this.isValidPhone(this.phone)) { this.error = 'Numéro de téléphone invalide (7 à 15 chiffres)'; return; }
    this.loading = true; this.error = '';
    try {
      const res = await fetch(`${environment.apiUrl}/api/auth/request-otp`, {
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
      const res = await fetch(`${environment.apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.phone, code: this.otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      localStorage.setItem('kittab_token', data.access_token);
      await this.auth.loadUser();
      if (data.is_new_user) {
        this.router.navigate(['/profile'], { queryParams: { nouveau: '1' } });
      } else {
        this.router.navigate([this.redirectUrl]);
      }
    } catch (e: any) { this.error = e.message || 'Code invalide'; }
    this.loading = false;
  }

  // Étape 1 du flux Google : envoyer OTP sur le numéro saisi
  async sendGooglePhoneOtp() {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.error = 'Prénom et nom sont obligatoires'; return;
    }
    if (!this.profilePhone.trim()) {
      this.error = 'Le numéro de téléphone est obligatoire'; return;
    }
    this.profilePhone = this.normalizePhone(this.profilePhone);
    if (!this.isValidPhone(this.profilePhone)) {
      this.error = 'Numéro de téléphone invalide (7 à 15 chiffres)'; return;
    }
    this.loading = true; this.error = '';
    try {
      const res = await fetch(`${environment.apiUrl}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.profilePhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      this.googleDevCode = data.dev_code ?? '';
      this.step = 'google-otp';
    } catch (e: any) { this.error = e.message || 'Erreur envoi du code'; }
    this.loading = false;
  }

  // Étape 2 du flux Google : vérifier OTP + compléter/fusionner
  async verifyGoogleOtp() {
    if (!this.googleOtp.trim()) { this.error = 'Veuillez saisir le code'; return; }
    this.loading = true; this.error = '';
    try {
      const res = await fetch(`${environment.apiUrl}/api/auth/google/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.auth.token}`,
        },
        body: JSON.stringify({
          first_name: this.firstName,
          last_name: this.lastName,
          phone: this.profilePhone,
          otp_code: this.googleOtp,
          email: this.email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      localStorage.setItem('kittab_token', data.access_token);
      await this.auth.loadUser();
      this.router.navigate([this.redirectUrl]);
    } catch (e: any) { this.error = e.message || 'Code invalide'; }
    this.loading = false;
  }
}

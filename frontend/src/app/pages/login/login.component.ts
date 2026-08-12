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
  step: 'phone' | 'otp' | 'profile' = 'phone';
  phone = ''; otp = ''; firstName = ''; lastName = ''; email = '';
  loading = false; devCode = ''; error = '';
  private redirectUrl = '/';

  constructor(private auth: AuthService, private router: Router, private zone: NgZone) {
    if (this.auth.isLoggedIn) this.router.navigate(['/']);
    const nav = this.router.getCurrentNavigation();
    this.redirectUrl = nav?.extras?.state?.['redirectUrl'] ?? '/';
  }

  ngOnInit() {}

  ngAfterViewInit() {
    // Connexion Google désactivée pour le MVP — voir initGoogleButton() ci-dessous.
    // setTimeout(() => this.initGoogleButton(), 100);
  }

  // Connexion Google désactivée pour le MVP. Le bouton correspondant est
  // commenté dans le template : sans cet appel, la boucle de réessai ci-dessous
  // tournerait indéfiniment à la recherche d'un élément qui n'existe plus.
  // private initGoogleButton() {
  //   if (typeof google !== 'undefined') {
  //     google.accounts.id.initialize({
  //       client_id: '211698271206-1smssf8ul4pp3dn771sdma0np7boblmu.apps.googleusercontent.com',
  //       callback: (response: any) => this.zone.run(() => this.handleGoogleCallback(response)),
  //     });
  //     const btn = document.getElementById('google-btn');
  //     const width = btn?.offsetWidth || 360;
  //     google.accounts.id.renderButton(btn, {
  //       theme: 'outline', size: 'large', width: width, text: 'continue_with'
  //     });
  //   } else {
  //     setTimeout(() => this.initGoogleButton(), 300);
  //   }
  // }

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
      if (!data.user?.first_name || !data.user?.last_name) {
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

  /**
   * Indicatifs proposés. Le pays du compte en est déduit côté serveur, et il
   * détermine ensuite la liste de villes proposée à la publication : une
   * erreur ici a des conséquences bien au-delà de la réception du code.
   */
  readonly dialCodes = [
    { code: '+221', flag: '🇸🇳', label: 'Sénégal' },
    // Pays préparés mais pas encore ouverts. Les réactiver demande aussi
    // d'insérer leurs villes dans la table cities : sans elles, un compte
    // peut se créer mais la publication reste impossible, faute de ville
    // à choisir. Les villes de Côte d'Ivoire sont déjà en base (migration
    // 023), il suffit donc de décommenter sa ligne.
    // { code: '+225', flag: '🇨🇮', label: "Côte d'Ivoire" },
    // { code: '+226', flag: '🇧🇫', label: 'Burkina Faso' },
    // { code: '+223', flag: '🇲🇱', label: 'Mali' },
    // { code: '+227', flag: '🇳🇪', label: 'Niger' },
    // { code: '+233', flag: '🇬🇭', label: 'Ghana' },
    // { code: '+224', flag: '🇬🇳', label: 'Guinée' },
    // { code: '+228', flag: '🇹🇬', label: 'Togo' },
    // { code: '+229', flag: '🇧🇯', label: 'Bénin' },
    // { code: '+33',  flag: '🇫🇷', label: 'France' },
  ];

  dialCode = this.dialCodes[0].code;

  /** Numéro complet, indicatif compris, envoyé au serveur. Distinct du champ
   *  de saisie, qui ne contient que la partie locale. */
  fullPhone = '';

  /**
   * Un menu déroulant à une seule entrée n'a pas de sens : tant qu'un seul
   * pays est ouvert, l'indicatif reste affiché mais devient une simple
   * mention. Le menu réapparaît de lui-même dès qu'un pays est décommenté.
   */
  get hasMultipleCountries(): boolean {
    return this.dialCodes.length > 1;
  }

  get currentDial() {
    return this.dialCodes.find(d => d.code === this.dialCode) ?? this.dialCodes[0];
  }

  /**
   * L'indicatif choisi remplace l'ancien "+221" écrit en dur. Auparavant,
   * quelqu'un saisissant un numéro ivoirien sans indicatif se retrouvait avec
   * un numéro sénégalais invalide, sans jamais recevoir de code ni comprendre
   * pourquoi : l'hypothèse était invisible.
   */
  normalizePhone(phone: string): string {
    let p = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (p.startsWith('00')) p = '+' + p.slice(2);
    if (p.startsWith('+')) return p;
    // Un numéro local commence souvent par un 0 qu'il faut retirer avant
    // l'indicatif international (06... en France, 07... en Côte d'Ivoire).
    if (p.startsWith('0')) p = p.slice(1);
    return this.dialCode + p;
  }

  isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  async requestOtp() {
    if (!this.phone.trim()) { this.error = 'Veuillez saisir votre numéro'; return; }

    // Le champ garde ce que l'utilisateur a tapé. L'indicatif est déjà affiché
    // à côté : le recopier dans le champ afficherait "+221" deux fois.
    this.fullPhone = this.normalizePhone(this.phone);
    if (!this.isValidPhone(this.fullPhone)) { this.error = 'Numéro de téléphone invalide (7 à 15 chiffres)'; return; }
    this.loading = true; this.error = '';
    try {
      const res = await fetch(`${environment.apiUrl}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.fullPhone }),
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
        body: JSON.stringify({ phone: this.fullPhone, code: this.otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      localStorage.setItem('kittab_token', data.access_token);
      await this.auth.loadUser();
      if (data.is_new_user) {
        this.router.navigate(['/profile'], { queryParams: { nouveau: '1' } });
      } else {
        this.router.navigateByUrl(this.redirectUrl);
      }
    } catch (e: any) { this.error = e.message || 'Code invalide'; }
    this.loading = false;
  }

  async completeGoogleProfile() {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.error = 'Prénom et nom sont obligatoires'; return;
    }
    this.loading = true; this.error = '';
    try {
      const res = await fetch(`${environment.apiUrl}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.auth.token}`,
        },
        body: JSON.stringify({ first_name: this.firstName.trim(), last_name: this.lastName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      await this.auth.loadUser();
      this.router.navigateByUrl(this.redirectUrl);
    } catch (e: any) { this.error = e.message || 'Erreur lors de l\'enregistrement'; }
    this.loading = false;
  }
}

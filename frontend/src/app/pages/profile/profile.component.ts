import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
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
  username = '';
  firstName = '';
  lastName = '';
  address = '';
  phone = '';
  newPhone = '';
  email = '';
  loading = false;
  success = false;
  error = '';
  isNewUser = false;
  isIncomplete = false;
  addressSuggestions: { label: string }[] = [];
  showAddressSuggestions = false;
  private addressTimeout: any;

  constructor(public auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.isNewUser = this.route.snapshot.queryParamMap.get('nouveau') === '1';
    this.isIncomplete = this.route.snapshot.queryParamMap.get('incomplet') === '1';
    const u = this.auth.user;
    const load = (u: any) => {
      this.username = u.username || '';
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

  isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  onAddressInput() {
    clearTimeout(this.addressTimeout);
    this.showAddressSuggestions = false;
    if (this.address.length < 2) { this.addressSuggestions = []; return; }
    this.addressTimeout = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.address)}&format=json&addressdetails=1&limit=5&countrycodes=sn,gn,ci,ml,fr&accept-language=fr`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
        const data = await res.json();
        this.addressSuggestions = data.map((item: any) => ({ label: this.shortenAddress(item) }));
        this.showAddressSuggestions = this.addressSuggestions.length > 0;
      } catch {}
    }, 400);
  }

  private shortenAddress(item: any): string {
    const a = item.address ?? {};
    const parts: string[] = [];
    const neighbourhood = a.neighbourhood || a.suburb || a.quarter || a.hamlet || a.village;
    const city = a.city || a.town || a.municipality || a.county;
    const country = a.country;
    if (neighbourhood) parts.push(neighbourhood);
    if (city && city !== neighbourhood) parts.push(city);
    if (country) parts.push(country);
    return parts.length > 0 ? parts.join(', ') : item.display_name;
  }

  selectAddress(s: { label: string }) {
    this.address = s.label;
    this.addressSuggestions = [];
    this.showAddressSuggestions = false;
  }

  async save() {
    if (!this.firstName.trim() || !this.lastName.trim() || !this.address.trim()) {
      this.error = 'Prénom, nom et Quartier ou Ville sont obligatoires.';
      return;
    }
    this.loading = true; this.success = false; this.error = '';
    try {
      const body: any = { first_name: this.firstName, last_name: this.lastName, address: this.address };
      if (this.isGoogleUser && this.newPhone.trim()) {
        if (!this.isValidPhone(this.newPhone)) {
          this.error = 'Numéro de téléphone invalide (7 à 15 chiffres)';
          this.loading = false; return;
        }
        body.phone = this.newPhone.trim();
      }
      if (this.email.trim()) body.email = this.email.trim();
      const res = await fetch(`${environment.apiUrl}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.auth.token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await this.auth.loadUser();
        this.success = true;
        this.isNewUser = false;
      } else {
        const d = await res.json();
        this.error = d.detail || 'Erreur lors de la mise à jour';
      }
    } catch { this.error = 'Impossible de contacter le serveur'; }
    this.loading = false;
  }
}

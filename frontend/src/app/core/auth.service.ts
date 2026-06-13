import { Injectable } from '@angular/core';

export interface CurrentUser {
  first_name: string;
  last_name: string;
  phone: string;
  is_profile_complete: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user: CurrentUser | null = null;

  get token(): string | null {
    return localStorage.getItem('kittab_token');
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get user(): CurrentUser | null {
    return this._user;
  }

  async loadUser(): Promise<void> {
    if (!this.token) return;
    try {
      const res = await fetch('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (res.ok) this._user = await res.json();
      else this.logout();
    } catch {}
  }

  logout(): void {
    localStorage.removeItem('kittab_token');
    this._user = null;
  }
}

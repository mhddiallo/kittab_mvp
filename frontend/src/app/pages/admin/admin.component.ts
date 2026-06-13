import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../core/auth.service';

interface AdminStats {
  total_books: number; total_views: number; boosted_books: number; total_users: number;
  cities: { city: string; count: number }[];
  categories: { name: string; count: number }[];
  daily_publications: { date: string; count: number }[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  stats: AdminStats | null = null;
  loading = true;
  error = '';

  constructor(private auth: AuthService) {}

  async ngOnInit() {
    try {
      const res = await fetch('http://localhost:8000/api/admin/stats', {
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) this.stats = await res.json();
      else this.error = 'Accès refusé ou non autorisé';
    } catch { this.error = 'Impossible de contacter le serveur'; }
    this.loading = false;
  }
}

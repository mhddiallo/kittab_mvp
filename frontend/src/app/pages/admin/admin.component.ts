import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../core/auth.service';

interface AdminStats {
  total_books: number; total_views: number; boosted_books: number; total_users: number;
  cities: { city: string; count: number }[];
  categories: { name: string; count: number }[];
  daily_publications: { date: string; count: number }[];
}

interface AdminBook {
  id: number; title: string; author: string; price: number;
  views: number; is_boosted: boolean; boost_expires_at: string | null;
  is_available: boolean; seller_phone: string | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  stats: AdminStats | null = null;
  loading = true;
  error = '';

  // Books management
  books: AdminBook[] = [];
  booksLoading = false;
  searchQuery = '';
  boostDays = 7;
  boostingId: number | null = null;
  searchTimeout: any;

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
    await this.loadBooks();
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadBooks(), 300);
  }

  async loadBooks() {
    this.booksLoading = true;
    try {
      const url = `http://localhost:8000/api/admin/books${this.searchQuery ? '?q=' + encodeURIComponent(this.searchQuery) : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.auth.token}` } });
      if (res.ok) this.books = await res.json();
    } catch {}
    this.booksLoading = false;
  }

  async boost(book: AdminBook) {
    this.boostingId = book.id;
    try {
      const res = await fetch(`http://localhost:8000/api/admin/books/${book.id}/boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.auth.token}` },
        body: JSON.stringify({ days: this.boostDays }),
      });
      if (res.ok) {
        const data = await res.json();
        book.is_boosted = true;
        book.boost_expires_at = data.expires_at;
        if (this.stats) this.stats.boosted_books++;
      }
    } catch {}
    this.boostingId = null;
  }

  async unboost(book: AdminBook) {
    this.boostingId = book.id;
    try {
      const res = await fetch(`http://localhost:8000/api/admin/books/${book.id}/boost`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) {
        book.is_boosted = false;
        book.boost_expires_at = null;
        if (this.stats) this.stats.boosted_books--;
      }
    } catch {}
    this.boostingId = null;
  }
}

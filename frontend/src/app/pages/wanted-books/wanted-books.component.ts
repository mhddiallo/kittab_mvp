import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

interface Category { id: number; name: string; }

interface WantedBook {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  is_fulfilled: boolean;
  created_at: string;
  user: { id: number; username?: string };
  category: { id: number; name: string } | null;
}

@Component({
  selector: 'app-wanted-books',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './wanted-books.component.html',
})
export class WantedBooksComponent implements OnInit {
  books: WantedBook[] = [];
  categories: Category[] = [];
  loading = true;
  searchQuery = '';
  selectedCategoryId: number | null = null;
  showForm = false;
  submitting = false;
  formError = '';
  searchTimeout: any;

  form = { title: '', author: '', category_id: null as number | null, description: '' };

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.loadCategories();
    this.load();
  }

  async loadCategories() {
    try {
      const res = await fetch(`${environment.apiUrl}/api/categories`);
      if (res.ok) this.categories = await res.json();
    } catch {}
  }

  async load() {
    this.loading = true;
    try {
      const params = new URLSearchParams();
      if (this.searchQuery.trim()) params.set('search', this.searchQuery.trim());
      if (this.selectedCategoryId) params.set('category_id', String(this.selectedCategoryId));
      const res = await fetch(`${environment.apiUrl}/api/wanted-books?${params}`);
      if (res.ok) this.books = await res.json();
    } catch {}
    this.loading = false;
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 350);
  }

  selectCategory(id: number | null) {
    this.selectedCategoryId = id;
    this.load();
  }

  async submit() {
    if (!this.form.title.trim()) { this.formError = 'Le titre est obligatoire'; return; }
    this.submitting = true; this.formError = '';
    try {
      const body: any = { title: this.form.title.trim() };
      if (this.form.author.trim()) body.author = this.form.author.trim();
      if (this.form.category_id) body.category_id = this.form.category_id;
      if (this.form.description.trim()) body.description = this.form.description.trim();
      const res = await fetch(`${environment.apiUrl}/api/wanted-books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.auth.token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const created = await res.json();
        this.books = [created, ...this.books];
        this.showForm = false;
        this.form = { title: '', author: '', category_id: null, description: '' };
      } else {
        const d = await res.json();
        this.formError = d.detail || 'Erreur lors de l\'envoi';
      }
    } catch { this.formError = 'Impossible de contacter le serveur'; }
    this.submitting = false;
  }

  async fulfill(book: WantedBook) {
    try {
      const res = await fetch(`${environment.apiUrl}/api/wanted-books/${book.id}/fulfill`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) this.books = this.books.filter(b => b.id !== book.id);
    } catch {}
  }

  async deleteBook(book: WantedBook) {
    try {
      await fetch(`${environment.apiUrl}/api/wanted-books/${book.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      this.books = this.books.filter(b => b.id !== book.id);
    } catch {}
  }

  isOwner(book: WantedBook): boolean {
    return !!this.auth.user && this.auth.user.id === book.user.id;
  }

  timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 2592000) return `Il y a ${Math.floor(diff / 86400)} j`;
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }
}

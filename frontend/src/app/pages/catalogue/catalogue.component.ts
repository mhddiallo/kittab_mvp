import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BookCardComponent, BookCard } from '../../components/book-card/book-card.component';

interface Category { id: number; name: string; }

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, NavbarComponent, FooterComponent, BookCardComponent],
  templateUrl: './catalogue.component.html',
})
export class CatalogueComponent implements OnInit {
  searchQuery = '';
  selectedCategoryId: number | null = null;
  books: BookCard[] = [];
  categories: Category[] = [];
  total = 0;
  loading = true;
  alertPhone = '';
  alertSent = false;
  searchTimeout: any;

  async ngOnInit() {
    await Promise.all([this.loadCategories(), this.loadBooks()]);
  }

  async loadCategories() {
    try {
      const res = await fetch('http://localhost:8000/api/categories');
      if (res.ok) this.categories = await res.json();
    } catch {}
  }

  async loadBooks() {
    this.loading = true;
    try {
      let url = `http://localhost:8000/api/books?limit=20&skip=0`;
      if (this.searchQuery) url += `&search=${encodeURIComponent(this.searchQuery)}`;
      if (this.selectedCategoryId) url += `&category_id=${this.selectedCategoryId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        this.books = data.items ?? data;
        this.total = data.total ?? this.books.length;
      }
    } catch {}
    this.loading = false;
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadBooks(), 400);
  }

  selectCategory(id: number | null) {
    this.selectedCategoryId = id;
    this.loadBooks();
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return 'https://placehold.co/176x128/f3f4f6/9ca3af?text=Livre';
    return url.startsWith('http') ? url : `http://localhost:8000${url}`;
  }

  async sendAlert() {
    if (!this.alertPhone || !this.searchQuery) return;
    try {
      await fetch('http://localhost:8000/api/books/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: this.searchQuery, notification_phone: this.alertPhone }),
      });
      this.alertSent = true;
    } catch {}
  }
}


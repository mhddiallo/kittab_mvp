import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BookCardComponent, BookCard } from '../../components/book-card/book-card.component';
import { environment } from '../../../environments/environment';

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
  selectedCondition = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  onlyExchange = false;
  showFilters = false;
  cityFilter = '';
  cityLoading = false;
  cityError = '';

  books: BookCard[] = [];
  boostedBooks: BookCard[] = [];
  categories: Category[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 20;
  loading = true;
  alertPhone = '';
  alertSent = false;
  searchTimeout: any;

  get totalPages(): number { return Math.ceil(this.total / this.pageSize); }
  get pages(): number[] {
    const p = this.totalPages;
    if (p <= 7) return Array.from({ length: p }, (_, i) => i + 1);
    if (this.currentPage <= 4) return [1,2,3,4,5,0,p];
    if (this.currentPage >= p - 3) return [1,0,p-4,p-3,p-2,p-1,p];
    return [1,0,this.currentPage-1,this.currentPage,this.currentPage+1,0,p];
  }

  conditions = [
    { value: '', label: 'Tous les états' },
    { value: 'new', label: 'Neuf' },
    { value: 'like_new', label: 'Très bon' },
    { value: 'good', label: 'Bon état' },
    { value: 'fair', label: 'Correct' },
  ];

  priceRanges = [
    { label: 'Tous les prix', min: null, max: null },
    { label: 'Moins de 2 000 FCFA', min: null, max: 2000 },
    { label: '2 000 – 5 000 FCFA', min: 2000, max: 5000 },
    { label: '5 000 – 10 000 FCFA', min: 5000, max: 10000 },
    { label: 'Plus de 10 000 FCFA', min: 10000, max: null },
  ];

  selectedPriceRange = 0;

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) this.searchQuery = q;
    await Promise.all([this.loadCategories(), this.loadBooks(), this.loadBoostedBooks()]);
  }

  async loadCategories() {
    try {
      const res = await fetch(`${environment.apiUrl}/api/categories`);
      if (res.ok) this.categories = await res.json();
    } catch {}
  }

  async loadBoostedBooks() {
    try {
      const res = await fetch(`${environment.apiUrl}/api/books?boosted=true&page_size=6`);
      if (res.ok) {
        const data = await res.json();
        this.boostedBooks = data.items ?? data;
      }
    } catch {}
  }

  async loadBooks(page = this.currentPage) {
    this.loading = true;
    try {
      let url = `${environment.apiUrl}/api/books?page=${page}&page_size=${this.pageSize}`;
      if (this.searchQuery) url += `&q=${encodeURIComponent(this.searchQuery)}`;
      if (this.selectedCategoryId) url += `&category_id=${this.selectedCategoryId}`;
      if (this.selectedCondition) url += `&condition=${this.selectedCondition}`;
      const range = this.priceRanges[this.selectedPriceRange];
      if (range.min !== null) url += `&min_price=${range.min}`;
      if (range.max !== null) url += `&max_price=${range.max}`;
      if (this.onlyExchange) url += `&accepts_exchange=true`;
      if (this.cityFilter.trim()) url += `&city=${encodeURIComponent(this.cityFilter.trim())}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        this.books = data.items ?? data;
        this.total = data.total ?? this.books.length;
        this.currentPage = page;
      }
    } catch {}
    this.loading = false;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadBooks(page);
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadBooks(), 400);
  }

  selectCategory(id: number | null) {
    this.selectedCategoryId = id;
    this.loadBooks(1);
  }

  applyFilters() {
    this.loadBooks(1);
  }

  resetFilters() {
    this.selectedCondition = '';
    this.selectedPriceRange = 0;
    this.onlyExchange = false;
    this.cityFilter = '';
    this.cityError = '';
    this.loadBooks(1);
  }

  async detectLocation() {
    if (!navigator.geolocation) { this.cityError = 'Géolocalisation non supportée'; return; }
    this.cityLoading = true; this.cityError = '';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'fr' } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          if (city) { this.cityFilter = city; this.loadBooks(1); }
          else this.cityError = 'Ville non détectée, saisie manuelle possible';
        } catch { this.cityError = 'Impossible de détecter la ville'; }
        this.cityLoading = false;
      },
      () => { this.cityError = 'Localisation refusée'; this.cityLoading = false; },
      { timeout: 8000 }
    );
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedCondition) count++;
    if (this.selectedPriceRange > 0) count++;
    if (this.onlyExchange) count++;
    if (this.cityFilter.trim()) count++;
    return count;
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return 'https://placehold.co/176x128/f3f4f6/9ca3af?text=Livre';
    return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  }

  async sendAlert() {
    if (!this.alertPhone || !this.searchQuery) return;
    try {
      await fetch(`${environment.apiUrl}/api/books/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: this.searchQuery, notification_phone: this.alertPhone }),
      });
      this.alertSent = true;
    } catch {}
  }
}

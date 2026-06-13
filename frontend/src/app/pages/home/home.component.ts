import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BookCardComponent, BookCard } from '../../components/book-card/book-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, NavbarComponent, FooterComponent, BookCardComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  trendingBooks: BookCard[] = [];
  popularBooks: BookCard[] = [];
  totalBooks = 0;
  loading = true;
  searchQuery = '';
  suggestions: any[] = [];
  private searchTimeout: any;

  constructor(private router: Router) {}

  async ngOnInit() {
    await this.loadBooks();
  }

  async loadBooks() {
    try {
      const res = await fetch('http://localhost:8000/api/books?page_size=10&page=1');
      if (res.ok) {
        const data = await res.json();
        const books: BookCard[] = data.items ?? data;
        this.totalBooks = data.total ?? books.length;
        this.trendingBooks = books.slice(0, 4);
        this.popularBooks = books.slice(0, 6);
      }
    } catch {}
    if (!this.trendingBooks.length) {
      this.trendingBooks = this.mock(4);
      this.popularBooks = this.mock(6, 4);
    }
    this.loading = false;
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    if (this.searchQuery.length < 2) { this.suggestions = []; return; }
    this.searchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/books/autocomplete?q=${encodeURIComponent(this.searchQuery)}`);
        if (res.ok) this.suggestions = await res.json();
      } catch {}
    }, 300);
  }

  selectSuggestion(s: any) {
    this.searchQuery = s.title;
    this.suggestions = [];
    this.router.navigate(['/catalogue'], { queryParams: { q: s.title } });
  }

  goToCatalogue() {
    this.suggestions = [];
    this.router.navigate(['/catalogue'], { queryParams: { q: this.searchQuery } });
  }

  mock(count: number, offset = 0): BookCard[] {
    const data = [
      { t: 'Les Contes de Leuk-le-Lièvre', a: 'L. S. Senghor', p: 8000, c: 'good' },
      { t: 'Le Ventre de l\'Atlantique', a: 'Fatou Diome', p: 12000, c: 'like_new' },
      { t: 'Une si longue lettre', a: 'Mariama Bâ', p: 6000, c: 'new' },
      { t: 'Soundjata ou l\'épopée', a: 'D. T. Niane', p: 9500, c: 'fair' },
      { t: 'Mathématiques Terminale S', a: 'Seydou Traoré', p: 8500, c: 'like_new' },
      { t: 'L\'enfant noir', a: 'Camara Laye', p: 7500, c: 'good' },
      { t: 'Introduction à la Physique', a: 'Aminata Diallo', p: 15000, c: 'new' },
      { t: 'Histoire de l\'Afrique', a: 'Ousmane Tall', p: 18000, c: 'good' },
    ];
    return Array.from({ length: count }, (_, i) => {
      const d = data[(i + offset) % data.length];
      return {
        id: i + offset + 1, title: d.t, author: d.a, price: d.p, condition: d.c, book_type: 'novel',
        images: [{ url: `https://picsum.photos/seed/b${i + offset}/300/400`, is_primary: true }],
        seller: { first_name: 'Vendeur', last_name: '', phone: '', address: ['Conakry', 'Dakar', 'Bamako'][i % 3] },
        is_available: true,
      };
    });
  }
}

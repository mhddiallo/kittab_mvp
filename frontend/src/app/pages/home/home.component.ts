import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BookCardComponent, BookCard } from '../../components/book-card/book-card.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, NavbarComponent, FooterComponent, BookCardComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  trendingBooks: BookCard[] = [];
  wantedBooks: any[] = [];
  loading = true;
  searchQuery = '';
  activeTab = 'acheter';
  suggestions: any[] = [];
  private searchTimeout: any;

  categories: { id: number; name: string; emoji: string }[] = [];

  private categoryEmojis: Record<string, string> = {
    'Romans': '📖', 'Roman': '📖',
    'Scolaire': '🎓', 'Manuels scolaires': '🎓',
    'Essais': '💡', 'Essai': '💡',
    'Bandes dessinées': '🎨', 'BD': '🎨',
    'Jeunesse': '🌟',
    'Poésie': '📝', 'Poesie': '📝',
    'Sciences': '🔬', 'Informatique': '💻',
    'Histoire': '🏛️', 'Géographie': '🌍',
    'Philosophie': '🧠', 'Religion': '🕌',
    'Art': '🎨', 'Cuisine': '🍽️',
  };

  private bookGradients = [
    'linear-gradient(160deg, #8B1A1A 0%, #C0392B 100%)',
    'linear-gradient(160deg, #1A3A8B 0%, #2563EB 100%)',
    'linear-gradient(160deg, #7C4A00 0%, #D97706 100%)',
    'linear-gradient(160deg, #3D1A0A 0%, #7C3A0A 100%)',
    'linear-gradient(160deg, #1A5C1A 0%, #16A34A 100%)',
    'linear-gradient(160deg, #4A0A6B 0%, #9333EA 100%)',
  ];

  constructor(private router: Router) {}

  getBookGradient(index: number): string {
    return this.bookGradients[index % this.bookGradients.length];
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [boostedRes, wantedRes, categoriesRes] = await Promise.all([
        fetch(`${environment.apiUrl}/api/books?boosted=true&page_size=6&page=1`),
        fetch(`${environment.apiUrl}/api/wanted-books?page_size=4`),
        fetch(`${environment.apiUrl}/api/categories?with_books=true`),
      ]);
      if (boostedRes.ok) {
        const data = await boostedRes.json();
        this.trendingBooks = data.items ?? data;
      }
      if (wantedRes.ok) {
        const data = await wantedRes.json();
        this.wantedBooks = Array.isArray(data) ? data : (data.items ?? []);
      }
      if (categoriesRes.ok) {
        const data: { id: number; name: string }[] = await categoriesRes.json();
        this.categories = data.map(c => ({
          id: c.id,
          name: c.name,
          emoji: this.categoryEmojis[c.name] ?? '📚',
        }));
      }
    } catch {}
    if (!this.trendingBooks.length) {
      this.trendingBooks = this.mockTrending();
    }
    if (!this.wantedBooks.length) {
      this.wantedBooks = this.mockWanted();
    }
    this.loading = false;
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    if (this.searchQuery.length < 2) { this.suggestions = []; return; }
    this.searchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`${environment.apiUrl}/api/books/autocomplete?q=${encodeURIComponent(this.searchQuery)}`);
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

  private mockTrending(): BookCard[] {
    const data = [
      { t: 'Une si longue lettre', a: 'Mariama Bâ', addr: 'Dakar', boosted: true },
      { t: 'Physique Terminale S', a: 'Durandeau', addr: 'Dakar', boosted: false },
      { t: 'Les Soleils des indépendances', a: 'A. Kourouma', addr: 'Abidjan', boosted: true },
      { t: 'Sapiens', a: 'Y. N. Harari', addr: 'Abidjan', boosted: true },
    ];
    return data.map((d, i) => ({
      id: i + 1, title: d.t, author: d.a, price: 5000, condition: 'good', book_type: 'novel',
      images: [], is_boosted: d.boosted,
      seller: { first_name: '', last_name: '', phone: '', address: d.addr },
      is_available: true,
    } as any));
  }

  private mockWanted(): any[] {
    return [
      { title: 'Une si longue lettre', author: 'par Mariama Bâ', description: 'Pour mes cours de littérature à l\'université. Édition récente de préférence.', category: { name: 'Roman' }, user: { username: 'Aminata D.' } },
      { title: 'Maths 1ère C — CIAM', author: 'manuel scolaire', description: 'Pour mon fils qui entre en 1ère. État indifférent tant que c\'est complet et lisible.', category: { name: 'Scolaire' }, user: { username: 'Cheikh B.' } },
      { title: 'Petit Pays', author: 'par Gaël Faye', description: 'Disponible en bon état ? Je peux échanger contre deux de mes romans.', category: { name: 'Roman' }, user: { username: 'Moussa K.' } },
      { title: 'Sapiens', author: 'par Y. N. Harari', description: 'Version française recherchée. J\'habite Abidjan, remise en main propre possible.', category: { name: 'Essai' }, user: { username: 'Ibrahim T.' } },
    ];
  }
}

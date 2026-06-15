import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class HomeComponent implements OnInit, OnDestroy {
  trendingBooks: BookCard[] = [];
  popularBooks: BookCard[] = [];
  totalBooks = 0;
  loading = true;
  searchQuery = '';
  suggestions: any[] = [];
  private searchTimeout: any;

  // Hero typewriter
  heroPhrases = [
    'Vends, achète et échange tes livres facilement',
    'Donne une seconde vie à tes livres',
    'Débarrasse-toi de tes livres dont tu n\'as plus besoin',
  ];
  currentHeroIndex = 0;
  displayedText = '';
  showCursor = true;
  private typewriterTimeout: any;

  constructor(private router: Router) {}

  startTypewriter() {
    this.typePhrase();
  }

  private typePhrase() {
    const full = this.heroPhrases[this.currentHeroIndex];
    let i = 0;
    this.displayedText = '';

    const type = () => {
      if (i < full.length) {
        this.displayedText += full[i++];
        this.typewriterTimeout = setTimeout(type, 45);
      } else {
        // Pause avant d'effacer
        this.typewriterTimeout = setTimeout(() => this.erasePhrase(), 2000);
      }
    };
    type();
  }

  private erasePhrase() {
    const erase = () => {
      if (this.displayedText.length > 0) {
        this.displayedText = this.displayedText.slice(0, -1);
        this.typewriterTimeout = setTimeout(erase, 25);
      } else {
        this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroPhrases.length;
        this.typewriterTimeout = setTimeout(() => this.typePhrase(), 400);
      }
    };
    erase();
  }

  get beforeRed(): string {
    const full = this.heroPhrases[this.currentHeroIndex];
    const redStart = full.indexOf('livres');
    const typed = this.displayedText;
    if (redStart < 0 || typed.length <= redStart) return typed;
    return typed.slice(0, redStart);
  }

  get redPart(): string {
    const full = this.heroPhrases[this.currentHeroIndex];
    const redStart = full.indexOf('livres');
    const typed = this.displayedText;
    if (redStart < 0 || typed.length <= redStart) return '';
    return typed.slice(redStart, Math.min(typed.length, redStart + 6));
  }

  get afterRed(): string {
    const full = this.heroPhrases[this.currentHeroIndex];
    const redEnd = full.indexOf('livres') + 6;
    const typed = this.displayedText;
    if (typed.length <= redEnd) return '';
    return typed.slice(redEnd);
  }

  ngOnDestroy() {
    clearTimeout(this.typewriterTimeout);
  }

  getImageUrl(book: BookCard): string {
    const url = book.images?.find(i => i.is_primary)?.url || book.images?.[0]?.url;
    if (!url) return 'https://placehold.co/300x400/f3f4f6/9ca3af?text=📚';
    return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  }

  async ngOnInit() {
    await this.loadBooks();
    this.startTypewriter();
  }

  async loadBooks() {
    try {
      // À la une : livres boostés uniquement
      const [boostedRes, latestRes] = await Promise.all([
        fetch(`${environment.apiUrl}/api/books?boosted=true&page_size=6&page=1`),
        fetch(`${environment.apiUrl}/api/books?page_size=6&page=1`),
      ]);
      if (latestRes.ok) {
        const data = await latestRes.json();
        const books: BookCard[] = data.items ?? data;
        this.totalBooks = data.total ?? books.length;
        this.popularBooks = books;
      }
      if (boostedRes.ok) {
        const data = await boostedRes.json();
        this.trendingBooks = data.items ?? data;
      }
    } catch {}
    if (!this.popularBooks.length) {
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

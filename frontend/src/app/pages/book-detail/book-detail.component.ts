import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BookCardComponent, BookCard } from '../../components/book-card/book-card.component';
import { environment } from '../../../environments/environment';

interface BookDetail {
  id: number;
  title: string;
  author: string;
  price: number;
  condition: string;
  book_type: string;
  description: string;
  images: string[];
  seller: { id: number; username?: string; first_name: string; last_name: string; phone: string; address: string };
  location_label: string | null;
  cover_url: string | null;
  language: string | null;
  open_library_id: string | null;
  is_available: boolean;
  is_sold: boolean;
  accepts_exchange: boolean;
  views: number;
  is_pack: boolean;
  pack_items: string[] | null;
  education_level: string | null;
  category: { id: number; name: string };
  created_at: string;
}

interface BookInfo {
  summary: string;
  subjects: string[];
  first_publish_year: string;
  author_bio: string;
  cover_url: string | null;
  page_count: number | null;
  publisher: string | null;
  google_books_link: string | null;
}

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, BookCardComponent],
  templateUrl: './book-detail.component.html',
})
export class BookDetailComponent implements OnInit {
  book: BookDetail | null = null;
  selectedImage = 0;
  loading = true;
  similarBooks: BookCard[] = [];

  // Panneau infos livre
  showBookInfo = false;
  bookInfo: BookInfo | null = null;
  bookInfoLoading = false;
  markingSold = false;

  conditionMap: Record<string, { label: string; cls: string }> = {
    new: { label: 'Neuf', cls: 'bg-green-100 text-green-700' },
    like_new: { label: 'Très bon état', cls: 'bg-blue-100 text-blue-700' },
    good: { label: 'Bon état', cls: 'bg-yellow-100 text-yellow-700' },
    fair: { label: 'Correct', cls: 'bg-orange-100 text-orange-700' },
  };

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

  contactSeller() {
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/messages'], {
      queryParams: { new: '1', book_id: this.book!.id, other_user_id: this.book!.seller.id },
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.selectedImage = 0;
      this.similarBooks = [];
      this.book = null;
      this.loading = true;
      this.showBookInfo = false;
      this.bookInfo = null;
      this.loadBook(id);
    });
  }

  async loadBook(id: number) {
    try {
      const res = await fetch(`${environment.apiUrl}/api/books/${id}`);
      if (res.ok) {
        this.book = await res.json();
        if (this.book?.category?.id) {
          this.loadSimilarBooks(this.book.category.id, id);
        }
      }
    } catch {}
    this.loading = false;
  }

  async loadSimilarBooks(categoryId: number, excludeId: number) {
    try {
      const res = await fetch(`${environment.apiUrl}/api/books?category_id=${categoryId}&page_size=5`);
      if (res.ok) {
        const data = await res.json();
        this.similarBooks = (data.items ?? data).filter((b: BookCard) => b.id !== excludeId);
      }
    } catch {}
  }

  openBookInfo() {
    this.showBookInfo = true;
    document.body.style.overflow = 'hidden';
    if (!this.bookInfo) this.loadBookInfo();
  }

  closeBookInfo() {
    this.showBookInfo = false;
    document.body.style.overflow = '';
  }

  async loadBookInfo() {
    if (!this.book) return;
    this.bookInfoLoading = true;
    try {
      const params = new URLSearchParams();
      if (this.book.open_library_id) params.set('google_id', this.book.open_library_id);
      if (this.book.title) params.set('title', this.book.title);
      if (this.book.author) params.set('author', this.book.author);

      const res = await fetch(`${environment.apiUrl}/api/books/info?${params}`);
      if (res.ok) {
        const data = await res.json();
        this.bookInfo = {
          summary: data.summary ?? '',
          subjects: data.subjects ?? [],
          first_publish_year: data.published_year ?? '',
          author_bio: '',
          cover_url: data.cover_url ?? null,
          page_count: data.page_count ?? null,
          publisher: data.publisher ?? null,
          google_books_link: data.google_books_link ?? null,
        };
      } else {
        this.bookInfo = { summary: '', subjects: [], first_publish_year: '', author_bio: '', cover_url: null, page_count: null, publisher: null, google_books_link: null };
      }
    } catch {
      this.bookInfo = { summary: '', subjects: [], first_publish_year: '', author_bio: '', cover_url: null, page_count: null, publisher: null, google_books_link: null };
    }
    this.bookInfoLoading = false;
  }

  get condition() {
    return this.book ? (this.conditionMap[this.book.condition] ?? { label: this.book.condition, cls: 'bg-gray-100 text-gray-600' }) : null;
  }

  get exchangeWhatsAppUrl(): string {
    if (!this.book) return '#';
    const phone = this.book.seller.phone.replace('+', '');
    const msg = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre livre "${this.book.title}" sur KITTAB et je souhaite proposer un échange. Quel livre accepteriez-vous en échange ?`);
    return `https://wa.me/${phone}?text=${msg}`;
  }

  get isOwner(): boolean {
    return !!this.auth.user && this.book?.seller?.id === this.auth.user.id;
  }

  async markSold() {
    if (!this.book || !confirm(`Marquer "${this.book.title}" comme vendu ?`)) return;
    this.markingSold = true;
    try {
      const res = await fetch(`${environment.apiUrl}/api/books/${this.book.id}/mark-sold`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) {
        this.book.is_sold = true;
        this.book.is_available = false;
      }
    } catch {}
    this.markingSold = false;
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'https://placehold.co/600x800/f3f4f6/9ca3af?text=Livre';
  }

  private isValidCover(url: string): boolean {
    return !url.toLowerCase().includes('unavailable') && !url.toLowerCase().includes('nocover');
  }

  get displayImages(): string[] {
    if (!this.book) return ['https://placehold.co/600x800/f3f4f6/9ca3af?text=Livre'];
    const uploaded = this.book.images.map(i => {
      const url = (i as any).url;
      if (!url) return i as unknown as string;
      return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
    });
    if (uploaded.length) return uploaded;
    if (this.book.cover_url && this.isValidCover(this.book.cover_url)) return [this.book.cover_url];
    return ['https://placehold.co/600x800/f3f4f6/9ca3af?text=Livre'];
  }
}

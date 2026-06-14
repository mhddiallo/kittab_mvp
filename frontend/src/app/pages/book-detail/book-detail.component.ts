import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BookCardComponent, BookCard } from '../../components/book-card/book-card.component';

interface BookDetail {
  id: number;
  title: string;
  author: string;
  price: number;
  condition: string;
  book_type: string;
  description: string;
  images: string[];
  seller: { first_name: string; last_name: string; phone: string; address: string };
  is_available: boolean;
  accepts_exchange: boolean;
  views: number;
  is_pack: boolean;
  pack_items: string[] | null;
  education_level: string | null;
  category: { id: number; name: string };
  created_at: string;
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

  conditionMap: Record<string, { label: string; cls: string }> = {
    new: { label: 'Neuf', cls: 'bg-green-100 text-green-700' },
    like_new: { label: 'Très bon état', cls: 'bg-blue-100 text-blue-700' },
    good: { label: 'Bon état', cls: 'bg-yellow-100 text-yellow-700' },
    fair: { label: 'Correct', cls: 'bg-orange-100 text-orange-700' },
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.selectedImage = 0;
      this.similarBooks = [];
      this.book = null;
      this.loading = true;
      this.loadBook(id);
    });
  }

  async loadBook(id: number) {
    try {
      const res = await fetch(`http://localhost:8000/api/books/${id}`);
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
      const res = await fetch(`http://localhost:8000/api/books?category_id=${categoryId}&page_size=5`);
      if (res.ok) {
        const data = await res.json();
        this.similarBooks = (data.items ?? data).filter((b: BookCard) => b.id !== excludeId);
      }
    } catch {}
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

  get displayImages(): string[] {
    if (!this.book) return ['https://placehold.co/600x400/f3f4f6/9ca3af?text=Livre'];
    if (!this.book.images.length) return ['https://placehold.co/600x400/f3f4f6/9ca3af?text=Livre'];
    return this.book.images.map(i => (i as any).url ? `http://localhost:8000${(i as any).url}` : i as unknown as string);
  }
}

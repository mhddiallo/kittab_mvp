import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

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
  category: { id: number; name: string };
  created_at: string;
}

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './book-detail.component.html',
})
export class BookDetailComponent implements OnInit {
  book: BookDetail | null = null;
  selectedImage = 0;
  loading = true;

  conditionMap: Record<string, { label: string; cls: string }> = {
    new: { label: 'Neuf', cls: 'bg-green-100 text-green-700' },
    like_new: { label: 'Très bon état', cls: 'bg-blue-100 text-blue-700' },
    good: { label: 'Bon état', cls: 'bg-yellow-100 text-yellow-700' },
    fair: { label: 'Correct', cls: 'bg-orange-100 text-orange-700' },
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.loadBook(Number(id));
  }

  async loadBook(id: number) {
    try {
      const res = await fetch(`http://localhost:8000/api/books/${id}`);
      if (res.ok) this.book = await res.json();
    } catch {}
    this.loading = false;
  }

  get condition() {
    return this.book ? (this.conditionMap[this.book.condition] ?? { label: this.book.condition, cls: 'bg-gray-100 text-gray-600' }) : null;
  }

  get displayImages(): string[] {
    if (!this.book) return ['https://placehold.co/600x400/f3f4f6/9ca3af?text=Livre'];
    if (!this.book.images.length) return ['https://placehold.co/600x400/f3f4f6/9ca3af?text=Livre'];
    return this.book.images.map(i => (i as any).url ? `http://localhost:8000${(i as any).url}` : i as unknown as string);
  }
}

import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface BookCard {
  id: number; title: string; author: string; price: number;
  condition: string; book_type: string;
  images: { url: string; is_primary: boolean }[];
  seller: { first_name: string; last_name: string; phone: string; address?: string };
  is_available: boolean;
  views?: number;
  is_pack?: boolean;
  pack_items?: string[];
  cover_url?: string | null;
}

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './book-card.component.html',
})
export class BookCardComponent {
  @Input() book!: BookCard;

  get conditionLabel(): string {
    return ({ new: 'Neuf', like_new: 'Très bon', good: 'Bon état', fair: 'Correct' } as any)[this.book.condition] || this.book.condition;
  }
  get conditionClass(): string {
    return ({ new: 'bg-green-100 text-green-700', like_new: 'bg-blue-100 text-blue-700', good: 'bg-amber-100 text-amber-700', fair: 'bg-gray-100 text-gray-600' } as any)[this.book.condition] || 'bg-gray-100 text-gray-600';
  }
  private readonly API = 'http://localhost:8000';

  get primaryImage(): string {
    const url = this.book.images?.find(i => i.is_primary)?.url || this.book.images?.[0]?.url;
    if (url) return url.startsWith('http') ? url : `${this.API}${url}`;
    if (this.book.cover_url) return this.book.cover_url;
    return 'https://placehold.co/300x400/f3f4f6/9ca3af?text=Livre';
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'https://placehold.co/300x400/f3f4f6/9ca3af?text=Livre';
  }
}

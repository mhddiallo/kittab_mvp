import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookCoverComponent } from '../book-cover/book-cover.component';

export interface BookCard {
  id: number; title: string; author: string; price: number;
  condition: string; book_type: string;
  images: { url: string; is_primary: boolean }[];
  seller: { first_name: string; last_name: string; phone: string; address?: string };
  location_label?: string | null;
  city?: { id: number; name: string } | null;
  is_available: boolean;
  views?: number;
  is_pack?: boolean;
  is_boosted?: boolean;
  pack_items?: string[];
  cover_url?: string | null;
}

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [RouterLink, CommonModule, BookCoverComponent],
  templateUrl: './book-card.component.html',
})
export class BookCardComponent {
  @Input() book!: BookCard;

  /**
   * Localisation du LIVRE, pas du vendeur.
   *
   * La carte affichait seller.address, c'est-à-dire l'adresse du profil : tous
   * les livres d'un même vendeur portaient donc la même mention, quelle que
   * soit la ville renseignée à la publication. On retombe sur l'adresse du
   * profil uniquement pour les annonces antérieures au champ Ville.
   */
  get locationText(): string {
    const own = [this.book.location_label, this.book.city?.name].filter(Boolean).join(', ');
    return own || this.book.seller?.address || 'Non précisé';
  }

  get conditionLabel(): string {
    return ({ new: 'Neuf', like_new: 'Très bon', good: 'Bon état', fair: 'Correct' } as any)[this.book.condition] || this.book.condition;
  }
  get conditionClass(): string {
    return ({ new: 'bg-green-100 text-green-700', like_new: 'bg-blue-100 text-blue-700', good: 'bg-amber-100 text-amber-700', fair: 'bg-gray-100 text-gray-600' } as any)[this.book.condition] || 'bg-gray-100 text-gray-600';
  }
  slugify(text: string): string {
    return text.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

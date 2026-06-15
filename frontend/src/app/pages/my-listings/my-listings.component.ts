import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

interface MyBook {
  id: number; title: string; author: string; price: number;
  condition: string; is_available: boolean; views: number;
  is_boosted: boolean; images: { url: string; is_primary: boolean }[];
  created_at: string;
}

interface BoostOption {
  days: number;
  label: string;
  price: number;
  tag?: string;
}

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './my-listings.component.html',
})
export class MyListingsComponent implements OnInit {
  books: MyBook[] = [];
  loading = true;
  deletingId: number | null = null;
  boostingId: number | null = null;
  boostMessage = '';

  // Modale boost
  showBoostModal = false;
  selectedBook: MyBook | null = null;
  selectedDays = 7;

  boostOptions: BoostOption[] = [
    { days: 3,  label: '3 jours',  price: 500 },
    { days: 7,  label: '7 jours',  price: 1000, tag: 'Populaire' },
    { days: 14, label: '14 jours', price: 1800 },
    { days: 30, label: '30 jours', price: 3000, tag: 'Meilleure valeur' },
  ];

  conditionLabel: Record<string, string> = {
    new: 'Neuf', like_new: 'Très bon', good: 'Bon état', fair: 'Correct'
  };

  constructor(private auth: AuthService) {}

  async ngOnInit() {
    await this.loadBooks();
  }

  async loadBooks() {
    this.loading = true;
    try {
      const res = await fetch(`${environment.apiUrl}/api/books/me/listings`, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) this.books = await res.json();
    } catch {}
    this.loading = false;
  }

  async toggleAvailable(book: MyBook) {
    try {
      await fetch(`${environment.apiUrl}/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.auth.token}` },
        body: JSON.stringify({ is_available: !book.is_available }),
      });
      book.is_available = !book.is_available;
    } catch {}
  }

  async deleteBook(id: number) {
    if (!confirm('Supprimer cette annonce ?')) return;
    this.deletingId = id;
    try {
      await fetch(`${environment.apiUrl}/api/books/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      this.books = this.books.filter(b => b.id !== id);
    } catch {}
    this.deletingId = null;
  }

  openBoostModal(book: MyBook) {
    this.selectedBook = book;
    this.selectedDays = 7;
    this.showBoostModal = true;
  }

  closeBoostModal() {
    this.showBoostModal = false;
    this.selectedBook = null;
  }

  get selectedOption(): BoostOption {
    return this.boostOptions.find(o => o.days === this.selectedDays) ?? this.boostOptions[1];
  }

  async confirmBoost() {
    if (!this.selectedBook) return;
    this.boostingId = this.selectedBook.id;
    this.boostMessage = '';
    const bookId = this.selectedBook.id;
    this.closeBoostModal();
    try {
      const res = await fetch(`${environment.apiUrl}/api/books/${bookId}/boost-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.auth.token}` },
        body: JSON.stringify({ duration_days: this.selectedDays }),
      });
      const data = await res.json();
      if (res.ok) {
        this.boostMessage = `✅ Demande envoyée pour ${this.selectedDays} jours ! L'admin va examiner votre demande.`;
      } else {
        this.boostMessage = '⚠️ ' + (data.detail ?? 'Une erreur est survenue.');
      }
    } catch {
      this.boostMessage = '⚠️ Impossible de contacter le serveur.';
    }
    this.boostingId = null;
    setTimeout(() => this.boostMessage = '', 6000);
  }

  getImageUrl(book: MyBook): string {
    const url = book.images?.[0]?.url;
    if (!url) return 'https://placehold.co/80x80/f3f4f6/9ca3af?text=📚';
    return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  }
}

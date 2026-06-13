import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../core/auth.service';

interface MyBook {
  id: number; title: string; author: string; price: number;
  condition: string; is_available: boolean; views: number;
  is_boosted: boolean; images: { url: string; is_primary: boolean }[];
  created_at: string;
}

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './my-listings.component.html',
})
export class MyListingsComponent implements OnInit {
  books: MyBook[] = [];
  loading = true;
  deletingId: number | null = null;
  boostingId: number | null = null;
  boostMessage = '';

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
      const res = await fetch('http://localhost:8000/api/books/me/listings', {
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) this.books = await res.json();
    } catch {}
    this.loading = false;
  }

  async toggleAvailable(book: MyBook) {
    try {
      await fetch(`http://localhost:8000/api/books/${book.id}`, {
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
      await fetch(`http://localhost:8000/api/books/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      this.books = this.books.filter(b => b.id !== id);
    } catch {}
    this.deletingId = null;
  }

  async requestBoost(book: MyBook) {
    this.boostingId = book.id;
    this.boostMessage = '';
    try {
      const res = await fetch(`http://localhost:8000/api/books/${book.id}/boost-request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      const data = await res.json();
      if (res.ok) {
        this.boostMessage = '✅ Demande envoyée ! L\'admin va examiner votre demande.';
      } else {
        this.boostMessage = '⚠️ ' + (data.detail ?? 'Une erreur est survenue.');
      }
    } catch {
      this.boostMessage = '⚠️ Impossible de contacter le serveur.';
    }
    this.boostingId = null;
    setTimeout(() => this.boostMessage = '', 5000);
  }

  getImageUrl(book: MyBook): string {
    const url = book.images?.[0]?.url;
    if (!url) return 'https://placehold.co/80x80/f3f4f6/9ca3af?text=📚';
    return url.startsWith('http') ? url : `http://localhost:8000${url}`;
  }
}

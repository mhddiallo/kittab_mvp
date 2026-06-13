import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { AuthService } from '../../../core/auth.service';

interface Category { id: number; name: string; }

@Component({
  selector: 'app-edit-book',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './edit-book.component.html',
})
export class EditBookComponent implements OnInit {
  bookId!: number;
  title = '';
  author = '';
  categoryId: number | null = null;
  bookType = 'textbook';
  condition = '';
  price: number | null = null;
  description = '';
  isAvailable = true;

  categories: Category[] = [];
  loading = true;
  submitting = false;
  error = '';
  success = '';

  conditions = [
    { value: 'new', label: 'Neuf', emoji: '✨', desc: 'Jamais utilisé', cls: 'border-green-400 bg-green-50', textCls: 'text-green-600' },
    { value: 'like_new', label: 'Très bon', emoji: '👍', desc: 'Peu de traces', cls: 'border-blue-400 bg-blue-50', textCls: 'text-blue-600' },
    { value: 'good', label: 'Bon état', emoji: '📖', desc: 'Quelques marques', cls: 'border-yellow-400 bg-yellow-50', textCls: 'text-yellow-600' },
    { value: 'fair', label: 'Correct', emoji: '📝', desc: 'Très annoté', cls: 'border-orange-400 bg-orange-50', textCls: 'text-orange-600' },
  ];

  bookTypes = [
    { value: 'textbook', label: 'Manuel scolaire' },
    { value: 'novel', label: 'Roman' },
    { value: 'autobiography', label: 'Autobiographie' },
    { value: 'science', label: 'Science' },
    { value: 'history', label: 'Histoire' },
    { value: 'other', label: 'Autre' },
  ];

  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

  async ngOnInit() {
    this.bookId = Number(this.route.snapshot.paramMap.get('id'));
    await Promise.all([this.loadBook(), this.loadCategories()]);
  }

  async loadCategories() {
    try {
      const res = await fetch('http://localhost:8000/api/categories');
      if (res.ok) this.categories = await res.json();
    } catch {}
  }

  async loadBook() {
    try {
      const res = await fetch(`http://localhost:8000/api/books/${this.bookId}`, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) {
        const book = await res.json();
        this.title = book.title;
        this.author = book.author;
        this.categoryId = book.category_id ?? null;
        this.bookType = book.book_type ?? 'textbook';
        this.condition = book.condition;
        this.price = book.price;
        this.description = book.description ?? '';
        this.isAvailable = book.is_available;
      } else {
        this.error = 'Livre introuvable ou accès refusé.';
      }
    } catch {
      this.error = 'Impossible de contacter le serveur.';
    }
    this.loading = false;
  }

  get isValid() {
    return this.title && this.author && this.condition && this.price && this.price > 0;
  }

  async submit() {
    if (!this.isValid || this.submitting) return;
    this.submitting = true;
    this.error = '';
    this.success = '';

    try {
      const payload: any = {
        title: this.title,
        author: this.author,
        condition: this.condition,
        price: this.price,
        book_type: this.bookType,
        is_available: this.isAvailable,
        description: this.description || null,
      };
      if (this.categoryId) payload.category_id = this.categoryId;

      const res = await fetch(`http://localhost:8000/api/books/${this.bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.auth.token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        this.success = 'Annonce mise à jour !';
        setTimeout(() => this.router.navigate(['/my-listings']), 1200);
      } else {
        const err = await res.json();
        this.error = err.detail ?? 'Une erreur est survenue.';
      }
    } catch {
      this.error = 'Impossible de contacter le serveur.';
    }
    this.submitting = false;
  }
}

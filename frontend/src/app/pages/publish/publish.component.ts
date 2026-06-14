import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface AutocompleteResult {
  title: string;
  author: string;
  source: string;
  google_books_id?: string;
  thumbnail?: string;
}

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-publish',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './publish.component.html',
})
export class PublishComponent implements OnInit {
  // Form fields
  isPack = false;
  title = '';
  author = '';
  categoryId: number | null = null;
  bookType = 'textbook';
  condition = '';
  price: number | null = null;
  description = '';
  googleBooksId = '';
  acceptsExchange = false;
  educationLevel = '';
  packItems: string[] = ['', ''];

  educationLevels = ['6ème','5ème','4ème','3ème','Seconde','Première','Terminale','Licence 1','Licence 2','Licence 3','Master 1','Master 2'];

  // State
  categories: Category[] = [];
  suggestions: AutocompleteResult[] = [];
  showSuggestions = false;
  autocompleteLoading = false;
  images: File[] = [];
  imagePreviews: string[] = [];
  submitting = false;
  error = '';
  autocompleteTimeout: any;

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

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    try {
      const res = await fetch('http://localhost:8000/api/categories');
      if (res.ok) this.categories = await res.json();
    } catch {}
  }

  onTitleInput() {
    clearTimeout(this.autocompleteTimeout);
    if (this.title.length < 2) { this.suggestions = []; this.showSuggestions = false; return; }
    this.autocompleteLoading = true;
    this.autocompleteTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/books/autocomplete?q=${encodeURIComponent(this.title)}`);
        if (res.ok) { this.suggestions = await res.json(); this.showSuggestions = this.suggestions.length > 0; }
      } catch {}
      this.autocompleteLoading = false;
    }, 300);
  }

  selectSuggestion(s: AutocompleteResult) {
    this.title = s.title;
    this.author = s.author;
    this.googleBooksId = s.google_books_id ?? '';
    this.showSuggestions = false;
    this.suggestions = [];
  }

  onImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    const remaining = 4 - this.images.length;
    const toAdd = files.slice(0, remaining);
    this.images.push(...toAdd);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => this.imagePreviews.push(e.target?.result as string);
      reader.readAsDataURL(f);
    });
  }

  removeImage(i: number) {
    this.images.splice(i, 1);
    this.imagePreviews.splice(i, 1);
  }

  get emptySlots(): null[] {
    return Array(4 - this.imagePreviews.length).fill(null);
  }

  get conditionLabel(): string {
    return this.conditions.find(c => c.value === this.condition)?.label || '—';
  }

  addPackItem() {
    if (this.packItems.length < 10) this.packItems.push('');
  }

  removePackItem(i: number) {
    if (this.packItems.length > 1) this.packItems.splice(i, 1);
  }

  get validPackItems(): string[] {
    return this.packItems.filter(s => s.trim().length > 0);
  }

  get isValid() {
    if (!this.condition || !this.price || this.price <= 0) return false;
    if (this.isPack) return this.title.trim().length > 0 && this.validPackItems.length >= 2;
    return this.title.trim().length > 0 && this.author.trim().length > 0;
  }

  async submit() {
    if (!this.isValid || this.submitting) return;
    this.submitting = true;
    this.error = '';

    const token = localStorage.getItem('kittab_token');
    if (!token) { this.router.navigate(['/login']); return; }

    try {
      // Étape 1 : créer le livre en JSON
      const payload: any = {
        title: this.title,
        author: this.isPack ? 'Pack' : this.author,
        condition: this.condition,
        price: this.price,
        book_type: this.bookType,
        accepts_exchange: this.acceptsExchange,
        is_pack: this.isPack,
      };
      if (this.categoryId) payload.category_id = this.categoryId;
      if (this.description) payload.description = this.description;
      if (this.isPack) {
        payload.pack_items = this.validPackItems;
        if (this.educationLevel) payload.education_level = this.educationLevel;
      }

      const res = await fetch('http://localhost:8000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        this.error = err.detail ?? 'Une erreur est survenue.';
        if (res.status === 401) this.router.navigate(['/login']);
        this.submitting = false;
        return;
      }

      const book = await res.json();

      // Étape 2 : uploader les images une par une
      for (const img of this.images) {
        const form = new FormData();
        form.append('file', img);
        await fetch(`http://localhost:8000/api/books/${book.id}/images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
      }

      this.router.navigate(['/books', book.id]);
    } catch {
      this.error = 'Impossible de contacter le serveur.';
    }
    this.submitting = false;
  }
}

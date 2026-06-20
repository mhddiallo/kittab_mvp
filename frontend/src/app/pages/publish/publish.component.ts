import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { environment } from '../../../environments/environment';

interface AutocompleteResult {
  title: string;
  author: string;
  source: string;
  open_library_id?: string;
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
export class PublishComponent implements OnInit, OnDestroy {
  @ViewChild('barcodeVideo') barcodeVideo!: ElementRef<HTMLVideoElement>;
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
  selectedCover = '';
  language = '';
  pageCount: number | null = null;
  acceptsExchange = false;
  educationLevel = '';
  locationLabel = '';
  locationLat: number | null = null;
  locationLng: number | null = null;
  locationSuggestions: { label: string; lat: number; lng: number }[] = [];
  locationLoading = false;
  locationTimeout: any;
  showLocationSuggestions = false;
  packItems: { value: string }[] = [{ value: '' }, { value: '' }];

  languages = ['Français', 'Anglais', 'Arabe', 'Portugais', 'Wolof', 'Peul', 'Autre'];
  educationLevels = ['6ème','5ème','4ème','3ème','Seconde','Première','Terminale','Licence 1','Licence 2','Licence 3','Master 1','Master 2'];

  // State
  showPreviewModal = false;
  categories: Category[] = [];
  suggestions: AutocompleteResult[] = [];
  showSuggestions = false;
  autocompleteLoading = false;
  images: File[] = [];
  imagePreviews: string[] = [];
  submitting = false;
  error = '';
  autocompleteTimeout: any;
  scanLoading: false | 'cover' | 'back' | 'barcode' = false;
  scanError = '';
  showScanMenu = false;
  showBarcodeCamera = false;
  private barcodeReader: BrowserMultiFormatReader | null = null;
  private barcodeStream: MediaStream | null = null;
  private barcodeDetected = false;

  conditions = [
    {
      value: 'new',
      label: 'Parfait état',
      desc: 'Livre comme neuf, aucune marque d\'usure. Couverture intacte, coins parfaits, pas de pli ni de rayure.',
      img: 'assets/conditions/condition-new.jpg',
      color: 'border-green-400',
      bg: 'bg-green-50',
      badge: 'bg-green-100 text-green-700',
    },
    {
      value: 'like_new',
      label: 'Très bon état',
      desc: 'Légères traces d\'usage sur la couverture : petits frottements ou pliures légères. Intérieur propre.',
      img: 'assets/conditions/condition-like-new.jpg',
      color: 'border-green-300',
      bg: 'bg-green-50/50',
      badge: 'bg-teal-100 text-teal-700',
    },
    {
      value: 'good',
      label: 'État correct',
      desc: 'Traces d\'usure visibles : rayures, plis marqués ou coins abîmés. Intérieur en bon état.',
      img: 'assets/conditions/condition-correct.jpg',
      color: 'border-yellow-400',
      bg: 'bg-yellow-50',
      badge: 'bg-yellow-100 text-yellow-700',
    },
    {
      value: 'fair',
      label: 'Dégradé',
      desc: 'Couverture très abîmée : déchirures, taches, fortes plis ou coins manquants. Intérieur peut être altéré.',
      img: 'assets/conditions/condition-degrade.jpg',
      color: 'border-red-300',
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
    },
  ];

  get selectedCondition() {
    return this.conditions.find(c => c.value === this.condition) ?? null;
  }

  // Questionnaire état
  showConditionQuiz = false;
  quizStep = 0;
  quizAnswers: number[] = [];
  quizSuggestion: { condition: string; label: string; priceMin: number; priceMax: number } | null = null;

  quizQuestions = [
    {
      question: 'Les pages sont-elles toutes présentes et intactes ?',
      options: [
        { label: 'Oui, toutes les pages sont là', score: 0 },
        { label: 'Il manque ou des pages sont déchirées', score: 3 },
      ]
    },
    {
      question: 'La couverture est-elle en bon état ?',
      options: [
        { label: 'Propre, sans déchirure', score: 0 },
        { label: 'Légèrement abîmée ou cornée', score: 1 },
        { label: 'Très abîmée ou déchirée', score: 2 },
      ]
    },
    {
      question: 'Y a-t-il des annotations ou surlignages ?',
      options: [
        { label: 'Non, aucun', score: 0 },
        { label: 'Quelques-uns au crayon (effaçables)', score: 1 },
        { label: 'Beaucoup à l\'encre ou stabilo', score: 2 },
      ]
    },
    {
      question: 'Le livre a-t-il été utilisé ?',
      options: [
        { label: 'Jamais, il est neuf', score: 0 },
        { label: 'Peu utilisé', score: 1 },
        { label: 'Beaucoup utilisé', score: 2 },
      ]
    },
  ];

  openConditionQuiz() {
    this.showConditionQuiz = true;
    this.quizStep = 0;
    this.quizAnswers = [];
    this.quizSuggestion = null;
  }

  closeConditionQuiz() {
    this.showConditionQuiz = false;
  }

  answerQuiz(score: number) {
    this.quizAnswers.push(score);
    if (this.quizStep < this.quizQuestions.length - 1) {
      this.quizStep++;
    } else {
      this.computeQuizResult();
    }
  }

  computeQuizResult() {
    const total = this.quizAnswers.reduce((a, b) => a + b, 0);
    if (total === 0) {
      this.quizSuggestion = { condition: 'new', label: 'Parfait état', priceMin: 8000, priceMax: 25000 };
    } else if (total <= 2) {
      this.quizSuggestion = { condition: 'like_new', label: 'Très bon état', priceMin: 5000, priceMax: 15000 };
    } else if (total <= 4) {
      this.quizSuggestion = { condition: 'good', label: 'État correct', priceMin: 3000, priceMax: 8000 };
    } else {
      this.quizSuggestion = { condition: 'fair', label: 'Dégradé', priceMin: 1000, priceMax: 4000 };
    }
  }

  applyQuizSuggestion() {
    if (this.quizSuggestion) {
      this.condition = this.quizSuggestion.condition;
      if (!this.price) this.price = this.quizSuggestion.priceMin;
    }
    this.closeConditionQuiz();
  }

  bookTypes = [
    { value: 'textbook', label: 'Manuel scolaire' },
    { value: 'novel', label: 'Roman' },
    { value: 'autobiography', label: 'Autobiographie' },
    { value: 'science', label: 'Science' },
    { value: 'history', label: 'Histoire' },
    { value: 'other', label: 'Autre' },
  ];

  constructor(private router: Router, private auth: AuthService, private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnDestroy() { this.stopBarcodeCamera(); }

  async startBarcodeCamera() {
    this.showScanMenu = false;
    this.showBarcodeCamera = true;
    this.barcodeDetected = false;
    this.scanError = '';
    setTimeout(async () => {
      try {
        this.barcodeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        this.barcodeVideo.nativeElement.srcObject = this.barcodeStream;
        this.barcodeReader = new BrowserMultiFormatReader();
        this.barcodeReader.decodeFromVideoElement(this.barcodeVideo.nativeElement, (result, err) => {
          if (result && !this.barcodeDetected) {
            this.barcodeDetected = true;
            const isbn = result.getText();
            this.stopBarcodeCamera();
            this.ngZone.run(() => this.lookupByIsbn(isbn));
          }
        });
      } catch {
        this.scanError = 'Impossible d\'accéder à la caméra.';
        this.showBarcodeCamera = false;
      }
    }, 200);
  }

  stopBarcodeCamera() {
    try { (this.barcodeReader as any)?.reset?.(); } catch {}
    this.barcodeStream?.getTracks().forEach(t => t.stop());
    this.barcodeReader = null;
    this.barcodeStream = null;
    this.showBarcodeCamera = false;
  }

  async onScanUpload(event: Event) {
    this.showScanMenu = false;
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.scanError = '';

    // Essayer d'abord le code-barres
    try {
      const reader = new BrowserMultiFormatReader();
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      const result = await reader.decodeFromCanvas(canvas);
      if (result) {
        await this.lookupByIsbn(result.getText());
        input.value = '';
        return;
      }
    } catch {}

    // Sinon scan couverture avec Claude
    await this.onScanImage({ target: input } as any, 'cover');
  }

  async lookupByIsbn(isbn: string) {
    this.scanLoading = 'barcode';
    this.scanError = '';
    try {
      const res = await fetch(`${environment.apiUrl}/api/books/info?isbn=${encodeURIComponent(isbn)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) this.title = data.title;
        if (data.author && !this.author) this.author = data.author;
        if (data.cover_url) this.selectedCover = data.cover_url;
        if (data.page_count) this.pageCount = data.page_count;
        if (data.kittab_category) {
          const match = this.categories.find(c => c.name === data.kittab_category);
          if (match) this.categoryId = match.id;
        }
        if (data.language && this.languages.includes(data.language)) this.language = data.language;
        this.scanError = '';
      } else {
        this.scanError = 'ISBN non trouvé dans Google Books, remplis manuellement.';
      }
    } catch {
      this.scanError = 'Erreur lors de la recherche par ISBN.';
    }
    this.scanLoading = false;
    this.cdr.detectChanges();
  }


  onLocationInput() {
    clearTimeout(this.locationTimeout);
    this.locationLat = null; this.locationLng = null;
    if (this.locationLabel.length < 2) { this.locationSuggestions = []; this.showLocationSuggestions = false; return; }
    this.locationLoading = true;
    this.locationTimeout = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.locationLabel)}&format=json&limit=5&countrycodes=sn,gn,ci,ml,fr&accept-language=fr`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
        const data = await res.json();
        this.locationSuggestions = data.map((item: any) => ({
          label: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        this.showLocationSuggestions = this.locationSuggestions.length > 0;
      } catch {}
      this.locationLoading = false;
    }, 400);
  }

  selectLocation(s: { label: string; lat: number; lng: number }) {
    this.locationLabel = s.label;
    this.locationLat = s.lat;
    this.locationLng = s.lng;
    this.locationSuggestions = [];
    this.showLocationSuggestions = false;
  }

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    try {
      const res = await fetch(`${environment.apiUrl}/api/categories`);
      if (res.ok) this.categories = await res.json();
    } catch {}
  }

  hideSuggestionsDelayed() {
    setTimeout(() => { this.showSuggestions = false; }, 400);
  }

  selectSuggestion(s: AutocompleteResult) {
    this.title = s.title;
    this.author = s.author;
    this.googleBooksId = s.open_library_id ?? '';
    this.selectedCover = s.thumbnail ?? '';
    this.showSuggestions = false;
    this.suggestions = [];

    if (s.source === 'google_books' && s.open_library_id) {
      fetch(`${environment.apiUrl}/api/books/catalog/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: s.title,
          author: s.author,
          open_library_id: s.open_library_id,
          cover_url: s.thumbnail ?? null,
        }),
      }).catch(() => {});

      // Récupérer la catégorie depuis Google Books
      fetch(`${environment.apiUrl}/api/books/info?google_id=${s.open_library_id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.kittab_category) {
            const match = this.categories.find(c => c.name === data.kittab_category);
            if (match) this.categoryId = match.id;
          }
          if (data?.page_count) this.pageCount = data.page_count;
        })
        .catch(() => {});
    }
  }

  async onScanImage(event: Event, mode: 'cover' | 'back' = 'cover') {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.scanLoading = mode;
    this.scanError = '';
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${environment.apiUrl}/api/books/scan-cover`, {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        // Ne pas écraser ce qui est déjà rempli
        if (data.title && !this.title) this.title = data.title;
        if (data.author && !this.author) this.author = data.author;
        if (data.category && !this.categoryId) {
          const match = this.categories.find(c => c.name === data.category);
          if (match) this.categoryId = match.id;
        }
        if (data.language && !this.language && this.languages.includes(data.language)) {
          this.language = data.language;
        }
        // Ajouter la photo scannée comme image de l'annonce
        if (this.images.length < 4) {
          this.images.push(file);
          const reader = new FileReader();
          reader.onload = e => this.imagePreviews.push(e.target?.result as string);
          reader.readAsDataURL(file);
        }
      } else {
        this.scanError = 'Impossible d\'analyser l\'image, remplis manuellement.';
      }
    } catch {
      this.scanError = 'Erreur lors de l\'analyse, remplis manuellement.';
    }
    this.scanLoading = false;
    this.cdr.detectChanges();
    input.value = '';
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

  get conditionBadge(): string {
    return this.conditions.find(c => c.value === this.condition)?.badge || 'bg-gray-100 text-gray-600';
  }

  showPreview() {
    if (!this.isValid) return;
    this.showPreviewModal = true;
  }

  closePreview() {
    this.showPreviewModal = false;
  }

  addPackItem() {
    if (this.packItems.length < 10) this.packItems.push({ value: '' });
  }

  removePackItem(i: number) {
    if (this.packItems.length > 1) this.packItems.splice(i, 1);
  }

  get validPackItems(): string[] {
    return this.packItems.map(p => p.value.trim()).filter(s => s.length > 0);
  }

  get isValid() {
    if (!this.condition || !this.price || this.price <= 0) return false;
    if (this.isPack) return this.title.trim().length > 0 && this.validPackItems.length >= 2;
    return this.title.trim().length > 0 && this.author.trim().length > 0 && this.locationLabel.trim().length > 0;
  }

  async submit() {
    if (!this.isValid || this.submitting) return;
    this.submitting = true;
    this.error = '';

    const token = localStorage.getItem('kittab_token');
    if (!token) { this.router.navigate(['/login']); return; }

    const userPhone = this.auth.user?.phone;
    if (!userPhone || userPhone.startsWith('google_')) {
      this.error = 'Vous devez ajouter un numéro de téléphone dans votre profil avant de publier une annonce.';
      this.submitting = false;
      this.router.navigate(['/profile']);
      return;
    }

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
      if (this.selectedCover) payload.cover_url = this.selectedCover;
      if (this.language) payload.language = this.language;
      if (this.pageCount) payload.page_count = this.pageCount;
      if (this.googleBooksId) payload.open_library_id = this.googleBooksId;
      if (this.locationLabel) payload.location_label = this.locationLabel;
      if (this.locationLat !== null) payload.latitude = this.locationLat;
      if (this.locationLng !== null) payload.longitude = this.locationLng;
      if (this.pageCount) payload.page_count = this.pageCount;
      if (this.isPack) {
        payload.pack_items = this.validPackItems;
        if (this.educationLevel) payload.education_level = this.educationLevel;
      }

      const res = await fetch(`${environment.apiUrl}/api/books`, {
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
        await fetch(`${environment.apiUrl}/api/books/${book.id}/images`, {
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

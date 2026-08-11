import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';

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
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
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
  // null tant que l'utilisateur n'a pas répondu : dans la maquette, ni "Oui"
  // ni "Non" n'est pré-sélectionné. Ces deux réponses restent facultatives
  // (pas d'astérisque), et sont converties en booléen à l'envoi.
  acceptsExchange: boolean | null = null;
  acceptsWhatsappContact: boolean | null = null;
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

  // ── Assistant en 4 étapes ──────────────────────────────
  step = 1;

  /** Infobulle du "i" à côté de "Contact par WhatsApp ?". */
  showWhatsappInfo = false;

  readonly steps = [
    {
      n: 1, label: 'Livre', heading: 'Quel livre vends-tu ?', emoji: '📖',
      text: 'Scanne son ISBN pour un remplissage automatique, ou renseigne-le manuellement.',
      tip: "Un titre précis attire plus d'acheteurs.",
      gradient: 'from-[#C0452F] to-[#A63A28]',
    },
    {
      n: 2, label: 'État', heading: 'Décris son état', emoji: '🏷️',
      text: "Sois honnête sur l'état : ça crée la confiance et évite les mauvaises surprises.",
      tip: 'Précise ta ville pour faciliter la rencontre.',
      gradient: 'from-[#3E8E5A] to-[#2E7A4A]',
    },
    {
      n: 3, label: 'Prix', heading: 'Fixe tes conditions', emoji: '💰',
      text: 'Choisis ton prix librement. Tu peux aussi accepter les échanges ou la messagerie via WhatsApp.',
      tip: 'Les échanges livre contre livre plaisent beaucoup.',
      gradient: 'from-[#5B7FE0] to-[#3F62D4]',
    },
    {
      n: 4, label: 'Photos', heading: 'Dernière étape', emoji: '📸',
      text: 'Ajoute de vraies photos de ton exemplaire : couverture, dos, pages intérieures.',
      tip: 'Les annonces avec photos se vendent 3x plus vite.',
      gradient: 'from-[#E8A317] to-[#CE8A00]',
    },
  ];

  // Les quatre états réels de la maquette. "Je ne sais pas" n'est pas une
  // valeur stockée : ce bouton ouvre le questionnaire, qui déduit l'état.
  readonly conditionChoices = [
    { value: 'new',      label: 'Parfait',  emoji: '✨', iconBg: 'bg-green-500' },
    { value: 'like_new', label: 'Très bon', emoji: '🙂', iconBg: 'bg-blue-500' },
    { value: 'good',     label: 'Correct',  emoji: '📙', iconBg: 'bg-amber-400' },
    { value: 'fair',     label: 'Dégradé',  emoji: '📕', iconBg: 'bg-gray-500' },
  ];

  get currentStep() {
    return this.steps[this.step - 1];
  }

  /** Champs marqués d'un astérisque dans la maquette, étape par étape. */
  stepValid(step: number): boolean {
    switch (step) {
      case 1: return this.title.trim().length > 0 && this.author.trim().length > 0;
      case 2: return !!this.condition && this.locationLabel.trim().length > 0;
      case 3: return !!this.price && this.price > 0;
      case 4: return this.images.length > 0;
      default: return false;
    }
  }

  get canContinue(): boolean {
    return this.stepValid(this.step);
  }

  next() {
    if (!this.canContinue || this.step >= 4) return;
    this.step++;
    this.scrollToTop();
  }

  prev() {
    if (this.step <= 1) return;
    this.step--;
    this.scrollToTop();
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
  /** Renseigné quand l'annonce est créée mais que des photos ont échoué. */
  createdBookId: number | null = null;

  /** Progression de l'envoi des photos, affichée dans la fenêtre d'attente. */
  uploadDone = 0;
  uploadTotal = 0;

  /**
   * Étape en cours de la publication. Les messages affichés suivent le
   * traitement réel plutôt que de défiler au hasard : l'utilisateur sait où
   * il en est, et une attente qu'on peut situer paraît plus courte.
   */
  publishPhase: '' | 'creating' | 'optimizing' | 'uploading' | 'finalizing' = '';

  get phaseMessage(): string {
    switch (this.publishPhase) {
      case 'creating':   return 'On prépare ton annonce...';
      case 'optimizing': return 'On allège tes photos pour un envoi plus rapide...';
      case 'uploading':  return 'Envoi de tes photos...';
      case 'finalizing': return 'Presque fini, on met ton annonce en ligne...';
      default:           return 'Publication en cours...';
    }
  }

  get phaseHint(): string {
    return this.publishPhase === 'uploading' && this.uploadTotal > 1
      ? 'Reste sur cette page, ça peut prendre quelques secondes selon ta connexion.'
      : 'Reste sur cette page, ça ne prend qu\'un instant.';
  }

  get uploadPercent(): number {
    if (!this.uploadTotal) return 0;
    return Math.round((this.uploadDone / this.uploadTotal) * 100);
  }

  get submitLabel(): string {
    return this.submitting ? 'Publication...' : "Publier l'annonce →";
  }
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
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.locationLabel)}&format=json&addressdetails=1&limit=5&countrycodes=sn,gn,ci,ml,fr&accept-language=fr`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
        const data = await res.json();
        this.locationSuggestions = data.map((item: any) => ({
          label: this.shortenAddress(item),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        this.showLocationSuggestions = this.locationSuggestions.length > 0;
      } catch {}
      this.locationLoading = false;
    }, 400);
  }

  private shortenAddress(item: any): string {
    const a = item.address ?? {};
    const parts: string[] = [];
    const neighbourhood = a.neighbourhood || a.suburb || a.quarter || a.hamlet || a.village;
    const city = a.city || a.town || a.municipality || a.county;
    const country = a.country;
    if (neighbourhood) parts.push(neighbourhood);
    if (city && city !== neighbourhood) parts.push(city);
    if (country) parts.push(country);
    return parts.length > 0 ? parts.join(', ') : item.display_name;
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
    if (this.isPack) {
      if (!this.condition || !this.price || this.price <= 0 || this.images.length === 0) return false;
      return this.title.trim().length > 0 && this.validPackItems.length >= 2;
    }
    return [1, 2, 3, 4].every(s => this.stepValid(s));
  }

  // ── Optimisation des photos avant envoi ────────────────
  //
  // Une photo d'iPhone fait 2 à 5 Mo pour 3024x4032 px. C'est bien au-delà de
  // ce qu'un écran affiche, et c'est ce qui rendait la publication lente en
  // 4G. On redimensionne donc côté navigateur avant l'envoi.
  //
  // Réglages volontairement prudents pour préserver la lisibilité d'une
  // couverture de livre (titre, auteur, mentions d'édition) : 2000 px sur le
  // plus grand côté et qualité JPEG 0,85. Une photo passe typiquement de
  // 2,5 Mo à 400-600 Ko, sans perte visible à l'écran.
  private static readonly MAX_DIMENSION = 2000;
  private static readonly JPEG_QUALITY = 0.85;
  /** En dessous, l'image est déjà légère : on n'y touche pas. */
  private static readonly SKIP_BELOW_BYTES = 700 * 1024;

  private async compressImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.size <= PublishComponent.SKIP_BELOW_BYTES) {
      return file;
    }
    try {
      // imageOrientation évite que les photos prises à la verticale
      // ressortent tournées : l'orientation EXIF est appliquée au dessin.
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const largestSide = Math.max(bitmap.width, bitmap.height);
      const scale = Math.min(1, PublishComponent.MAX_DIMENSION / largestSide);
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', PublishComponent.JPEG_QUALITY)
      );

      // Filet de sécurité : on ne remplace jamais l'original par plus lourd.
      if (!blob || blob.size >= file.size) return file;

      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], name, { type: 'image/jpeg' });
    } catch {
      return file;
    }
  }

  /**
   * Traduit une réponse d'erreur d'upload en texte lisible.
   *
   * FastAPI renvoie `detail` sous deux formes très différentes : une chaîne
   * pour un HTTPException levé par notre code, mais une LISTE d'objets pour
   * une erreur de validation 422. Interpoler cette liste telle quelle
   * affichait "[object Object]", ce qui ne renseignait sur rien.
   */
  private async describeUploadError(res: Response): Promise<string> {
    let body: any = null;
    try { body = await res.json(); } catch {}
    const detail = body?.detail;

    let message = '';
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((d: any) => `${(d?.loc ?? []).join('.')} : ${d?.msg ?? 'invalide'}`)
        .join(' ; ');
    } else if (detail) {
      message = JSON.stringify(detail);
    }

    return message ? `HTTP ${res.status} — ${message}` : `HTTP ${res.status}`;
  }

  async submit() {
    if (!this.isValid || this.submitting) return;
    this.submitting = true;
    this.error = '';
    this.publishPhase = 'creating';
    this.uploadDone = 0;
    this.uploadTotal = 0;

    const token = localStorage.getItem('kittab_token');
    if (!token) { this.router.navigate(['/login']); return; }

    const userPhone = this.auth.user?.phone;
    if (!userPhone || userPhone.startsWith('google_')) {
      this.error = 'Vous devez ajouter un numéro de téléphone dans votre profil avant de publier une annonce.';
      this.publishPhase = ""; this.submitting = false;
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
        accepts_exchange: !!this.acceptsExchange,
        accepts_whatsapp_contact: !!this.acceptsWhatsappContact,
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
        this.publishPhase = ""; this.submitting = false;
        return;
      }

      const book = await res.json();

      if (!book?.id) {
        this.error = "L'annonce a été créée mais le serveur n'a pas renvoyé son identifiant : les photos n'ont pas pu être rattachées. Retrouve l'annonce dans « Mes annonces ».";
        this.publishPhase = ""; this.submitting = false;
        return;
      }

      // Étape 2 : uploader les images une par une.
      // Les échecs étaient auparavant ignorés : l'annonce partait sans ses
      // photos et l'utilisateur était redirigé sans le moindre message.
      this.uploadTotal = this.images.length;
      this.uploadDone = 0;
      this.publishPhase = 'optimizing';

      const sendOne = async (img: File): Promise<string | null> => {
        const optimised = await this.compressImage(img);
        this.publishPhase = 'uploading';
        const form = new FormData();
        form.append('file', optimised);
        try {
          // ngsw-bypass : le service worker ne doit pas intercepter cet envoi.
          // Sur Safari iOS, un corps volumineux réémis par un service worker
          // est perdu en route (le serveur répondait 422 "body.file : Field
          // required"), alors que le JSON de création, plus petit, passait.
          // Ce paramètre fait exécuter la requête nativement par le navigateur.
          const imgRes = await fetch(`${environment.apiUrl}/api/books/${book.id}/images?ngsw-bypass=true`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          });
          return imgRes.ok ? null : await this.describeUploadError(imgRes);
        } catch (e: any) {
          return `connexion interrompue (${e?.message || 'inconnue'})`;
        } finally {
          this.uploadDone++;
        }
      };

      // La première photo part seule : le serveur marque comme couverture la
      // première image reçue. En tout envoyer en parallèle ferait dépendre la
      // couverture de l'ordre d'arrivée des requêtes. Les suivantes, elles,
      // partent ensemble.
      const [first, ...rest] = this.images;
      const failures = (
        [await sendOne(first), ...(await Promise.all(rest.map(sendOne)))]
      ).filter((f): f is string => f !== null);

      this.publishPhase = 'finalizing';

      if (failures.length > 0) {
        this.publishPhase = '';
        this.createdBookId = book.id;
        this.error = `Ton annonce a bien été créée, mais ${failures.length} photo(s) n'ont pas pu être envoyées (${failures[0]}). Tu peux les ajouter depuis « Mes annonces ».`;
        this.publishPhase = ""; this.submitting = false;
        return;
      }

      this.router.navigate(['/books', book.id]);
    } catch {
      this.error = 'Impossible de contacter le serveur.';
    }
    this.publishPhase = ""; this.submitting = false;
  }
}

import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BrowserMultiFormatReader } from '@zxing/browser';

import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { BookCoverComponent } from '../../components/book-cover/book-cover.component';

interface City { id: number; name: string; slug: string; }
interface Category { id: number; name: string; }

type Screen = 'message' | 'processing' | 'review' | 'result';

/**
 * Publication par message : le vendeur décrit son livre en texte libre,
 * l'IA en tire les champs du formulaire, et rien ne part avant que le
 * vendeur ait vérifié — même principe que le formulaire classique, un
 * chemin plus court pour y arriver.
 */
@Component({
  selector: 'app-publish-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, BookCoverComponent],
  templateUrl: './publish-ai.component.html',
})
export class PublishAiComponent implements OnInit, OnDestroy {
  @ViewChild('barcodeVideo') barcodeVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('coverVideo') coverVideo!: ElementRef<HTMLVideoElement>;

  screen: Screen = 'message';

  // ── Étape 1 : le message ────────────────────────────────────────────
  text = '';
  isbn = '';

  /** Même vérification que le formulaire classique (app/core/isbn.py côté serveur). */
  get normalizedIsbn(): string {
    const code = this.isbn.replace(/[\s\-–—]/g, '').toUpperCase();
    if (/^\d{9}[\dX]$/.test(code)) {
      const sum = [...code.slice(0, 9)].reduce((t, d, i) => t + (10 - i) * +d, 0);
      const rest = (11 - (sum % 11)) % 11;
      if (code[9] !== (rest === 10 ? 'X' : String(rest))) return '';
      const base = '978' + code.slice(0, 9);
      return base + PublishAiComponent.ean13CheckDigit(base);
    }
    if (/^\d{13}$/.test(code)) {
      if (!code.startsWith('978') && !code.startsWith('979')) return '';
      if (code[12] !== PublishAiComponent.ean13CheckDigit(code.slice(0, 12))) return '';
      return code;
    }
    return '';
  }

  private static ean13CheckDigit(firstTwelve: string): string {
    const sum = [...firstTwelve].reduce((t, d, i) => t + (i % 2 === 0 ? 1 : 3) * +d, 0);
    return String((10 - (sum % 10)) % 10);
  }

  showBarcodeCamera = false;
  barcodeError = '';
  private barcodeReader: BrowserMultiFormatReader | null = null;
  private barcodeStream: MediaStream | null = null;
  private barcodeDetected = false;

  async startBarcodeCamera() {
    this.showBarcodeCamera = true;
    this.barcodeDetected = false;
    this.barcodeError = '';
    setTimeout(async () => {
      try {
        this.barcodeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        this.barcodeVideo.nativeElement.srcObject = this.barcodeStream;
        this.barcodeReader = new BrowserMultiFormatReader();
        this.barcodeReader.decodeFromVideoElement(this.barcodeVideo.nativeElement, (result) => {
          if (result && !this.barcodeDetected) {
            this.barcodeDetected = true;
            this.isbn = result.getText();
            this.stopBarcodeCamera();
            this.cdr.detectChanges();
          }
        });
      } catch {
        this.barcodeError = "Impossible d'accéder à la caméra.";
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

  get canAnalyze(): boolean {
    return this.text.trim().length > 0 && !this.analyzing;
  }

  analyzing = false;
  messageError = '';

  async analyze() {
    if (!this.canAnalyze) return;
    this.analyzing = true;
    this.messageError = '';
    this.screen = 'processing';

    try {
      const payload: any = { text: this.text.trim() };
      if (this.normalizedIsbn) payload.isbn = this.normalizedIsbn;

      const token = localStorage.getItem('kittab_token');
      const res = await fetch(`${environment.apiUrl}/api/books/parse-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        this.messageError = err.detail ?? 'La lecture du message a échoué. Réessaie ou remplis le formulaire classique.';
        this.screen = 'message';
        this.analyzing = false;
        return;
      }

      const data = await res.json();
      this.title = data.title || '';
      this.author = data.author || '';
      this.condition = data.condition || '';
      this.price = data.price ?? null;
      this.cityId = data.city_id ?? null;
      this.locationLabel = data.location_label || '';
      this.categoryId = data.category_id ?? null;
      this.language = data.language || '';
      this.selectedCover = data.cover_url || '';
      this.pageCount = data.page_count ?? null;
      if (data.isbn) this.isbn = data.isbn;
      this.parseFailed = !!data.parse_failed;

      this.screen = 'review';
    } catch {
      this.messageError = 'Impossible de contacter le serveur. Réessaie dans un instant.';
      this.screen = 'message';
    }
    this.analyzing = false;
  }

  // ── Étape 2 : relecture ─────────────────────────────────────────────
  title = '';
  author = '';
  condition = '';
  price: number | null = null;
  cityId: number | null = null;
  locationLabel = '';
  categoryId: number | null = null;
  language = '';
  /** Couverture officielle si l'ISBN en a fourni une valide ; sinon vide,
   *  et app-book-cover compose alors la vignette générée automatiquement —
   *  même logique que sur le formulaire classique, rien de plus à coder ici. */
  selectedCover = '';
  pageCount: number | null = null;
  parseFailed = false;

  editingTitle = false;
  editingAuthor = false;
  editingPrice = false;

  cities: City[] = [];
  categories: Category[] = [];
  readonly languages = ['Français', 'Anglais', 'Arabe', 'Portugais', 'Wolof', 'Peul', 'Autre'];
  readonly conditionChoices = [
    { value: 'new', label: 'Parfait' },
    { value: 'like_new', label: 'Très bon' },
    { value: 'good', label: 'Correct' },
    { value: 'fair', label: 'Dégradé' },
  ];

  get cityName(): string {
    return this.cities.find(c => c.id === this.cityId)?.name || '';
  }

  get canPublish(): boolean {
    return this.title.trim().length > 0
      && this.author.trim().length > 0
      && !!this.condition
      && !!this.price && this.price > 0
      && this.cityId !== null
      && !!this.language
      && !!this.coverPhoto
      && !this.submitting;
  }

  async loadCities() {
    const country = this.auth.user?.country_code || 'SN';
    try {
      const res = await fetch(`${environment.apiUrl}/api/cities?country=${country}`);
      if (res.ok) this.cities = await res.json();
    } catch {}
  }

  async loadCategories() {
    try {
      const res = await fetch(`${environment.apiUrl}/api/categories`);
      if (res.ok) this.categories = await res.json();
    } catch {}
  }

  // ── Photos : couverture obligatoire (cadrage guidé), reste facultatif ──
  //
  // Reprend telle quelle la mécanique du formulaire classique : le cadre
  // affiché correspond exactement à la zone découpée, calculée une seule
  // fois pour ne jamais désynchroniser les deux (voir publish.component.ts).
  coverPhoto: File | null = null;
  coverPhotoPreview = '';
  showCoverCamera = false;
  coverCameraError = '';
  private coverStream: MediaStream | null = null;
  videoAspect = 3 / 4;

  static readonly FRAME_WIDTH_RATIO = 0.78;
  static readonly FRAME_ASPECT = 3 / 4;
  static readonly FRAME_MAX_HEIGHT_RATIO = 0.92;

  private get frameFractions(): { w: number; h: number } {
    const w = PublishAiComponent.FRAME_WIDTH_RATIO;
    const h = (w / PublishAiComponent.FRAME_ASPECT) * this.videoAspect;
    if (h <= PublishAiComponent.FRAME_MAX_HEIGHT_RATIO) return { w, h };
    const clamped = PublishAiComponent.FRAME_MAX_HEIGHT_RATIO;
    return { w: (clamped / this.videoAspect) * PublishAiComponent.FRAME_ASPECT, h: clamped };
  }

  get frameWidthCss(): string { return `${(this.frameFractions.w * 100).toFixed(2)}%`; }
  get frameHeightCss(): string { return `${(this.frameFractions.h * 100).toFixed(2)}%`; }

  async startCoverCamera() {
    this.showCoverCamera = true;
    this.coverCameraError = '';
    setTimeout(async () => {
      try {
        this.coverStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 } },
        });
        const video = this.coverVideo.nativeElement;
        video.srcObject = this.coverStream;
        video.onloadedmetadata = () => {
          this.ngZone.run(() => {
            this.videoAspect = video.videoWidth / video.videoHeight;
            this.cdr.detectChanges();
          });
        };
      } catch {
        this.coverCameraError = "Impossible d'accéder à la caméra.";
      }
      this.cdr.detectChanges();
    }, 200);
  }

  stopCoverCamera() {
    this.coverStream?.getTracks().forEach(t => t.stop());
    this.coverStream = null;
    this.showCoverCamera = false;
  }

  async captureCover() {
    const video = this.coverVideo?.nativeElement;
    if (!video || !video.videoWidth) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const { w, h } = this.frameFractions;
    const frameW = vw * w;
    const frameH = vh * h;
    const sx = (vw - frameW) / 2;
    const sy = (vh - frameH) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(frameW);
    canvas.height = Math.round(frameH);
    canvas.getContext('2d')!.drawImage(video, sx, sy, frameW, frameH, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.9));
    if (!blob) return;

    this.coverPhoto = new File([blob], `couverture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    this.coverPhotoPreview = canvas.toDataURL('image/jpeg', 0.7);
    this.stopCoverCamera();
    this.cdr.detectChanges();
  }

  /** Repli quand la caméra guidée est indisponible. */
  onCoverPhotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.coverPhoto = file;
    this.readFile(file, preview => { this.coverPhotoPreview = preview; this.cdr.detectChanges(); });
    input.value = '';
  }

  /** Dos, défaut particulier — facultatif, sans limite de mise en scène. */
  extraPhotos: File[] = [];
  extraPhotoPreviews: string[] = [];
  private static readonly MAX_EXTRA_PHOTOS = 2; // couverture + 2 = MAX_IMAGES côté serveur

  get canAddExtraPhoto(): boolean {
    return this.extraPhotos.length < PublishAiComponent.MAX_EXTRA_PHOTOS;
  }

  onExtraPhotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.canAddExtraPhoto) return;
    this.extraPhotos.push(file);
    this.readFile(file, preview => { this.extraPhotoPreviews.push(preview); this.cdr.detectChanges(); });
    input.value = '';
  }

  removeExtraPhoto(i: number) {
    this.extraPhotos.splice(i, 1);
    this.extraPhotoPreviews.splice(i, 1);
  }

  private readFile(file: File, apply: (preview: string) => void) {
    const reader = new FileReader();
    reader.onload = e => apply(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Publication ─────────────────────────────────────────────────────
  submitting = false;
  error = '';
  createdBookId: number | null = null;
  createdBookTitle = '';
  createdBookAuthor = '';

  private static readonly MAX_DIMENSION = 2000;
  private static readonly JPEG_QUALITY = 0.85;
  private static readonly SKIP_BELOW_BYTES = 700 * 1024;

  private async compressImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.size <= PublishAiComponent.SKIP_BELOW_BYTES) return file;
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const largestSide = Math.max(bitmap.width, bitmap.height);
      const scale = Math.min(1, PublishAiComponent.MAX_DIMENSION / largestSide);
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', PublishAiComponent.JPEG_QUALITY));
      if (!blob || blob.size >= file.size) return file;
      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], name, { type: 'image/jpeg' });
    } catch {
      return file;
    }
  }

  private async describeUploadError(res: Response): Promise<string> {
    let body: any = null;
    try { body = await res.json(); } catch {}
    const detail = body?.detail;
    let message = '';
    if (typeof detail === 'string') message = detail;
    else if (Array.isArray(detail)) message = detail.map((d: any) => `${(d?.loc ?? []).join('.')} : ${d?.msg ?? 'invalide'}`).join(' ; ');
    else if (detail) message = JSON.stringify(detail);
    return message ? `HTTP ${res.status} — ${message}` : `HTTP ${res.status}`;
  }

  async publish() {
    if (!this.canPublish) return;
    this.submitting = true;
    this.error = '';

    const token = localStorage.getItem('kittab_token');
    if (!token) { this.router.navigate(['/login']); return; }

    const userPhone = this.auth.user?.phone;
    if (!userPhone || userPhone.startsWith('google_')) {
      this.error = 'Ajoute un numéro de téléphone dans ton profil avant de publier.';
      this.submitting = false;
      this.router.navigate(['/profile']);
      return;
    }

    try {
      const payload: any = {
        title: this.title,
        author: this.author,
        condition: this.condition,
        price: this.price,
        book_type: 'textbook',
        accepts_exchange: false,
        accepts_whatsapp_contact: false,
        is_pack: false,
      };
      if (this.normalizedIsbn) payload.isbn = this.normalizedIsbn;
      if (this.categoryId) payload.category_id = this.categoryId;
      if (this.selectedCover) payload.cover_url = this.selectedCover;
      if (this.language) payload.language = this.language;
      if (this.pageCount) payload.page_count = this.pageCount;
      if (this.cityId !== null) payload.city_id = this.cityId;
      if (this.locationLabel) payload.location_label = this.locationLabel.trim();

      const res = await fetch(`${environment.apiUrl}/api/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        this.error = err.detail ?? 'Une erreur est survenue.';
        if (res.status === 401) this.router.navigate(['/login']);
        this.submitting = false;
        return;
      }

      const book = await res.json();
      if (!book?.id) {
        this.error = "L'annonce a été créée mais les photos n'ont pas pu être rattachées. Retrouve-la dans « Mes annonces ».";
        this.submitting = false;
        return;
      }

      const images = [this.coverPhoto!, ...this.extraPhotos];
      const sendOne = async (img: File): Promise<string | null> => {
        const optimised = await this.compressImage(img);
        const form = new FormData();
        form.append('file', optimised);
        try {
          const imgRes = await fetch(`${environment.apiUrl}/api/books/${book.id}/images?ngsw-bypass=true`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          });
          return imgRes.ok ? null : await this.describeUploadError(imgRes);
        } catch (e: any) {
          return `connexion interrompue (${e?.message || 'inconnue'})`;
        }
      };

      const [first, ...rest] = images;
      const failures = ([await sendOne(first), ...(await Promise.all(rest.map(sendOne)))]).filter((f): f is string => f !== null);

      if (failures.length > 0) {
        this.createdBookId = book.id;
        this.error = `Ton annonce a bien été créée, mais ${failures.length} photo(s) n'ont pas pu être envoyées (${failures[0]}). Tu peux les ajouter depuis « Mes annonces ».`;
        this.submitting = false;
        return;
      }

      this.createdBookId = book.id;
      this.createdBookTitle = this.title;
      this.createdBookAuthor = this.author;
      this.screen = 'result';
    } catch {
      this.error = 'Impossible de contacter le serveur.';
    }
    this.submitting = false;
  }

  /** Repart de zéro pour un nouveau livre, sans quitter le flux message. */
  addAnother() {
    this.screen = 'message';
    this.text = '';
    this.isbn = '';
    this.messageError = '';
    this.title = ''; this.author = ''; this.condition = ''; this.price = null;
    this.cityId = null; this.locationLabel = ''; this.categoryId = null; this.language = '';
    this.selectedCover = ''; this.pageCount = null; this.parseFailed = false;
    this.coverPhoto = null; this.coverPhotoPreview = '';
    this.extraPhotos = []; this.extraPhotoPreviews = [];
    this.createdBookId = null; this.error = '';
  }

  constructor(private router: Router, public auth: AuthService, private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadCategories();
    this.loadCities();
  }

  ngOnDestroy() {
    this.stopBarcodeCamera();
    this.stopCoverCamera();
  }
}

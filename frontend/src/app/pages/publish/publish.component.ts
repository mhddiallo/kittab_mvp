import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';

import { environment } from '../../../environments/environment';
import { EDUCATION_CYCLES, SUBJECTS, SCHOOL_CATEGORY_NAME } from '../../core/education';

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
  @ViewChild('coverVideo') coverVideo!: ElementRef<HTMLVideoElement>;
  // Form fields
  isPack = false;
  title = '';
  author = '';
  /**
   * ISBN de l'exemplaire, scanné ou saisi à la main.
   *
   * C'est la seule clé fiable pour rattacher une annonce à une couverture de
   * référence : un ISBN identifie une édition et un format précis, là où
   * « titre + auteur » confond les cinq éditions d'un même manuel.
   */
  isbn = '';
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
  /** Quartier : saisie libre, facultative. La ville est portée par cityId. */
  cityId: number | null = null;
  cities: { id: number; name: string; slug: string }[] = [];
  packItems: { value: string }[] = [{ value: '' }, { value: '' }];

  languages = ['Français', 'Anglais', 'Arabe', 'Portugais', 'Wolof', 'Peul', 'Autre'];
  /** Référentiel scolaire partagé avec le catalogue (voir core/education.ts). */
  readonly educationCycles = EDUCATION_CYCLES;
  readonly subjects = SUBJECTS;

  subject = '';

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

  /**
   * ISBN ramené à sa forme ISBN-13 sans séparateur, ou '' s'il est invalide.
   *
   * Même règle que le serveur (`app/core/isbn.py`) : on vérifie la clé de
   * contrôle plutôt que la seule longueur. Un ISBN mal saisi pointerait vers
   * un autre livre, et le catalogue afficherait une couverture sans rapport
   * avec l'exemplaire mis en vente.
   */
  get normalizedIsbn(): string {
    const code = this.isbn.replace(/[\s\-–—]/g, '').toUpperCase();

    if (/^\d{9}[\dX]$/.test(code)) {
      const sum = [...code.slice(0, 9)].reduce((t, d, i) => t + (10 - i) * +d, 0);
      const rest = (11 - (sum % 11)) % 11;
      if (code[9] !== (rest === 10 ? 'X' : String(rest))) return '';
      const base = '978' + code.slice(0, 9);
      return base + PublishComponent.ean13CheckDigit(base);
    }

    if (/^\d{13}$/.test(code)) {
      if (!code.startsWith('978') && !code.startsWith('979')) return '';
      if (code[12] !== PublishComponent.ean13CheckDigit(code.slice(0, 12))) return '';
      return code;
    }

    return '';
  }

  private static ean13CheckDigit(firstTwelve: string): string {
    const sum = [...firstTwelve].reduce((t, d, i) => t + (i % 2 === 0 ? 1 : 3) * +d, 0);
    return String((10 - (sum % 10)) % 10);
  }

  get isValidIsbn(): boolean {
    return this.normalizedIsbn !== '';
  }

  /** Signale une saisie qui ressemble à un ISBN sans en être un. */
  get isbnError(): string {
    if (!this.isbn.trim() || this.isValidIsbn) return '';
    return "Ce code ne correspond pas à un ISBN valide, vérifie les chiffres.";
  }

  /** Champs marqués d'un astérisque dans la maquette, étape par étape. */
  stepValid(step: number): boolean {
    switch (step) {
      case 1: return this.title.trim().length > 0 && this.author.trim().length > 0
                     && (!this.isSchoolBook || (!!this.educationLevel && !!this.subject));
      case 2: return !!this.condition && this.cityId !== null;
      case 3: return !!this.price && this.price > 0;
      case 4: return this.images.length > 0;
      default: return false;
    }
  }

  /**
   * Une annonce scolaire appelle des champs que les autres n'ont pas : un
   * parent ne cherche pas un titre, il cherche « ce qu'il faut pour la 4ème ».
   * Ces champs n'apparaissent donc que dans ce cas, pour ne pas réalourdir le
   * formulaire de tout le monde.
   */
  get isSchoolBook(): boolean {
    return this.categories.find(c => c.id === this.categoryId)?.name === SCHOOL_CATEGORY_NAME;
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

  /**
   * Durée minimale d'affichage d'un message d'étape.
   *
   * La création de l'annonce et la compression des photos durent quelques
   * centaines de millisecondes : leurs messages défilaient trop vite pour être
   * lus, et on ne voyait que "Envoi de tes photos". Chaque étape est donc
   * maintenue à l'écran le temps d'être lue, en file d'attente.
   *
   * Cette file ne ralentit pas le traitement : elle ne pilote que l'affichage.
   */
  private static readonly MIN_PHASE_MS = 900;
  private phaseQueue: Promise<void> = Promise.resolve();
  private lastRequestedPhase: typeof this.publishPhase = '';
  /** Incrémenté à chaque remise à zéro : les étapes encore en file sont ignorées. */
  private phaseRun = 0;

  private setPhase(phase: typeof this.publishPhase) {
    // L'envoi des photos passe par ici une fois par image : sans ce garde-fou,
    // le même message serait mis en file autant de fois qu'il y a de photos.
    if (phase === this.lastRequestedPhase) return;
    this.lastRequestedPhase = phase;

    const run = this.phaseRun;
    this.phaseQueue = this.phaseQueue.then(async () => {
      if (run !== this.phaseRun) return;
      this.publishPhase = phase;
      await new Promise(resolve => setTimeout(resolve, PublishComponent.MIN_PHASE_MS));
    });
  }

  /** Ferme la fenêtre d'attente sans laisser un message en file la rouvrir. */
  private resetPhase() {
    this.phaseRun++;
    this.phaseQueue = Promise.resolve();
    this.lastRequestedPhase = '';
    this.publishPhase = '';
  }

  /** Laisse le dernier message le temps d'être lu avant de quitter la page. */
  private async flushPhases() {
    await this.phaseQueue;
  }

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

  /**
   * Étape de confirmation. Le bouton "Publier" n'envoie plus directement :
   * il ouvre un récapitulatif que l'utilisateur valide. La publication ne
   * démarre qu'après, et la même fenêtre affiche alors la progression.
   */
  showConfirm = false;

  openConfirm() {
    if (!this.isValid || this.submitting) return;
    this.error = '';
    this.createdBookId = null;
    this.showConfirm = true;
  }

  closeConfirm() {
    if (this.submitting) return;
    this.showConfirm = false;
  }

  get cityName(): string {
    return this.cities.find(c => c.id === this.cityId)?.name || '—';
  }

  get exchangeLabel(): string {
    if (this.acceptsExchange === null) return 'Non précisé';
    return this.acceptsExchange ? 'Oui' : 'Non';
  }

  get whatsappLabel(): string {
    if (this.acceptsWhatsappContact === null) return 'Non précisé';
    return this.acceptsWhatsappContact ? 'Oui' : 'Non';
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

  constructor(private router: Router, public auth: AuthService, private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnDestroy() { this.stopBarcodeCamera(); this.stopCoverCamera(); }

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

  /**
   * Ce que la recherche a rempli, et ce qu'il reste à faire à la main.
   *
   * Les éditions françaises et africaines sont souvent référencées sans image
   * ni rubrique chez Google Books. Le formulaire se contentait alors de ne
   * rien remplir, sans rien dire : impossible de savoir si la recherche avait
   * échoué ou si le livre était incomplet.
   */
  private describeLookup(data: any): string {
    if (data.lookup_failed) {
      return 'La recherche automatique est momentanément indisponible. Remplis les champs à la main, ton ISBN est conservé.';
    }
    if (!data.title) {
      return "Ce livre n'est pas référencé. Remplis les champs à la main, ton ISBN est conservé.";
    }

    const missing: string[] = [];
    if (!this.selectedCover) missing.push('la couverture');
    if (!this.categoryId) missing.push('la catégorie');
    if (!missing.length) return '';

    return `Fiche trouvée, mais ${missing.join(' et ')} ${missing.length > 1 ? 'manquent' : 'manque'} : à compléter ci-dessous.`;
  }

  /** L'image annoncée ne charge pas : on n'affirme pas l'avoir trouvée. */
  onCoverError() {
    this.selectedCover = '';
    this.scanError = "La couverture trouvée n'a pas pu être chargée : ajoute une photo de la couverture à l'étape Photos.";
  }

  async lookupByIsbn(isbn: string) {
    // On retient l'ISBN avant même d'interroger Google Books : qu'il y ait une
    // fiche ou non, c'est lui qui permettra plus tard de rattacher l'annonce à
    // une couverture de référence. Auparavant il était simplement perdu.
    this.isbn = isbn;

    this.scanLoading = 'barcode';
    this.scanError = '';
    try {
      // On transmet aussi ce que le vendeur a déjà saisi : le serveur sait
      // chercher par titre et auteur quand l'ISBN ne donne rien, mais ce
      // second essai n'était jamais déclenché faute de lui envoyer ces champs.
      const params = new URLSearchParams({ isbn });
      if (this.title.trim()) params.set('title', this.title.trim());
      if (this.author.trim()) params.set('author', this.author.trim());

      const res = await fetch(`${environment.apiUrl}/api/books/info?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) this.title = data.title;
        if (data.author && !this.author) this.author = data.author;
        if (data.cover_url) this.selectedCover = data.cover_url;
        if (data.page_count) this.pageCount = data.page_count;
        if (data.google_id) this.googleBooksId = data.google_id;
        if (data.kittab_category) {
          const match = this.categories.find(c => c.name === data.kittab_category);
          if (match) this.categoryId = match.id;
        }
        if (data.language && this.languages.includes(data.language)) this.language = data.language;
        this.scanError = this.describeLookup(data);
      } else {
        this.scanError = 'La recherche automatique a échoué. Remplis les champs à la main, ton ISBN est conservé.';
      }
    } catch {
      this.scanError = 'Erreur lors de la recherche par ISBN.';
    }
    this.scanLoading = false;
    this.cdr.detectChanges();
  }


  /**
   * Chargement du référentiel de villes.
   *
   * Remplace l'autocomplétion Nominatim : celle-ci laissait saisir n'importe
   * quelle orthographe, ce qui rendait le filtre du catalogue inexploitable,
   * et OpenStreetMap plafonne l'usage à une requête par seconde — intenable
   * dès que plusieurs personnes publient en même temps.
   */
  async loadCities() {
    const country = this.auth.user?.country_code || 'SN';
    try {
      const res = await fetch(`${environment.apiUrl}/api/cities?country=${country}`);
      if (res.ok) this.cities = await res.json();
    } catch {}
  }

  ngOnInit() {
    this.loadCategories();
    this.loadCities();
  }

  async loadCategories() {
    try {
      const res = await fetch(`${environment.apiUrl}/api/categories`);
      if (res.ok) this.categories = await res.json();
    } catch {}
  }

  /**
   * Le vendeur signale que la couverture trouvée n'est pas la sienne.
   *
   * On l'écarte sans rien exiger de plus : le catalogue composera alors une
   * vignette à partir du titre et de l'auteur, et la grille restera homogène.
   * Ses propres photos restent visibles sur la fiche de l'annonce.
   */
  rejectCover() {
    this.selectedCover = '';
    this.scanError = "Couverture écartée. Le catalogue affichera le titre et l'auteur ; tes photos resteront visibles sur la fiche de l'annonce.";
  }

  // ── Prise de vue guidée de la couverture ──────────────────────────
  //
  // Guider le cadrage à la prise de vue vaut mieux que corriger après coup :
  // aucun traitement ne rattrape un livre pris de biais dans la pénombre, et
  // un cadre à l'écran ne coûte ni calcul ni latence sur les téléphones
  // modestes.
  showCoverCamera = false;
  coverCameraError = '';
  private coverStream: MediaStream | null = null;
  /** Proportions réelles du flux, pour que le cadre affiché corresponde
   *  exactement à la zone découpée. */
  videoAspect = 3 / 4;

  static readonly FRAME_WIDTH_RATIO = 0.78;
  static readonly FRAME_ASPECT = 3 / 4;
  /** Le cadre ne dépasse jamais cette part de la hauteur de l'image. */
  static readonly FRAME_MAX_HEIGHT_RATIO = 0.92;

  /**
   * Dimensions du cadre affiché, en pourcentage de l'image.
   *
   * Calculées ici et non en CSS, pour qu'elles proviennent des mêmes valeurs
   * que le découpage : sur un flux en paysage, un cadre 3/4 à 78 % de largeur
   * dépasse en hauteur, et le vendeur voyait un cadre qui ne correspondait
   * pas à la zone réellement conservée.
   */
  private get frameFractions(): { w: number; h: number } {
    const w = PublishComponent.FRAME_WIDTH_RATIO;
    const h = (w / PublishComponent.FRAME_ASPECT) * this.videoAspect;
    if (h <= PublishComponent.FRAME_MAX_HEIGHT_RATIO) return { w, h };

    const clamped = PublishComponent.FRAME_MAX_HEIGHT_RATIO;
    return { w: (clamped / this.videoAspect) * PublishComponent.FRAME_ASPECT, h: clamped };
  }

  get frameWidthCss(): string {
    return `${(this.frameFractions.w * 100).toFixed(2)}%`;
  }

  get frameHeightCss(): string {
    return `${(this.frameFractions.h * 100).toFixed(2)}%`;
  }

  async startCoverCamera() {
    if (this.images.length >= 4) return;
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
        this.coverCameraError = "Impossible d'accéder à la caméra. Utilise « Ajouter des photos ».";
      }
      this.cdr.detectChanges();
    }, 200);
  }

  stopCoverCamera() {
    this.coverStream?.getTracks().forEach(t => t.stop());
    this.coverStream = null;
    this.showCoverCamera = false;
  }

  /**
   * Découpe la zone visée et l'ajoute en première photo.
   *
   * Le découpage reprend exactement les proportions du cadre affiché : le
   * vendeur obtient ce qu'il a vu, sans surprise.
   */
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

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.9));
    if (!blob) return;

    const file = new File([blob], `couverture-${Date.now()}.jpg`, { type: 'image/jpeg' });

    // En première position : le serveur marque comme couverture la première
    // image reçue, et c'est bien celle-ci.
    this.images.unshift(file);
    this.imagePreviews.unshift(canvas.toDataURL('image/jpeg', 0.7));
    if (this.images.length > 4) {
      this.images.pop();
      this.imagePreviews.pop();
    }

    this.stopCoverCamera();
    this.cdr.detectChanges();
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
    this.resetPhase();
    this.setPhase('creating');
    this.uploadDone = 0;
    this.uploadTotal = 0;

    const token = localStorage.getItem('kittab_token');
    if (!token) { this.router.navigate(['/login']); return; }

    const userPhone = this.auth.user?.phone;
    if (!userPhone || userPhone.startsWith('google_')) {
      this.error = 'Vous devez ajouter un numéro de téléphone dans votre profil avant de publier une annonce.';
      this.resetPhase(); this.showConfirm = false; this.submitting = false;
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
      if (this.isValidIsbn) payload.isbn = this.normalizedIsbn;
      if (this.educationLevel) payload.education_level = this.educationLevel;
      if (this.subject) payload.subject = this.subject;
      if (this.categoryId) payload.category_id = this.categoryId;
      if (this.description) payload.description = this.description;
      if (this.selectedCover) payload.cover_url = this.selectedCover;
      if (this.language) payload.language = this.language;
      if (this.pageCount) payload.page_count = this.pageCount;
      if (this.googleBooksId) payload.open_library_id = this.googleBooksId;
      if (this.cityId !== null) payload.city_id = this.cityId;
      if (this.locationLabel) payload.location_label = this.locationLabel.trim();
      if (this.locationLat !== null) payload.latitude = this.locationLat;
      if (this.locationLng !== null) payload.longitude = this.locationLng;
      if (this.pageCount) payload.page_count = this.pageCount;
      if (this.isPack) {
        payload.pack_items = this.validPackItems;
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
        this.resetPhase(); this.showConfirm = false; this.submitting = false;
        return;
      }

      const book = await res.json();

      if (!book?.id) {
        this.error = "L'annonce a été créée mais le serveur n'a pas renvoyé son identifiant : les photos n'ont pas pu être rattachées. Retrouve l'annonce dans « Mes annonces ».";
        this.resetPhase(); this.showConfirm = false; this.submitting = false;
        return;
      }

      // Étape 2 : uploader les images une par une.
      // Les échecs étaient auparavant ignorés : l'annonce partait sans ses
      // photos et l'utilisateur était redirigé sans le moindre message.
      this.uploadTotal = this.images.length;
      this.uploadDone = 0;
      this.setPhase('optimizing');

      const sendOne = async (img: File): Promise<string | null> => {
        const optimised = await this.compressImage(img);
        this.setPhase('uploading');
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

      this.setPhase('finalizing');

      if (failures.length > 0) {
        this.createdBookId = book.id;
        this.error = `Ton annonce a bien été créée, mais ${failures.length} photo(s) n'ont pas pu être envoyées (${failures[0]}). Tu peux les ajouter depuis « Mes annonces ».`;
        this.resetPhase(); this.showConfirm = false; this.submitting = false;
        return;
      }

      // Les envois peuvent finir avant que la file de messages soit épuisée :
      // sans cette attente, on quitterait la page pendant "On allège tes
      // photos" et les dernières étapes ne seraient jamais vues.
      await this.flushPhases();

      this.router.navigate(['/books', book.id]);
    } catch {
      this.error = 'Impossible de contacter le serveur.';
    }
    this.resetPhase(); this.showConfirm = false; this.submitting = false;
  }
}

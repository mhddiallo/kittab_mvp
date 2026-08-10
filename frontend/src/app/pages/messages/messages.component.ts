import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

interface MessageOut {
  id: number;
  sender_id: number;
  sender_username?: string;
  content: string;
  image_url?: string;
  created_at: string;
  read_at?: string;
  is_mine: boolean;
}

interface ConversationSummary {
  id: number;
  other_user: { id: number; username?: string };
  book: { id: number; title: string } | null;
  wanted_book: { id: number; title: string } | null;
  last_message: MessageOut | null;
  unread_count: number;
  created_at: string;
}

interface ConversationDetail {
  id: number;
  other_user: { id: number; username?: string };
  book: { id: number; title: string } | null;
  wanted_book: { id: number; title: string } | null;
  messages: MessageOut[];
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './messages.component.html',
})
export class MessagesComponent implements OnInit, OnDestroy {
  conversations: ConversationSummary[] = [];
  activeConversation: ConversationDetail | null = null;
  newMessage = '';
  loading = true;
  loadingConv = false;
  sending = false;
  error = '';
  selectedImages: File[] = [];
  imagePreviews: string[] = [];

  /** Filtre de la barre de recherche de la liste des conversations. */
  search = '';

  /**
   * Détail du livre de la conversation ouverte. La conversation ne renvoie que
   * l'id et le titre : on va chercher la couverture et le réglage WhatsApp,
   * pour ne jamais annoncer "Contact WhatsApp activé" à tort.
   */
  activeBook: { cover_url: string | null; accepts_whatsapp_contact: boolean } | null = null;

  private pollInterval: any;

  /** Palette d'avatars, choisie de façon stable à partir de l'id utilisateur. */
  private readonly avatarColors = [
    'bg-[#B03A28]', 'bg-[#3D5AF1]', 'bg-[#2E7A4A]',
    'bg-[#D19100]', 'bg-[#7A4BC4]', 'bg-[#0E7490]',
  ];

  avatarColor(userId?: number): string {
    return this.avatarColors[(userId ?? 0) % this.avatarColors.length];
  }

  /** "Aminata Diop" → "AD" ; "GorilleDiscret" → "GO". */
  getInitials(username?: string): string {
    const name = (username || '').trim();
    if (!name) return '?';
    const words = name.split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  get totalUnread(): number {
    return this.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  }

  get filteredConversations(): ConversationSummary[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.conversations;
    return this.conversations.filter(c =>
      (c.other_user.username || '').toLowerCase().includes(q) ||
      (c.book?.title || '').toLowerCase().includes(q) ||
      (c.wanted_book?.title || '').toLowerCase().includes(q) ||
      (c.last_message?.content || '').toLowerCase().includes(q)
    );
  }

  /** Horodatage court de la liste : "09:42", "hier", "lun.", puis la date. */
  listTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (sameDay(d, now)) return this.formatTime(dateStr);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay(d, yesterday)) return 'hier';

    if ((now.getTime() - d.getTime()) / 86400000 < 7) {
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  constructor(
    public auth: AuthService,
    private route: ActivatedRoute,
    public router: Router,
  ) {}

  async ngOnInit() {
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.auth.user) {
      await this.auth.loadUser();
    }

    // Handle ?new=1 query params for initiating a new conversation
    const qp = this.route.snapshot.queryParamMap;
    const isNew = qp.get('new') === '1';
    if (isNew) {
      const otherUserId = qp.get('other_user_id') ? parseInt(qp.get('other_user_id')!) : null;
      const userId = qp.get('user_id') ? parseInt(qp.get('user_id')!) : otherUserId;
      const bookId = qp.get('book_id') ? parseInt(qp.get('book_id')!) : null;
      const wantedBookId = qp.get('wanted_book_id') ? parseInt(qp.get('wanted_book_id')!) : null;
      const bookTitle = qp.get('book_title') || '';
      const isExchange = qp.get('exchange') === '1';

      if (userId) {
        const prefillMsg = isExchange
          ? `Bonjour, je suis intéressé(e) par votre livre "${bookTitle}" et je souhaite proposer un échange. Quel livre accepteriez-vous en échange ?`
          : bookId
          ? `Bonjour, je suis intéressé(e) par votre livre "${bookTitle}". Est-il toujours disponible ?`
          : wantedBookId
          ? 'Bonjour, j\'ai le livre que vous recherchez !'
          : 'Bonjour !';
        try {
          const res = await fetch(`${environment.apiUrl}/api/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.auth.token}` },
            body: JSON.stringify({
              other_user_id: userId,
              book_id: bookId,
              wanted_book_id: wantedBookId,
              initial_message: prefillMsg,
            }),
          });
          if (res.ok) {
            const conv = await res.json();
            this.router.navigate(['/messages', conv.id], { replaceUrl: true });
            return;
          }
        } catch {}
      }
    }

    await this.loadConversations();

    // Subscribe to route param changes
    this.route.params.subscribe(async params => {
      const id = params['id'];
      if (id) {
        await this.loadConversationDetail(parseInt(id));
      } else {
        this.activeConversation = null;
      }
    });

    // Initial active conversation
    const id = this.route.snapshot.params['id'];
    if (id) {
      await this.loadConversationDetail(parseInt(id));
    }

    // Poll every 5 seconds (silent — no spinner)
    this.pollInterval = setInterval(async () => {
      await this.loadConversations();
      if (this.activeConversation) {
        await this.loadConversationDetailSilent(this.activeConversation.id);
      }
    }, 5000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async loadConversations() {
    try {
      const res = await fetch(`${environment.apiUrl}/api/conversations`, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) {
        this.conversations = await res.json();
      }
    } catch {}
    this.loading = false;
  }

  async loadConversationDetail(id: number) {
    this.loadingConv = true;
    await this._fetchConversationDetail(id);
    this.loadingConv = false;
  }

  async loadConversationDetailSilent(id: number) {
    await this._fetchConversationDetail(id);
  }

  private async _fetchConversationDetail(id: number) {
    try {
      const res = await fetch(`${environment.apiUrl}/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
      });
      if (res.ok) {
        const previousBookId = this.activeConversation?.book?.id ?? null;
        this.activeConversation = await res.json();
        const conv = this.conversations.find(c => c.id === id);
        if (conv) conv.unread_count = 0;
        // Le détail du livre ne change pas d'un sondage à l'autre : on ne le
        // recharge que si la conversation ouverte porte sur un autre livre.
        const bookId = this.activeConversation?.book?.id ?? null;
        if (bookId !== previousBookId) this.loadActiveBook(bookId);
        setTimeout(() => this.scrollToBottom(), 50);
      } else if (res.status === 403 || res.status === 404) {
        this.router.navigate(['/messages']);
      }
    } catch {}
  }

  selectConversation(id: number) {
    this.router.navigate(['/messages', id]);
  }

  private async loadActiveBook(bookId: number | null) {
    this.activeBook = null;
    if (!bookId) return;
    try {
      const res = await fetch(`${environment.apiUrl}/api/books/${bookId}`);
      if (!res.ok) return;
      const book = await res.json();
      this.activeBook = {
        cover_url: book.cover_url ?? book.images?.[0] ?? null,
        accepts_whatsapp_contact: !!book.accepts_whatsapp_contact,
      };
    } catch {}
  }

  onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    this.selectedImages.push(...files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    }
    // Reset input so same files can be re-selected if needed
    input.value = '';
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  async sendMessage() {
    const hasText = this.newMessage.trim().length > 0;
    const hasImages = this.selectedImages.length > 0;
    if ((!hasText && !hasImages) || !this.activeConversation || this.sending) return;
    this.sending = true;
    try {
      const convId = this.activeConversation.id;

      // Upload each image as a separate message
      for (const file of this.selectedImages) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${environment.apiUrl}/api/conversations/${convId}/messages/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.auth.token}` },
          body: formData,
        });
        if (res.ok) {
          const msg: MessageOut = await res.json();
          this.activeConversation.messages.push(msg);
        }
      }
      this.selectedImages = [];
      this.imagePreviews = [];

      // Send text message if any
      if (hasText) {
        const res = await fetch(`${environment.apiUrl}/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.auth.token}` },
          body: JSON.stringify({ content: this.newMessage.trim() }),
        });
        if (res.ok) {
          const msg: MessageOut = await res.json();
          this.activeConversation.messages.push(msg);
          this.newMessage = '';
        }
      }

      setTimeout(() => this.scrollToBottom(), 50);
      this.loadConversations();
    } catch {}
    this.sending = false;
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom() {
    const el = document.getElementById('messages-container');
    if (el) el.scrollTop = el.scrollHeight;
  }

  timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 2592000) return `Il y a ${Math.floor(diff / 86400)} j`;
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return "Aujourd'hui";
    if (sameDay(d, yesterday)) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  showDateSeparator(messages: any[], index: number): boolean {
    if (index === 0) return true;
    const cur = new Date(messages[index].created_at);
    const prev = new Date(messages[index - 1].created_at);
    return cur.toDateString() !== prev.toDateString();
  }

  getInitial(username?: string): string {
    return username?.[0]?.toUpperCase() || '?';
  }

  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }

  openImage(url: string) {
    window.open(this.getImageUrl(url), '_blank');
  }

  /**
   * Doit rester aligné sur le point de rupture "lg" de Tailwind (1024px), celui
   * où le template passe de l'affichage une-colonne au deux-panneaux. Un écart
   * entre les deux ferait cohabiter la liste en pleine largeur et la
   * conversation sur les tablettes.
   */
  isMobile(): boolean {
    return window.innerWidth < 1024;
  }
}

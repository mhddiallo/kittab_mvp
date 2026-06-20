import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
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
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
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

  private pollInterval: any;

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

      if (userId) {
        const initialMsg = bookId
          ? 'Bonjour, je suis intéressé par votre livre.'
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
              initial_message: initialMsg,
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
        this.activeConversation = await res.json();
        const conv = this.conversations.find(c => c.id === id);
        if (conv) conv.unread_count = 0;
        setTimeout(() => this.scrollToBottom(), 50);
      } else if (res.status === 403 || res.status === 404) {
        this.router.navigate(['/messages']);
      }
    } catch {}
  }

  selectConversation(id: number) {
    this.router.navigate(['/messages', id]);
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

  isMobile(): boolean {
    return window.innerWidth < 768;
  }
}

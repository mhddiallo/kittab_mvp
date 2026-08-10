import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface ContactType {
  id: 'idee' | 'bug' | 'avis' | 'autre';
  emoji: string;
  label: string;
  subjectPlaceholder: string;
  messagePlaceholder: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  readonly types: ContactType[] = [
    {
      id: 'idee',
      emoji: '💡',
      label: 'Idée / fonctionnalité',
      subjectPlaceholder: 'Ex. Ajouter un filtre par langue du livre',
      messagePlaceholder: 'Décris ta fonctionnalité et pourquoi elle serait utile...',
    },
    {
      id: 'bug',
      emoji: '🐛',
      label: 'Signaler un bug',
      subjectPlaceholder: 'Ex. Le bouton Publier ne répond plus',
      messagePlaceholder: "Que s'est-il passé ? Sur quel écran ? Étapes pour reproduire...",
    },
    {
      id: 'avis',
      emoji: '❤️',
      label: 'Mon avis',
      subjectPlaceholder: "Ex. Ce que j'aime, ce qui pourrait être mieux",
      messagePlaceholder: 'Dis-nous ce que tu penses de Kittab, sans filtre...',
    },
    {
      id: 'autre',
      emoji: '💭',
      label: 'Autre question',
      subjectPlaceholder: 'Objet de ton message',
      messagePlaceholder: 'Écris-nous ton message...',
    },
  ];

  selectedType: ContactType = this.types[0];

  firstName = '';
  email = '';
  subject = '';
  message = '';
  sent = false;
  loading = false;

  selectType(type: ContactType) {
    this.selectedType = type;
  }

  get canSubmit(): boolean {
    return !!this.firstName.trim() && !!this.email.trim() && !!this.message.trim() && !this.loading;
  }

  submit() {
    if (!this.canSubmit) return;
    this.loading = true;
    // ATTENTION : aucun envoi réel pour l'instant. Il n'existe pas encore
    // d'endpoint côté backend, ce délai simule seulement la requête.
    setTimeout(() => {
      this.sent = true;
      this.loading = false;
    }, 800);
  }

  reset() {
    this.sent = false;
    this.subject = '';
    this.message = '';
  }
}

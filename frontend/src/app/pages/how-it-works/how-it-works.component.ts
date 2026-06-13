import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [RouterLink, CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './how-it-works.component.html',
})
export class HowItWorksComponent {
  openFaq: number | null = null;

  faqs = [
    { q: 'Comment utiliser KITTAB ?', r: 'KITTAB est accessible directement sur le web, sans téléchargement. Créez un compte gratuitement et commencez !' },
    { q: 'Dans quelles villes êtes-vous ?', r: 'Nous couvrons toute l\'Afrique francophone avec des vendeurs dans toutes les grandes villes.' },
    { q: 'Combien de temps pour vendre ?', r: 'En moyenne, 70% des livres sont vendus dans les 7 premiers jours après publication.' },
    { q: 'Comment garantir la qualité ?', r: 'Photos détaillées, système de notation des vendeurs et chat direct pour vérifier l\'état du livre.' },
  ];

  toggleFaq(i: number) {
    this.openFaq = this.openFaq === i ? null : i;
  }
}

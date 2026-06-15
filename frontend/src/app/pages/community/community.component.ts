import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './community.component.html',
})
export class CommunityComponent {
  features = [
    {
      emoji: '📖',
      title: 'Clubs de lecture',
      desc: 'Rejoins des groupes autour de tes genres préférés — romans africains, mangas, science-fiction, développement personnel...',
      color: 'bg-red-50 border-red-100',
      iconBg: 'bg-red-100 text-primary',
    },
    {
      emoji: '💬',
      title: 'Discussions par livre',
      desc: 'Chaque livre aura sa propre page de discussion. Partage tes impressions, pose des questions, débats avec d\'autres lecteurs.',
      color: 'bg-blue-50 border-blue-100',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      emoji: '🔄',
      title: 'Échanges organisés',
      desc: 'Propose des échanges directement dans les groupes. Trouve facilement quelqu\'un qui a ce que tu cherches.',
      color: 'bg-green-50 border-green-100',
      iconBg: 'bg-green-100 text-green-600',
    },
    {
      emoji: '🌍',
      title: 'Groupes par ville',
      desc: 'Retrouve les lecteurs de ta ville — Conakry, Dakar, Bamako — pour des échanges en main propre ou des rencontres littéraires.',
      color: 'bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-100 text-amber-600',
    },
    {
      emoji: '🎓',
      title: 'Espaces scolaires',
      desc: 'Des groupes dédiés par niveau (6ème, Terminale, Licence...) pour s\'entraider sur les manuels et partager des ressources.',
      color: 'bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-100 text-purple-600',
    },
    {
      emoji: '⭐',
      title: 'Recommandations',
      desc: 'Découvre des livres suggérés par la communauté. Les meilleures lectures remontent grâce aux votes des membres.',
      color: 'bg-orange-50 border-orange-100',
      iconBg: 'bg-orange-100 text-orange-600',
    },
  ];
}

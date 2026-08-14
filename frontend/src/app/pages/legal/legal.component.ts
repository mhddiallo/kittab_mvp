import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

type LegalSection = 'confidentialite' | 'conditions';

/**
 * Politique de confidentialité et conditions d'utilisation.
 *
 * Une seule page pour les deux textes : ils se lisent ensemble, se
 * maintiennent ensemble, et un lecteur qui vient pour l'un tombe souvent sur
 * une question couverte par l'autre. Les deux routes historiques
 * (`/confidentialite`, `/conditions`, déjà utilisées par la page de
 * connexion) ouvrent la même page sur l'onglet correspondant.
 *
 * Le texte ci-dessous est un texte provisoire, à remplacer par la version
 * officielle avant l'ouverture publique — voir le bandeau d'avertissement
 * dans le gabarit.
 */
@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './legal.component.html',
})
export class LegalComponent implements OnInit {
  active: LegalSection = 'confidentialite';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const section = this.route.snapshot.data['section'];
    if (section === 'conditions' || section === 'confidentialite') {
      this.active = section;
    }
  }

  show(section: LegalSection) {
    this.active = section;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

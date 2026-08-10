import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationError } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {
  private router = inject(Router);

  constructor() {
    // Filet de sécurité sur la navigation interne.
    //
    // Chaque page est chargée en lazy loading : un clic sur un lien déclenche le
    // téléchargement de son chunk JS. Après un déploiement, les chunks changent
    // de nom ; un onglet resté ouvert (ou un service worker qui sert encore les
    // fichiers de la version précédente) demande alors un fichier qui n'existe
    // plus. Le routeur émet un NavigationError et, sans traitement, le clic ne
    // produit tout simplement rien — alors qu'ouvrir le lien dans un nouvel
    // onglet fonctionne, puisque c'est un chargement complet.
    //
    // Dans ce cas on bascule sur une navigation navigateur classique, qui
    // repart d'un index.html frais. Le drapeau en sessionStorage garantit qu'on
    // ne tente ce rechargement qu'une fois par URL, pour éviter toute boucle si
    // la page est réellement cassée.
    this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationError)) return;

      const key = 'kittab_reload_' + event.url;
      if (sessionStorage.getItem(key)) return;

      sessionStorage.setItem(key, '1');
      window.location.assign(event.url);
    });
  }
}

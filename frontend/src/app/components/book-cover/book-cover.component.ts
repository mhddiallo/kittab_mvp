import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Vignette d'un livre dans le catalogue.
 *
 * Deux rendus, et un seul principe : la grille reste homogène quoi qu'il
 * arrive.
 *
 * - Quand on dispose d'une couverture d'éditeur, on l'affiche entière sur un
 *   fond tiré d'elle-même. Les couvertures sont en 2:3, le cadre en 3:4 :
 *   rogner couperait les titres.
 *
 * - Sinon, on compose une vignette à partir du titre et de l'auteur. Aucun
 *   fichier n'est chargé, donc rien à stocker, rien à télécharger, et jamais
 *   d'image cassée.
 *
 * Les photos du vendeur n'apparaissent jamais ici. Elles montrent son
 * exemplaire, pas l'ouvrage : leur place est sur la fiche de l'annonce, où
 * l'acheteur juge l'état réel. Les faire remonter dans la grille donnait
 * autant d'images différentes que de vendeurs pour un même livre.
 */
@Component({
  selector: 'app-book-cover',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="hasCover; else generated">
      <img [src]="coverUrl" alt="" aria-hidden="true"
           class="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40" />
      <img [src]="coverUrl" [alt]="title" (error)="onError()"
           class="relative w-full h-full object-contain" />
    </ng-container>

    <ng-template #generated>
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center text-white"
           [ngClass]="compact ? 'gap-1 px-2' : 'gap-2 px-3.5'"
           [style.background]="palette.bg">
        <!-- Rappel de dos de livre : suffit à faire lire la vignette comme un
             ouvrage plutôt que comme une case vide. -->
        <span class="absolute inset-y-0 left-0" [style.background]="palette.spine"
              [ngClass]="compact ? 'w-1' : 'w-[7px]'"></span>

        <span class="font-extrabold leading-tight cover-clamp"
              [ngClass]="compact ? 'text-[10px] clamp-3' : 'text-[13px] clamp-4'">{{ title }}</span>

        <span *ngIf="!compact" class="w-6 h-0.5 rounded-full bg-white/50"></span>

        <span *ngIf="author" class="opacity-75 leading-tight cover-clamp clamp-2"
              [ngClass]="compact ? 'text-[8px]' : 'text-[10.5px]'">{{ author }}</span>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; position: relative; width: 100%; height: 100%; }
    .cover-clamp { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
    .clamp-2 { -webkit-line-clamp: 2; }
    .clamp-3 { -webkit-line-clamp: 3; }
    .clamp-4 { -webkit-line-clamp: 4; }
  `],
})
export class BookCoverComponent {
  @Input() title = '';
  @Input() author?: string | null;
  @Input() coverUrl?: string | null;
  /** Bandeau « À la une » : mêmes règles, typographie resserrée. */
  @Input() compact = false;

  /** Une image annoncée peut ne pas charger : on retombe alors sur la vignette
   *  composée plutôt que de laisser un cadre vide. */
  private failed = false;

  onError() {
    this.failed = true;
  }

  get hasCover(): boolean {
    const url = this.coverUrl || '';
    if (!url || this.failed) return false;
    // Certaines sources servent un substitut « pas de couverture » plutôt
    // qu'une erreur ; il ne doit pas passer pour une vraie image.
    return !/unavailable|nocover|no_cover|image_not_available/i.test(url);
  }

  /**
   * Couleur déduite du titre.
   *
   * Déterministe : un livre garde la même teinte sur toutes ses annonces et à
   * chaque visite. Saturation et clarté sont fixes, pour que le texte blanc
   * reste lisible quelle que soit la teinte tirée.
   */
  get palette(): { bg: string; spine: string } {
    let hash = 0;
    const source = this.title || '';
    for (let i = 0; i < source.length; i++) {
      hash = (hash * 31 + source.charCodeAt(i)) % 360;
    }
    return {
      bg: `hsl(${hash} 42% 34%)`,
      spine: `hsl(${hash} 48% 24%)`,
    };
  }
}

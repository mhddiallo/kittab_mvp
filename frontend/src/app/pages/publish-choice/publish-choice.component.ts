import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

/**
 * Point d'entrée de la publication : deux façons d'y arriver.
 *
 * Le formulaire classique reste la référence — champs, contrôle direct.
 * La description en un message est l'ajout : elle réutilise le même
 * cadrage guidé et les mêmes listes fermées (ville, catégorie) une fois
 * passée par l'IA, elle ne les contourne pas.
 */
@Component({
  selector: 'app-publish-choice',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './publish-choice.component.html',
})
export class PublishChoiceComponent {}

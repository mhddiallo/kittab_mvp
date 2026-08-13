/**
 * Référentiel scolaire, partagé entre la publication et le catalogue.
 *
 * Les deux écrans doivent proposer exactement les mêmes valeurs : un vendeur
 * qui choisit « 4ème » et un acheteur qui filtre sur « 4ème » ne se croisent
 * que si les deux listes sont rigoureusement identiques. Les dupliquer, c'est
 * les laisser diverger à la première modification.
 *
 * Ces listes sont aujourd'hui celles du système sénégalais. Elles devront être
 * rattachées au pays — comme le référentiel des villes — avant toute ouverture
 * hors zone francophone : le Ghana suit un tout autre découpage
 * (Primary 1-6, Junior High 1-3, Senior High 1-3).
 */

export interface EducationCycle {
  label: string;
  levels: string[];
}

export const EDUCATION_CYCLES: EducationCycle[] = [
  { label: 'Élémentaire', levels: ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'] },
  { label: 'Collège', levels: ['6ème', '5ème', '4ème', '3ème'] },
  { label: 'Lycée', levels: ['Seconde', 'Première', 'Terminale'] },
  // Volontairement indifférencié : on n'y cherche pas un manuel de niveau mais
  // un ouvrage de filière, ce qui appelle un autre découpage.
  { label: 'Supérieur', levels: ['Supérieur'] },
];

/**
 * Matières : liste fermée, jamais de saisie libre.
 *
 * En texte libre, « maths », « Maths » et « mathématiques » cohabiteraient et
 * le filtre du catalogue serait inexploitable — exactement le problème qu'on a
 * réglé sur les villes.
 */
export const SUBJECTS: string[] = [
  'Mathématiques', 'Français', 'Anglais', 'Physique-Chimie', 'SVT',
  'Histoire-Géographie', 'Philosophie', 'Arabe', 'Espagnol', 'Allemand',
  'Économie', 'Informatique', 'Éducation religieuse', 'Autre',
];

/** Nom exact de la catégorie qui déclenche l'affichage des champs scolaires. */
export const SCHOOL_CATEGORY_NAME = 'Manuels scolaires';

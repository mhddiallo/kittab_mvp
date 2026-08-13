# Amorce du référentiel de couvertures

Ce dossier contient la liste choisie à partir de laquelle on remplit la table
`book_covers`.

## Pourquoi une liste choisie plutôt qu'un import de masse

Le dump complet d'Open Library pèse des dizaines de gigaoctets, et son service
d'images plafonne les requêtes — de l'ordre de la centaine par tranche de cinq
minutes et par adresse IP. Récupérer un million de couvertures est hors de
portée. En récupérer deux cents choisies prend une soirée, et chacune servira
des dizaines de fois.

Le corpus visé n'est de toute façon pas dans ces dumps : les manuels scolaires
sénégalais et les éditions africaines locales ne figurent dans aucun
référentiel exploitable par machine. C'est précisément ce qui fait la valeur de
cette base.

## Lancer l'import

```bash
cd backend
python import_covers.py seeds/covers_seed.csv --dry-run   # voir sans écrire
python import_covers.py seeds/covers_seed.csv             # écrire
python import_covers.py seeds/covers_seed.csv --only-missing
```

Le script est rejouable : l'unicité porte sur `(source, source_ref)`, donc une
relance après incident met à jour au lieu de dupliquer. Il ne touche jamais une
couverture déjà validée par des vendeurs.

Comptez environ trois secondes par ligne — c'est volontaire, pour rester en
deçà des limites d'Open Library. Cinquante lignes prennent trois minutes.

## Colonnes

| Colonne | Obligatoire | Rôle |
|---|---|---|
| `title` | oui | Titre de l'œuvre |
| `author` | non | Vide pour les manuels, qui sont collectifs |
| `isbn` | non | Rempli si vous l'avez ; sinon le script tente de le retrouver |
| `publisher` | non | EDICEF, NEA, Présence Africaine… |
| `edition_hint` | non | Ce qui distingue deux couvertures : « Folio, 2019 » |
| `education_level` | non | Manuels : CI…CM2, 6ème…3ème, Seconde…Terminale, Supérieur |
| `subject` | non | Manuels : voir `frontend/src/app/core/education.ts` |
| `country_code` | non | ISO 3166-1 alpha-2 : SN, CI, ML… |
| `image_url` | non | Force une image précise, par exemple celle fournie par un éditeur |

## État de la liste fournie

**La colonne `isbn` est volontairement vide partout.** Un ISBN inventé pointe
vers un autre livre et ferait afficher une couverture sans rapport — mieux vaut
laisser le script chercher par titre et auteur, et vérifier le résultat.

**Les titres de littérature africaine** sont un point de départ raisonnable,
mais ils restent à vérifier. Contrôlez le résultat de l'import avant de vous
en servir.

**Les lignes de manuels scolaires sont des exemples de format**, pas une liste
de référence. La vraie liste est celle du programme officiel publié par le
Ministère de l'Éducation nationale — c'est elle qu'il faut recopier ici. Le
travail de curation est la partie qui a de la valeur, et c'est celle que le
script ne peut pas faire à votre place.

## Ce qu'il faut regarder après un import

Le script affiche à la fin la liste des titres pour lesquels **aucune
couverture n'a été trouvée**. C'est l'information la plus utile du rapport :
elle vous dit exactement où il faut demander à un éditeur, photographier un
exemplaire, ou attendre qu'un vendeur en publie un.

## Provenance et retrait

Chaque ligne conserve sa `source`. Le jour où un éditeur demande le retrait de
ses visuels, c'est une suppression ciblée sur cette colonne, et non une reprise
de toute la base.

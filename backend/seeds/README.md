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
python import_covers.py seeds/covers_seed_manuels.csv --dry-run   # voir sans écrire
python import_covers.py seeds/covers_seed_manuels.csv             # écrire
python import_covers.py seeds/covers_seed_litterature.csv
```

Deux fichiers, deux niveaux de confiance :

- `covers_seed_manuels.csv` — recopié du programme officiel sénégalais. Les
  ISBN qui s'y trouvent ont tous passé la clé de contrôle.
- `covers_seed_litterature.csv` — classiques africains, titres et auteurs
  saisis de mémoire. À vérifier après import.

Le script est rejouable : l'unicité porte sur `(source, source_ref)`, donc une
relance après incident met à jour au lieu de dupliquer. Il ne touche jamais une
couverture déjà validée par des vendeurs.

Le rythme s'adapte à ce qui est sollicité. Quand la couverture doit être
cherchée chez Google ou Open Library, comptez trois secondes par ligne — c'est
volontaire, pour rester en deçà des limites d'Open Library. Quand le CSV fournit
déjà l'adresse de l'image, cas d'un catalogue d'éditeur relevé au préalable,
aucune API plafonnée n'est sollicitée et l'import va environ sept fois plus
vite.

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

**La colonne `isbn` n'est remplie que là où le code provient d'un document.**
Un ISBN inventé pointe vers un autre livre et ferait afficher une couverture
sans rapport : ailleurs, on laisse le script chercher par titre et auteur, puis
on vérifie le résultat.

**Les titres de littérature africaine** sont un point de départ raisonnable,
mais ils restent à vérifier. Contrôlez le résultat de l'import avant de vous
en servir.

**Les manuels** proviennent du programme officiel sénégalais. Seule la classe
de Seconde (séries L et S) est couverte pour l'instant : les autres niveaux
restent à recopier depuis les documents du Ministère, du CI à la Terminale.

Trois lignes n'ont pas d'ISBN dans le document d'origine — le manuel de
physique-chimie Kandia, celui de SVT Didactikos et le fascicule d'arabe. Le
script tentera de les retrouver par titre et éditeur ; à défaut, il faudra
photographier un exemplaire ou demander le visuel à l'éditeur.

Le travail de curation est la partie qui a de la valeur, et c'est celle que le
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

## Relever le catalogue d'un éditeur

`scrape_catalog.py` produit un CSV au format ci-dessus à partir du site d'un
éditeur. Il ne touche jamais la base : on relit le fichier, puis on l'importe.

```bash
cd backend
python scrape_catalog.py https://editionsdidactikos.sn --limit 5   # essai
python scrape_catalog.py https://editionsdidactikos.sn \
    --out seeds/didactikos.csv --publisher "Éditions Didactikos"
python import_covers.py seeds/didactikos.csv --dry-run
```

Il essaie d'abord l'API JSON de WooCommerce, qui donne des données structurées
et résiste aux changements de présentation. Il ne lit le HTML qu'à défaut.

Il consulte `robots.txt` et s'arrête si la relève y est interdite. Il attend
deux secondes entre deux requêtes : un éditeur local n'a pas l'infrastructure
d'un grand site marchand, et une relève doit rester invisible.

**Niveau et matière sont déduits du titre.** C'est une supposition : relisez le
fichier avant de l'importer. Une case vide vaut mieux qu'une déduction fausse.

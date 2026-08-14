#!/usr/bin/env python3
"""
Relève le catalogue d'un éditeur pour alimenter le référentiel de couvertures.

Écrit pour les éditeurs scolaires ouest-africains — Didactikos, NEA — dont les
manuels ne figurent dans aucun référentiel international. C'est le seul endroit
où trouver ces couvertures.

Deux chemins, du plus fiable au moins fiable :

1. L'API JSON de WooCommerce. L'adresse « /categoriedeproduit/... » trahit un
   site WooCommerce, et ces sites exposent presque toujours leur catalogue en
   JSON structuré, sans authentification. On y trouve le titre, l'image, les
   rubriques et souvent la référence — parfois l'ISBN. C'est propre, paginé, et
   insensible aux changements de présentation.

2. À défaut, la lecture du HTML. Fragile par nature : la moindre refonte du
   site casse la relève. On s'en sert seulement si le JSON n'est pas exposé.

Le script ne remplit RIEN en base. Il produit un CSV qu'on relit avant de
l'importer : le rattachement d'une matière ou d'un niveau se fait par
déduction sur le titre, et une déduction se vérifie.

Usage
-----
    python scrape_catalog.py https://editionsdidactikos.sn --out seeds/didactikos.csv
    python scrape_catalog.py https://editionsdidactikos.sn --limit 5      # essai
    python scrape_catalog.py https://editionsdidactikos.sn --ignore-robots

Le résultat s'importe ensuite comme n'importe quelle amorce :

    python import_covers.py seeds/didactikos.csv --dry-run
"""

import argparse
import csv
import html
import re
import sys
import time
import unicodedata
import urllib.robotparser
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx

# On s'annonce. Un éditeur qui voit passer ces requêtes doit pouvoir savoir
# qui les fait et pourquoi, et nous joindre plutôt que nous bloquer.
#
# Sans accent : un en-tête HTTP ne transporte que de l'ASCII, et httpx refuse
# d'encoder le reste.
USER_AGENT = (
    "KittabBot/1.0 (referencement de manuels scolaires ouest-africains; "
    "contact@kittab.sn)"
)

# Une relève doit être invisible pour le serveur d'en face. Un éditeur local
# n'a pas l'infrastructure d'un grand site marchand.
DELAY_S = 2.0
PAGE_SIZE = 100

SUBJECTS = [
    'Mathématiques', 'Français', 'Anglais', 'Physique-Chimie', 'SVT',
    'Histoire-Géographie', 'Philosophie', 'Arabe', 'Espagnol', 'Allemand',
    'Économie', 'Informatique', 'Éducation religieuse',
]

# Variantes rencontrées dans les intitulés, ramenées à notre liste fermée.
SUBJECT_ALIASES = {
    'maths': 'Mathématiques', 'mathematique': 'Mathématiques',
    'sciences physiques': 'Physique-Chimie', 'physique': 'Physique-Chimie',
    'chimie': 'Physique-Chimie', 'pc': 'Physique-Chimie',
    'sciences de la vie': 'SVT', 'biologie': 'SVT',
    'histoire': 'Histoire-Géographie', 'geographie': 'Histoire-Géographie',
    'lecture': 'Français', 'grammaire': 'Français', 'orthographe': 'Français',
    'conjugaison': 'Français', 'expression ecrite': 'Français',
    'anglais': 'Anglais', 'espagnol': 'Espagnol', 'allemand': 'Allemand',
    'arabe': 'Arabe', 'philosophie': 'Philosophie', 'economie': 'Économie',
    'informatique': 'Informatique',
}

LEVEL_PATTERNS = [
    (r'\bci\b', 'CI'), (r'\bcp\b', 'CP'),
    (r'\bce\s*1\b', 'CE1'), (r'\bce\s*2\b', 'CE2'),
    (r'\bcm\s*1\b', 'CM1'), (r'\bcm\s*2\b', 'CM2'),
    (r'\b6\s*[e°]', '6ème'), (r'\bsixieme\b', '6ème'),
    (r'\b5\s*[e°]', '5ème'), (r'\bcinquieme\b', '5ème'),
    (r'\b4\s*[e°]', '4ème'), (r'\bquatrieme\b', '4ème'),
    (r'\b3\s*[e°]', '3ème'), (r'\btroisieme\b', '3ème'),
    (r'\b2\s*n?de\b', 'Seconde'), (r'\bseconde\b', 'Seconde'),
    (r'\b1\s*[e°]?re\b', 'Première'), (r'\bpremiere\b', 'Première'),
    (r'\btle\b', 'Terminale'), (r'\bterminale\b', 'Terminale'),
]

ISBN_IN_TEXT = re.compile(r'97[89][\d\-\s]{10,17}')


def strip_accents(text: str) -> str:
    """
    Ramène le texte à sa forme la plus simple pour la comparaison.

    NFKD et non NFD : les catalogues écrivent « Tlᵉ » et « 1ʳᵉ » avec de vraies
    lettres en exposant, que NFD laisse intactes. Le niveau n'était alors pas
    reconnu. NFKD les ramène à « Tle » et « 1re ».
    """
    return "".join(
        c for c in unicodedata.normalize("NFKD", text)
        if unicodedata.category(c) != "Mn"
    )


def flatten(text: str) -> str:
    """
    Texte prêt pour la reconnaissance de niveau.

    Les points des abréviations sont retirés : « C.E.2 » et « CE2 » désignent
    la même classe, mais seule la seconde forme était reconnue.
    """
    return strip_accents(text).lower().replace(".", "")


def guess_level(*texts: str) -> str:
    haystack = flatten(" ".join(t or "" for t in texts))
    for pattern, level in LEVEL_PATTERNS:
        if re.search(pattern, haystack):
            return level
    return ""


def guess_subject(*texts: str) -> str:
    haystack = flatten(" ".join(t or "" for t in texts))
    for subject in SUBJECTS:
        if flatten(subject) in haystack:
            return subject
    for alias, subject in SUBJECT_ALIASES.items():
        if alias in haystack:
            return subject
    return ""


def find_isbn(*texts: str) -> str:
    for text in texts:
        if not text:
            continue
        match = ISBN_IN_TEXT.search(text)
        if match:
            return re.sub(r'[\s\-]', '', match.group())
    return ""


def robots_allows(base_url: str, path: str = "/") -> bool | None:
    """None si le fichier robots.txt est introuvable — on ne conclut pas."""
    parser = urllib.robotparser.RobotFileParser()
    parser.set_url(urljoin(base_url, "/robots.txt"))
    try:
        parser.read()
    except Exception:
        return None
    return parser.can_fetch(USER_AGENT, urljoin(base_url, path))


# ── Chemin 1 : l'API JSON de WooCommerce ────────────────────────────────────

JSON_ENDPOINTS = [
    "/wp-json/wc/store/v1/products",
    "/wp-json/wc/store/products",
    "/wp-json/wp/v2/product",
]


def fetch_json_catalog(client: httpx.Client, base_url: str, limit: int | None) -> list[dict]:
    for endpoint in JSON_ENDPOINTS:
        url = urljoin(base_url, endpoint)
        try:
            probe = client.get(url, params={"per_page": 1})
        except Exception as exc:
            print(f"  {endpoint} : injoignable ({type(exc).__name__})")
            continue
        if probe.status_code != 200:
            print(f"  {endpoint} : HTTP {probe.status_code}")
            continue
        try:
            probe.json()
        except Exception:
            print(f"  {endpoint} : réponse non JSON")
            continue

        print(f"  {endpoint} : disponible — relève par JSON")
        return _paginate_json(client, url, limit)

    return []


def _paginate_json(client: httpx.Client, url: str, limit: int | None) -> list[dict]:
    products: list[dict] = []
    page = 1
    while True:
        response = client.get(url, params={"per_page": PAGE_SIZE, "page": page})
        if response.status_code != 200:
            break
        batch = response.json()
        if not batch:
            break
        products.extend(batch)
        print(f"    page {page} : {len(batch)} produit(s), total {len(products)}")
        if limit and len(products) >= limit:
            break
        if len(batch) < PAGE_SIZE:
            break
        page += 1
        time.sleep(DELAY_S)
    return products[:limit] if limit else products


def row_from_json(product: dict) -> dict:
    name = product.get("name") or ""
    if isinstance(name, dict):          # wp/v2 renvoie {"rendered": "..."}
        name = name.get("rendered", "")
    # WooCommerce renvoie les intitulés encodés : « Cahier d&rsquo;activités ».
    name = html.unescape(str(name))

    images = product.get("images") or []
    image_url = ""
    if images and isinstance(images[0], dict):
        image_url = images[0].get("src") or images[0].get("source_url") or ""

    categories = product.get("categories") or []
    category_names = " ".join(
        c.get("name", "") for c in categories if isinstance(c, dict)
    )

    description = product.get("short_description") or product.get("description") or ""
    if isinstance(description, dict):
        description = description.get("rendered", "")
    description = html.unescape(re.sub(r"<[^>]+>", " ", str(description)))

    sku = str(product.get("sku") or "")

    return {
        "title": re.sub(r"\s+", " ", name).strip(),
        "author": "",
        "isbn": find_isbn(sku, description) or (sku if sku.isdigit() and len(sku) == 13 else ""),
        "publisher": "",
        "edition_hint": "",
        "education_level": guess_level(name, category_names, description),
        "subject": guess_subject(name, category_names, description),
        "country_code": "SN",
        "image_url": image_url,
    }


# ── Chemin 2 : lecture du HTML ──────────────────────────────────────────────

class ProductListParser(HTMLParser):
    """
    Extrait les produits d'une page de boutique WooCommerce.

    Volontairement tolérant : on repère les blocs produit par leur classe, et
    on prend le premier titre et la première image rencontrés à l'intérieur.
    Une refonte du site casse cette lecture — d'où la préférence pour le JSON.
    """

    def __init__(self):
        super().__init__()
        self.products: list[dict] = []
        self._depth = 0
        self._in_product = False
        self._current: dict = {}
        self._capture_title = False

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = attributes.get("class", "")

        if not self._in_product:
            if tag == "li" and "product" in classes:
                self._in_product = True
                self._depth = 1
                self._current = {"title": "", "image_url": "", "url": ""}
            return

        if tag == "li":
            self._depth += 1

        if tag == "img" and not self._current["image_url"]:
            src = attributes.get("src") or attributes.get("data-src") or ""
            # WooCommerce sert souvent plusieurs tailles : on prend la plus grande.
            srcset = attributes.get("srcset") or ""
            if srcset:
                candidates = [p.strip().split(" ")[0] for p in srcset.split(",") if p.strip()]
                if candidates:
                    src = candidates[-1]
            self._current["image_url"] = src

        if tag == "a" and not self._current["url"]:
            self._current["url"] = attributes.get("href", "")

        if tag in ("h2", "h3") and "title" in classes:
            self._capture_title = True

    def handle_data(self, data):
        if self._in_product and self._capture_title:
            self._current["title"] += data

    def handle_endtag(self, tag):
        if not self._in_product:
            return
        if tag in ("h2", "h3"):
            self._capture_title = False
        if tag == "li":
            self._depth -= 1
            if self._depth == 0:
                title = re.sub(r"\s+", " ", self._current["title"]).strip()
                if title:
                    self.products.append({**self._current, "title": title})
                self._in_product = False


def fetch_html_catalog(client: httpx.Client, base_url: str, paths: list[str],
                       limit: int | None) -> list[dict]:
    found: list[dict] = []
    for path in paths:
        page = 1
        while True:
            url = urljoin(base_url, path if page == 1 else f"{path.rstrip('/')}/page/{page}/")
            try:
                response = client.get(url)
            except Exception as exc:
                print(f"  {url} : injoignable ({type(exc).__name__})")
                break
            if response.status_code != 200:
                break

            parser = ProductListParser()
            parser.feed(response.text)
            if not parser.products:
                break

            print(f"    {url} : {len(parser.products)} produit(s)")
            for product in parser.products:
                found.append({
                    "title": product["title"],
                    "author": "",
                    "isbn": "",
                    "publisher": "",
                    "edition_hint": "",
                    "education_level": guess_level(product["title"], path),
                    "subject": guess_subject(product["title"], path),
                    "country_code": "SN",
                    "image_url": urljoin(base_url, product["image_url"]),
                })
            if limit and len(found) >= limit:
                return found[:limit]
            page += 1
            time.sleep(DELAY_S)
    return found


# ── Assemblage ──────────────────────────────────────────────────────────────

FIELDS = ["title", "author", "isbn", "publisher", "edition_hint",
          "education_level", "subject", "country_code", "image_url"]


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("base_url", help="Adresse du site, ex. https://editionsdidactikos.sn")
    parser.add_argument("--out", type=Path, default=Path("seeds/catalogue_editeur.csv"))
    parser.add_argument("--publisher", default="", help="Nom de l'éditeur, écrit dans chaque ligne")
    parser.add_argument("--limit", type=int, default=None, help="S'arrêter après N produits")
    parser.add_argument("--paths", nargs="*", default=[
        "/categoriedeproduit/livres-scolaires/",
        "/boutique/",
    ], help="Pages de catalogue, pour la lecture HTML")
    parser.add_argument("--ignore-robots", action="store_true")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    publisher = args.publisher or urlparse(base_url).netloc

    allowed = robots_allows(base_url)
    if allowed is False and not args.ignore_robots:
        print("robots.txt interdit la relève de ce site.")
        print("Demandez l'accord de l'éditeur, ou passez --ignore-robots en connaissance de cause.")
        return 2
    if allowed is None:
        print("robots.txt introuvable — on continue, sans certitude sur les règles du site.")

    headers = {"User-Agent": USER_AGENT, "Accept-Language": "fr"}
    with httpx.Client(timeout=20.0, follow_redirects=True, headers=headers) as client:
        print(f"\nRelève de {base_url}\n")
        print("Recherche d'une API JSON :")
        products = fetch_json_catalog(client, base_url, args.limit)
        rows = [row_from_json(p) for p in products]

        if not rows:
            print("\nAucune API JSON exploitable. Lecture du HTML :")
            rows = fetch_html_catalog(client, base_url, args.paths, args.limit)

    # Un même livre figure souvent dans plusieurs rubriques du site : sans
    # dédoublonnage, il ressortirait autant de fois qu'il y est rangé.
    unique: dict[str, dict] = {}
    for row in rows:
        if not row["title"]:
            continue
        key = strip_accents(row["title"].lower()).strip()
        existing = unique.get(key)
        # À doublon, on garde la fiche la plus complète.
        if existing is None or sum(1 for v in row.values() if v) > sum(1 for v in existing.values() if v):
            unique[key] = row
    duplicates = len(rows) - len(unique)
    rows = list(unique.values())

    for row in rows:
        row["publisher"] = publisher

    if not rows:
        print("\nAucun produit relevé.")
        print("Vérifiez l'adresse, ou passez les bonnes pages avec --paths.")
        return 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    with_level = sum(1 for r in rows if r["education_level"])
    with_subject = sum(1 for r in rows if r["subject"])
    with_image = sum(1 for r in rows if r["image_url"])
    with_isbn = sum(1 for r in rows if r["isbn"])

    print(f"""
── Résultat ─────────────────────────────
  {len(rows)} livre(s) écrits dans {args.out}
  doublons écartés  : {duplicates}

  avec une image    : {with_image}
  avec un ISBN      : {with_isbn}
  avec un niveau    : {with_level}
  avec une matière  : {with_subject}

Niveau et matière sont DÉDUITS du titre : relisez le fichier avant de
l'importer. Une déduction fausse vaut moins qu'une case vide.
""")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

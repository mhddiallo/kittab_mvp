"""
Résolution et regroupement des couvertures de livres.

Deux clés cohabitent, et elles ne servent pas à la même chose.

`isbn13` désigne une édition et un format précis : c'est la clé qui permet de
**répondre** avec certitude. Mais une grande partie du corpus visé — manuels
scolaires sénégalais, éditions africaines locales — n'a pas d'ISBN du tout.

`work_key` regroupe les éditions d'une même œuvre à partir du titre et de
l'auteur normalisés. Ce rapprochement est approximatif, il confond les
éditions : il ne sert donc jamais à décider, seulement à **proposer** un choix
au vendeur, qui a le livre en main et tranche.
"""

import re
import unicodedata
from typing import Optional

import httpx

# Motifs des images « pas de couverture » servies à la place d'une vraie.
_PLACEHOLDER_MARKERS = ("no_cover", "nocover", "unavailable", "image_not_available")

_PUNCTUATION = re.compile(r"[^a-z0-9]+")


def strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def normalize_work_key(title: str, author: Optional[str] = None) -> str:
    """
    Clé de regroupement d'une œuvre, insensible à la casse et aux accents.

    « La Belle Histoire de Leuk-le-Lièvre » et « la belle histoire de leuk le
    lievre » doivent tomber sur la même clé, sans quoi les éditions d'un même
    livre ne seraient jamais proposées ensemble au vendeur.
    """
    parts = [title or ""]
    if author:
        parts.append(author)
    raw = strip_accents(" ".join(parts).lower())
    return _PUNCTUATION.sub("-", raw).strip("-")


def is_placeholder(url: str) -> bool:
    lowered = url.lower()
    return any(marker in lowered for marker in _PLACEHOLDER_MARKERS)


def google_image_link(volume_info: dict) -> Optional[str]:
    """
    Meilleure couverture déclarée par Google Books, du plus grand format au plus petit.

    Seul `thumbnail` était lu : les volumes qui n'exposent que `smallThumbnail`
    revenaient sans image, alors qu'ils en avaient une.
    """
    links = volume_info.get("imageLinks") or {}
    for key in ("extraLarge", "large", "medium", "small", "thumbnail", "smallThumbnail"):
        url = links.get(key)
        if url:
            return url.replace("http://", "https://").replace("&zoom=1", "&zoom=3")
    return None


# Une image plus petite que ça n'est pas une couverture : c'est un pixel
# transparent ou une icône de substitution.
MIN_COVER_BYTES = 900


def _looks_like_image(response) -> bool:
    """
    Vrai si la réponse est bien une image d'une taille plausible.

    Le verdict repose d'abord sur le type de contenu, et seulement ensuite sur
    la taille. L'ancien test exigeait un `content-length` : Open Library
    redirige vers un stockage qui ne renvoie pas cet en-tête sur une requête
    HEAD, l'absence valait zéro, et toutes ses couvertures étaient écartées
    alors qu'elles existaient.
    """
    if response.status_code >= 400:
        return False
    if not response.headers.get("content-type", "").lower().startswith("image/"):
        return False

    size = response.headers.get("content-length")
    if size is None:
        # Taille inconnue : le type de contenu suffit à trancher.
        return True
    try:
        return int(size) > MIN_COVER_BYTES
    except ValueError:
        return True


async def is_valid_cover(client: httpx.AsyncClient, url: str) -> bool:
    """
    Vérifie qu'une adresse sert vraiment une couverture.

    On interroge d'abord par HEAD, plus léger. Certains hébergeurs le refusent
    ou répondent sans en-têtes exploitables : on retombe alors sur un GET
    limité aux premiers octets, assez pour connaître le type et la taille sans
    télécharger l'image entière.
    """
    try:
        head = await client.head(url, follow_redirects=True, timeout=8.0)
        if _looks_like_image(head):
            return True
        # 405 : méthode refusée. 200 sans type exploitable : réponse muette.
        if head.status_code >= 400 and head.status_code != 405:
            return False
    except Exception:
        pass

    try:
        r = await client.get(
            url, follow_redirects=True, timeout=8.0,
            headers={"Range": "bytes=0-2047"},
        )
        if r.status_code >= 400:
            return False
        if not r.headers.get("content-type", "").lower().startswith("image/"):
            return False
        # Une réponse partielle ne dit pas la taille totale : le contenu reçu
        # suffit à écarter un pixel de substitution.
        return len(r.content) > 100 or r.status_code == 206
    except Exception:
        return False


async def resolve_cover(client, volume_info: dict, isbn: Optional[str]) -> Optional[str]:
    """
    Couverture d'un livre, en descendant les sources jusqu'à en trouver une valide.

    On ne retient que ce que Google déclare dans `imageLinks` : c'est le seul
    endroit où la présence d'une entrée signifie qu'une vraie couverture
    existe. Le point d'accès « content », interrogé à partir de l'identifiant
    de volume, répond toujours 200 — avec l'image grise « Image not available »
    quand il n'a rien, laquelle passait pour une couverture.

    Faute de couverture chez Google, on interroge Open Library, qui indexe par
    ISBN sans clé ni quota et répond 404 plutôt que de servir un substitut.
    """
    candidates = [google_image_link(volume_info)]
    if isbn:
        # default=false : renvoie 404 au lieu d'un GIF d'un pixel.
        candidates.append(f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false")

    for url in candidates:
        if url and not is_placeholder(url) and await is_valid_cover(client, url):
            return url
    return None


async def fetch_google_volume(
    client: httpx.AsyncClient,
    api_key: Optional[str] = None,
    isbn: Optional[str] = None,
    title: Optional[str] = None,
    author: Optional[str] = None,
) -> tuple[Optional[dict], Optional[str], bool]:
    """
    Fiche Google Books, en essayant les interrogations de la plus sûre à la plus large.

    L'opérateur `isbn:` est strict : il rate des fiches qui contiennent pourtant
    le code. On retente donc en texte libre, puis par titre et auteur — ce
    dernier essai était prévu côté serveur mais n'était jamais déclenché,
    faute que le formulaire transmette ce que le vendeur avait déjà saisi.

    Renvoie (volume_info, volume_id, echec_technique). Le dernier booléen
    distingue « Google n'a pas répondu » de « Google ne connaît pas ce livre ».
    """
    attempts: list[dict] = []
    if isbn:
        attempts.append({"q": f"isbn:{isbn}"})
        attempts.append({"q": isbn})
    if title:
        q = f"intitle:{title}"
        if author:
            q += f"+inauthor:{author}"
        attempts.append({"q": q, "maxResults": 1})

    failed = False
    for params in attempts:
        if api_key:
            params = {**params, "key": api_key}
        try:
            r = await client.get("https://www.googleapis.com/books/v1/volumes", params=params)
        except Exception:
            failed = True
            continue
        if r.status_code != 200:
            # 429 en tête : le quota Google Books est vite atteint sans clé.
            failed = True
            continue
        items = r.json().get("items", [])
        if items:
            return items[0].get("volumeInfo"), items[0].get("id"), False

    return None, None, failed


# Au-delà de ce nombre de couvertures pour une même œuvre, on cesse d'en
# ajouter automatiquement. Sans ce plafond, quarante vendeurs du même manuel
# créeraient quarante entrées : on aurait simplement déplacé le désordre des
# annonces vers le référentiel, sans rien résoudre.
MAX_AUTO_COVERS_PER_WORK = 3


def promote_seller_cover(db, book, image_url: str) -> bool:
    """
    Fait entrer la photo d'un vendeur dans le référentiel des couvertures.

    C'est ce qui ferme la boucle : la première personne à publier un manuel
    inconnu fournit la couverture que le sélecteur proposera à toutes les
    suivantes. Sans ce versement, le référentiel ne se remplirait que par
    imports manuels, et le catalogue garderait autant d'images différentes que
    de vendeurs pour un même livre.

    On n'ajoute rien si l'œuvre est déjà pourvue : au-delà de trois vignettes,
    le choix n'aide plus le vendeur, il l'encombre.

    Renvoie True si une entrée a été créée.
    """
    from app.models.book import BookCover, CoverSource

    if not image_url or not (book.title or "").strip():
        return False

    key = normalize_work_key(book.title, book.author)

    existing = db.query(BookCover).filter(BookCover.work_key == key).count()
    if existing >= MAX_AUTO_COVERS_PER_WORK:
        return False

    # L'unicité porte sur (source, source_ref) : une même image ne peut pas
    # entrer deux fois, même si l'envoi est rejoué.
    already = (
        db.query(BookCover)
        .filter(BookCover.source == CoverSource.SELLER,
                BookCover.source_ref == image_url)
        .first()
    )
    if already:
        return False

    db.add(BookCover(
        isbn13=book.isbn or None,
        work_key=key,
        title=book.title,
        author=book.author,
        image_url=image_url,
        source=CoverSource.SELLER,
        source_ref=image_url,
        education_level=book.education_level,
        subject=book.subject,
        country_code=book.country_code,
        picks_count=0,
        is_verified=False,
    ))
    db.commit()
    return True

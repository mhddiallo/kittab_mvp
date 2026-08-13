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


async def is_valid_cover(client: httpx.AsyncClient, url: str) -> bool:
    try:
        r = await client.head(url, follow_redirects=True, timeout=4.0)
        if r.status_code >= 400:
            return False
        return int(r.headers.get("content-length", 0)) > 500
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

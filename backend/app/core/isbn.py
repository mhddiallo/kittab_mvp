"""
Normalisation des ISBN.

L'ISBN est la seule clé fiable pour rattacher une annonce à une couverture de
référence : il identifie une édition et un format précis, là où « titre +
auteur » confond les cinq éditions d'un même manuel scolaire.

Encore faut-il que « 978-2-07-041311-9 », « 9782070413119 » et l'ISBN-10
« 2070413119 » du même livre se rejoignent. Tout est donc ramené à une forme
unique : un ISBN-13 sans séparateur.
"""

import re

_SEPARATORS = re.compile(r"[\s\-‐-―]")


def _isbn13_check_digit(first_twelve: str) -> str:
    """Clé de contrôle EAN-13 : somme pondérée 1/3, complément à 10."""
    total = sum((1 if i % 2 == 0 else 3) * int(d) for i, d in enumerate(first_twelve))
    return str((10 - total % 10) % 10)


def _isbn10_check_digit(first_nine: str) -> str:
    """Clé de contrôle ISBN-10 : somme pondérée 10..2, modulo 11, 10 s'écrit X."""
    total = sum((10 - i) * int(d) for i, d in enumerate(first_nine))
    remainder = (11 - total % 11) % 11
    return "X" if remainder == 10 else str(remainder)


def normalize_isbn(raw: str | None) -> str | None:
    """
    Ramène un ISBN à sa forme ISBN-13 sans séparateur, ou None s'il est invalide.

    Un code refusé vaut mieux qu'un code erroné : un ISBN mal saisi pointerait
    vers un autre livre, et le catalogue afficherait une couverture qui n'a
    rien à voir avec l'exemplaire mis en vente. On vérifie donc la clé de
    contrôle, et on exige le préfixe 978/979 réservé au livre — un code-barres
    de boîte de conserve scanné par erreur est ainsi écarté.
    """
    if not raw or not isinstance(raw, str):
        return None

    code = _SEPARATORS.sub("", raw).upper()

    if re.fullmatch(r"\d{9}[\dX]", code):
        if code[9] != _isbn10_check_digit(code[:9]):
            return None
        code = "978" + code[:9]
        code += _isbn13_check_digit(code)
        return code

    if re.fullmatch(r"\d{13}", code):
        if not code.startswith(("978", "979")):
            return None
        if code[12] != _isbn13_check_digit(code[:12]):
            return None
        return code

    return None

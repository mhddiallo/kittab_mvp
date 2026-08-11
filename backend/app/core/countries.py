"""
Correspondance entre indicatif téléphonique et pays.

Les comptes se créent par numéro de téléphone : l'indicatif suffit à connaître
le pays, sans rien demander de plus à l'utilisateur. Aucun de ces indicatifs ne
se chevauche, la déduction est donc sans ambiguïté.

Les codes suivent la norme ISO 3166-1 alpha-2.
"""

DEFAULT_COUNTRY = "SN"

# Ordre décroissant de longueur à l'usage : ici tous les indicatifs font
# 3 chiffres, mais le tri protège d'un futur ajout plus court (+33 par exemple).
PHONE_PREFIX_TO_COUNTRY = {
    "+221": "SN",  # Sénégal
    "+225": "CI",  # Côte d'Ivoire
    "+226": "BF",  # Burkina Faso
    "+223": "ML",  # Mali
    "+227": "NE",  # Niger
    "+233": "GH",  # Ghana
    "+224": "GN",  # Guinée
    "+228": "TG",  # Togo
    "+229": "BJ",  # Bénin
    "+245": "GW",  # Guinée-Bissau
    "+33": "FR",   # France (diaspora)
}


def country_from_phone(phone: str | None) -> str:
    """Renvoie le code pays déduit du numéro, ou le pays par défaut."""
    if not phone:
        return DEFAULT_COUNTRY
    normalised = phone.strip().replace(" ", "")
    for prefix in sorted(PHONE_PREFIX_TO_COUNTRY, key=len, reverse=True):
        if normalised.startswith(prefix):
            return PHONE_PREFIX_TO_COUNTRY[prefix]
    return DEFAULT_COUNTRY

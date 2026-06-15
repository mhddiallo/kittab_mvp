CATEGORY_MAPPING: dict[str, str] = {
    # Autobiographies
    "biography": "Autobiographies",
    "autobiography": "Autobiographies",
    "biographie": "Autobiographies",
    "autobiographie": "Autobiographies",
    "memoirs": "Autobiographies",
    "mémoires": "Autobiographies",

    # Romans
    "fiction": "Romans",
    "novel": "Romans",
    "roman": "Romans",
    "literature": "Romans",
    "littérature": "Romans",
    "literary": "Romans",

    # Histoire
    "history": "Histoire",
    "histoire": "Histoire",
    "historical": "Histoire",

    # Sciences
    "science": "Sciences",
    "mathematics": "Sciences",
    "math": "Sciences",
    "physics": "Sciences",
    "chemistry": "Sciences",
    "biology": "Sciences",
    "nature": "Sciences",

    # Manuels scolaires
    "education": "Manuels scolaires",
    "textbook": "Manuels scolaires",
    "school": "Manuels scolaires",
    "scolaire": "Manuels scolaires",
    "manuel": "Manuels scolaires",
    "study": "Manuels scolaires",
    "academic": "Manuels scolaires",

    # Développement personnel
    "self-help": "Développement personnel",
    "self help": "Développement personnel",
    "personal development": "Développement personnel",
    "développement personnel": "Développement personnel",
    "motivation": "Développement personnel",
    "productivity": "Développement personnel",
    "psychology": "Développement personnel",
    "psychologie": "Développement personnel",

    # Religion & Spiritualité
    "religion": "Religion & Spiritualité",
    "spirituality": "Religion & Spiritualité",
    "spiritualité": "Religion & Spiritualité",
    "islam": "Religion & Spiritualité",
    "christianity": "Religion & Spiritualité",
    "bible": "Religion & Spiritualité",
    "quran": "Religion & Spiritualité",
    "coran": "Religion & Spiritualité",
    "theology": "Religion & Spiritualité",

    # Philosophie
    "philosophy": "Philosophie",
    "philosophie": "Philosophie",

    # Économie & Business
    "business": "Économie & Business",
    "economics": "Économie & Business",
    "économie": "Économie & Business",
    "finance": "Économie & Business",
    "management": "Économie & Business",
    "entrepreneurship": "Économie & Business",

    # Droit
    "law": "Droit",
    "droit": "Droit",
    "legal": "Droit",
    "juridique": "Droit",

    # Médecine & Santé
    "medical": "Médecine & Santé",
    "medicine": "Médecine & Santé",
    "médecine": "Médecine & Santé",
    "health": "Médecine & Santé",
    "santé": "Médecine & Santé",
    "nursing": "Médecine & Santé",
    "pharmacy": "Médecine & Santé",

    # Informatique
    "computers": "Informatique",
    "computer": "Informatique",
    "programming": "Informatique",
    "technology": "Informatique",
    "informatique": "Informatique",
    "software": "Informatique",

    # Littérature africaine
    "african": "Littérature africaine",
    "africa": "Littérature africaine",
    "afrique": "Littérature africaine",
    "africain": "Littérature africaine",

    # Jeunesse
    "children": "Jeunesse",
    "juvenile": "Jeunesse",
    "jeunesse": "Jeunesse",
    "young adult": "Jeunesse",
    "kids": "Jeunesse",

    # Poésie
    "poetry": "Poésie",
    "poésie": "Poésie",
    "poème": "Poésie",

    # BD & Comics
    "comics": "BD & Comics",
    "comic": "BD & Comics",
    "graphic novel": "BD & Comics",
    "manga": "BD & Comics",
    "bande dessinée": "BD & Comics",
    "bd": "BD & Comics",

    # Langues & Dictionnaires
    "language": "Langues & Dictionnaires",
    "languages": "Langues & Dictionnaires",
    "dictionary": "Langues & Dictionnaires",
    "dictionnaire": "Langues & Dictionnaires",
    "linguistics": "Langues & Dictionnaires",
}


def map_to_kittab_category(external_categories: list[str]) -> str | None:
    """Map external category strings to a Kittab category name."""
    for cat in external_categories:
        cat_lower = cat.lower()
        for keyword, kittab_cat in CATEGORY_MAPPING.items():
            if keyword in cat_lower:
                return kittab_cat
    return None

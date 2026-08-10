"""
Insère des annonces de test pour vérifier la pagination du catalogue.

À n'utiliser que sur une base de développement ou de recette : le script écrit
dans la base pointée par DATABASE_URL.

Chaque livre créé porte le marqueur SEED_MARKER dans sa description, ce qui
permet de tous les supprimer ensuite sans toucher aux vraies annonces.

    # 50 livres de test (2 pages et demie de catalogue)
    python seed_books.py --count 50

    # tout supprimer
    python seed_books.py --clean

Le vendeur de test est créé si besoin, puis supprimé par --clean s'il ne lui
reste aucune annonce.
"""

import argparse
import random
import sys

from app.core.database import SessionLocal
from app.models.book import Book, BookCondition, BookType, Category
from app.models.user import User

SEED_MARKER = "[SEED-TEST]"
SEED_PHONE = "+221000000001"

TITLES = [
    "Une si longue lettre", "L'Aventure ambiguë", "Les Bouts de bois de Dieu",
    "Le Docker noir", "Xala", "Sous l'orage", "Le Pauvre Christ de Bomba",
    "Ville cruelle", "L'Enfant noir", "Le Devoir de violence",
    "Mathématiques 3e", "Physique-Chimie Terminale", "SVT Première",
    "Histoire-Géographie 4e", "Anglais 6e", "Philosophie Terminale",
    "Introduction au droit", "Précis d'anatomie", "Algèbre linéaire",
    "Économie générale",
]

AUTHORS = [
    "Mariama Bâ", "Cheikh Hamidou Kane", "Ousmane Sembène", "Seydou Badian",
    "Mongo Beti", "Camara Laye", "Yambo Ouologuem", "Collectif",
]

CITIES = [
    "Médina, Dakar, Sénégal", "Plateau, Dakar, Sénégal", "Guédiawaye, Sénégal",
    "Thiès, Sénégal", "Saint-Louis, Sénégal", "Ziguinchor, Sénégal",
]

CONDITIONS = list(BookCondition)
TYPES = list(BookType)


def get_or_create_seller(db) -> User:
    seller = db.query(User).filter(User.phone == SEED_PHONE).first()
    if seller:
        return seller
    seller = User(
        phone=SEED_PHONE,
        first_name="Vendeur",
        last_name="Test",
        username="VendeurTest",
        address="Dakar, Sénégal",
        is_profile_complete=True,
    )
    db.add(seller)
    db.flush()
    return seller


def seed(count: int) -> None:
    db = SessionLocal()
    try:
        seller = get_or_create_seller(db)
        categories = db.query(Category).all()

        for i in range(1, count + 1):
            title = TITLES[(i - 1) % len(TITLES)]
            db.add(Book(
                title=f"{title} #{i}",
                author=random.choice(AUTHORS),
                description=f"{SEED_MARKER} Annonce générée pour tester la pagination.",
                price=float(random.randrange(1000, 25001, 500)),
                condition=random.choice(CONDITIONS),
                book_type=random.choice(TYPES),
                language="Français",
                location_label=random.choice(CITIES),
                is_available=True,
                is_sold=False,
                accepts_exchange=random.random() < 0.4,
                accepts_whatsapp_contact=random.random() < 0.6,
                views=random.randint(0, 200),
                is_boosted=i <= 3,  # quelques annonces boostées en tête de liste
                seller_id=seller.id,
                category_id=random.choice(categories).id if categories else None,
            ))

        db.commit()
        total = db.query(Book).count()
        print(f"{count} livres de test insérés. Total en base : {total}.")
    finally:
        db.close()


def clean() -> None:
    db = SessionLocal()
    try:
        books = db.query(Book).filter(Book.description.like(f"%{SEED_MARKER}%")).all()
        for book in books:
            db.delete(book)
        db.commit()

        seller = db.query(User).filter(User.phone == SEED_PHONE).first()
        removed_seller = False
        if seller and db.query(Book).filter(Book.seller_id == seller.id).count() == 0:
            db.delete(seller)
            db.commit()
            removed_seller = True

        print(f"{len(books)} livres de test supprimés." + (" Vendeur de test supprimé." if removed_seller else ""))
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=50, help="nombre de livres à insérer (défaut : 50)")
    parser.add_argument("--clean", action="store_true", help="supprimer les livres de test au lieu d'en créer")
    args = parser.parse_args()

    if args.clean:
        clean()
    else:
        if args.count < 1:
            sys.exit("--count doit être au moins 1")
        seed(args.count)

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, Enum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BookCondition(str, PyEnum):
    NEW = "new"
    LIKE_NEW = "like_new"
    GOOD = "good"
    FAIR = "fair"


class BookType(str, PyEnum):
    TEXTBOOK = "textbook"
    NOVEL = "novel"
    AUTOBIOGRAPHY = "autobiography"
    SCIENCE = "science"
    HISTORY = "history"
    OTHER = "other"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    books = relationship("Book", back_populates="category")


class City(Base):
    """
    Référentiel fermé des villes, par pays.

    La ville n'est plus saisie librement : elle est choisie dans cette liste.
    Sans quoi le filtre du catalogue, qui cherchait une sous-chaîne dans un
    champ libre, éclatait dès que les orthographes divergeaient ("Dakar",
    "dakar", "DKR"). Le quartier, lui, reste libre : aucune liste ne le
    couvrirait.

    country_code suit la norme ISO 3166-1 alpha-2 (SN, CI, BF, ML, NE, GH...).
    Il est indispensable dès maintenant : sans lui, impossible de distinguer
    plus tard les homonymes entre pays, Saint-Louis ou Kayes par exemple.
    """

    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(primary_key=True)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)

    books = relationship("Book", back_populates="city")


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    isbn: Mapped[str | None] = mapped_column(String(20))
    price: Mapped[float] = mapped_column(Float, nullable=False)
    condition: Mapped[BookCondition] = mapped_column(Enum(BookCondition), nullable=False)
    book_type: Mapped[BookType] = mapped_column(Enum(BookType), default=BookType.OTHER)
    education_level: Mapped[str | None] = mapped_column(String(100))
    subject: Mapped[str | None] = mapped_column(String(100))
    is_pack: Mapped[bool] = mapped_column(Boolean, default=False)
    pack_items: Mapped[str | None] = mapped_column(Text)  # JSON string list
    cover_url: Mapped[str | None] = mapped_column(String(500))
    language: Mapped[str | None] = mapped_column(String(50))
    open_library_id: Mapped[str | None] = mapped_column(String(100))
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # location_label devient le quartier seul : la ville est portée par city_id.
    # Le champ reste en place pour les annonces créées avant la bascule.
    location_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    country_code: Mapped[str | None] = mapped_column(String(2), nullable=True, index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    is_sold: Mapped[bool] = mapped_column(Boolean, default=False)
    accepts_exchange: Mapped[bool] = mapped_column(Boolean, default=False)
    accepts_whatsapp_contact: Mapped[bool] = mapped_column(Boolean, default=False)
    views: Mapped[int] = mapped_column(Integer, default=0)
    is_boosted: Mapped[bool] = mapped_column(Boolean, default=False)
    boost_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    city_id: Mapped[int | None] = mapped_column(ForeignKey("cities.id"), nullable=True, index=True)

    seller = relationship("User", back_populates="books")
    category = relationship("Category", back_populates="books")
    city = relationship("City", back_populates="books")
    images = relationship("BookImage", back_populates="book", cascade="all, delete-orphan")
    boost_requests = relationship("BoostRequest", back_populates="book")


class BoostRequestStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class BoostRequest(Base):
    __tablename__ = "boost_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"), nullable=False)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[BoostRequestStatus] = mapped_column(
        Enum(BoostRequestStatus), default=BoostRequestStatus.PENDING
    )
    duration_days: Mapped[int] = mapped_column(Integer, default=7)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    book = relationship("Book", back_populates="boost_requests")
    seller = relationship("User")


class BookImage(Base):
    __tablename__ = "book_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    book = relationship("Book", back_populates="images")


class CoverSource(str, PyEnum):
    """D'où vient une couverture. Conservé par ligne pour pouvoir, le jour où
    un éditeur le demande, retirer d'un seul coup tout ce qui vient de lui."""

    PUBLISHER = "publisher"      # fourni ou autorisé par l'éditeur
    MANUAL = "manual"            # saisi à la main dans l'amorce
    GOOGLE = "google"            # Google Books
    OPENLIBRARY = "openlibrary"  # Open Library
    SELLER = "seller"            # photo d'un vendeur, promue après validation


class BookCover(Base):
    """
    Référentiel des couvertures, indépendant des annonces.

    Une annonce va et vient ; la couverture d'une édition, non. En séparant les
    deux, une couverture ajoutée aujourd'hui profite immédiatement à toutes les
    annonces concernées, passées et futures, sans reprise de données.

    Deux clés, deux usages :

    - `isbn13` désigne une édition et un format précis. C'est la clé qui permet
      de RÉPONDRE avec certitude. Elle est facultative : une grande partie du
      corpus visé — manuels scolaires sénégalais, éditions africaines locales —
      n'a pas d'ISBN du tout, et l'exiger ferait caler l'amorce sur son cas
      principal.

    - `work_key` regroupe les éditions d'une même œuvre par titre et auteur
      normalisés. Ce rapprochement confond les éditions : il ne sert jamais à
      décider, seulement à PROPOSER un choix au vendeur, qui a le livre en main
      et tranche. C'est cette validation humaine qui rend le flou acceptable.
    """

    __tablename__ = "book_covers"

    id: Mapped[int] = mapped_column(primary_key=True)

    isbn13: Mapped[str | None] = mapped_column(String(13), nullable=True, index=True)
    work_key: Mapped[str] = mapped_column(String(300), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    author: Mapped[str | None] = mapped_column(String(300), nullable=True)
    publisher: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Ce qui distingue deux couvertures d'un même livre, affiché sous la
    # vignette pour que le vendeur puisse choisir : "Folio, 2019".
    edition_hint: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Renseignés pour les manuels : ils rendent l'amorce scolaire exploitable
    # même sans ISBN.
    education_level: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    subject: Mapped[str | None] = mapped_column(String(60), nullable=True, index=True)
    country_code: Mapped[str | None] = mapped_column(String(2), nullable=True, index=True)

    # Notre copie, sur notre propre hébergement : les URL des sources externes
    # changent et expirent.
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)

    source: Mapped[CoverSource] = mapped_column(Enum(CoverSource), nullable=False)
    # Identifiant d'origine (URL externe, identifiant de volume...). Couplé à
    # `source`, il rend l'import rejouable sans créer de doublon.
    source_ref: Mapped[str] = mapped_column(String(500), nullable=False)

    # Nombre de vendeurs ayant désigné cette couverture. Plusieurs choix
    # concordants valent mieux qu'une supposition automatique.
    picks_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint("source", "source_ref", name="uq_book_covers_source_ref"),
    )

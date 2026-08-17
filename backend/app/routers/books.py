import io
import json
import os
import uuid
from datetime import datetime
from typing import Optional

import cloudinary
import cloudinary.uploader

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.countries import country_from_phone
from app.core.deps import get_current_user
from app.models.book import Book, BookCondition, BookImage, BookType, BoostRequest, BoostRequestStatus, City
from app.models.user import User
from app.schemas.book import (
    AlertCreate,
    AlertOut,
    BookCreate,
    BookOut,
    BookUpdate,
    CatalogSuggestion,
    PaginatedBooks,
)
from app.services.alert_service import check_and_notify_alerts
from app.services.catalog_service import autocomplete, save_to_catalog
from app.services.category_mapping import map_to_kittab_category
from app.models.alert import BookAlert

router = APIRouter(prefix="/books", tags=["books"])

if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

MAX_IMAGES = 3
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Repli quand le nom de fichier envoyé par le navigateur n'a pas d'extension
# exploitable, cas fréquent depuis un téléphone.
MIME_TO_EXTENSION = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


# ── Catalogue autocomplete ────────────────────────────────────────────────

@router.post("/scan-cover")
async def scan_cover(file: UploadFile = File(...)):
    import base64
    import anthropic as _anthropic

    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="Scan non disponible")

    content = await file.read()
    b64 = base64.standard_b64encode(content).decode("utf-8")
    ext = (file.content_type or "image/jpeg")
    print(f"[SCAN-COVER] content_type={ext} size={len(content)}")

    import json as _json
    import re as _re
    try:
        client = _anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": ext, "data": b64},
                    },
                    {
                        "type": "text",
                        "text": "This is a book cover or back cover. Extract: title, author name, category, and language of the book. For category, use ONE of: Autobiographies, Romans, Histoire, Sciences, Manuels scolaires, Développement personnel, Religion & Spiritualité, Philosophie, Économie & Business, Droit, Médecine & Santé, Informatique, Littérature africaine, Jeunesse, Poésie, BD & Comics, Langues & Dictionnaires, Autres. For language use the language name in French (Français, Anglais, Arabe, Portugais, Wolof, etc). Reply ONLY with valid JSON: {\"title\": \"...\", \"author\": \"...\", \"category\": \"...\", \"language\": \"...\"}. If you cannot determine a field, use an empty string.",
                    },
                ],
            }],
        )
        text = message.content[0].text.strip()
        print(f"[SCAN-COVER] Claude response: {text[:200]}")
        match = _re.search(r'\{.*?\}', text, _re.DOTALL)
        if match:
            data = _json.loads(match.group())
            return {"title": data.get("title", ""), "author": data.get("author", ""), "category": data.get("category", ""), "language": data.get("language", "")}
        raise ValueError("no json in response")
    except Exception as e:
        print(f"[SCAN-COVER] ERROR: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Impossible d'extraire les informations du livre: {str(e)}")


@router.get("/autocomplete", response_model=list[CatalogSuggestion])
async def book_autocomplete(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    return await autocomplete(db, q)


@router.get("/info")
async def book_info(
    google_id: Optional[str] = Query(None),
    title: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    isbn: Optional[str] = Query(None),
):
    import httpx
    from app.services.cover_service import fetch_google_volume, resolve_cover

    empty = {
        "title": None, "author": None, "language": None, "summary": None,
        "subjects": [], "published_year": None, "cover_url": None,
        "page_count": None, "publisher": None, "google_books_link": None,
        "kittab_category": None, "google_id": None, "lookup_failed": False,
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            volume_info, volume_id, lookup_failed = await fetch_google_volume(
                client,
                api_key=settings.GOOGLE_BOOKS_API_KEY,
                isbn=isbn,
                title=title,
                author=author,
            )
            if not volume_info and google_id:
                try:
                    params = {"key": settings.GOOGLE_BOOKS_API_KEY} if settings.GOOGLE_BOOKS_API_KEY else {}
                    r = await client.get(
                        f"https://www.googleapis.com/books/v1/volumes/{google_id}", params=params
                    )
                    if r.status_code == 200:
                        volume_info = r.json().get("volumeInfo")
                        volume_id = google_id
                    else:
                        lookup_failed = True
                except Exception:
                    lookup_failed = True

            # Google peut ne rien connaître du livre et Open Library avoir sa
            # couverture : on tente quand même la résolution par ISBN.
            cover_url = await resolve_cover(client, volume_info or {}, isbn)
    except Exception:
        return {**empty, "lookup_failed": True}

    if not volume_info:
        return {**empty, "cover_url": cover_url, "lookup_failed": lookup_failed}

    gb_categories = volume_info.get("categories") or []
    authors = volume_info.get("authors") or []
    lang_map = {"fr": "Français", "en": "Anglais", "ar": "Arabe", "pt": "Portugais", "wo": "Wolof", "ff": "Peul"}
    raw_lang = volume_info.get("language") or ""
    return {
        "title": volume_info.get("title") or None,
        "author": ", ".join(authors) if authors else None,
        "language": lang_map.get(raw_lang[:2], None),
        "summary": volume_info.get("description"),
        "subjects": gb_categories[:6],
        "published_year": (volume_info.get("publishedDate") or "")[:4] or None,
        "cover_url": cover_url,
        "page_count": volume_info.get("pageCount"),
        "publisher": volume_info.get("publisher"),
        "google_books_link": volume_info.get("infoLink"),
        "kittab_category": map_to_kittab_category(gb_categories),
        "google_id": volume_id,
        "lookup_failed": False,
    }


class ParseListingInput(BaseModel):
    text: str
    isbn: str | None = None


def _parse_price(price_text: Optional[str]) -> Optional[int]:
    """
    Isole les chiffres d'un prix écrit en texte libre ("2000 FCFA", "2 000F",
    "environ 2000") en un entier. Renvoie None plutôt que de deviner un
    montant : c'est le seul champ que l'IA ne doit jamais inventer, une
    absence explicite vaut mieux qu'un chiffre halluciné.
    """
    import re

    if not price_text:
        return None
    digits = re.sub(r"[^\d]", "", price_text)
    if not digits:
        return None
    try:
        value = int(digits)
    except ValueError:
        return None
    return value if value > 0 else None


async def _extract_listing_with_ai(
    text: str,
    category_names: list[str],
    city_names: list[str],
    languages: list[str],
    condition_values: list[str],
) -> dict:
    """
    Demande à Claude de lire l'annonce en texte libre et d'en extraire les
    champs du formulaire, contraints à nos listes fermées.

    La sortie structurée (`output_config.format`) est ce qui nous permet de
    ne jamais laisser l'IA inventer une ville ou une catégorie hors de nos
    référentiels : le schéma JSON liste les valeurs possibles en `enum`,
    Claude ne peut littéralement pas répondre autre chose.
    """
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "author": {"type": "string"},
            "condition": {"type": "string", "enum": [*condition_values, ""]},
            "price_text": {"type": "string", "description": "Le prix tel qu'écrit dans le texte, chiffres uniquement importants. Vide si absent."},
            "city": {"type": "string", "enum": [*city_names, ""]},
            "location_label": {"type": "string", "description": "Quartier ou zone mentionné, si présent."},
            "category": {"type": "string", "enum": [*category_names, ""]},
            "language": {"type": "string", "enum": [*languages, ""]},
        },
        "required": ["title", "author", "condition", "price_text", "city", "location_label", "category", "language"],
        "additionalProperties": False,
    }

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": (
                "Voici une annonce de vente d'un livre d'occasion, écrite librement par un "
                "particulier en français. Extrais-en les informations demandées. Ne réponds "
                "qu'à partir de ce texte, sans inventer : laisse une chaîne vide si "
                "l'information n'y figure pas. Pour l'état, choisis la catégorie la plus "
                "proche de ce que le texte décrit (état neuf/parfait, bon état, correct, "
                "dégradé/abîmé) ; laisse vide si rien ne l'indique.\n\n"
                f"Texte du vendeur :\n{text}"
            ),
        }],
        output_config={"format": {"type": "json_schema", "schema": schema}},
    )

    if message.stop_reason == "refusal":
        raise ValueError("refusal")

    raw = next((b.text for b in message.content if b.type == "text"), "")
    return json.loads(raw)


@router.post("/parse-listing")
async def parse_listing(
    payload: ParseListingInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Publication par message : transforme un texte libre en champs de
    formulaire pré-remplis.

    Rien de ce qui revient ici n'est appliqué tel quel côté client sans
    passer par l'écran de relecture — voir le principe déjà en place pour
    l'ISBN : l'IA propose, le serveur vérifie ce qui doit rester dans une
    liste fermée, le vendeur confirme.
    """
    from app.core.countries import DEFAULT_COUNTRY
    from app.core.isbn import normalize_isbn
    from app.models.book import Category

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Décris le livre avant de continuer.")
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="La publication par message est momentanément indisponible.")

    country = (current_user.country_code or DEFAULT_COUNTRY).upper()
    categories = db.query(Category).order_by(Category.name).all()
    cities = db.query(City).filter(City.country_code == country).order_by(City.name).all()
    languages = ["Français", "Anglais", "Arabe", "Portugais", "Wolof", "Peul", "Autre"]
    condition_labels = {"new": "Parfait", "like_new": "Très bon", "good": "Correct", "fair": "Dégradé"}

    try:
        extracted = await _extract_listing_with_ai(
            text,
            [c.name for c in categories],
            [c.name for c in cities],
            languages,
            list(condition_labels.keys()),
        )
        parse_failed = False
    except Exception as exc:
        print(f"[PARSE-LISTING] échec de l'extraction : {exc}")
        extracted = {}
        parse_failed = True

    city = next((c for c in cities if c.name == extracted.get("city")), None)
    category = next((c for c in categories if c.name == extracted.get("category")), None)

    cover_url = None
    page_count = None
    normalized_isbn = normalize_isbn(payload.isbn) if payload.isbn else None
    if normalized_isbn:
        import httpx
        from app.services.cover_service import fetch_google_volume, resolve_cover

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                volume_info, _, _ = await fetch_google_volume(
                    client, api_key=settings.GOOGLE_BOOKS_API_KEY, isbn=normalized_isbn,
                )
                cover_url = await resolve_cover(client, volume_info or {}, normalized_isbn)
                if volume_info:
                    page_count = volume_info.get("pageCount")
        except Exception:
            pass

    return {
        "title": extracted.get("title") or "",
        "author": extracted.get("author") or "",
        "condition": extracted.get("condition") or "",
        "condition_label": condition_labels.get(extracted.get("condition"), ""),
        "price": _parse_price(extracted.get("price_text")),
        "city_id": city.id if city else None,
        "city_name": city.name if city else None,
        "location_label": extracted.get("location_label") or "",
        "category_id": category.id if category else None,
        "category_name": category.name if category else None,
        "language": extracted.get("language") or "",
        "cover_url": cover_url,
        "isbn": normalized_isbn,
        "page_count": page_count,
        "parse_failed": parse_failed,
    }


class CatalogSavePayload(BaseModel):
    title: str
    author: str
    open_library_id: str
    isbn: str | None = None
    cover_url: str | None = None
    published_year: str | None = None


@router.post("/catalog/save", status_code=status.HTTP_204_NO_CONTENT)
def save_catalog_entry(payload: CatalogSavePayload, db: Session = Depends(get_db)):
    save_to_catalog(db, payload.model_dump())


# ── Listing CRUD ────────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedBooks)
def list_books(
    q: Optional[str] = Query(None),
    book_type: Optional[BookType] = Query(None),
    condition: Optional[BookCondition] = Query(None),
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    education_level: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    boosted: Optional[bool] = Query(None),
    accepts_exchange: Optional[bool] = Query(None),
    pack_only: Optional[bool] = Query(None),
    city: Optional[str] = Query(None),
    city_id: Optional[int] = Query(None),
    country: Optional[str] = Query(None, min_length=2, max_length=2),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    # Expirer les boosts dépassés
    db.query(Book).filter(
        Book.is_boosted == True,
        Book.boost_expires_at < datetime.utcnow()
    ).update({"is_boosted": False, "boost_expires_at": None}, synchronize_session=False)
    db.commit()

    query = db.query(Book).filter(Book.is_available == True, Book.is_sold == False)

    if boosted:
        query = query.filter(Book.is_boosted == True)
    if accepts_exchange:
        query = query.filter(Book.accepts_exchange == True)
    if pack_only:
        query = query.filter(Book.is_pack == True)

    if q:
        query = query.filter(
            Book.title.ilike(f"%{q}%") | Book.author.ilike(f"%{q}%")
        )
    if book_type:
        query = query.filter(Book.book_type == book_type)
    if condition:
        query = query.filter(Book.condition == condition)
    if category_id:
        query = query.filter(Book.category_id == category_id)
    if min_price is not None:
        query = query.filter(Book.price >= min_price)
    if max_price is not None:
        query = query.filter(Book.price <= max_price)
    # Niveau et matière sont désormais choisis dans une liste fermée : une
    # égalité exacte suffit et évite les rapprochements hasardeux d'un LIKE.
    if education_level:
        query = query.filter(Book.education_level == education_level)
    if subject:
        query = query.filter(Book.subject == subject)
    if city_id is not None:
        # Filtre exact, celui du nouveau sélecteur de ville.
        query = query.filter(Book.city_id == city_id)
    elif city:
        # Ancien filtre en texte libre, conservé pour les annonces créées avant
        # la bascule et pour les liens déjà partagés. La recherche porte à la
        # fois sur le nom de la ville et sur le quartier.
        query = query.outerjoin(City, Book.city_id == City.id).filter(
            City.name.ilike(f"%{city}%") | Book.location_label.ilike(f"%{city}%")
        )
    if country:
        query = query.filter(Book.country_code == country.upper())

    total = query.count()
    items = query.order_by(Book.is_boosted.desc(), Book.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedBooks(total=total, page=page, page_size=page_size, items=items)


@router.get("/me/listings", response_model=list[BookOut])
def my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Book)
        .options(joinedload(Book.images))
        .filter(Book.seller_id == current_user.id)
        .order_by(Book.created_at.desc())
        .all()
    )


@router.get("/{book_id}", response_model=BookOut)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    book.views = (book.views or 0) + 1
    db.commit()
    db.refresh(book)
    return book


@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    payload: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_profile_complete:
        raise HTTPException(
            status_code=400,
            detail="Veuillez compléter votre profil avant de publier une annonce",
        )
    data = payload.model_dump()
    if data.get('pack_items') is not None:
        data['pack_items'] = json.dumps(data['pack_items'])

    # La ville doit appartenir au pays du vendeur : sans cette vérification,
    # un identifiant arbitraire rattacherait l'annonce à une ville d'un autre
    # pays, et le filtre du catalogue afficherait n'importe quoi.
    seller_country = current_user.country_code or country_from_phone(current_user.phone)
    if data.get('city_id') is not None:
        city = db.get(City, data['city_id'])
        if not city or city.country_code != seller_country:
            raise HTTPException(status_code=400, detail="Ville inconnue")

    book = Book(**data, seller_id=current_user.id, country_code=seller_country)
    db.add(book)
    db.commit()
    db.refresh(book)

    # Lancer les alertes en arrière-plan après avoir répondu au vendeur
    book_id = book.id
    import threading
    from app.core.database import SessionLocal
    def run_alerts():
        bg_db = SessionLocal()
        try:
            from app.models.book import Book as BookModel
            bg_book = bg_db.query(BookModel).get(book_id)
            if bg_book:
                check_and_notify_alerts(bg_db, bg_book)
        finally:
            bg_db.close()
    threading.Thread(target=run_alerts, daemon=True).start()

    return book


@router.put("/{book_id}", response_model=BookOut)
def update_book(
    book_id: int,
    payload: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if book.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action non autorisée")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(book, field, value)
    db.commit()
    db.refresh(book)
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if book.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action non autorisée")
    db.delete(book)
    db.commit()


# ── Mark as sold ────────────────────────────────────────────────────────────────────

@router.patch("/{book_id}/mark-sold", response_model=BookOut)
def mark_book_sold(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if book.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action non autorisée")
    book.is_sold = True
    book.is_available = False
    db.commit()
    db.refresh(book)
    return book


# ── Images ──────────────────────────────────────────────────────────────────────────

@router.post("/{book_id}/images", response_model=BookOut)
async def upload_image(
    book_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if book.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action non autorisée")
    if len(book.images) >= MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES} photos par annonce")

    # Le nom de fichier n'est pas fiable : selon le navigateur mobile et la
    # source choisie (appareil photo, photothèque, gestionnaire de fichiers),
    # il arrive sans extension ou avec une extension inattendue. On retombe
    # donc sur le type MIME déclaré avant de rejeter.
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = MIME_TO_EXTENSION.get((file.content_type or "").lower(), "")
    if ext not in ALLOWED_EXTENSIONS:
        received = os.path.splitext(file.filename or "")[1] or file.content_type or "inconnu"
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté ({received}). Formats acceptés : jpg, png, webp.",
        )

    content = await file.read()

    if settings.CLOUDINARY_CLOUD_NAME:
        result = cloudinary.uploader.upload(
            io.BytesIO(content),
            folder="kittab/books",
            public_id=str(uuid.uuid4()),
            overwrite=False,
            resource_type="image",
        )
        image_url = result["secure_url"]
    else:
        filename = f"{uuid.uuid4()}{ext}"
        dest = os.path.join(settings.UPLOAD_DIR, filename)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        with open(dest, "wb") as f:
            f.write(content)
        image_url = f"/uploads/{filename}"

    is_primary = len(book.images) == 0
    image = BookImage(book_id=book_id, url=image_url, is_primary=is_primary)
    db.add(image)
    db.commit()

    # La première photo est la couverture de l'exemplaire : elle rejoint le
    # référentiel, où le sélecteur la proposera aux prochains vendeurs du même
    # livre. C'est ce versement qui évite quarante images différentes pour un
    # même manuel. Un échec ici ne doit pas faire perdre la photo au vendeur.
    if is_primary:
        try:
            from app.services.cover_service import promote_seller_cover
            promote_seller_cover(db, book, image_url)
        except Exception as exc:
            print(f"[COVERS] promotion impossible pour le livre {book_id} : {exc}")
            db.rollback()

    db.refresh(book)
    return book


@router.delete("/{book_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(
    book_id: int,
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book or book.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action non autorisée")

    image = db.get(BookImage, image_id)
    if not image or image.book_id != book_id:
        raise HTTPException(status_code=404, detail="Image introuvable")

    if settings.CLOUDINARY_CLOUD_NAME and image.url.startswith("https://res.cloudinary.com"):
        try:
            # Extraire le public_id depuis l'URL Cloudinary
            public_id = "/".join(image.url.split("/")[-3:]).rsplit(".", 1)[0]
            cloudinary.uploader.destroy(public_id)
        except Exception:
            pass
    else:
        path = os.path.join(settings.UPLOAD_DIR, os.path.basename(image.url))
        if os.path.exists(path):
            os.remove(path)

    was_primary = image.is_primary
    db.delete(image)
    db.flush()

    if was_primary and book.images:
        book.images[0].is_primary = True

    db.commit()


# ── Boost requests ───────────────────────────────────────────────────────────────

class BoostRequestPayload(BaseModel):
    duration_days: int = 7


@router.post("/{book_id}/boost-request", status_code=status.HTTP_201_CREATED)
def request_boost(
    book_id: int,
    payload: BoostRequestPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book or book.seller_id != current_user.id:
        raise HTTPException(status_code=404, detail="Livre introuvable")

    existing = (
        db.query(BoostRequest)
        .filter(BoostRequest.book_id == book_id, BoostRequest.status == BoostRequestStatus.PENDING)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Une demande de boost est déjà en attente")

    req = BoostRequest(book_id=book_id, seller_id=current_user.id, duration_days=payload.duration_days)
    db.add(req)
    db.commit()
    return {"message": "Demande de boost envoyée, l'admin va examiner votre demande"}


# ── Alerts ───────────────────────────────────────────────────────────────────────

@router.post("/alerts", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    if not payload.email and not payload.notification_phone:
        raise HTTPException(status_code=400, detail="email ou notification_phone requis")
    alert = BookAlert(
        query=payload.query,
        author=payload.author,
        email=payload.email,
        notification_phone=payload.notification_phone,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

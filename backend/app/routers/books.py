import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.book import Book, BookCondition, BookImage, BookType, BoostRequest, BoostRequestStatus
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
from app.services.catalog_service import autocomplete
from app.models.alert import BookAlert

router = APIRouter(prefix="/books", tags=["books"])

MAX_IMAGES = 4
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


# ── Catalogue autocomplete ────────────────────────────────────────────────

@router.get("/autocomplete", response_model=list[CatalogSuggestion])
async def book_autocomplete(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    return await autocomplete(db, q)


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
    boosted: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Book).filter(Book.is_available == True)

    if boosted:
        query = query.filter(Book.is_boosted == True, Book.boost_expires_at > datetime.utcnow())

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
    if education_level:
        query = query.filter(Book.education_level.ilike(f"%{education_level}%"))

    total = query.count()
    items = query.order_by(Book.is_boosted.desc(), Book.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedBooks(total=total, page=page, page_size=page_size, items=items)


@router.get("/me/listings", response_model=list[BookOut])
def my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Book).filter(Book.seller_id == current_user.id).order_by(Book.created_at.desc()).all()


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
    book = Book(**payload.model_dump(), seller_id=current_user.id)
    db.add(book)
    db.commit()
    db.refresh(book)
    check_and_notify_alerts(db, book)
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

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Format non supporté (jpg, png, webp)")

    filename = f"{uuid.uuid4()}{ext}"
    dest = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)

    is_primary = len(book.images) == 0
    image = BookImage(book_id=book_id, url=f"/uploads/{filename}", is_primary=is_primary)
    db.add(image)
    db.commit()
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
    alert = BookAlert(query=payload.query, notification_phone=payload.notification_phone)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.book import Book, BoostRequest, BoostRequestStatus
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return current_user


class BoostPayload(BaseModel):
    days: int = 7


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    total_books = db.query(Book).filter(Book.is_available == True).count()
    total_views = db.query(func.sum(Book.views)).scalar() or 0
    boosted_books = db.query(Book).filter(Book.is_boosted == True, Book.boost_expires_at > datetime.utcnow()).count()
    total_users = db.query(User).filter(User.is_profile_complete == True).count()

    # Répartition par ville (address du vendeur)
    cities_raw = (
        db.query(User.address, func.count(Book.id).label("count"))
        .join(Book, Book.seller_id == User.id)
        .filter(Book.is_available == True, User.address.isnot(None))
        .group_by(User.address)
        .order_by(func.count(Book.id).desc())
        .limit(10)
        .all()
    )
    cities = [{"city": r.address, "count": r.count} for r in cities_raw]

    # Livres par catégorie
    from app.models.book import Category
    categories_raw = (
        db.query(Category.name, func.count(Book.id).label("count"))
        .join(Book, Book.category_id == Category.id)
        .filter(Book.is_available == True)
        .group_by(Category.name)
        .order_by(func.count(Book.id).desc())
        .all()
    )
    categories = [{"name": r.name, "count": r.count} for r in categories_raw]

    # Livres publiés par jour (7 derniers jours)
    recent = (
        db.query(func.date(Book.created_at).label("date"), func.count(Book.id).label("count"))
        .filter(Book.created_at >= datetime.utcnow() - timedelta(days=7))
        .group_by(func.date(Book.created_at))
        .order_by(func.date(Book.created_at))
        .all()
    )
    daily = [{"date": str(r.date), "count": r.count} for r in recent]

    return {
        "total_books": total_books,
        "total_views": total_views,
        "boosted_books": boosted_books,
        "total_users": total_users,
        "cities": cities,
        "categories": categories,
        "daily_publications": daily,
    }


@router.get("/books")
def list_all_books(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(Book)
    if q:
        query = query.filter(Book.title.ilike(f"%{q}%") | Book.author.ilike(f"%{q}%"))
    books = query.order_by(Book.is_boosted.desc(), Book.created_at.desc()).limit(50).all()
    return [
        {
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "price": b.price,
            "views": b.views,
            "is_boosted": b.is_boosted,
            "boost_expires_at": b.boost_expires_at.isoformat() if b.boost_expires_at else None,
            "is_available": b.is_available,
            "seller_phone": b.seller.phone if b.seller else None,
        }
        for b in books
    ]


@router.get("/boost-requests")
def list_boost_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(BoostRequest)
    if status:
        query = query.filter(BoostRequest.status == status)
    else:
        query = query.filter(BoostRequest.status == BoostRequestStatus.PENDING)
    requests = query.order_by(BoostRequest.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "book_id": r.book_id,
            "book_title": r.book.title,
            "book_author": r.book.author,
            "seller_phone": r.seller.phone if r.seller else None,
            "seller_name": f"{r.seller.first_name or ''} {r.seller.last_name or ''}".strip() if r.seller else None,
            "status": r.status,
            "duration_days": r.duration_days,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in requests
    ]


@router.post("/boost-requests/{request_id}/approve")
def approve_boost(
    request_id: int,
    payload: BoostPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    req = db.get(BoostRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    req.status = BoostRequestStatus.APPROVED
    req.reviewed_at = datetime.utcnow()
    book = db.get(Book, req.book_id)
    if book:
        book.is_boosted = True
        book.boost_expires_at = datetime.utcnow() + timedelta(days=payload.days)
    db.commit()
    return {"message": f"Boost approuvé pour {payload.days} jours"}


@router.post("/boost-requests/{request_id}/reject")
def reject_boost(
    request_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    req = db.get(BoostRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    req.status = BoostRequestStatus.REJECTED
    req.reviewed_at = datetime.utcnow()
    db.commit()
    return {"message": "Demande rejetée"}


@router.post("/books/{book_id}/boost")
def boost_book(book_id: int, payload: BoostPayload, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livre introuvable")
    book.is_boosted = True
    book.boost_expires_at = datetime.utcnow() + timedelta(days=payload.days)
    db.commit()
    return {"message": f"Livre boosté pour {payload.days} jours", "expires_at": book.boost_expires_at}


@router.delete("/books/{book_id}/boost")
def unboost_book(book_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livre introuvable")
    book.is_boosted = False
    book.boost_expires_at = None
    db.commit()
    return {"message": "Boost retiré"}

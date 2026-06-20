from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import exists

from app.core.database import get_db
from app.models.book import Category, Book
from app.schemas.book import CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    with_books: bool = Query(False),
):
    q = db.query(Category)
    if with_books:
        q = q.filter(exists().where((Book.category_id == Category.id) & (Book.is_available == True)))
    return q.order_by(Category.name).all()

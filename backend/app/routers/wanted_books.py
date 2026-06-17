from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.wanted_book import WantedBook

router = APIRouter(prefix="/wanted-books", tags=["wanted-books"])


class WantedBookCreate(BaseModel):
    title: str
    author: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None


class CategoryBrief(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class UserBrief(BaseModel):
    id: int
    username: Optional[str] = None
    model_config = {"from_attributes": True}


class WantedBookOut(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    description: Optional[str] = None
    is_fulfilled: bool
    created_at: datetime
    user: UserBrief
    category: Optional[CategoryBrief] = None
    model_config = {"from_attributes": True}


@router.get("", response_model=list[WantedBookOut])
def list_wanted_books(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 40,
    db: Session = Depends(get_db),
):
    q = db.query(WantedBook).filter(WantedBook.is_fulfilled == False)
    if search:
        q = q.filter(WantedBook.title.ilike(f"%{search}%") | WantedBook.author.ilike(f"%{search}%"))
    if category_id:
        q = q.filter(WantedBook.category_id == category_id)
    return q.order_by(WantedBook.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=WantedBookOut, status_code=201)
def create_wanted_book(
    payload: WantedBookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Le titre est requis")
    wanted = WantedBook(
        user_id=current_user.id,
        title=title,
        author=payload.author.strip() if payload.author else None,
        category_id=payload.category_id,
        description=payload.description.strip() if payload.description else None,
    )
    db.add(wanted)
    db.commit()
    db.refresh(wanted)
    return wanted


@router.patch("/{wanted_id}/fulfill", response_model=WantedBookOut)
def fulfill_wanted_book(
    wanted_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wanted = db.query(WantedBook).filter(WantedBook.id == wanted_id).first()
    if not wanted:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    if wanted.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    wanted.is_fulfilled = True
    db.commit()
    db.refresh(wanted)
    return wanted


@router.delete("/{wanted_id}", status_code=204)
def delete_wanted_book(
    wanted_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wanted = db.query(WantedBook).filter(WantedBook.id == wanted_id).first()
    if not wanted:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    if wanted.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Non autorisé")
    db.delete(wanted)
    db.commit()

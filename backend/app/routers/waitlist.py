from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import Session

from app.core.database import Base, get_db

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


class WaitlistEntry(Base):
    __tablename__ = "waitlist"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    lang = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class WaitlistInput(BaseModel):
    email: str | None = None
    phone: str | None = None
    lang: str = "fr"


@router.post("", status_code=201)
def join_waitlist(payload: WaitlistInput, db: Session = Depends(get_db)):
    if not payload.email and not payload.phone:
        raise HTTPException(status_code=400, detail="Email ou téléphone requis")
    entry = WaitlistEntry(email=payload.email, phone=payload.phone, lang=payload.lang)
    db.add(entry)
    db.commit()
    return {"message": "Inscription enregistrée"}


@router.get("", include_in_schema=False)
def list_waitlist(db: Session = Depends(get_db)):
    entries = db.query(WaitlistEntry).order_by(WaitlistEntry.created_at.desc()).all()
    return [{"id": e.id, "email": e.email, "phone": e.phone, "lang": e.lang, "created_at": str(e.created_at)} for e in entries]

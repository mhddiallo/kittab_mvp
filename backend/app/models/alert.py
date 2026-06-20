from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BookAlert(Base):
    __tablename__ = "book_alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    query: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notification_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

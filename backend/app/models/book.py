from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, Enum
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
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_exchange: Mapped[bool] = mapped_column(Boolean, default=False)
    views: Mapped[int] = mapped_column(Integer, default=0)
    is_boosted: Mapped[bool] = mapped_column(Boolean, default=False)
    boost_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))

    seller = relationship("User", back_populates="books")
    category = relationship("Category", back_populates="books")
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

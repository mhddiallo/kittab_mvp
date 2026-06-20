from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator
import json

from app.models.book import BookCondition, BookType


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class BookImageOut(BaseModel):
    id: int
    url: str
    is_primary: bool

    model_config = {"from_attributes": True}


class SellerBrief(BaseModel):
    id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: str
    address: Optional[str] = None

    model_config = {"from_attributes": True}


class BookCreate(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    isbn: Optional[str] = None
    price: float
    condition: BookCondition
    book_type: BookType = BookType.OTHER
    education_level: Optional[str] = None
    subject: Optional[str] = None
    category_id: Optional[int] = None
    accepts_exchange: bool = False
    accepts_whatsapp_contact: bool = False
    is_pack: bool = False
    pack_items: Optional[List[str]] = None
    cover_url: Optional[str] = None
    language: Optional[str] = None
    open_library_id: Optional[str] = None
    page_count: Optional[int] = None
    location_label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator('pack_items', mode='before')
    @classmethod
    def parse_pack_items(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    condition: Optional[BookCondition] = None
    book_type: Optional[BookType] = None
    education_level: Optional[str] = None
    subject: Optional[str] = None
    category_id: Optional[int] = None
    is_available: Optional[bool] = None
    accepts_exchange: Optional[bool] = None
    accepts_whatsapp_contact: Optional[bool] = None
    is_pack: Optional[bool] = None
    pack_items: Optional[List[str]] = None


class BookOut(BaseModel):
    id: int
    title: str
    author: str
    description: Optional[str] = None
    isbn: Optional[str] = None
    price: float
    condition: BookCondition
    book_type: BookType
    education_level: Optional[str] = None
    subject: Optional[str] = None
    is_available: bool
    is_sold: bool = False
    accepts_exchange: bool = False
    accepts_whatsapp_contact: bool = False
    views: int = 0
    is_pack: bool = False
    pack_items: Optional[List[str]] = None
    cover_url: Optional[str] = None
    language: Optional[str] = None
    open_library_id: Optional[str] = None
    page_count: Optional[int] = None
    location_label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    seller: SellerBrief
    category: Optional[CategoryOut] = None
    images: List[BookImageOut] = []

    @field_validator('pack_items', mode='before')
    @classmethod
    def parse_pack_items(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    model_config = {"from_attributes": True}


class BookListOut(BaseModel):
    id: int
    title: str
    author: str
    price: float
    condition: BookCondition
    book_type: BookType
    is_available: bool
    is_sold: bool = False
    accepts_exchange: bool = False
    accepts_whatsapp_contact: bool = False
    views: int = 0
    is_pack: bool = False
    pack_items: Optional[List[str]] = None
    cover_url: Optional[str] = None
    created_at: datetime
    seller: SellerBrief
    category: Optional[CategoryOut] = None
    images: List[BookImageOut] = []

    @field_validator('pack_items', mode='before')
    @classmethod
    def parse_pack_items(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    model_config = {"from_attributes": True}


class PaginatedBooks(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[BookListOut]


class CatalogSuggestion(BaseModel):
    source: str
    title: str
    author: str
    isbn: Optional[str] = None
    cover_url: Optional[str] = None
    thumbnail: Optional[str] = None
    published_year: Optional[str] = None
    open_library_id: Optional[str] = None

    def model_post_init(self, __context: any) -> None:
        if self.thumbnail is None and self.cover_url:
            self.thumbnail = self.cover_url


class AlertCreate(BaseModel):
    query: str
    author: str | None = None
    email: str | None = None
    notification_phone: str | None = None

    @classmethod
    def model_validator_contact(cls, v: dict) -> dict:
        if not v.get("email") and not v.get("notification_phone"):
            raise ValueError("email ou notification_phone requis")
        return v


class AlertOut(BaseModel):
    id: int
    query: str
    author: str | None
    email: str | None
    notification_phone: str | None
    is_notified: bool
    created_at: datetime

    model_config = {"from_attributes": True}

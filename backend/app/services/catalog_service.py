import asyncio
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.book_catalog import BookCatalog


def search_internal(db: Session, q: str, limit: int = 10) -> list[dict]:
    results = (
        db.query(BookCatalog)
        .filter(
            BookCatalog.title.ilike(f"%{q}%")
            | BookCatalog.author.ilike(f"%{q}%")
        )
        .limit(limit)
        .all()
    )
    return [
        {
            "source": "internal",
            "title": b.title,
            "author": b.author,
            "isbn": b.isbn,
            "cover_url": b.cover_url,
            "thumbnail": b.cover_url,
            "published_year": b.published_year,
            "open_library_id": b.open_library_id,
        }
        for b in results
    ]


async def search_google_books(q: str, limit: int = 10) -> list[dict]:
    url = "https://www.googleapis.com/books/v1/volumes"
    params: dict = {
        "q": f"intitle:{q}",
        "maxResults": limit,
        "printType": "books",
        "fields": "items(id,volumeInfo(title,authors,industryIdentifiers,imageLinks,publishedDate))",
    }
    if settings.GOOGLE_BOOKS_API_KEY:
        params["key"] = settings.GOOGLE_BOOKS_API_KEY

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    results = []
    for item in data.get("items", []):
        info = item.get("volumeInfo", {})
        authors = info.get("authors", [])
        image_links = info.get("imageLinks", {})
        thumbnail = image_links.get("thumbnail") or image_links.get("smallThumbnail")
        if thumbnail:
            thumbnail = thumbnail.replace("http://", "https://")

        isbn = None
        for identifier in info.get("industryIdentifiers", []):
            if identifier.get("type") in ("ISBN_13", "ISBN_10"):
                isbn = identifier["identifier"]
                if identifier["type"] == "ISBN_13":
                    break

        published_year = (info.get("publishedDate") or "")[:4] or None

        results.append({
            "source": "google_books",
            "open_library_id": item.get("id", ""),
            "title": info.get("title", ""),
            "author": ", ".join(authors[:2]) if authors else "",
            "isbn": isbn,
            "cover_url": thumbnail,
            "thumbnail": thumbnail,
            "published_year": published_year,
        })
    return results


def save_to_catalog(db: Session, book_data: dict) -> None:
    """Cache-aside: save a Google Books result to our local catalog."""
    google_id = book_data.get("open_library_id")
    if not google_id:
        return

    existing = db.query(BookCatalog).filter(BookCatalog.open_library_id == google_id).first()
    if existing:
        return

    entry = BookCatalog(
        title=book_data.get("title", ""),
        author=book_data.get("author", ""),
        isbn=book_data.get("isbn"),
        cover_url=book_data.get("cover_url"),
        published_year=book_data.get("published_year"),
        open_library_id=google_id,
    )
    db.add(entry)
    try:
        db.commit()
    except Exception:
        db.rollback()


async def autocomplete(db: Session, q: str) -> list[dict]:
    if not q or len(q) < 2:
        return []

    internal, google = await asyncio.gather(
        asyncio.to_thread(search_internal, db, q, 5),
        search_google_books(q, 8),
    )

    internal_titles = {r["title"].lower() for r in internal}
    merged = internal[:]
    for g in google:
        if g["title"].lower() not in internal_titles:
            merged.append(g)
        if len(merged) >= 8:
            break

    return merged

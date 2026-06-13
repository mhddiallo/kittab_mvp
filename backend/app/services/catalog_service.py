import httpx
from sqlalchemy.orm import Session

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
            "published_year": b.published_year,
            "google_books_id": b.google_books_id,
        }
        for b in results
    ]


async def search_google_books(q: str, limit: int = 10) -> list[dict]:
    url = "https://www.googleapis.com/books/v1/volumes"
    params = {"q": q, "maxResults": limit, "printType": "books"}
    try:
        async with httpx.AsyncClient(timeout=3.0, verify=False) as client:
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
        results.append({
            "source": "google_books",
            "google_books_id": item.get("id"),
            "title": info.get("title", ""),
            "author": ", ".join(authors) if authors else "",
            "isbn": next(
                (i["identifier"] for i in info.get("industryIdentifiers", []) if "ISBN" in i["type"]),
                None,
            ),
            "cover_url": image_links.get("thumbnail"),
            "published_year": info.get("publishedDate", "")[:4] if info.get("publishedDate") else None,
        })
    return results


async def autocomplete(db: Session, q: str) -> list[dict]:
    if not q or len(q) < 2:
        return []

    internal = search_internal(db, q, limit=5)
    google = await search_google_books(q, limit=10)

    internal_titles = {r["title"].lower() for r in internal}
    merged = internal[:]
    for g in google:
        if g["title"].lower() not in internal_titles:
            merged.append(g)
        if len(merged) >= 10:
            break

    return merged

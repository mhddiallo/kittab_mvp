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


async def search_open_library(q: str, limit: int = 10) -> list[dict]:
    url = "https://openlibrary.org/search.json"
    params = {"q": q, "limit": limit, "fields": "key,title,author_name,isbn,cover_i,first_publish_year"}
    try:
        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    results = []
    for item in data.get("docs", []):
        authors = item.get("author_name", [])
        cover_i = item.get("cover_i")
        results.append({
            "source": "open_library",
            "google_books_id": item.get("key", "").replace("/works/", ""),
            "title": item.get("title", ""),
            "author": ", ".join(authors[:2]) if authors else "",
            "isbn": item.get("isbn", [None])[0] if item.get("isbn") else None,
            "cover_url": f"https://covers.openlibrary.org/b/id/{cover_i}-M.jpg" if cover_i else None,
            "published_year": str(item.get("first_publish_year", "")) or None,
        })
    return results


async def autocomplete(db: Session, q: str) -> list[dict]:
    if not q or len(q) < 2:
        return []

    internal = search_internal(db, q, limit=5)
    google = await search_open_library(q, limit=5)

    internal_titles = {r["title"].lower() for r in internal}
    merged = internal[:]
    for g in google:
        if g["title"].lower() not in internal_titles:
            merged.append(g)
        if len(merged) >= 5:
            break

    return merged

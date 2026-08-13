#!/usr/bin/env python3
"""
Amorce du référentiel de couvertures, à partir d'une liste écrite à la main.

Pourquoi une liste choisie plutôt qu'un import de masse : le dump complet
d'Open Library pèse des dizaines de gigaoctets, et son service d'images plafonne
les requêtes (de l'ordre de la centaine par tranche de cinq minutes et par
adresse IP). Récupérer un million de couvertures est hors de portée ; en
récupérer deux cents choisies prend une soirée, et chacune servira des dizaines
de fois. Le rendement est sans commune mesure.

Le script est REJOUABLE : l'unicité porte sur (source, source_ref), donc une
relance après incident met à jour au lieu de dupliquer. Il ne touche jamais une
couverture validée par un vendeur (is_verified).

Usage
-----
    python import_covers.py seeds/covers_seed.csv --dry-run
    python import_covers.py seeds/covers_seed.csv
    python import_covers.py seeds/covers_seed.csv --only-missing

Colonnes du CSV (titre et auteur obligatoires, le reste facultatif) :

    title, author, isbn, publisher, edition_hint,
    education_level, subject, country_code, image_url

`image_url` permet de forcer une image précise — celle d'un éditeur qui vous a
donné son accord, par exemple. Laissée vide, elle est cherchée automatiquement.
"""

import argparse
import asyncio
import csv
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.config import settings           # noqa: E402
from app.core.database import SessionLocal     # noqa: E402
from app.core.isbn import normalize_isbn       # noqa: E402
from app.models.book import BookCover, CoverSource  # noqa: E402
from app.services.cover_service import (        # noqa: E402
    fetch_google_volume,
    normalize_work_key,
    resolve_cover,
)

# Open Library plafonne les requêtes vers son service de couvertures. On reste
# volontairement en deçà : un import qui se fait bannir à mi-parcours coûte
# plus cher que quelques minutes d'attente.
DELAY_LOOKUP_S = 3.0

# Quand le CSV fournit déjà l'adresse de l'image — cas d'un catalogue d'éditeur
# relevé au préalable — aucune API plafonnée n'est sollicitée : attendre trois
# secondes par ligne ferait durer un import de trois cents manuels un quart
# d'heure pour rien.
DELAY_DIRECT_S = 0.4


@dataclass
class Report:
    imported: int = 0
    updated: int = 0
    skipped: int = 0
    no_cover: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def render(self) -> str:
        lines = [
            "",
            "── Résultat ─────────────────────────────",
            f"  créées          : {self.imported}",
            f"  mises à jour    : {self.updated}",
            f"  ignorées        : {self.skipped}",
            f"  sans couverture : {len(self.no_cover)}",
            f"  en erreur       : {len(self.errors)}",
        ]
        # Ce qu'on n'a pas trouvé est la seule information vraiment utile : sans
        # elle, on découvre six mois plus tard que la moitié du corpus manque.
        if self.no_cover:
            lines.append("")
            lines.append("  Aucune couverture trouvée pour :")
            lines += [f"    - {t}" for t in self.no_cover]
        if self.errors:
            lines.append("")
            lines.append("  Erreurs :")
            lines += [f"    - {e}" for e in self.errors]
        return "\n".join(lines)


def upload_to_cloudinary(url: str, public_id: str) -> str | None:
    """
    Recopie l'image chez nous.

    Les URL de Google et d'Open Library changent et expirent : une couverture
    qu'on ne possède pas peut disparaître du catalogue sans prévenir.
    """
    if not settings.CLOUDINARY_CLOUD_NAME:
        return None
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    try:
        result = cloudinary.uploader.upload(
            url, folder="kittab/covers", public_id=public_id, overwrite=False
        )
        return result.get("secure_url")
    except Exception as exc:
        print(f"    ! copie impossible : {exc}")
        return None


async def resolve_row(client: httpx.AsyncClient, row: dict) -> tuple[str | None, dict]:
    """Cherche une couverture et complète les métadonnées manquantes."""
    title = (row.get("title") or "").strip()
    author = (row.get("author") or "").strip() or None
    isbn = normalize_isbn(row.get("isbn"))

    forced = (row.get("image_url") or "").strip()
    if forced:
        return forced, {
            "isbn13": isbn, "source": CoverSource.PUBLISHER,
            "source_ref": forced, "direct": True,
        }

    volume_info, _volume_id, _failed = await fetch_google_volume(
        client, api_key=settings.GOOGLE_BOOKS_API_KEY,
        isbn=isbn, title=title, author=author,
    )
    volume_info = volume_info or {}

    # Google peut renvoyer l'ISBN que le CSV n'avait pas : on le récupère, il
    # deviendra la clé de rattachement exacte.
    if not isbn:
        for ident in volume_info.get("industryIdentifiers") or []:
            if ident.get("type") == "ISBN_13":
                isbn = normalize_isbn(ident.get("identifier"))
                break

    url = await resolve_cover(client, volume_info, isbn)
    if not url:
        return None, {}

    source = CoverSource.OPENLIBRARY if "openlibrary" in url else CoverSource.GOOGLE
    return url, {
        "isbn13": isbn,
        "source": source,
        "source_ref": url,
        "publisher": volume_info.get("publisher"),
        "published_year": (volume_info.get("publishedDate") or "")[:4] or None,
    }


async def run(csv_path: Path, dry_run: bool, only_missing: bool) -> Report:
    report = Report()
    rows = list(csv.DictReader(csv_path.open(encoding="utf-8")))
    print(f"{len(rows)} ligne(s) à traiter depuis {csv_path.name}\n")

    db = SessionLocal()
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for index, row in enumerate(rows, start=1):
                title = (row.get("title") or "").strip()
                author = (row.get("author") or "").strip() or None
                if not title:
                    report.skipped += 1
                    continue

                label = f"{title}" + (f" — {author}" if author else "")
                print(f"[{index}/{len(rows)}] {label}")

                work_key = normalize_work_key(title, author)
                if only_missing and db.query(BookCover).filter_by(work_key=work_key).first():
                    print("    déjà en base, ignorée")
                    report.skipped += 1
                    continue

                try:
                    url, meta = await resolve_row(client, row)
                except Exception as exc:
                    report.errors.append(f"{label} : {type(exc).__name__} {exc}")
                    continue

                delay = DELAY_DIRECT_S if meta.get("direct") else DELAY_LOOKUP_S

                if not url:
                    print("    aucune couverture trouvée")
                    report.no_cover.append(label)
                    await asyncio.sleep(DELAY_LOOKUP_S)
                    continue

                existing = (
                    db.query(BookCover)
                    .filter_by(source=meta["source"], source_ref=meta["source_ref"])
                    .first()
                )

                if dry_run:
                    verb = "mettrait à jour" if existing else "créerait"
                    print(f"    {verb} — {url[:90]}")
                    report.updated += 1 if existing else 0
                    report.imported += 0 if existing else 1
                    await asyncio.sleep(delay)
                    continue

                hosted = upload_to_cloudinary(url, f"{work_key[:80]}-{index}") or url

                values = dict(
                    isbn13=meta.get("isbn13"),
                    work_key=work_key,
                    title=title,
                    author=author,
                    publisher=(row.get("publisher") or meta.get("publisher") or None),
                    edition_hint=(row.get("edition_hint") or "").strip() or None,
                    education_level=(row.get("education_level") or "").strip() or None,
                    subject=(row.get("subject") or "").strip() or None,
                    country_code=(row.get("country_code") or "").strip() or None,
                    image_url=hosted,
                )

                if existing:
                    # Une couverture désignée par des vendeurs fait foi : un
                    # import ne doit pas l'écraser au motif qu'il est passé
                    # après.
                    if existing.is_verified:
                        print("    validée par des vendeurs, laissée intacte")
                        report.skipped += 1
                    else:
                        for key, value in values.items():
                            setattr(existing, key, value)
                        print("    mise à jour")
                        report.updated += 1
                else:
                    db.add(BookCover(source=meta["source"], source_ref=meta["source_ref"], **values))
                    print(f"    créée — {hosted[:90]}")
                    report.imported += 1

                db.commit()
                await asyncio.sleep(delay)
    finally:
        db.close()

    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("csv_path", type=Path, help="Fichier CSV d'amorce")
    parser.add_argument("--dry-run", action="store_true",
                        help="Montre ce qui serait fait, sans rien écrire")
    parser.add_argument("--only-missing", action="store_true",
                        help="Ignore les œuvres déjà présentes en base")
    args = parser.parse_args()

    if not args.csv_path.exists():
        print(f"Fichier introuvable : {args.csv_path}")
        return 1

    if args.dry_run:
        print("── Essai à blanc : aucune écriture en base ──\n")

    report = asyncio.run(run(args.csv_path, args.dry_run, args.only_missing))
    print(report.render())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

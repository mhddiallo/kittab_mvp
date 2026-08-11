from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.countries import DEFAULT_COUNTRY
from app.core.database import get_db
from app.models.book import City
from app.schemas.book import CityOut

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("", response_model=list[CityOut])
def list_cities(
    db: Session = Depends(get_db),
    country: str = Query(DEFAULT_COUNTRY, min_length=2, max_length=2),
):
    """
    Villes disponibles pour un pays, alphabétiquement, "Autre" en dernier.

    Le formulaire de publication et le filtre du catalogue s'alimentent ici :
    la liste s'étend par insertion en base, sans redéploiement.
    """
    cities = (
        db.query(City)
        .filter(City.country_code == country.upper())
        .order_by(City.name)
        .all()
    )
    # "Autre" est un repli, pas une ville : il n'a rien à faire au milieu.
    return sorted(cities, key=lambda c: (c.slug == "autre", c.name))

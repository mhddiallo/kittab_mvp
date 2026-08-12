"""add Ivory Coast cities

Revision ID: 023
Revises: 022
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision = '023'
down_revision = '022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Ouverture de la Côte d'Ivoire. Sans ces villes, un compte +225 se crée mais
# ne peut rien publier : la liste proposée au formulaire serait vide.
#
# Abidjan figure comme une seule entrée, à l'image de Dakar : ses communes
# (Cocody, Yopougon, Treichville, Marcory...) relèvent du champ "Quartier",
# laissé libre. Une liste de communes serait toujours incomplète, et
# mélangerait deux niveaux administratifs dans le même menu.
IVORY_COAST_CITIES = [
    ("Abidjan", "abidjan"),
    ("Abengourou", "abengourou"),
    ("Aboisso", "aboisso"),
    ("Adzopé", "adzope"),
    ("Agboville", "agboville"),
    ("Anyama", "anyama"),
    ("Bingerville", "bingerville"),
    ("Bondoukou", "bondoukou"),
    ("Bouaké", "bouake"),
    ("Bouaflé", "bouafle"),
    ("Dabou", "dabou"),
    ("Daloa", "daloa"),
    ("Divo", "divo"),
    ("Ferkessédougou", "ferkessedougou"),
    ("Gagnoa", "gagnoa"),
    ("Grand-Bassam", "grand-bassam"),
    ("Katiola", "katiola"),
    ("Korhogo", "korhogo"),
    ("Man", "man"),
    ("Odienné", "odienne"),
    ("San-Pédro", "san-pedro"),
    ("Séguéla", "seguela"),
    ("Soubré", "soubre"),
    ("Yamoussoukro", "yamoussoukro"),
    ("Autre", "autre"),
]


def upgrade() -> None:
    op.bulk_insert(
        sa.table(
            "cities",
            sa.column("country_code", sa.String),
            sa.column("name", sa.String),
            sa.column("slug", sa.String),
        ),
        [{"country_code": "CI", "name": name, "slug": slug} for name, slug in IVORY_COAST_CITIES],
    )


def downgrade() -> None:
    op.execute("DELETE FROM cities WHERE country_code = 'CI'")

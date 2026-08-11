"""add cities table, country_code and city_id

Revision ID: 022
Revises: 021
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision = '022'
down_revision = '021'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Villes du Sénégal servant de jeu initial. La liste est volontairement courte :
# une trentaine d'entrées bien choisies reste utilisable dans un menu déroulant,
# là où un import complet de type GeoNames noierait l'utilisateur sous des
# hameaux que personne ne cherche. Elle s'étend par simple insertion.
SENEGAL_CITIES = [
    ("Dakar", "dakar"),
    ("Pikine", "pikine"),
    ("Guédiawaye", "guediawaye"),
    ("Rufisque", "rufisque"),
    ("Keur Massar", "keur-massar"),
    ("Thiès", "thies"),
    ("Mbour", "mbour"),
    ("Tivaouane", "tivaouane"),
    ("Saint-Louis", "saint-louis"),
    ("Richard-Toll", "richard-toll"),
    ("Louga", "louga"),
    ("Kaolack", "kaolack"),
    ("Fatick", "fatick"),
    ("Kaffrine", "kaffrine"),
    ("Diourbel", "diourbel"),
    ("Touba", "touba"),
    ("Ziguinchor", "ziguinchor"),
    ("Kolda", "kolda"),
    ("Sédhiou", "sedhiou"),
    ("Tambacounda", "tambacounda"),
    ("Kédougou", "kedougou"),
    ("Matam", "matam"),
    # Repli pour ne bloquer personne dont la ville manque. Si cette entrée
    # devient fréquente, c'est le signe qu'il faut étoffer la liste.
    ("Autre", "autre"),
]


def upgrade() -> None:
    op.create_table(
        "cities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("country_code", sa.String(2), nullable=False, index=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("slug", sa.String(120), nullable=False),
        sa.UniqueConstraint("country_code", "slug", name="uq_cities_country_slug"),
    )

    op.bulk_insert(
        sa.table(
            "cities",
            sa.column("country_code", sa.String),
            sa.column("name", sa.String),
            sa.column("slug", sa.String),
        ),
        [{"country_code": "SN", "name": name, "slug": slug} for name, slug in SENEGAL_CITIES],
    )

    op.add_column("users", sa.Column("country_code", sa.String(2), nullable=True))
    op.create_index("ix_users_country_code", "users", ["country_code"])
    # Les comptes existants sont sénégalais : le site n'a jamais servi ailleurs.
    op.execute("UPDATE users SET country_code = 'SN' WHERE country_code IS NULL")

    op.add_column("books", sa.Column("country_code", sa.String(2), nullable=True))
    op.create_index("ix_books_country_code", "books", ["country_code"])
    op.execute("UPDATE books SET country_code = 'SN' WHERE country_code IS NULL")

    op.add_column("books", sa.Column("city_id", sa.Integer(), nullable=True))
    op.create_index("ix_books_city_id", "books", ["city_id"])
    op.create_foreign_key("fk_books_city_id", "books", "cities", ["city_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_books_city_id", "books", type_="foreignkey")
    op.drop_index("ix_books_city_id", table_name="books")
    op.drop_column("books", "city_id")

    op.drop_index("ix_books_country_code", table_name="books")
    op.drop_column("books", "country_code")

    op.drop_index("ix_users_country_code", table_name="users")
    op.drop_column("users", "country_code")

    op.drop_table("cities")

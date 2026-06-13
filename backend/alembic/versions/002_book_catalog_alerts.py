"""book_catalog and book_alerts

Revision ID: 002
Revises: 001
Create Date: 2026-06-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "book_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False, index=True),
        sa.Column("author", sa.String(255), nullable=False),
        sa.Column("isbn", sa.String(20), nullable=True, index=True),
        sa.Column("publisher", sa.String(255), nullable=True),
        sa.Column("published_year", sa.String(10), nullable=True),
        sa.Column("cover_url", sa.String(500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("google_books_id", sa.String(50), unique=True, nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "book_alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("query", sa.String(255), nullable=False),
        sa.Column("notification_phone", sa.String(20), nullable=False),
        sa.Column("is_notified", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.execute("""
        INSERT INTO book_catalog (title, author, isbn, published_year, created_at) VALUES
        ('Mathématiques Terminale S', 'Collection Dimaths', NULL, '2020', NOW()),
        ('Physique-Chimie Terminale S', 'Collection Hecht', NULL, '2020', NOW()),
        ('Français Terminale', 'Lagarde et Michard', NULL, '2019', NOW()),
        ('Histoire-Géographie Terminale', 'Nathan', NULL, '2021', NOW()),
        ('Biologie Terminale S', 'Belin', NULL, '2020', NOW()),
        ('Mathématiques 3ème', 'Transmath', NULL, '2018', NOW()),
        ('Français 3ème', 'Fleurs d''encre', NULL, '2019', NOW()),
        ('Anglais Terminale', 'Globe', NULL, '2020', NOW()),
        ('Philosophie Terminale', 'Hatier', NULL, '2020', NOW()),
        ('Économie-Gestion Terminale', 'Nathan Technique', NULL, '2019', NOW())
    """)


def downgrade() -> None:
    op.drop_table("book_alerts")
    op.drop_table("book_catalog")

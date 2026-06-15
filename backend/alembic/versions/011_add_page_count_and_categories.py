"""Add page_count to books and enrich categories

Revision ID: 011
Revises: 010
Create Date: 2026-06-15
"""
from alembic import op
import sqlalchemy as sa

revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None

NEW_CATEGORIES = [
    ("Développement personnel", "developpement-personnel"),
    ("Religion & Spiritualité", "religion-spiritualite"),
    ("Philosophie", "philosophie"),
    ("Économie & Business", "economie-business"),
    ("Droit", "droit"),
    ("Médecine & Santé", "medecine-sante"),
    ("Informatique", "informatique"),
    ("Littérature africaine", "litterature-africaine"),
    ("Jeunesse", "jeunesse"),
    ("Poésie", "poesie"),
    ("BD & Comics", "bd-comics"),
    ("Langues & Dictionnaires", "langues-dictionnaires"),
]


def upgrade():
    op.add_column('books', sa.Column('page_count', sa.Integer(), nullable=True))

    conn = op.get_bind()
    for name, slug in NEW_CATEGORIES:
        exists = conn.execute(
            sa.text("SELECT id FROM categories WHERE slug = :slug"),
            {"slug": slug}
        ).fetchone()
        if not exists:
            conn.execute(
                sa.text("INSERT INTO categories (name, slug) VALUES (:name, :slug)"),
                {"name": name, "slug": slug}
            )


def downgrade():
    op.drop_column('books', 'page_count')

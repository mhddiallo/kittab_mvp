"""Indexe l'ISBN des annonces.

L'ISBN est désormais réellement stocké à la publication (il était scanné puis
perdu). Il devient la clé de rattachement d'une annonce à une couverture de
référence, donc une colonne de jointure : sans index, chaque affichage du
catalogue déclencherait un parcours complet de la table.

Revision ID: 024
Revises: 023
"""
from alembic import op

revision = '024'
down_revision = '023'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index('ix_books_isbn', 'books', ['isbn'])


def downgrade():
    op.drop_index('ix_books_isbn', table_name='books')

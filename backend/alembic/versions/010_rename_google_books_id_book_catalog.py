"""rename google_books_id to open_library_id in book_catalog

Revision ID: 010
Revises: 009
Create Date: 2026-06-15
"""
from alembic import op

revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('book_catalog', 'google_books_id', new_column_name='open_library_id')


def downgrade():
    op.alter_column('book_catalog', 'open_library_id', new_column_name='google_books_id')

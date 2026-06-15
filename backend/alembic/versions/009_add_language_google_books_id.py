"""add language and google_books_id to books

Revision ID: 009
Revises: 008
Create Date: 2026-06-15
"""
from alembic import op
import sqlalchemy as sa

revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('books', sa.Column('language', sa.String(50), nullable=True))
    op.add_column('books', sa.Column('google_books_id', sa.String(100), nullable=True))


def downgrade():
    op.drop_column('books', 'google_books_id')
    op.drop_column('books', 'language')

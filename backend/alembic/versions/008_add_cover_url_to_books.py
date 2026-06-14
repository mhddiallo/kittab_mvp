"""add cover_url to books

Revision ID: 008
Revises: 007
Create Date: 2026-06-14
"""
from alembic import op
import sqlalchemy as sa

revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('books', sa.Column('cover_url', sa.String(500), nullable=True))


def downgrade():
    op.drop_column('books', 'cover_url')

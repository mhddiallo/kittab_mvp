"""add is_sold to books

Revision ID: 015
Revises: 014
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('books', sa.Column('is_sold', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    op.drop_column('books', 'is_sold')

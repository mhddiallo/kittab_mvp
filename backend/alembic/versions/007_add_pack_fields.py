"""add pack fields to books

Revision ID: 007
Revises: 006
Create Date: 2026-06-14
"""
from alembic import op
import sqlalchemy as sa

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('books', sa.Column('is_pack', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('books', sa.Column('pack_items', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('books', 'pack_items')
    op.drop_column('books', 'is_pack')

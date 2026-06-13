"""add is_admin to users, is_boosted to books

Revision ID: 004
Revises: 003
Create Date: 2026-06-13
"""
from alembic import op
import sqlalchemy as sa

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('books', sa.Column('is_boosted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('books', sa.Column('boost_expires_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('users', 'is_admin')
    op.drop_column('books', 'is_boosted')
    op.drop_column('books', 'boost_expires_at')

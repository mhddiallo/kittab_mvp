"""add views column to books

Revision ID: 003
Revises: 002
Create Date: 2026-06-13
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('books', sa.Column('views', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    op.drop_column('books', 'views')

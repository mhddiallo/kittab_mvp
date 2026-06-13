"""add accepts_exchange to books

Revision ID: 006
Revises: 005
Create Date: 2026-06-13
"""
from alembic import op
import sqlalchemy as sa

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('books', sa.Column('accepts_exchange', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    op.drop_column('books', 'accepts_exchange')

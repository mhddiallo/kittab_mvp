"""add location fields to books

Revision ID: 013
Revises: 012
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('books', sa.Column('location_label', sa.String(255), nullable=True))
    op.add_column('books', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('books', sa.Column('longitude', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('books', 'longitude')
    op.drop_column('books', 'latitude')
    op.drop_column('books', 'location_label')

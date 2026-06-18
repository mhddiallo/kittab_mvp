"""add image_url to messages

Revision ID: 019
Revises: 018
Create Date: 2026-06-18
"""
from alembic import op
import sqlalchemy as sa

revision = '019'
down_revision = '018'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('messages', sa.Column('image_url', sa.String(), nullable=True))


def downgrade():
    op.drop_column('messages', 'image_url')

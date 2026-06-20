"""add accepts_whatsapp_contact to books

Revision ID: 021
Revises: 020
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = '021'
down_revision = '020'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('books', sa.Column('accepts_whatsapp_contact', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    op.drop_column('books', 'accepts_whatsapp_contact')

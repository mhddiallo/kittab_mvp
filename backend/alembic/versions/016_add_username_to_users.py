"""add username to users

Revision ID: 016
Revises: 015
Create Date: 2026-06-17
"""
from alembic import op
import sqlalchemy as sa

revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('username', sa.String(60), nullable=True))
    op.create_index('ix_users_username', 'users', ['username'], unique=True)


def downgrade():
    op.drop_index('ix_users_username', table_name='users')
    op.drop_column('users', 'username')

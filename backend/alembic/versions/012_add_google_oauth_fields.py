"""add google oauth fields to users

Revision ID: 012
Revises: 011
Create Date: 2026-06-15
"""
from alembic import op
import sqlalchemy as sa

revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('email', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('google_id', sa.String(100), nullable=True))
    op.alter_column('users', 'phone', type_=sa.String(100))
    op.create_unique_constraint('uq_users_email', 'users', ['email'])
    op.create_unique_constraint('uq_users_google_id', 'users', ['google_id'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_google_id', 'users', ['google_id'])


def downgrade():
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_constraint('uq_users_google_id', 'users', type_='unique')
    op.drop_constraint('uq_users_email', 'users', type_='unique')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'email')

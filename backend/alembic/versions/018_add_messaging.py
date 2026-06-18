"""add messaging tables

Revision ID: 018
Revises: 017
Create Date: 2026-06-18
"""
from alembic import op
import sqlalchemy as sa

revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('book_id', sa.Integer(), sa.ForeignKey('books.id', ondelete='SET NULL'), nullable=True),
        sa.Column('wanted_book_id', sa.Integer(), sa.ForeignKey('wanted_books.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'conversation_participants',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
    )

    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('read_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('messages')
    op.drop_table('conversation_participants')
    op.drop_table('conversations')

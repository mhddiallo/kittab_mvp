"""add email and author to book_alerts

Revision ID: 020
Revises: 019
Create Date: 2026-06-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "020"
down_revision: Union[str, None] = "019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("book_alerts", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("book_alerts", sa.Column("author", sa.String(255), nullable=True))
    # Rendre notification_phone nullable (email peut suffire désormais)
    op.alter_column("book_alerts", "notification_phone", nullable=True)


def downgrade() -> None:
    op.drop_column("book_alerts", "email")
    op.drop_column("book_alerts", "author")
    op.alter_column("book_alerts", "notification_phone", nullable=False)

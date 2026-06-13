"""init

Revision ID: 001
Revises:
Create Date: 2026-06-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("phone", sa.String(20), unique=True, index=True, nullable=False),
        sa.Column("first_name", sa.String(100), nullable=True),
        sa.Column("last_name", sa.String(100), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("is_profile_complete", sa.Boolean(), default=False, nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "otp_codes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("phone", sa.String(20), index=True, nullable=False),
        sa.Column("code", sa.String(6), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("is_used", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
    )

    op.create_table(
        "books",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("title", sa.String(255), nullable=False, index=True),
        sa.Column("author", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("isbn", sa.String(20), nullable=True),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("condition", sa.String(20), nullable=False),
        sa.Column("book_type", sa.String(20), nullable=False),
        sa.Column("education_level", sa.String(100), nullable=True),
        sa.Column("subject", sa.String(100), nullable=True),
        sa.Column("is_available", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("seller_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=True),
    )

    op.create_table(
        "book_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("book_id", sa.Integer(), sa.ForeignKey("books.id"), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("is_primary", sa.Boolean(), default=False, nullable=False),
    )

    op.execute("""
        INSERT INTO categories (name, slug) VALUES
        ('Manuels scolaires', 'manuels-scolaires'),
        ('Romans', 'romans'),
        ('Autobiographies', 'autobiographies'),
        ('Sciences', 'sciences'),
        ('Histoire', 'histoire'),
        ('Autres', 'autres')
    """)


def downgrade() -> None:
    op.drop_table("book_images")
    op.drop_table("books")
    op.drop_table("categories")
    op.drop_table("otp_codes")
    op.drop_table("users")

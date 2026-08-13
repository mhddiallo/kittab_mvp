"""Crée le référentiel des couvertures.

Une annonce va et vient ; la couverture d'une édition, non. En les séparant,
une couverture ajoutée aujourd'hui profite immédiatement à toutes les annonces
concernées, passées et futures, sans reprise de données.

isbn13 est volontairement facultatif : une grande partie du corpus visé —
manuels scolaires sénégalais, éditions africaines locales — n'a pas d'ISBN, et
l'exiger ferait caler l'amorce sur son cas principal.

Revision ID: 025
Revises: 024
"""
import sqlalchemy as sa
from alembic import op

revision = '025'
down_revision = '024'
branch_labels = None
depends_on = None

COVER_SOURCE = sa.Enum(
    'PUBLISHER', 'MANUAL', 'GOOGLE', 'OPENLIBRARY', 'SELLER',
    name='coversource',
)


def upgrade():
    COVER_SOURCE.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'book_covers',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('isbn13', sa.String(length=13), nullable=True),
        sa.Column('work_key', sa.String(length=300), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('author', sa.String(length=300), nullable=True),
        sa.Column('publisher', sa.String(length=200), nullable=True),
        sa.Column('edition_hint', sa.String(length=200), nullable=True),
        sa.Column('education_level', sa.String(length=40), nullable=True),
        sa.Column('subject', sa.String(length=60), nullable=True),
        sa.Column('country_code', sa.String(length=2), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('source', COVER_SOURCE, nullable=False),
        sa.Column('source_ref', sa.String(length=500), nullable=False),
        sa.Column('picks_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('source', 'source_ref', name='uq_book_covers_source_ref'),
    )

    op.create_index('ix_book_covers_isbn13', 'book_covers', ['isbn13'])
    op.create_index('ix_book_covers_work_key', 'book_covers', ['work_key'])
    op.create_index('ix_book_covers_education_level', 'book_covers', ['education_level'])
    op.create_index('ix_book_covers_subject', 'book_covers', ['subject'])
    op.create_index('ix_book_covers_country_code', 'book_covers', ['country_code'])


def downgrade():
    op.drop_index('ix_book_covers_country_code', table_name='book_covers')
    op.drop_index('ix_book_covers_subject', table_name='book_covers')
    op.drop_index('ix_book_covers_education_level', table_name='book_covers')
    op.drop_index('ix_book_covers_work_key', table_name='book_covers')
    op.drop_index('ix_book_covers_isbn13', table_name='book_covers')
    op.drop_table('book_covers')
    COVER_SOURCE.drop(op.get_bind(), checkfirst=True)

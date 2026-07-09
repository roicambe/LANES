"""Add birthdate to profile

Revision ID: dba4fa131eeb
Revises: ae212a5d1790
Create Date: 2026-07-10 00:24:41.443533

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dba4fa131eeb'
down_revision: Union[str, Sequence[str], None] = 'ae212a5d1790'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add birthdate column to profiles table."""
    op.add_column('profiles', sa.Column('birthdate', sa.Date(), nullable=True))


def downgrade() -> None:
    """Remove birthdate column from profiles table."""
    op.drop_column('profiles', 'birthdate')

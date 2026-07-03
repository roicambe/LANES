"""modify_flood_reports_geometry_to_generic

Revision ID: 449b80c7e066
Revises: 0cff9d1ff136
Create Date: 2026-07-03 20:09:52.946999

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '449b80c7e066'
down_revision: Union[str, Sequence[str], None] = '0cff9d1ff136'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE flood_reports ALTER COLUMN geometry TYPE geometry(Geometry, 4326)")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE flood_reports ALTER COLUMN geometry TYPE geometry(Point, 4326)")

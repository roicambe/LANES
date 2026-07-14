"""Fix severity check constraint

Revision ID: 577203e96d7b
Revises: 2abb5c5c48d2
Create Date: 2026-07-15 01:30:18.827826

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '577203e96d7b'
down_revision: Union[str, Sequence[str], None] = '2abb5c5c48d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE flood_reports DROP CONSTRAINT IF EXISTS ck_flood_reports_chk_flood_reports_severity")
    op.execute("ALTER TABLE flood_reports ADD CONSTRAINT ck_flood_reports_chk_flood_reports_severity CHECK (severity::text = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'extreme'::text]))")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE flood_reports DROP CONSTRAINT IF EXISTS ck_flood_reports_chk_flood_reports_severity")
    op.execute("ALTER TABLE flood_reports ADD CONSTRAINT ck_flood_reports_chk_flood_reports_severity CHECK (severity::text = ANY (ARRAY['low'::text, 'medium'::text, 'extreme'::text]))")

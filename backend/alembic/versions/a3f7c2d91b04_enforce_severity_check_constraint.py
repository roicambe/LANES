"""enforce_severity_check_constraint

Revision ID: a3f7c2d91b04
Revises: 449b80c7e066
Create Date: 2026-07-04 20:28:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a3f7c2d91b04'
down_revision: Union[str, Sequence[str], None] = '449b80c7e066'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Enforce the severity domain on flood_reports.

    Step 1: Migrate any legacy 'high' rows to 'extreme' so existing data
            satisfies the new constraint before it is added.
    Step 2: Add the CHECK constraint that restricts severity to the three
            values recognised by the application: 'low', 'medium', 'extreme'.
    """
    # Data fix: remap obsolete 'high' value (used in early seed data) to 'extreme'
    op.execute(
        "UPDATE flood_reports SET severity = 'extreme' WHERE severity = 'high'"
    )

    # Add CHECK constraint — second line of defence after Pydantic validation
    op.create_check_constraint(
        constraint_name="chk_flood_reports_severity",
        table_name="flood_reports",
        condition="severity IN ('low', 'medium', 'extreme')",
    )


def downgrade() -> None:
    """
    Remove the severity CHECK constraint.

    Note: the 'high' → 'extreme' data migration is intentionally NOT reversed
    because 'high' is no longer a valid application value.
    """
    op.drop_constraint(
        constraint_name="chk_flood_reports_severity",
        table_name="flood_reports",
        type_="check",
    )

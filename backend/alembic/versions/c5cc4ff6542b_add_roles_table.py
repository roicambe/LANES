"""add_roles_table

Revision ID: c5cc4ff6542b
Revises: a3f7c2d91b04
Create Date: 2026-07-04 22:35:51.060933

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5cc4ff6542b'
down_revision: Union[str, Sequence[str], None] = 'a3f7c2d91b04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    import json
    from datetime import datetime

    # 1. Create roles table
    roles_table = op.create_table('roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('permissions', sa.JSON(), nullable=False),
        sa.Column('is_template', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_roles')),
        sa.UniqueConstraint('name', name=op.f('uq_roles_name'))
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=False)

    # 2. Insert default roles
    now = datetime.utcnow()
    op.bulk_insert(roles_table, [
        {
            "id": 1, 
            "name": "Super Admin", 
            "permissions": {"reports": "full", "zones": "full", "users": "full", "roles": "full", "audit": "view", "data": "full", "settings": "full"},
            "is_template": True,
            "created_at": now
        },
        {
            "id": 2, 
            "name": "DRRM Officer", 
            "permissions": {"reports": "full", "zones": "full", "users": "none", "roles": "none", "audit": "view", "data": "none", "settings": "none"},
            "is_template": True,
            "created_at": now
        },
        {
            "id": 3, 
            "name": "Moderator", 
            "permissions": {"reports": "full", "zones": "none", "users": "none", "roles": "none", "audit": "none", "data": "none", "settings": "none"},
            "is_template": True,
            "created_at": now
        },
        {
            "id": 4, 
            "name": "Commuter", 
            "permissions": {},
            "is_template": True,
            "created_at": now
        }
    ])

    # 3. Add role_id column to users
    op.add_column('users', sa.Column('role_id', sa.Integer(), nullable=True))
    
    # 4. Map data
    op.execute("UPDATE users SET role_id = 1 WHERE role = 'admin'")
    op.execute("UPDATE users SET role_id = 4 WHERE role = 'commuter' OR role_id IS NULL")

    # 5. Make role_id non-nullable, add FK, drop old column
    op.alter_column('users', 'role_id', nullable=False)
    op.create_foreign_key(op.f('fk_users_role_id_roles'), 'users', 'roles', ['role_id'], ['id'])
    op.create_index(op.f('ix_users_role_id'), 'users', ['role_id'], unique=False)
    op.drop_column('users', 'role')


def downgrade() -> None:
    """Downgrade schema."""
    # Re-add role column
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=True))
    
    # Map back based on role_id
    op.execute("UPDATE users SET role = 'admin' WHERE role_id = 1")
    op.execute("UPDATE users SET role = 'commuter' WHERE role_id != 1")

    # Make role non-nullable, drop role_id
    op.alter_column('users', 'role', nullable=False)
    op.drop_constraint(op.f('fk_users_role_id_roles'), 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_role_id'), table_name='users')
    op.drop_column('users', 'role_id')

    # Drop roles table
    op.drop_index(op.f('ix_roles_name'), table_name='roles')
    op.drop_index(op.f('ix_roles_id'), table_name='roles')
    op.drop_table('roles')

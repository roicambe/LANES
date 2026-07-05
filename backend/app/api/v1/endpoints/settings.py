from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.crud.settings import get_all_settings, update_settings
from app.schemas.setting import SystemSettingsUpdate
from app.crud.audit import create_audit_log

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
def read_settings(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_user)
):
    """Retrieve all system settings."""
    if current_admin.role.permissions.get("settings") not in ["full", "view"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view system settings")
    return get_all_settings(db)

@router.put("", response_model=Dict[str, Any])
def write_settings(
    update_data: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_user)
):
    """Update system settings in bulk."""
    if current_admin.role.permissions.get("settings") != "full":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit system settings")
    
    updated_settings = update_settings(db, update_data.settings, admin_id=current_admin.id)
    
    create_audit_log(
        db=db,
        admin_id=current_admin.id,
        action_type="UPDATE_SETTINGS",
        target_table="system_settings",
        metadata_json={"updates": update_data.settings}
    )
    
    return updated_settings

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class AuditLogBase(BaseModel):
    action_type: str
    target_table: str
    target_id: Optional[int] = None
    metadata_json: Optional[Any] = None
    ip_address: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    admin_id: Optional[int] = None


class AuditLogResponse(AuditLogBase):
    id: int
    admin_id: Optional[int]
    created_at: datetime
    admin: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogsPaginatedResponse(BaseModel):
    logs: list[AuditLogResponse]
    total: int

from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict


class RoleBase(BaseModel):
    name: str
    permissions: Dict[str, Any] = {}


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None


class RoleResponse(RoleBase):
    id: int
    is_template: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

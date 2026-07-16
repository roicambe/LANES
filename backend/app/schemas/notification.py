from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict, field_serializer

from app.models.notification import NotificationType

class NotificationBase(BaseModel):
    type: NotificationType
    message: str
    payload: Dict[str, Any] = {}

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer('created_at')
    def serialize_datetime(self, dt: datetime, _info):
        if dt.tzinfo is None:
            return dt.isoformat() + "Z"
        return dt.isoformat()

class NotificationPaginatedResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    unread_count: int
    has_more: bool

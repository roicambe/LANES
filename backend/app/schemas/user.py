from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    username: str
    email: str
    role: str = "commuter"


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UsersPaginatedResponse(BaseModel):
    users: list[UserResponse]
    total: int


class UserStatusUpdateRequest(BaseModel):
    is_active: bool

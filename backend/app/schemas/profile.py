from datetime import datetime, date
from pydantic import BaseModel, ConfigDict
from typing import Optional


class ProfileBase(BaseModel):
    first_name: str
    last_name: str
    middle_initial: Optional[str] = None
    suffix: Optional[str] = None
    contact_number: Optional[str] = None
    birthdate: Optional[date] = None
    avatar_url: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_initial: Optional[str] = None
    suffix: Optional[str] = None
    contact_number: Optional[str] = None
    birthdate: Optional[date] = None
    avatar_url: Optional[str] = None


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

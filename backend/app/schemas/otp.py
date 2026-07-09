from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class OTPVerificationBase(BaseModel):
    email: str


class OTPVerificationCreate(OTPVerificationBase):
    otp_code: str
    expires_at: datetime


class OTPVerificationResponse(OTPVerificationBase):
    id: int
    expires_at: datetime
    attempts: int
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict
from typing import Optional


class AddressBase(BaseModel):
    house_number: Optional[str] = None
    street: Optional[str] = None
    barangay: str
    city_municipality: str
    province: str
    postal_code: Optional[str] = None
    country: str = "Philippines"


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    house_number: Optional[str] = None
    street: Optional[str] = None
    barangay: Optional[str] = None
    city_municipality: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None


class AddressResponse(AddressBase):
    id: int
    profile_id: int

    model_config = ConfigDict(from_attributes=True)

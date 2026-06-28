from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, field_validator
from geoalchemy2.elements import WKBElement

from app.schemas.common import PointGeometry, PolygonGeometry, parse_ewkb_point, parse_ewkb_polygon


class FloodReportBase(BaseModel):
    raw_text: str
    source: str
    severity: str = "medium"  # 'low', 'medium', 'high'


class FloodReportCreate(FloodReportBase):
    geometry: Optional[PointGeometry] = None


class FloodReportResponse(FloodReportBase):
    id: int
    extracted_locations: Optional[Any] = None
    status: str
    geometry: Optional[PointGeometry] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("geometry", mode="before")
    @classmethod
    def convert_geometry(cls, v: Any) -> Optional[PointGeometry]:
        if isinstance(v, WKBElement):
            try:
                # Use raw bytes data from descriptor or data field
                data = bytes.fromhex(v.desc) if isinstance(v.desc, str) else bytes(v.data)
                coords = parse_ewkb_point(data)
                return PointGeometry(type="Point", coordinates=coords)
            except Exception as e:
                # Log parser error and return None
                print(f"Warning: Failed parsing Point EWKB: {e}")
                return None
        return v


class FloodAvoidanceZoneBase(BaseModel):
    is_active: bool = True
    expires_at: Optional[datetime] = None


class FloodAvoidanceZoneCreate(FloodAvoidanceZoneBase):
    report_id: int
    geometry: PolygonGeometry


class FloodAvoidanceZoneResponse(FloodAvoidanceZoneBase):
    id: int
    report_id: int
    geometry: PolygonGeometry
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("geometry", mode="before")
    @classmethod
    def convert_geometry(cls, v: Any) -> Optional[PolygonGeometry]:
        if isinstance(v, WKBElement):
            try:
                data = bytes.fromhex(v.desc) if isinstance(v.desc, str) else bytes(v.data)
                coords = parse_ewkb_polygon(data)
                return PolygonGeometry(type="Polygon", coordinates=coords)
            except Exception as e:
                print(f"Warning: Failed parsing Polygon EWKB: {e}")
                return None
        return v

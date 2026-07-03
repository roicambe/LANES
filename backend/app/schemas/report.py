from datetime import datetime
import struct
from typing import Any, Optional, Union
from pydantic import BaseModel, ConfigDict, field_validator
from geoalchemy2.elements import WKBElement

from app.schemas.common import (
    PointGeometry,
    LineStringGeometry,
    PolygonGeometry,
    parse_ewkb_point,
    parse_ewkb_linestring,
    parse_ewkb_polygon,
)


class FloodReportBase(BaseModel):
    raw_text: str
    source: str
    severity: str = "medium"  # 'low', 'medium', 'high', 'extreme'


class FloodReportCreate(FloodReportBase):
    geometry: Optional[Union[PointGeometry, LineStringGeometry]] = None


class FloodReportResponse(FloodReportBase):
    id: int
    extracted_locations: Optional[Any] = None
    status: str
    geometry: Optional[Union[PointGeometry, LineStringGeometry]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("geometry", mode="before")
    @classmethod
    def convert_geometry(cls, v: Any) -> Optional[Union[PointGeometry, LineStringGeometry]]:
        if isinstance(v, WKBElement):
            try:
                # Use raw bytes data from descriptor or data field
                data = bytes.fromhex(v.desc) if isinstance(v.desc, str) else bytes(v.data)
                byte_order = '<' if data[0] == 1 else '>'
                geom_type = struct.unpack(f"{byte_order}I", data[1:5])[0]
                pure_geom_type = geom_type & 0x0fffffff
                
                if pure_geom_type == 1:  # Point
                    coords = parse_ewkb_point(data)
                    return PointGeometry(type="Point", coordinates=coords)
                elif pure_geom_type == 2:  # LineString
                    coords = parse_ewkb_linestring(data)
                    return LineStringGeometry(type="LineString", coordinates=coords)
            except Exception as e:
                # Log parser error and return None
                print(f"Warning: Failed parsing EWKB in validator: {e}")
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
    severity: str
    report_geometry: Optional[Union[PointGeometry, LineStringGeometry]] = None
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

    @field_validator("report_geometry", mode="before")
    @classmethod
    def convert_report_geometry(cls, v: Any) -> Optional[Union[PointGeometry, LineStringGeometry]]:
        if isinstance(v, WKBElement):
            try:
                data = bytes.fromhex(v.desc) if isinstance(v.desc, str) else bytes(v.data)
                byte_order = '<' if data[0] == 1 else '>'
                geom_type = struct.unpack(f"{byte_order}I", data[1:5])[0]
                pure_geom_type = geom_type & 0x0fffffff
                
                if pure_geom_type == 1:  # Point
                    coords = parse_ewkb_point(data)
                    return PointGeometry(type="Point", coordinates=coords)
                elif pure_geom_type == 2:  # LineString
                    coords = parse_ewkb_linestring(data)
                    return LineStringGeometry(type="LineString", coordinates=coords)
            except Exception as e:
                print(f"Warning: Failed parsing report_geometry EWKB: {e}")
                return None
        return v


class FloodReportsPaginatedResponse(BaseModel):
    reports: list[FloodReportResponse]
    total: int


class AdminDashboardStats(BaseModel):
    total_pending_reports: int
    total_active_zones: int
    total_approved_today: int
    total_rejected_today: int
    total_users: int
    database_status: str


class FloodAvoidanceZonesPaginatedResponse(BaseModel):
    zones: list[FloodAvoidanceZoneResponse]
    total: int


class AvoidanceZoneDeactivateBulkRequest(BaseModel):
    zone_ids: list[int]

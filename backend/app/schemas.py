import struct
from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from geoalchemy2.elements import WKBElement


# ==========================================
# 1. EWKB Binary Geometry Parsers
# ==========================================

def parse_ewkb_point(data: bytes) -> List[float]:
    """
    Parses a PostGIS EWKB (Extended Well-Known Binary) Point into [longitude, latitude].
    """
    byte_order = '<' if data[0] == 1 else '>'
    geom_type = struct.unpack(f"{byte_order}I", data[1:5])[0]
    
    offset = 5
    # If EWKB has SRID flag (0x20000000)
    if geom_type & 0x20000000:
        offset += 4
        
    # Read X and Y (8 bytes each, double precision float)
    x, y = struct.unpack(f"{byte_order}dd", data[offset:offset+16])
    return [x, y]


def parse_ewkb_polygon(data: bytes) -> List[List[List[float]]]:
    """
    Parses a PostGIS EWKB (Extended Well-Known Binary) Polygon into a list of coordinate rings.
    """
    byte_order = '<' if data[0] == 1 else '>'
    geom_type = struct.unpack(f"{byte_order}I", data[1:5])[0]
    
    offset = 5
    # If EWKB has SRID flag (0x20000000)
    if geom_type & 0x20000000:
        offset += 4
        
    num_rings = struct.unpack(f"{byte_order}I", data[offset:offset+4])[0]
    offset += 4
    
    rings = []
    for _ in range(num_rings):
        num_points = struct.unpack(f"{byte_order}I", data[offset:offset+4])[0]
        offset += 4
        points = []
        for _ in range(num_points):
            x, y = struct.unpack(f"{byte_order}dd", data[offset:offset+16])
            offset += 16
            points.append([x, y])
        rings.append(points)
    return rings


# ==========================================
# 2. GeoJSON Pydantic Helper Schemas
# ==========================================

class PointGeometry(BaseModel):
    """
    GeoJSON Point geometry.
    """
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]


class PolygonGeometry(BaseModel):
    """
    GeoJSON Polygon geometry.
    """
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # Rings -> Points -> [longitude, latitude]


# ==========================================
# 3. User Schemas
# ==========================================

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


# ==========================================
# 4. FloodReport Schemas
# ==========================================

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


# ==========================================
# 5. FloodAvoidanceZone Schemas
# ==========================================

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


# ==========================================
# 6. Route Schemas
# ==========================================

class LineStringGeometry(BaseModel):
    """
    GeoJSON LineString geometry.
    """
    type: str = "LineString"
    coordinates: List[List[float]]  # List of [longitude, latitude] points


class RouteRequest(BaseModel):
    """
    Request start and end coordinates for routing.
    Coordinates format: [longitude, latitude]
    """
    start: List[float] = Field(..., min_items=2, max_items=2, description="Start coordinates [lng, lat]")
    end: List[float] = Field(..., min_items=2, max_items=2, description="End coordinates [lng, lat]")


class RouteResponse(BaseModel):
    """
    Response schema returning route path, distance, duration, and metadata.
    """
    geometry: LineStringGeometry
    distance: float  # In meters
    duration: float  # In seconds
    avoided_floods: bool  # True if the path had to divert around active flood zones


from datetime import datetime
from typing import Optional, Union, Any
from pydantic import BaseModel, ConfigDict, field_validator
import struct
from geoalchemy2.elements import WKBElement

from app.schemas.common import PointGeometry, LineStringGeometry, parse_ewkb_point, parse_ewkb_linestring
from app.schemas.report import FloodReportBase

class FeedPostResponse(FloodReportBase):
    id: int
    status: str
    geometry: Optional[Union[PointGeometry, LineStringGeometry]] = None
    image_url: Optional[str] = None
    created_at: datetime
    
    # New feed-specific fields
    upvotes: int = 0
    downvotes: int = 0
    distance_meters: Optional[float] = None
    user_interaction: Optional[str] = None  # "upvote", "downvote", or None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("geometry", mode="before")
    @classmethod
    def convert_geometry(cls, v: Any) -> Optional[Union[PointGeometry, LineStringGeometry]]:
        if isinstance(v, WKBElement):
            try:
                data = bytes.fromhex(v.desc) if isinstance(v.desc, str) else bytes(v.data)
                byte_order = '<' if data[0] == 1 else '>'
                geom_type = struct.unpack(f"{byte_order}I", data[1:5])[0]
                pure_geom_type = geom_type & 0x0fffffff
                
                if pure_geom_type == 1:
                    coords = parse_ewkb_point(data)
                    return PointGeometry(type="Point", coordinates=coords)
                elif pure_geom_type == 2:
                    coords = parse_ewkb_linestring(data)
                    return LineStringGeometry(type="LineString", coordinates=coords)
            except Exception as e:
                return None
        return v


class FeedPaginatedResponse(BaseModel):
    posts: list[FeedPostResponse]
    total: int
    has_more: bool

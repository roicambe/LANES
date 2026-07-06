from typing import List
from pydantic import BaseModel, Field


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
    ignore_floods: bool = Field(False, description="Bypass flood avoidance checks and return the raw shortest path")


class RouteResponse(BaseModel):
    """
    Response schema returning route path, distance, duration, and metadata.
    """
    geometry: LineStringGeometry
    distance: float  # In meters
    duration: float  # In seconds
    avoided_floods: bool  # True if the path had to divert around active flood zones
    blocked: bool = False  # True if no safe route could be found

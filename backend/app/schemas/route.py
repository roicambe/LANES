from typing import List
from pydantic import BaseModel, Field


class LineStringGeometry(BaseModel):
    """GeoJSON LineString geometry."""
    type: str = "LineString"
    coordinates: List[List[float]]  # List of [longitude, latitude] points


class RouteRequest(BaseModel):
    """Request start and end coordinates for routing.
    Coordinates format: [longitude, latitude]
    """
    start: List[float] = Field(..., min_length=2, max_length=2, description="Start coordinates [lng, lat]")
    end: List[float] = Field(..., min_length=2, max_length=2, description="End coordinates [lng, lat]")
    ignore_floods: bool = Field(False, description="Bypass flood avoidance checks and return the raw shortest path")


class RouteOption(BaseModel):
    """A single route candidate returned as part of a multi-route response.

    Attributes:
        index: Position in the OSRM candidate list (0 = primary).
        label: Human-readable label e.g. 'Recommended', 'Alternative 1'.
        geometry: GeoJSON LineString of the route path.
        distance: Total route distance in meters.
        duration: Estimated travel duration in seconds.
        avoided_floods: True if this route successfully diverted around an active flood zone.
        blocked: True if this specific route passes through an active flood zone.
        is_truncated: True if the route appears spatially incomplete due to one-way road constraints.
                      See docs/planning.md section Routing Known Constraints for context.
    """
    index: int
    label: str
    geometry: LineStringGeometry
    distance: float
    duration: float
    avoided_floods: bool
    blocked: bool = False
    is_truncated: bool = False


class MultiRouteResponse(BaseModel):
    """Response containing all available route candidates with flood safety metadata.

    Attributes:
        routes: List of route options ordered by OSRM priority (index 0 = primary).
        recommended_index: Index of the safest route (first flood-free option, or 0 as fallback).
    """
    routes: List[RouteOption]
    recommended_index: int


# Legacy schema retained for backward compatibility
class RouteResponse(BaseModel):
    """Legacy single-route response schema."""
    geometry: LineStringGeometry
    distance: float
    duration: float
    avoided_floods: bool
    blocked: bool = False

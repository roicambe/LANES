# Schemas index
from app.schemas.user import UserBase, UserCreate, UserResponse
from app.schemas.report import (
    FloodReportBase, FloodReportCreate, FloodReportResponse,
    FloodAvoidanceZoneBase, FloodAvoidanceZoneCreate, FloodAvoidanceZoneResponse
)
from app.schemas.route import RouteRequest, RouteResponse, LineStringGeometry
from app.schemas.common import PointGeometry, PolygonGeometry
from app.schemas.auth import Token, TokenPayload

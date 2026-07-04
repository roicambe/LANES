# Schemas index
from app.schemas.user import UserBase, UserCreate, UserResponse, UsersPaginatedResponse, UserStatusUpdateRequest
from app.schemas.report import (
    FloodReportBase, FloodReportCreate, FloodReportResponse,
    FloodAvoidanceZoneBase, FloodAvoidanceZoneCreate, FloodAvoidanceZoneResponse,
    FloodReportsPaginatedResponse, AdminDashboardStats,
    FloodAvoidanceZonesPaginatedResponse, AvoidanceZoneDeactivateBulkRequest
)
from app.schemas.route import RouteRequest, RouteResponse, LineStringGeometry
from app.schemas.common import PointGeometry, PolygonGeometry
from app.schemas.auth import Token, TokenPayload
from app.schemas.audit import AuditLogCreate, AuditLogResponse, AuditLogsPaginatedResponse
from app.schemas.role import RoleBase, RoleCreate, RoleUpdate, RoleResponse

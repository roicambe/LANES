from fastapi import APIRouter
from app.api.v1.endpoints import users, reports, auth, admin, roles, data, settings, websocket

api_router = APIRouter()

# Group endpoints by domain with appropriate URL prefixes and tags
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(roles.router, prefix="/admin/roles", tags=["admin roles"])
api_router.include_router(data.router, prefix="/admin/data", tags=["admin data"])
api_router.include_router(settings.router, prefix="/admin/settings", tags=["admin settings"])
api_router.include_router(websocket.router, tags=["websocket"])

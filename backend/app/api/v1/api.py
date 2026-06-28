from fastapi import APIRouter
from app.api.v1.endpoints import users, reports, auth, admin

api_router = APIRouter()

# Group endpoints by domain with appropriate URL prefixes and tags
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

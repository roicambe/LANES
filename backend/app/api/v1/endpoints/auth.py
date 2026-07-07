from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.database import get_db

router = APIRouter()


@router.post("/login/access-token", response_model=schemas.Token)
def login_access_token(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    client_ip = request.client.host if request.client else None
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user:
        crud.create_audit_log(
            db,
            audit_in=schemas.AuditLogCreate(
                admin_id=None,
                action_type="LOGIN_FAILURE",
                target_table="users",
                target_id=None,
                metadata_json={
                    "attempted_username": form_data.username,
                    "reason": "Incorrect username"
                },
                ip_address=client_ip
            )
        )
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    if not security.verify_password(form_data.password, user.hashed_password):
        crud.create_audit_log(
            db,
            audit_in=schemas.AuditLogCreate(
                admin_id=None,
                action_type="LOGIN_FAILURE",
                target_table="users",
                target_id=None,
                metadata_json={
                    "attempted_username": form_data.username,
                    "reason": "Incorrect password"
                },
                ip_address=client_ip
            )
        )
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    if not user.is_active:
        crud.create_audit_log(
            db,
            audit_in=schemas.AuditLogCreate(
                admin_id=user.id,
                action_type="LOGIN_FAILURE",
                target_table="users",
                target_id=user.id,
                metadata_json={
                    "attempted_username": form_data.username,
                    "reason": "Inactive account"
                },
                ip_address=client_ip
            )
        )
        raise HTTPException(status_code=400, detail="Inactive user")
    
    if user.role.name != "Commuter":
        crud.create_audit_log(
            db,
            audit_in=schemas.AuditLogCreate(
                admin_id=user.id,
                action_type="LOGIN_SUCCESS",
                target_table="users",
                target_id=user.id,
                metadata_json={
                    "username": user.username,
                    "role": user.role.name
                },
                ip_address=client_ip
            )
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            {"sub": str(user.id)}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/test-token", response_model=schemas.UserResponse)
def test_token(current_user: models.User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user

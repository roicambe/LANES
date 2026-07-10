from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app import models, schemas, crud
from app.core.config import settings
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login/access-token")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> models.User:
    """
    Validate JWT, extract subject (user_id), and retrieve the user from the DB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = schemas.TokenPayload(sub=int(user_id))
    except (JWTError, ValueError):
        raise credentials_exception

    user = crud.get_user(db, user_id=token_data.sub)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


def get_current_user_optional(
    db: Session = Depends(get_db),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="api/v1/auth/login/access-token", auto_error=False))
) -> Optional[models.User]:
    """
    Optional dependency. Returns User if valid token is provided, else None.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        token_data = schemas.TokenPayload(sub=int(user_id))
    except (JWTError, ValueError):
        return None

    user = crud.get_user(db, user_id=token_data.sub)
    if user is None or not user.is_active:
        return None
    return user


def get_current_active_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Dependency that enforces the current user has the 'admin' role.
    """
    if current_user.role.name == "Commuter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

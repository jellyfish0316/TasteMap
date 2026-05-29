"""Shared FastAPI dependencies.

`get_db` is re-exported so routers have one import site. `get_current_user` /
`get_current_user_id` decode the Bearer token (issued by auth_service) and load the
user — this is what protects write routes like import confirm and collection edits.
"""
from __future__ import annotations

import uuid

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db  # re-exported for routers
from app.core.security import decode_access_token
from app.models.user import User
from app.services import auth_service

__all__ = ["get_db", "get_current_user", "get_current_user_id"]

# tokenUrl points at the OAuth2 form endpoint so Swagger's Authorize button works.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the Bearer token, or raise AuthError."""
    subject = decode_access_token(token)  # raises AuthError if invalid/expired
    return auth_service.get_user(db, uuid.UUID(subject))


def get_current_user_id(user: User = Depends(get_current_user)) -> uuid.UUID:
    return user.id

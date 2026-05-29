"""Auth API endpoints: register, login, token (OAuth2 form), and me."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    return auth_service.register(
        db,
        email=payload.email,
        username=payload.username,
        password=payload.password,
        display_name=payload.display_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.authenticate(db, email=payload.email, password=payload.password)
    return TokenResponse(access_token=auth_service.issue_token(user))


@router.post("/token", response_model=TokenResponse)
def token(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """OAuth2 password-flow endpoint (powers Swagger's Authorize). `username` field
    carries the email."""
    user = auth_service.authenticate(db, email=form.username, password=form.password)
    return TokenResponse(access_token=auth_service.issue_token(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user

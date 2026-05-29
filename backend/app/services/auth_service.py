"""Auth Service — registration, login, and token issuing.

Wraps `user_repository` + `core.security`. Returns the User model and/or a signed
JWT; the API layer turns those into responses. The token subject (`sub`) is the
user id, which `api.deps.get_current_user_id` reads back on protected routes.
"""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.errors import AuthError, NotFoundError, ValidationError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories import user_repository


def register(db: Session, *, email: str, username: str, password: str,
             display_name: str | None = None) -> User:
    """Create a new account. Raises ValidationError if email/username is taken."""
    if user_repository.get_by_email(db, email):
        raise ValidationError("Email is already registered.")
    if user_repository.get_by_username(db, username):
        raise ValidationError("Username is already taken.")

    user = user_repository.create(
        db,
        email=email,
        username=username,
        hashed_password=hash_password(password),
        display_name=display_name,
    )
    db.commit()
    return user


def authenticate(db: Session, *, email: str, password: str) -> User:
    """Verify credentials and return the user, or raise AuthError."""
    user = user_repository.get_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        # Same error for both cases — don't reveal which emails exist.
        raise AuthError("Incorrect email or password.")
    if not user.is_active:
        raise AuthError("Account is disabled.")
    return user


def issue_token(user: User) -> str:
    """Mint a signed access token whose subject is the user id."""
    return create_access_token(str(user.id))


def get_user(db: Session, user_id: uuid.UUID) -> User:
    """Load an active user by id, or raise. Used by the auth dependency."""
    user = user_repository.get(db, user_id)
    if user is None:
        raise NotFoundError("User not found.")
    if not user.is_active:
        raise AuthError("Account is disabled.")
    return user

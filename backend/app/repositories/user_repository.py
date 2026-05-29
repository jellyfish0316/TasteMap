"""Data access for User. Pure persistence — no hashing/validation (that's the service).

Every function takes the `Session` as its first argument; the caller owns the
transaction (commit/rollback), so repositories stay composable.
"""
from __future__ import annotations

import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.user import User


def create(db: Session, *, email: str, username: str, hashed_password: str,
           display_name: str | None = None) -> User:
    user = User(
        email=email,
        username=username,
        hashed_password=hashed_password,
        display_name=display_name,
    )
    db.add(user)
    db.flush()  # assign PK without committing; caller commits
    return user


def get(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username))


def search(db: Session, q: str, *, limit: int = 20) -> list[User]:
    """Find users by handle or display name (case-insensitive) — L2 discovery."""
    pattern = f"%{q}%"
    return list(
        db.scalars(
            select(User)
            .where(or_(User.username.ilike(pattern), User.display_name.ilike(pattern)))
            .order_by(User.username)
            .limit(limit)
        )
    )

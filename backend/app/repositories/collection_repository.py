"""Data access for Collection (a user's list)."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.collection import Collection


def create(db: Session, *, user_id: uuid.UUID, name: str, is_public: bool = False,
           description: str | None = None, source_platform: str | None = None) -> Collection:
    collection = Collection(
        user_id=user_id,
        name=name,
        is_public=is_public,
        description=description,
        source_platform=source_platform,
    )
    db.add(collection)
    db.flush()
    return collection


def get(db: Session, collection_id: uuid.UUID) -> Collection | None:
    return db.get(Collection, collection_id)


def get_for_user(db: Session, collection_id: uuid.UUID, user_id: uuid.UUID) -> Collection | None:
    """Fetch a collection only if it belongs to `user_id` (ownership check)."""
    return db.scalar(
        select(Collection).where(Collection.id == collection_id, Collection.user_id == user_id)
    )


def list_for_user(db: Session, user_id: uuid.UUID) -> list[Collection]:
    return list(
        db.scalars(
            select(Collection)
            .where(Collection.user_id == user_id)
            .order_by(Collection.created_at.desc())
        )
    )


def update(db: Session, collection: Collection, **fields) -> Collection:
    """Apply provided fields (only keys present in `fields` are touched)."""
    for key, value in fields.items():
        setattr(collection, key, value)
    db.flush()
    return collection


def delete(db: Session, collection: Collection) -> None:
    db.delete(collection)
    db.flush()


def list_public_for_user(db: Session, user_id: uuid.UUID) -> list[Collection]:
    """Public lists of a user — what followers can see (L2 discovery)."""
    return list(
        db.scalars(
            select(Collection)
            .where(Collection.user_id == user_id, Collection.is_public.is_(True))
            .order_by(Collection.created_at.desc())
        )
    )

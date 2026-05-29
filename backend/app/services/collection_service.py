"""Collection Service — CRUD for lists and the saved cards inside them.

Ownership rules:
  * mutations (create/update/delete, edit/remove a card) require the caller to own
    the collection.
  * reads allow the owner OR anyone if the collection is public (L2 discovery);
    a private collection you don't own looks like a 404 (don't reveal it exists).
"""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.models.collection import Collection
from app.models.recommendation import Recommendation
from app.repositories import collection_repository, recommendation_repository


def create(db: Session, *, user_id: uuid.UUID, name: str,
           description: str | None = None, is_public: bool = False) -> Collection:
    collection = collection_repository.create(
        db, user_id=user_id, name=name, description=description, is_public=is_public
    )
    db.commit()
    return collection


def list_for_user(db: Session, user_id: uuid.UUID) -> list[Collection]:
    return collection_repository.list_for_user(db, user_id)


def get_visible(db: Session, collection_id: uuid.UUID, viewer_id: uuid.UUID) -> Collection:
    """Owner sees it always; others only if it's public; else NotFound."""
    collection = collection_repository.get(db, collection_id)
    if collection is None or (collection.user_id != viewer_id and not collection.is_public):
        raise NotFoundError(f"Collection {collection_id} not found")
    return collection


def get_detail(db: Session, collection_id: uuid.UUID, viewer_id: uuid.UUID,
               ) -> tuple[Collection, list[Recommendation]]:
    collection = get_visible(db, collection_id, viewer_id)
    recommendations = recommendation_repository.list_for_collection(db, collection.id)
    return collection, recommendations


def update(db: Session, collection_id: uuid.UUID, user_id: uuid.UUID, fields: dict) -> Collection:
    collection = _owned(db, collection_id, user_id)
    collection_repository.update(db, collection, **fields)
    db.commit()
    return collection


def delete(db: Session, collection_id: uuid.UUID, user_id: uuid.UUID) -> None:
    collection = _owned(db, collection_id, user_id)
    collection_repository.delete(db, collection)
    db.commit()


def update_recommendation(db: Session, collection_id: uuid.UUID, rec_id: uuid.UUID,
                          user_id: uuid.UUID, fields: dict) -> Recommendation:
    rec = _owned_recommendation(db, collection_id, rec_id, user_id)
    recommendation_repository.update(db, rec, **fields)
    db.commit()
    return rec


def remove_recommendation(db: Session, collection_id: uuid.UUID, rec_id: uuid.UUID,
                          user_id: uuid.UUID) -> None:
    rec = _owned_recommendation(db, collection_id, rec_id, user_id)
    recommendation_repository.delete(db, rec)
    db.commit()


# --- ownership helpers ------------------------------------------------------ #
def _owned(db: Session, collection_id: uuid.UUID, user_id: uuid.UUID) -> Collection:
    collection = collection_repository.get_for_user(db, collection_id, user_id)
    if collection is None:
        raise NotFoundError(f"Collection {collection_id} not found")
    return collection


def _owned_recommendation(db: Session, collection_id: uuid.UUID, rec_id: uuid.UUID,
                          user_id: uuid.UUID) -> Recommendation:
    rec = recommendation_repository.get(db, rec_id)
    if rec is None or rec.collection_id != collection_id or rec.user_id != user_id:
        raise NotFoundError(f"Recommendation {rec_id} not found")
    return rec

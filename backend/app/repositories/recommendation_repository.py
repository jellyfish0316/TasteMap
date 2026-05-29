"""Data access for Recommendation (a saved restaurant-in-collection w/ context)."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.collection import Collection
from app.models.follow import Follow
from app.models.recommendation import Recommendation


def get(db: Session, recommendation_id: uuid.UUID) -> Recommendation | None:
    return db.get(Recommendation, recommendation_id)


def get_in_collection(db: Session, collection_id: uuid.UUID, place_id: uuid.UUID) -> Recommendation | None:
    return db.scalar(
        select(Recommendation).where(
            Recommendation.collection_id == collection_id,
            Recommendation.place_id == place_id,
        )
    )


def upsert(db: Session, *, user_id: uuid.UUID, collection_id: uuid.UUID, place_id: uuid.UUID,
           **context) -> Recommendation:
    """Add a place to a collection, or update the existing card (dedup within list).

    `context` carries the source overlay fields (platform, author, source_url,
    dishes, summary, quote, context_tags, timestamp_seconds, is_ad, is_negative,
    confidence, status, note). The (collection_id, place_id) uniqueness means a
    repeated restaurant updates its card instead of duplicating it.
    """
    rec = get_in_collection(db, collection_id, place_id)
    if rec is None:
        rec = Recommendation(user_id=user_id, collection_id=collection_id, place_id=place_id)
        db.add(rec)
    for field, value in context.items():
        if value is not None:
            setattr(rec, field, value)
    db.flush()
    return rec


def update(db: Session, rec: Recommendation, **fields) -> Recommendation:
    """Apply provided fields (keys present in `fields` are set, even to None)."""
    for key, value in fields.items():
        setattr(rec, key, value)
    db.flush()
    return rec


def delete(db: Session, rec: Recommendation) -> None:
    db.delete(rec)
    db.flush()


def list_for_collection(db: Session, collection_id: uuid.UUID) -> list[Recommendation]:
    return list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.collection_id == collection_id)
            .order_by(Recommendation.created_at.desc())
        )
    )


def list_for_user(db: Session, user_id: uuid.UUID) -> list[Recommendation]:
    """Every recommendation across all the user's lists — the whole personal map."""
    return list(
        db.scalars(select(Recommendation).where(Recommendation.user_id == user_id))
    )


def list_for_user_and_place(db: Session, user_id: uuid.UUID, place_id: uuid.UUID) -> list[Recommendation]:
    """The user's cards for one place — every list they saved it in, with each note."""
    return list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.user_id == user_id, Recommendation.place_id == place_id)
            .order_by(Recommendation.created_at.desc())
        )
    )


def list_from_followees_for_place(db: Session, user_id: uuid.UUID,
                                  place_id: uuid.UUID) -> list[Recommendation]:
    """Cards for one place from the PUBLIC lists of people `user_id` follows.

    The owner (`.user`) is eager-loaded so the pin sheet can attribute each note.
    """
    return list(
        db.scalars(
            select(Recommendation)
            .join(Collection, Collection.id == Recommendation.collection_id)
            .join(Follow, Follow.followee_id == Collection.user_id)
            .where(
                Follow.follower_id == user_id,
                Collection.is_public.is_(True),
                Recommendation.place_id == place_id,
            )
            .options(joinedload(Recommendation.user))
            .order_by(Recommendation.created_at.desc())
        )
    )

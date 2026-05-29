"""Data access for the follow graph (L2 Taste Circle / L3 PageRank input)."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.follow import Follow
from app.models.user import User


def follow(db: Session, *, follower_id: uuid.UUID, followee_id: uuid.UUID) -> Follow:
    existing = get(db, follower_id=follower_id, followee_id=followee_id)
    if existing is not None:
        return existing
    edge = Follow(follower_id=follower_id, followee_id=followee_id)
    db.add(edge)
    db.flush()
    return edge


def unfollow(db: Session, *, follower_id: uuid.UUID, followee_id: uuid.UUID) -> bool:
    edge = get(db, follower_id=follower_id, followee_id=followee_id)
    if edge is None:
        return False
    db.delete(edge)
    db.flush()
    return True


def get(db: Session, *, follower_id: uuid.UUID, followee_id: uuid.UUID) -> Follow | None:
    return db.scalar(
        select(Follow).where(
            Follow.follower_id == follower_id, Follow.followee_id == followee_id
        )
    )


def is_following(db: Session, *, follower_id: uuid.UUID, followee_id: uuid.UUID) -> bool:
    return get(db, follower_id=follower_id, followee_id=followee_id) is not None


def list_following(db: Session, user_id: uuid.UUID) -> list[User]:
    """Users that `user_id` follows."""
    return list(
        db.scalars(
            select(User).join(Follow, Follow.followee_id == User.id).where(
                Follow.follower_id == user_id
            )
        )
    )


def list_followers(db: Session, user_id: uuid.UUID) -> list[User]:
    """Users that follow `user_id`."""
    return list(
        db.scalars(
            select(User).join(Follow, Follow.follower_id == User.id).where(
                Follow.followee_id == user_id
            )
        )
    )


def all_edges(db: Session) -> list[Follow]:
    """The full edge list — input to L3 Personalized PageRank."""
    return list(db.scalars(select(Follow)))

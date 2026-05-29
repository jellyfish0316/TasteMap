"""Social Service (L2) — the Taste Circle: follow graph + explore feed.

Following is what makes another user's *public* collections visible to you. The
feed is simply the public lists of everyone you follow. (L3 will rank *who* to
follow on top of this same graph via recommendation_service.)
"""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError, ValidationError
from app.models.collection import Collection
from app.models.user import User
from app.repositories import collection_repository, social_repository, user_repository


def follow(db: Session, *, follower_id: uuid.UUID, followee_id: uuid.UUID) -> None:
    if follower_id == followee_id:
        raise ValidationError("You can't follow yourself.")
    if user_repository.get(db, followee_id) is None:
        raise NotFoundError("User not found.")
    social_repository.follow(db, follower_id=follower_id, followee_id=followee_id)
    db.commit()


def unfollow(db: Session, *, follower_id: uuid.UUID, followee_id: uuid.UUID) -> None:
    social_repository.unfollow(db, follower_id=follower_id, followee_id=followee_id)
    db.commit()


def list_following(db: Session, user_id: uuid.UUID) -> list[User]:
    return social_repository.list_following(db, user_id)


def list_followers(db: Session, user_id: uuid.UUID) -> list[User]:
    return social_repository.list_followers(db, user_id)


def follow_status(db: Session, *, viewer_id: uuid.UUID, target_id: uuid.UUID) -> tuple[User, bool]:
    """For a profile view: the target user + whether the viewer follows them."""
    user = user_repository.get(db, target_id)
    if user is None:
        raise NotFoundError("User not found.")
    following = social_repository.is_following(db, follower_id=viewer_id, followee_id=target_id)
    return user, following


def explore_feed(db: Session, user_id: uuid.UUID) -> list[tuple[Collection, User]]:
    """Public collections from everyone the user follows, each with its owner."""
    collections = collection_repository.list_public_from_followees(db, user_id)
    return [(c, c.user) for c in collections]


def search_users(db: Session, *, viewer_id: uuid.UUID, q: str, limit: int = 20) -> list[User]:
    """Find people to follow by handle / display name, excluding the viewer."""
    return [u for u in user_repository.search(db, q, limit=limit + 1) if u.id != viewer_id][:limit]


def list_public_collections(db: Session, target_id: uuid.UUID) -> list[Collection]:
    """A user's public lists — what shows on their profile to anyone."""
    if user_repository.get(db, target_id) is None:
        raise NotFoundError("User not found.")
    return collection_repository.list_public_for_user(db, target_id)

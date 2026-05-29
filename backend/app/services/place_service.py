"""Place Service — read access to the shared Place layer and the user's map.

Places are global (one row per google_place_id, shared by everyone), so the detail
here is not user-scoped. The map and per-place card lookups ARE user-scoped: they
answer "which places have I pinned" and "what did I save about this one".
Search proxies Google Places for manual add.
"""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.integrations.google_places_client import PlaceCandidate, text_search
from app.models.place import Place
from app.models.recommendation import Recommendation
from app.repositories import place_repository, recommendation_repository


def get_detail(db: Session, place_id: uuid.UUID) -> Place:
    place = place_repository.get(db, place_id)
    if place is None:
        raise NotFoundError(f"Place {place_id} not found")
    return place


def list_map(db: Session, user_id: uuid.UUID) -> list[Place]:
    """All distinct places the user has saved — the pins for their map view."""
    return place_repository.list_saved_by_user(db, user_id)


def list_followee_map(db: Session, user_id: uuid.UUID) -> list[Place]:
    """Extra pins from the public lists of everyone the user follows (Taste Circle)."""
    return place_repository.list_from_followees(db, user_id)


def list_recommendations_for_place(db: Session, place_id: uuid.UUID,
                                   user_id: uuid.UUID) -> list[Recommendation]:
    """Cards for one place: the viewer's own, then any from people they follow.

    Followee cards carry an eager-loaded `.user` so the API can attribute them.
    """
    mine = recommendation_repository.list_for_user_and_place(db, user_id, place_id)
    followees = recommendation_repository.list_from_followees_for_place(db, user_id, place_id)
    return mine + followees


def search(query: str, *, region_hint: str | None = None, limit: int = 5) -> list[PlaceCandidate]:
    """Proxy Google Places text search (for manually adding a place)."""
    return text_search(query, region_hint=region_hint, limit=limit)

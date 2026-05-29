"""Data access for the global Place table (deduped by google_place_id)."""
from __future__ import annotations

import uuid

from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.google_places_client import PlaceCandidate
from app.models.place import Place
from app.models.recommendation import Recommendation


def get(db: Session, place_id: uuid.UUID) -> Place | None:
    return db.get(Place, place_id)


def list_saved_by_user(db: Session, user_id: uuid.UUID) -> list[Place]:
    """Distinct places the user has saved anywhere — the pins on their map."""
    return list(
        db.scalars(
            select(Place)
            .join(Recommendation, Recommendation.place_id == Place.id)
            .where(Recommendation.user_id == user_id)
            .distinct()
        )
    )


def get_by_google_place_id(db: Session, google_place_id: str) -> Place | None:
    return db.scalar(select(Place).where(Place.google_place_id == google_place_id))


def upsert_from_candidate(db: Session, candidate: PlaceCandidate, *, raw: dict | None = None) -> Place:
    """Get-or-create the shared Place for a matched google_place_id.

    This is the dedup point: two imports that resolve to the same place return the
    SAME row, so every Recommendation hangs off one canonical Place. Base fields are
    refreshed from the latest match (Google data drifts).
    """
    place = get_by_google_place_id(db, candidate.google_place_id)
    if place is None:
        place = Place(google_place_id=candidate.google_place_id, name=candidate.name)
        db.add(place)

    place.name = candidate.name or place.name
    place.address = candidate.address
    place.lat = candidate.lat
    place.lng = candidate.lng
    place.rating = candidate.rating
    place.user_rating_count = candidate.user_rating_count
    place.google_maps_uri = candidate.google_maps_uri
    if candidate.lat is not None and candidate.lng is not None:
        # PostGIS POINT is (lng lat) order.
        place.location = WKTElement(f"POINT({candidate.lng} {candidate.lat})", srid=4326)
    if raw is not None:
        place.raw = raw

    db.flush()
    return place

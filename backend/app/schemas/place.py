"""Place API schemas. PlaceSummary is the lean map-pin/card shape; PlaceDetail adds
the full Google base data shown when a pin is opened.
"""
from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict


class PlaceSummary(BaseModel):
    """The shared Google base data shown on a recommendation card / map pin."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    google_place_id: str
    name: str
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    rating: float | None = None
    user_rating_count: int | None = None
    google_maps_uri: str | None = None


class PlaceDetailResponse(PlaceSummary):
    """Full shared place detail (everything Google gives us for the pin sheet)."""

    phone: str | None = None
    opening_hours: dict | None = None
    photos: list | None = None

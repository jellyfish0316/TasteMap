"""Collection API schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.integrations.google_places_client import PlaceCandidate
from app.schemas.recommendation import RecommendationResponse


class CollectionCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    is_public: bool = False


class CollectionItemCreateRequest(BaseModel):
    """Manually save a chosen Google place into this collection (no import).

    `place` is a result from GET /places/search; the optional fields are the user's
    own overlay. There's no creator voice (platform/author) — this is a self-pin.
    """

    place: PlaceCandidate
    note: str | None = Field(None, max_length=2000, description="The user's own note.")
    dishes: list[str] = Field(default_factory=list)
    summary: str | None = Field(None, max_length=2000)


class CollectionUpdateRequest(BaseModel):
    """Partial update — only provided fields change."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    is_public: bool | None = None


class CollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None = None
    is_public: bool
    source_platform: str | None = None
    created_at: datetime


class CollectionDetailResponse(CollectionResponse):
    """A collection plus its saved recommendations — the data the map renders from."""

    recommendations: list[RecommendationResponse] = Field(default_factory=list)

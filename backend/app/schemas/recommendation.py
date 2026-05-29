"""Schemas for a saved Recommendation (a restaurant-in-collection with context).

NOTE: this is the *saved restaurant* recommendation, matching the Recommendation
model. The L3 "people you may want to follow" feature is a separate surface and
will get its own schemas when built.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.place import PlaceSummary


class RecommendationResponse(BaseModel):
    """One saved card: the shared Place + the source context + the user's overlay."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    collection_id: uuid.UUID
    place: PlaceSummary
    # source context (the original creator's voice)
    platform: str | None = None
    author: str | None = None
    source_url: str | None = None
    dishes: list[str] = Field(default_factory=list)
    summary: str | None = None
    quote: str | None = None
    context_tags: list[str] = Field(default_factory=list)
    timestamp_seconds: int | None = None
    is_ad: bool | None = None
    is_negative: bool | None = None
    confidence: float | None = None
    # the user's own overlay
    status: str | None = None
    note: str | None = None
    created_at: datetime


class RecommendationUpdateRequest(BaseModel):
    """Edit your own overlay on a saved card (status / personal note)."""

    status: str | None = Field(None, max_length=32, description="want_to_go | visited | friend_rec | ...")
    note: str | None = Field(None, description="Your personal note. Send empty string to clear.")

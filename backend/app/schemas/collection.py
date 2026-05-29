"""Collection API schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.recommendation import RecommendationResponse


class CollectionCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    is_public: bool = False


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

"""Social (L2) API schemas — the Taste Circle: following + the explore feed."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.collection import CollectionResponse


class UserPublic(BaseModel):
    """Public view of a user — no email or private fields."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    display_name: str | None = None


class FollowRequest(BaseModel):
    followee_id: uuid.UUID


class FollowStatusResponse(BaseModel):
    """Whether the current user follows `user`, used on profiles."""

    user: UserPublic
    is_following: bool


class FeedItem(BaseModel):
    """One public collection surfaced from someone you follow."""

    owner: UserPublic
    collection: CollectionResponse
    created_at: datetime

"""Recommendation — a restaurant a user saved into a collection, WITH its context.

This is TasteMap's overlay row: the "推薦脈絡" Google Maps doesn't keep — who
recommended it, from which platform, the dishes, the takeaway, the video timestamp,
the source link, the user's personal status and notes — all attached to one shared
`Place` (google_place_id) inside one `Collection`.

It is the persisted, confirmed form of an `ImportCandidate`: the import flow
produces candidates, the user confirms, and each confirmed candidate becomes a
Recommendation here.

NOTE: "recommendation" here means *a recommended restaurant a user saved*. The L3
"people you may want to follow" feature is a separate computed surface
(recommendation_service over the follow graph) and does not live in this table.
"""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.collection import Collection
    from app.models.place import Place
    from app.models.user import User


class Recommendation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "recommendations"
    __table_args__ = (
        # One card per place per list — dedup of repeated restaurants within a list.
        UniqueConstraint("collection_id", "place_id", name="uq_recommendation_collection_place"),
    )

    #: Owner (denormalized from collection.user_id for fast "my whole map" reads).
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    collection_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("collections.id", ondelete="CASCADE"), index=True
    )
    #: Places are shared/global, so deleting one is blocked while referenced.
    place_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("places.id", ondelete="RESTRICT"), index=True
    )

    # --- source context (from the ExtractedPlace that produced this) ---------- #
    platform: Mapped[str | None] = mapped_column(String(32), default=None)
    author: Mapped[str | None] = mapped_column(String(255), default=None)
    source_url: Mapped[str | None] = mapped_column(Text, default=None)
    dishes: Mapped[list] = mapped_column(JSONB, default=list, server_default=text("'[]'::jsonb"))
    summary: Mapped[str | None] = mapped_column(Text, default=None)
    quote: Mapped[str | None] = mapped_column(Text, default=None)
    context_tags: Mapped[list] = mapped_column(JSONB, default=list, server_default=text("'[]'::jsonb"))
    timestamp_seconds: Mapped[int | None] = mapped_column(Integer, default=None)
    is_ad: Mapped[bool | None] = mapped_column(Boolean, default=None)
    is_negative: Mapped[bool | None] = mapped_column(Boolean, default=None)
    confidence: Mapped[float | None] = mapped_column(Float, default=None)

    # --- the user's own overlay ---------------------------------------------- #
    #: Personal status: want_to_go | visited | friend_rec | ... (free-form for MVP).
    status: Mapped[str | None] = mapped_column(String(32), default=None)
    note: Mapped[str | None] = mapped_column(Text, default=None)

    user: Mapped["User"] = relationship(back_populates="recommendations")
    collection: Mapped["Collection"] = relationship(back_populates="recommendations")
    place: Mapped["Place"] = relationship()

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<Recommendation place={self.place_id} collection={self.collection_id}>"

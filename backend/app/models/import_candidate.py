"""ImportCandidate — one extracted-and-matched restaurant awaiting user confirmation.

This is the persisted form of an `ExtractedPlace` plus its Google Places match: the
"待加入的餐廳卡片" the user reviews. It snapshots the extraction (so the card is
stable even if matching is re-run) and records the match outcome. On confirm, a
selected candidate is turned into a `Recommendation` inside the chosen collection.
"""
from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
    true,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.import_job import ImportJob
    from app.models.place import Place


class MatchStatus(str, enum.Enum):
    pending = "pending"  # not yet run through place matching
    matched = "matched"  # confidently aligned to one google_place_id
    needs_review = "needs_review"  # ambiguous; see match_options
    unmatched = "unmatched"  # no Google Places result


class ImportCandidate(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "import_candidates"

    import_job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("import_jobs.id", ondelete="CASCADE"), index=True
    )

    # --- snapshot of the ExtractedPlace -------------------------------------- #
    name: Mapped[str] = mapped_column(String(255))
    region_hint: Mapped[str | None] = mapped_column(String(255), default=None)
    address_hint: Mapped[str | None] = mapped_column(Text, default=None)
    dishes: Mapped[list] = mapped_column(JSONB, default=list, server_default=text("'[]'::jsonb"))
    summary: Mapped[str | None] = mapped_column(Text, default=None)
    quote: Mapped[str | None] = mapped_column(Text, default=None)
    context_tags: Mapped[list] = mapped_column(JSONB, default=list, server_default=text("'[]'::jsonb"))
    timestamp_seconds: Mapped[int | None] = mapped_column(Integer, default=None)
    source_url: Mapped[str | None] = mapped_column(Text, default=None)
    platform: Mapped[str | None] = mapped_column(String(32), default=None)
    author: Mapped[str | None] = mapped_column(String(255), default=None)
    is_ad: Mapped[bool | None] = mapped_column(Boolean, default=None)
    is_negative: Mapped[bool | None] = mapped_column(Boolean, default=None)
    confidence: Mapped[float | None] = mapped_column(Float, default=None)

    # --- place matching outcome ---------------------------------------------- #
    match_status: Mapped[MatchStatus] = mapped_column(
        Enum(MatchStatus, name="match_status"),
        default=MatchStatus.pending,
        server_default=MatchStatus.pending.value,
        index=True,
    )
    matched_place_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("places.id", ondelete="SET NULL"), default=None
    )
    #: Ranked Google Places options when the match is ambiguous (for the review UI).
    match_options: Mapped[list | None] = mapped_column(JSONB, default=None)

    #: Whether the user keeps this candidate on confirm (default yes).
    selected: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())

    import_job: Mapped["ImportJob"] = relationship(back_populates="candidates")
    matched_place: Mapped["Place | None"] = relationship()

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<ImportCandidate {self.name!r} {self.match_status}>"

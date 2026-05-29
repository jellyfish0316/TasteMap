"""ImportJob — one URL submission, tracked through the async import pipeline.

Lifecycle: POST /imports creates it (status=pending) and enqueues a worker; the
worker runs the parser (fetch -> extract -> match), writes `ImportCandidate` rows,
and flips status to succeeded/failed. The client polls GET /imports/{id} and then
reviews .../candidates.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.import_candidate import ImportCandidate


class ImportStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class ImportJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "import_jobs"

    #: Owner of the import. Nullable for now so the dev preview flow works before
    #: auth is wired; the real async endpoint will always set it.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, default=None
    )
    url: Mapped[str] = mapped_column(Text)
    platform: Mapped[str | None] = mapped_column(String(32), default=None)
    source_type: Mapped[str | None] = mapped_column(String(32), default=None)

    status: Mapped[ImportStatus] = mapped_column(
        Enum(ImportStatus, name="import_status"),
        default=ImportStatus.pending,
        server_default=ImportStatus.pending.value,
        index=True,
    )
    #: Fan-out accounting (profile/channel imports): how many units, how many failed.
    units_total: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    units_failed: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    suggested_collection_name: Mapped[str | None] = mapped_column(String(255), default=None)
    error: Mapped[str | None] = mapped_column(Text, default=None)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    candidates: Mapped[list["ImportCandidate"]] = relationship(
        back_populates="import_job", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<ImportJob {self.platform} {self.status} {self.url!r}>"

"""Collection — a user's themed list ("台南想吃", "@tainan_foodie 推薦地圖").

One import typically lands in one collection. A collection groups
`Recommendation` rows; if `is_public`, it becomes visible to followers and feeds
the L2/L3 discovery surfaces.
"""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.recommendation import Recommendation
    from app.models.user import User


class Collection(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "collections"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, default=None)
    is_public: Mapped[bool] = mapped_column(default=False, server_default=false())
    #: Platform this list was imported from, if any ("youtube", "instagram", ...).
    source_platform: Mapped[str | None] = mapped_column(String(32), default=None)

    user: Mapped["User"] = relationship(back_populates="collections")
    recommendations: Mapped[list["Recommendation"]] = relationship(
        back_populates="collection", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<Collection {self.name!r}>"

"""Follow — a directed edge in the Taste Circle graph (L2), A follows B.

This is the only structure L2 needs, and it's also the graph L3's Personalized
PageRank runs over (nodes = users, edges = follows). Reverse lookups (my
followers / who I follow) go through `social_repository`, not ORM backrefs, to keep
the two self-referential FKs unambiguous.
"""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class Follow(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "followee_id", name="uq_follow_pair"),
        CheckConstraint("follower_id <> followee_id", name="ck_follow_not_self"),
    )

    follower_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    followee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    follower: Mapped["User"] = relationship(foreign_keys=[follower_id])
    followee: Mapped["User"] = relationship(foreign_keys=[followee_id])

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<Follow {self.follower_id} -> {self.followee_id}>"

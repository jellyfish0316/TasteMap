"""Place — the GLOBAL, deduped restaurant, keyed on google_place_id.

This is the shared base layer of the product: every import from every platform
aligns to one of these rows. Google Places owns the factual fields (name, address,
location, rating, hours, photos); TasteMap's per-user "推薦脈絡" lives separately on
`Recommendation`, never here. One google_place_id == one Place row, shared by all
users — that's what makes cross-platform / cross-user dedup work.
"""
from __future__ import annotations

from geoalchemy2 import Geometry
from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Place(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "places"

    #: The stable Google identity everything aligns to. Unique == dedup key.
    google_place_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(Text, default=None)

    #: PostGIS point (lng/lat, WGS84) for map + radius queries; lat/lng mirrored
    #: as plain floats for cheap reads without a spatial function.
    location = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, default=None)
    lng: Mapped[float | None] = mapped_column(Float, default=None)

    phone: Mapped[str | None] = mapped_column(String(64), default=None)
    rating: Mapped[float | None] = mapped_column(Float, default=None)
    user_rating_count: Mapped[int | None] = mapped_column(Integer, default=None)
    google_maps_uri: Mapped[str | None] = mapped_column(Text, default=None)

    photos: Mapped[list | None] = mapped_column(JSONB, default=None)
    opening_hours: Mapped[dict | None] = mapped_column(JSONB, default=None)
    #: Full raw Places Details payload, for audit / re-deriving fields later.
    raw: Mapped[dict | None] = mapped_column(JSONB, default=None)

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<Place {self.name!r} {self.google_place_id}>"

"""initial schema (users, places, collections, recommendations, imports, follows)

Revision ID: 0001
Revises:
Create Date: 2026-05-29
"""
from __future__ import annotations

from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_JSONB = postgresql.JSONB(astext_type=sa.Text())
_EMPTY_LIST = sa.text("'[]'::jsonb")


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("display_name", sa.String(120), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "places",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("google_place_id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column(
            "location",
            geoalchemy2.Geometry(geometry_type="POINT", srid=4326, spatial_index=False),
            nullable=True,
        ),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lng", sa.Float(), nullable=True),
        sa.Column("phone", sa.String(64), nullable=True),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("user_rating_count", sa.Integer(), nullable=True),
        sa.Column("google_maps_uri", sa.Text(), nullable=True),
        sa.Column("photos", _JSONB, nullable=True),
        sa.Column("opening_hours", _JSONB, nullable=True),
        sa.Column("raw", _JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_places_google_place_id", "places", ["google_place_id"], unique=True)
    op.create_index("idx_places_location", "places", ["location"], postgresql_using="gist")

    op.create_table(
        "collections",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("source_platform", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_collections_user_id", "collections", ["user_id"])

    op.create_table(
        "follows",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("follower_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("followee_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("follower_id", "followee_id", name="uq_follow_pair"),
        sa.CheckConstraint("follower_id <> followee_id", name="ck_follow_not_self"),
    )
    op.create_index("ix_follows_follower_id", "follows", ["follower_id"])
    op.create_index("ix_follows_followee_id", "follows", ["followee_id"])

    import_status = sa.Enum("pending", "running", "succeeded", "failed", name="import_status")
    op.create_table(
        "import_jobs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("platform", sa.String(32), nullable=True),
        sa.Column("source_type", sa.String(32), nullable=True),
        sa.Column("status", import_status, server_default="pending", nullable=False),
        sa.Column("units_total", sa.Integer(), server_default="0", nullable=False),
        sa.Column("units_failed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("suggested_collection_name", sa.String(255), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_import_jobs_user_id", "import_jobs", ["user_id"])
    op.create_index("ix_import_jobs_status", "import_jobs", ["status"])

    op.create_table(
        "recommendations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("collection_id", sa.Uuid(), sa.ForeignKey("collections.id", ondelete="CASCADE"), nullable=False),
        sa.Column("place_id", sa.Uuid(), sa.ForeignKey("places.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("platform", sa.String(32), nullable=True),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("dishes", _JSONB, server_default=_EMPTY_LIST, nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("quote", sa.Text(), nullable=True),
        sa.Column("context_tags", _JSONB, server_default=_EMPTY_LIST, nullable=False),
        sa.Column("timestamp_seconds", sa.Integer(), nullable=True),
        sa.Column("is_ad", sa.Boolean(), nullable=True),
        sa.Column("is_negative", sa.Boolean(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("status", sa.String(32), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("collection_id", "place_id", name="uq_recommendation_collection_place"),
    )
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])
    op.create_index("ix_recommendations_collection_id", "recommendations", ["collection_id"])
    op.create_index("ix_recommendations_place_id", "recommendations", ["place_id"])

    match_status = sa.Enum("pending", "matched", "needs_review", "unmatched", name="match_status")
    op.create_table(
        "import_candidates",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("import_job_id", sa.Uuid(), sa.ForeignKey("import_jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("region_hint", sa.String(255), nullable=True),
        sa.Column("address_hint", sa.Text(), nullable=True),
        sa.Column("dishes", _JSONB, server_default=_EMPTY_LIST, nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("quote", sa.Text(), nullable=True),
        sa.Column("context_tags", _JSONB, server_default=_EMPTY_LIST, nullable=False),
        sa.Column("timestamp_seconds", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("platform", sa.String(32), nullable=True),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("is_ad", sa.Boolean(), nullable=True),
        sa.Column("is_negative", sa.Boolean(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("match_status", match_status, server_default="pending", nullable=False),
        sa.Column("matched_place_id", sa.Uuid(), sa.ForeignKey("places.id", ondelete="SET NULL"), nullable=True),
        sa.Column("match_options", _JSONB, nullable=True),
        sa.Column("selected", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_import_candidates_import_job_id", "import_candidates", ["import_job_id"])
    op.create_index("ix_import_candidates_match_status", "import_candidates", ["match_status"])


def downgrade() -> None:
    op.drop_table("import_candidates")
    op.drop_table("recommendations")
    op.drop_table("import_jobs")
    op.drop_table("follows")
    op.drop_table("collections")
    op.drop_index("idx_places_location", table_name="places")
    op.drop_table("places")
    op.drop_table("users")
    sa.Enum(name="match_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="import_status").drop(op.get_bind(), checkfirst=True)
    # PostGIS extension is left installed (may be shared by other schemas).

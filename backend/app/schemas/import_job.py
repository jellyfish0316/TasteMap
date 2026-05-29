"""Import API request/response schemas.

The heavy lifting (canonical place format) lives in app.integrations.base; these
are the thin HTTP-facing models.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.integrations.base import ParseResult
from app.integrations.google_places_client import PlaceCandidate
from app.models.import_candidate import MatchStatus
from app.models.import_job import ImportStatus


class ImportRequest(BaseModel):
    url: str = Field(..., description="A supported platform URL (IG / YouTube / X / Threads / Google Maps).")


class ImportPreviewResponse(BaseModel):
    """Synchronous parse result — used in dev and for the review screen.

    In production the real flow is async (enqueue -> worker -> poll), but a parser
    owner can hit POST /imports/preview to test their parser end to end.
    """

    platform: str
    source_type: str
    result: ParseResult
    stats: dict[str, int]


class ImportJobResponse(BaseModel):
    """An import job's status — what the client polls after submitting a URL."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: ImportStatus
    platform: str | None = None
    source_type: str | None = None
    units_total: int
    units_failed: int
    suggested_collection_name: str | None = None
    error: str | None = None
    created_at: datetime
    finished_at: datetime | None = None


class ImportCandidateResponse(BaseModel):
    """One reviewable card: the extracted place + its Google Places match outcome."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    region_hint: str | None = None
    address_hint: str | None = None
    dishes: list[str] = Field(default_factory=list)
    summary: str | None = None
    quote: str | None = None
    context_tags: list[str] = Field(default_factory=list)
    timestamp_seconds: int | None = None
    source_url: str | None = None
    platform: str | None = None
    author: str | None = None
    is_ad: bool | None = None
    is_negative: bool | None = None
    confidence: float | None = None
    match_status: MatchStatus
    matched_place_id: uuid.UUID | None = None
    match_options: list[dict] | None = None
    selected: bool


class CandidateResolveRequest(BaseModel):
    """Manually resolve an unmatched / ambiguous candidate to a chosen Google place.

    The picked `place` (from GET /places/search) becomes the candidate's match, so it
    flips to `matched` and is then savable through the normal confirm flow.
    """

    place: PlaceCandidate


class ImportConfirmRequest(BaseModel):
    """Save chosen candidates into a collection — existing or newly created."""

    collection_id: uuid.UUID | None = Field(
        None, description="Add to this existing collection. Mutually exclusive with new_collection_name."
    )
    new_collection_name: str | None = Field(
        None, description="Create a new collection with this name. Defaults to the suggested name."
    )
    is_public: bool = Field(False, description="Visibility for a newly created collection.")
    candidate_ids: list[uuid.UUID] | None = Field(
        None, description="Subset of candidates to save. Omit to save all selected+matched ones."
    )

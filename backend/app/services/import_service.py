"""Import Service — orchestrates the whole import pipeline.

It ties the scaffold's steps together but owns none of their internals:
  parser_service     -> URL routing + fetch
  extraction_service -> per-unit LLM/structured extraction
  place_matching_service -> google_place_id resolution
  *_repository       -> persistence

Entry points:
  * preview(url)            — sync, DB-free; the parser owners' dev path.
  * enqueue(db, url, ...)   — create an ImportJob and hand it to the worker.
  * run_import_job(db, id)  — the worker body: fetch -> extract -> match -> persist.
  * confirm(db, id, ...)    — turn reviewed candidates into saved Recommendations.
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError, ParseError, ValidationError
from app.integrations.base import ExtractedPlace, ParseResult
from app.integrations.google_places_client import PlaceCandidate
from app.models.collection import Collection
from app.models.import_candidate import ImportCandidate, MatchStatus
from app.models.import_job import ImportJob
from app.repositories import (
    collection_repository,
    import_repository,
    place_repository,
    recommendation_repository,
)
from app.services import extraction_service, parser_service, place_matching_service
from app.utils.normalize import normalize_name

logger = logging.getLogger(__name__)


# --- detection / preview (no DB) ------------------------------------------- #
def detect(url: str) -> str:
    return parser_service.detect(url)


def preview(url: str) -> ParseResult:
    """Run the matching parser synchronously and return extracted candidates."""
    return parser_service.preview(url)


# --- async pipeline --------------------------------------------------------- #
def enqueue(db: Session, url: str, *, user_id: uuid.UUID | None = None) -> ImportJob:
    """Validate the URL is supported, persist a pending job, and dispatch the worker."""
    platform = parser_service.detect(url)  # raises UnsupportedSourceError if unknown
    job = import_repository.create_job(db, url=url, user_id=user_id, platform=platform)
    db.commit()

    # Local import avoids a service <-> worker import cycle.
    from app.workers.tasks.import_tasks import run_import

    run_import.delay(str(job.id))
    return job


def run_import_job(db: Session, job_id: uuid.UUID) -> ImportJob:
    """Worker body: fetch units, extract + match each place, persist candidates.

    Per-unit and per-place failures are isolated so one bad post / one matching
    error never sinks the whole import. A fetch-level failure fails the job.
    """
    job = import_repository.get_job(db, job_id)
    if job is None:
        raise NotFoundError(f"Import job {job_id} not found")

    import_repository.mark_running(db, job)
    db.commit()

    try:
        parser = parser_service.get_parser(job.url)
        units = parser.fetch(job.url)
    except ParseError as exc:
        import_repository.mark_failed(db, job, error=str(exc))
        db.commit()
        return job

    units_failed = 0
    suggested = units[0].suggested_collection_name if units else None
    source_type = units[0].source_type if units else None
    author = units[0].author if units else None

    extracted: list[ExtractedPlace] = []
    for unit in units:
        try:
            extracted.extend(extraction_service.extract(parser, unit))
        except ParseError:
            units_failed += 1  # isolate: skip this unit, keep importing

    # Collapse the same restaurant mentioned across posts into ONE candidate card.
    for place, outcome in _match_and_dedup(db, _dedup_by_name(extracted)):
        _persist_candidate(db, job, parser.platform, author, place, outcome)

    job.source_type = source_type
    import_repository.mark_succeeded(
        db, job,
        units_total=len(units),
        units_failed=units_failed,
        suggested_collection_name=suggested,
    )
    db.commit()
    return job


def _union(a: list[str], b: list[str]) -> list[str]:
    """a + b, order-preserving, no duplicates."""
    out = list(a)
    for item in b:
        if item not in out:
            out.append(item)
    return out


def _merge_place(into: ExtractedPlace, other: ExtractedPlace) -> None:
    """Fold a duplicate mention into `into`: union the lists, keep the first
    non-empty scalar, OR the warning flags, and take the higher confidence."""
    into.dishes = _union(into.dishes, other.dishes)
    into.context_tags = _union(into.context_tags, other.context_tags)
    into.region_hint = into.region_hint or other.region_hint
    into.address_hint = into.address_hint or other.address_hint
    into.summary = into.summary or other.summary
    into.quote = into.quote or other.quote
    into.source_url = into.source_url or other.source_url
    into.is_ad = bool(into.is_ad) or bool(other.is_ad)
    into.is_negative = bool(into.is_negative) or bool(other.is_negative)
    if other.confidence is not None:
        into.confidence = max(into.confidence or 0.0, other.confidence)


def _dedup_by_name(places: list[ExtractedPlace]) -> list[ExtractedPlace]:
    """Pre-match dedup on normalized name. Merges obvious repeats (the common
    profile case) BEFORE matching, so we don't pay Google for the same name twice."""
    groups: dict[str, ExtractedPlace] = {}
    order: list[str] = []
    for place in places:
        key = normalize_name(place.name) or f"__anon_{len(order)}"
        if key in groups:
            _merge_place(groups[key], place)
        else:
            groups[key] = place
            order.append(key)
    return [groups[key] for key in order]


def _match_and_dedup(
    db: Session, extracted: list[ExtractedPlace]
) -> list[tuple[ExtractedPlace, place_matching_service.MatchOutcome]]:
    """Match each place, then collapse any that resolve to the SAME google_place_id
    into one candidate (different names, one real shop). Returns first-seen order."""
    groups: dict[str, list] = {}
    order: list[str] = []
    for place in extracted:
        try:
            outcome = place_matching_service.match(db, place)
        except Exception as exc:  # noqa: BLE001 — matching must never crash the import
            logger.warning("place matching failed for %r: %s", place.name, exc, exc_info=True)
            outcome = place_matching_service.MatchOutcome(status=MatchStatus.pending)
        key = (
            f"gid:{outcome.place.google_place_id}"
            if outcome.place is not None
            else f"name:{normalize_name(place.name) or place.name}"
        )
        if key in groups:
            _merge_place(groups[key][0], place)
        else:
            groups[key] = [place, outcome]
            order.append(key)
    return [(groups[key][0], groups[key][1]) for key in order]


def _persist_candidate(db: Session, job: ImportJob, platform: str, author: str | None,
                       place: ExtractedPlace,
                       outcome: place_matching_service.MatchOutcome) -> ImportCandidate:
    """Store one already-matched, already-deduped place as a reviewable candidate."""
    return import_repository.add_candidate(
        db,
        import_job_id=job.id,
        name=place.name,
        region_hint=place.region_hint,
        address_hint=place.address_hint,
        dishes=place.dishes,
        summary=place.summary,
        quote=place.quote,
        context_tags=place.context_tags,
        timestamp_seconds=place.timestamp_seconds,
        source_url=place.source_url,
        platform=platform,
        author=author,
        is_ad=place.is_ad,
        is_negative=place.is_negative,
        confidence=place.confidence,
        match_status=outcome.status,
        matched_place_id=outcome.place.id if outcome.place else None,
        match_options=outcome.options,
    )


# --- manual resolve (unmatched / ambiguous -> matched) ---------------------- #
def resolve_candidate(db: Session, job_id: uuid.UUID, candidate_id: uuid.UUID, *,
                      candidate: PlaceCandidate) -> ImportCandidate:
    """Pin an unmatched/ambiguous candidate to a place the user picked by hand.

    Get-or-create the shared Place for the chosen google_place_id, then flip the
    candidate to `matched` (and selected) so the normal confirm flow saves it.
    """
    cand = import_repository.get_candidate(db, candidate_id)
    if cand is None or cand.import_job_id != job_id:
        raise NotFoundError(f"Import candidate {candidate_id} not found")

    place = place_repository.upsert_from_candidate(db, candidate)
    import_repository.set_match(
        db, cand, status=MatchStatus.matched, matched_place_id=place.id, match_options=None
    )
    cand.selected = True
    db.commit()
    return cand


# --- confirm (candidates -> saved recommendations) -------------------------- #
def confirm(db: Session, job_id: uuid.UUID, *, user_id: uuid.UUID,
            collection_id: uuid.UUID | None = None,
            new_collection_name: str | None = None,
            is_public: bool = False,
            candidate_ids: list[uuid.UUID] | None = None) -> Collection:
    """Save the chosen, matched candidates into an existing or new collection.

    Only candidates that resolved to a Place (match_status=matched) can be saved;
    unmatched / needs_review cards must be resolved first. Returns the collection.
    """
    job = import_repository.get_job(db, job_id)
    if job is None:
        raise NotFoundError(f"Import job {job_id} not found")

    collection = _resolve_target_collection(
        db, job, user_id=user_id, collection_id=collection_id,
        new_collection_name=new_collection_name, is_public=is_public,
    )

    wanted = set(candidate_ids) if candidate_ids is not None else None
    saved = 0
    for cand in import_repository.list_candidates(db, job.id):
        if wanted is not None and cand.id not in wanted:
            continue
        if not cand.selected or cand.match_status != MatchStatus.matched or cand.matched_place_id is None:
            continue
        recommendation_repository.upsert(
            db,
            user_id=user_id,
            collection_id=collection.id,
            place_id=cand.matched_place_id,
            platform=cand.platform,
            author=cand.author,
            source_url=cand.source_url,
            dishes=cand.dishes,
            summary=cand.summary,
            quote=cand.quote,
            context_tags=cand.context_tags,
            timestamp_seconds=cand.timestamp_seconds,
            is_ad=cand.is_ad,
            is_negative=cand.is_negative,
            confidence=cand.confidence,
        )
        saved += 1

    if saved == 0:
        raise ValidationError("No matched candidates selected to import.")

    db.commit()
    return collection


def _resolve_target_collection(db: Session, job: ImportJob, *, user_id: uuid.UUID,
                               collection_id: uuid.UUID | None,
                               new_collection_name: str | None,
                               is_public: bool) -> Collection:
    if collection_id is not None:
        collection = collection_repository.get_for_user(db, collection_id, user_id)
        if collection is None:
            raise NotFoundError(f"Collection {collection_id} not found")
        return collection

    name = new_collection_name or job.suggested_collection_name or "匯入清單"
    return collection_repository.create(
        db, user_id=user_id, name=name, is_public=is_public, source_platform=job.platform
    )

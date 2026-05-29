"""Place Matching Service — align an ExtractedPlace to one google_place_id.

This is the LAST shared step of every import, run for each extracted place:

    ExtractedPlace(name, region_hint)
        -> Google Places text search
        -> score candidates by name similarity
        -> decide: matched | needs_review | unmatched
        -> on a confident match, get-or-create the shared Place row (dedup point)

The decision logic (`score`, `decide`) is pure and unit-tested; the network call
and DB write are isolated so the rest of the pipeline can reason about outcomes.
"""
from __future__ import annotations

from dataclasses import dataclass
from difflib import SequenceMatcher

import hashlib

from sqlalchemy.orm import Session

from app.core.config import settings
from app.integrations.base import ExtractedPlace
from app.integrations.google_places_client import PlaceCandidate, text_search
from app.models.import_candidate import MatchStatus
from app.models.place import Place
from app.repositories import place_repository
from app.utils.normalize import normalize_name

#: Top candidate at/above this name-similarity is accepted automatically.
STRONG_MATCH = 0.82
#: Below this, we treat the search as a miss (no usable candidate).
WEAK_MATCH = 0.45
#: How many Google candidates to keep for the review UI when ambiguous.
MAX_OPTIONS = 5


@dataclass
class MatchOutcome:
    status: MatchStatus
    place: Place | None = None
    options: list[dict] | None = None


def score(extracted_name: str, candidate_name: str) -> float:
    """Name similarity in [0, 1] on normalized strings (order-insensitive enough)."""
    a, b = normalize_name(extracted_name), normalize_name(candidate_name)
    if not a or not b:
        return 0.0
    if a == b or a in b or b in a:
        return 1.0
    return SequenceMatcher(None, a, b).ratio()


def decide(extracted_name: str, candidates: list[PlaceCandidate]) -> tuple[MatchStatus, PlaceCandidate | None, list[PlaceCandidate]]:
    """Pure decision: given search results, pick a status + best candidate + options.

    - no candidate above WEAK_MATCH        -> unmatched
    - clear winner (>= STRONG, and ahead)  -> matched
    - otherwise                            -> needs_review (with ranked options)
    """
    ranked = sorted(candidates, key=lambda c: score(extracted_name, c.name), reverse=True)
    ranked = [c for c in ranked if score(extracted_name, c.name) >= WEAK_MATCH]
    if not ranked:
        return MatchStatus.unmatched, None, []

    best = ranked[0]
    best_score = score(extracted_name, best.name)
    runner_up = score(extracted_name, ranked[1].name) if len(ranked) > 1 else 0.0
    # Confident only if strong AND meaningfully ahead of the next option.
    if best_score >= STRONG_MATCH and (best_score - runner_up) >= 0.1:
        return MatchStatus.matched, best, ranked[:MAX_OPTIONS]
    return MatchStatus.needs_review, best, ranked[:MAX_OPTIONS]


def match(db: Session, extracted: ExtractedPlace) -> MatchOutcome:
    """Resolve one ExtractedPlace against Google Places and persist on a clear match.

    Only a `matched` result creates/updates a shared Place row; `needs_review`
    keeps the ranked options so the user can pick, `unmatched` keeps nothing.
    """
    # Only synthesize a match when we genuinely can't call Google (no key). If a
    # Places key IS set, run REAL matching even in fake-import mode — the fake parser
    # emits real restaurant names, so this resolves them to real google_place_ids.
    if settings.fake_imports and not settings.google_places_api_key:
        return _fake_match(db, extracted)

    candidates = text_search(extracted.name, region_hint=extracted.region_hint, limit=MAX_OPTIONS)
    status, best, options = decide(extracted.name, candidates)
    options_json = [c.model_dump() for c in options] or None

    if status is MatchStatus.matched and best is not None:
        place = place_repository.upsert_from_candidate(db, best)
        return MatchOutcome(status=status, place=place, options=options_json)
    return MatchOutcome(status=status, place=None, options=options_json)


def _fake_match(db: Session, extracted: ExtractedPlace) -> MatchOutcome:
    """Synthesize a confident match with deterministic fake coords (dev/test only)."""
    h = int(hashlib.md5(extracted.name.encode("utf-8")).hexdigest(), 16)
    # Anchor near Tainan or Taipei depending on the hint, with name-derived jitter.
    base_lat, base_lng = (22.99, 120.21) if (extracted.region_hint or "").find("台南") >= 0 else (25.033, 121.565)
    lat = round(base_lat + ((h % 1000) / 1000 - 0.5) * 0.06, 6)
    lng = round(base_lng + ((h // 1000 % 1000) / 1000 - 0.5) * 0.06, 6)
    candidate = PlaceCandidate(
        google_place_id=f"fake_{h % 10**12}",
        name=extracted.name,
        address=extracted.region_hint,
        lat=lat,
        lng=lng,
        rating=4.5,
        user_rating_count=100,
    )
    place = place_repository.upsert_from_candidate(db, candidate)
    return MatchOutcome(status=MatchStatus.matched, place=place, options=None)

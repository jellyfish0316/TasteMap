"""Extraction Service — turn one fetched unit into structured places.

This wraps `SourceParser.extract()` (which, for LLM platforms, calls the shared
extractor with the platform's own `extraction_guidance`; for Google Maps, builds
places deterministically). The pipeline calls this once PER unit so a profile/
channel fan-out runs as independent extractions.
"""
from __future__ import annotations

from app.integrations.base import ExtractedPlace, SourceContent, SourceParser


def extract(parser: SourceParser, unit: SourceContent) -> list[ExtractedPlace]:
    """Extract recommended places from a single SourceContent.

    Raises `app.core.errors.ParseError` on a unit-level failure; the caller isolates
    that so one bad post can't sink a whole import.
    """
    return parser.extract(unit)

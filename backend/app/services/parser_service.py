"""Parser Service — the seam between the app and the platform parsers.

Everything that needs a parser (the import pipeline, the dev preview) goes through
here instead of touching the registry directly, so URL→parser routing lives in one
place. The parsers themselves are owned by the 5 platform engineers; this service
just selects and drives them.
"""
from __future__ import annotations

from app.integrations.base import ParseResult, SourceContent, SourceParser
from app.integrations.registry import detect_platform, get_parser_for_url


def detect(url: str) -> str:
    """Return the platform id for a URL ('youtube', ...). Raises if unsupported."""
    return detect_platform(url)


def get_parser(url: str) -> SourceParser:
    """Resolve the parser instance that handles this URL (or raise UnsupportedSourceError)."""
    return get_parser_for_url(url)


def fetch(url: str) -> list[SourceContent]:
    """Scrape the platform and return one SourceContent per extraction unit."""
    return get_parser_for_url(url).fetch(url)


def preview(url: str) -> ParseResult:
    """Synchronous, DB-free parse — the dev/review path each parser owner uses."""
    return get_parser_for_url(url).parse(url)

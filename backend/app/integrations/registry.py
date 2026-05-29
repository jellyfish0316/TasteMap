"""Parser registry — maps a submitted URL to the right platform parser.

To add a platform: import its parser class and add it to PARSERS. That's the only
wiring needed; detection is by each parser's `url_patterns`.
"""
from __future__ import annotations

from app.core.config import settings
from app.core.errors import UnsupportedSourceError
from app.integrations.base import SourceParser
from app.integrations.fake_parser import FakeParser
from app.integrations.google_maps_parser import GoogleMapsParser
from app.integrations.instagram_parser import InstagramParser
from app.integrations.threads_parser import ThreadsParser
from app.integrations.x_parser import XParser
from app.integrations.youtube_parser import YouTubeParser

# One instance per platform (parsers are stateless).
PARSERS: list[SourceParser] = [
    GoogleMapsParser(),
    YouTubeParser(),
    InstagramParser(),
    ThreadsParser(),
    XParser(),
]

_FAKE_PARSER = FakeParser()


def get_parser_for_url(url: str) -> SourceParser:
    """Return the parser that handles `url`, or raise UnsupportedSourceError."""
    if settings.fake_imports:  # DEV/TEST: every url -> fake parser
        return _FAKE_PARSER
    for parser in PARSERS:
        if type(parser).can_handle(url):
            return parser
    raise UnsupportedSourceError(f"No parser registered for URL: {url}")


def detect_platform(url: str) -> str:
    """Return the platform id for a URL (e.g. 'youtube'), or raise."""
    return type(get_parser_for_url(url)).platform

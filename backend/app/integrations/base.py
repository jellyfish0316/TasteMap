"""TasteMap parser contract — the single source of truth for the import pipeline.

Every platform owner (Google Maps, YouTube, Instagram, Threads, X) implements ONE
subclass of `SourceParser`. The contract is intentionally tiny:

    URL  ──fetch()──►  SourceContent  ──extract()──►  list[ExtractedPlace]
                                                          │
                                          wrapped by parse() into a ParseResult

You normally only implement `fetch()`. The base class gives you a default
`extract()` that runs the SHARED LLM extractor on whatever text/segments/images
you collected, so every platform produces the exact same `ExtractedPlace` shape.

Downstream (Place Matching Service) takes each ExtractedPlace, searches Google
Places, and aligns it to a single `google_place_id`. That step is NOT your job —
just return clean, structured `ExtractedPlace` items and the rest is shared.

Read docs/parsers.md before you start.
"""
from __future__ import annotations

import re
from abc import ABC, abstractmethod
from typing import ClassVar

from pydantic import BaseModel, Field

from app.core.errors import ParseError

# --------------------------------------------------------------------------- #
# Canonical data formats — DO NOT diverge from these. Frontend, DB, and the
# place-matching step all depend on these exact fields.
# --------------------------------------------------------------------------- #


class ContentSegment(BaseModel):
    """One chunk of source content.

    Use multiple segments when a source covers multiple places (a YouTube video
    with chapters, an X thread, a multi-store reel). For a single-store post,
    one segment (or just `SourceContent.text`) is enough.
    """

    text: str = Field(..., description="Raw text of this chunk (caption line, transcript window, tweet).")
    timestamp_seconds: int | None = Field(
        None, description="Start time in the video/audio this chunk maps to. YouTube/reel only."
    )
    source_url: str | None = Field(
        None, description="Deep link to this exact chunk (e.g. youtu.be/ID?t=133, the specific post in a thread)."
    )


class SourceContent(BaseModel):
    """One EXTRACTION UNIT — the handoff from scraping to shared extraction.

    Crucial mental model: **one SourceContent == one LLM extraction call.**
      * a single post / single video  -> one SourceContent
      * a profile / channel           -> one SourceContent PER post/video
      * a thread / chaptered video    -> one SourceContent with several `segments`
        (shared context, a single cheaper call)

    `fetch()` returns a *list* of these. Fill in whatever the platform gives you;
    leave the rest as defaults.
    """

    platform: str
    source_url: str = Field(..., description="The original URL the user submitted.")
    source_type: str = Field(..., description="post | reel | profile | video | channel | thread | list | place")
    author: str | None = Field(None, description="Creator handle/username, e.g. tainan_foodie.")
    title: str | None = Field(None, description="Video title / page title / thread topic.")
    text: str = Field("", description="Primary text blob: caption + transcript + post body concatenated.")
    segments: list[ContentSegment] = Field(default_factory=list)
    image_urls: list[str] = Field(
        default_factory=list, description="Images for OCR (reel frames, post images) if the LLM step should read them."
    )
    suggested_collection_name: str | None = Field(
        None, description="A good default list name derived from the source (handle / video title / thread topic)."
    )
    raw: dict = Field(default_factory=dict, description="Anything extra you want to keep for debugging/audit.")


class ExtractedPlace(BaseModel):
    """One recommended restaurant extracted from a source — the unit the rest of
    TasteMap operates on. This is what your parser must ultimately produce.
    """

    name: str = Field(..., description="Restaurant name as recommended (NOT yet a google_place_id).")
    region_hint: str | None = Field(None, description="Locality clue to disambiguate matching: '台南', 'Tokyo Shibuya'.")
    address_hint: str | None = Field(None, description="Any address fragment mentioned, if available.")
    dishes: list[str] = Field(default_factory=list, description="Recommended dishes (推薦菜色).")
    summary: str | None = Field(None, description="Short why-go summary / key takeaway (重點評語).")
    quote: str | None = Field(None, description="A verbatim line from the source, if quotable.")
    context_tags: list[str] = Field(default_factory=list, description="Situation tags: 適合讀書, 約會, 排隊久, quiet, date-night.")
    timestamp_seconds: int | None = Field(None, description="Where in the video this place appears (YouTube jump-back).")
    source_url: str | None = Field(None, description="Deep link back to this specific recommendation.")
    is_ad: bool | None = Field(None, description="True if this reads as sponsored/業配.")
    is_negative: bool | None = Field(None, description="True if this is a warning / 踩雷 rather than a recommendation.")
    confidence: float | None = Field(None, ge=0, le=1, description="Parser/LLM confidence this is a real food rec.")


class ParseResult(BaseModel):
    """Final output of `SourceParser.parse()` — source metadata + extracted places.

    The Import Service persists this and shows the places as candidate cards the
    user reviews before saving into a collection.
    """

    platform: str
    source_url: str
    source_type: str
    author: str | None = None
    title: str | None = None
    suggested_collection_name: str | None = None
    places: list[ExtractedPlace] = Field(default_factory=list)
    #: How many extraction units were fetched, and how many failed (profile fan-out).
    units_total: int = 1
    units_failed: int = 0

    @property
    def stats(self) -> dict[str, int]:
        return {
            "units_total": self.units_total,
            "units_failed": self.units_failed,
            "extracted": len(self.places),
            "needs_review": sum(1 for p in self.places if (p.confidence or 1.0) < 0.6),
        }


# --------------------------------------------------------------------------- #
# The contract each platform owner implements.
# --------------------------------------------------------------------------- #


class SourceParser(ABC):
    """Base class for a single platform's importer.

    Required of every subclass:
      * `platform`     — a stable id ("youtube", "instagram", ...).
      * `url_patterns` — regexes; if any matches the URL, this parser handles it.
      * `fetch(url)`   — turn a URL into a SourceContent (the platform-specific work).

    Optional override:
      * `extract(content)` — default uses the shared LLM extractor. Override it if
        your platform gives structured place data directly (e.g. Google Maps),
        so you can skip the LLM entirely.
    """

    platform: ClassVar[str]
    url_patterns: ClassVar[list[str]] = []
    #: Set False if your platform never needs the LLM (you build ExtractedPlace yourself).
    uses_llm: ClassVar[bool] = True
    #: Platform-specific extraction guidance you OWN. Appended to the shared (fixed)
    #: format contract before the LLM runs — so you tune extraction quality without
    #: touching the canonical output format. See docs/parsers.md. Keep it stable so
    #: it stays prompt-cached.
    extraction_guidance: ClassVar[str | None] = None

    # ---- detection -------------------------------------------------------- #
    @classmethod
    def can_handle(cls, url: str) -> bool:
        return any(re.search(pattern, url, re.IGNORECASE) for pattern in cls.url_patterns)

    @classmethod
    def detect_source_type(cls, url: str) -> str:
        """Optional: classify the URL into post/profile/video/etc.

        Default returns 'unknown'. Override for nicer suggested names and routing.
        """
        return "unknown"

    # ---- the work you own ------------------------------------------------- #
    @abstractmethod
    def fetch(self, url: str) -> list[SourceContent]:
        """Scrape / call the platform API and return one SourceContent per unit.

        This is the ONLY method most platforms must implement.
          * single post / video -> return a 1-element list
          * profile / channel   -> return one SourceContent per post/video

        Raise `app.core.errors.ParseError` if the WHOLE fetch fails (e.g. the
        profile page is unreachable). For a profile, prefer skipping an individual
        bad post over failing everything — `parse()` already isolates per-unit
        extraction failures, but a post you can't even fetch should just be omitted.
        """
        raise NotImplementedError

    # ---- shared by default ------------------------------------------------ #
    def extract(self, content: SourceContent) -> list[ExtractedPlace]:
        """Turn raw content into structured ExtractedPlace items.

        Default: delegate to the shared LLM extractor so every platform yields the
        same shape. Override only if you can build ExtractedPlace deterministically.
        """
        if not self.uses_llm:
            raise NotImplementedError(
                f"{type(self).__name__} sets uses_llm=False but did not override extract()."
            )
        from app.integrations.llm_client import extract_places  # local import avoids cycles

        return extract_places(content, guidance=self.extraction_guidance)

    def parse(self, url: str) -> ParseResult:
        """Full pipeline for one URL. Usually you do NOT override this.

        Fans out across every unit fetch() returned, extracts each independently so
        one bad post can't sink a 120-post profile import, and flattens all places.
        Dedup of repeated restaurants happens DOWNSTREAM (keyed on google_place_id),
        not here.
        """
        units = self.fetch(url)
        places: list[ExtractedPlace] = []
        failed = 0
        for unit in units:
            try:
                places.extend(self.extract(unit))
            except ParseError:
                failed += 1  # isolate per-unit failure; keep going
        first = units[0] if units else None
        return ParseResult(
            platform=self.platform,
            source_url=url,
            source_type=self.detect_source_type(url),
            author=first.author if first else None,
            title=first.title if first else None,
            suggested_collection_name=first.suggested_collection_name if first else None,
            places=places,
            units_total=len(units),
            units_failed=failed,
        )

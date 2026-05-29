"""Google Maps parser — OWNER: <google maps engineer>.

Supports: single Place share URL, public List (saved-places) share URL.
SPECIAL CASE: places here are already explicit, so this parser sets
`uses_llm = False` and builds ExtractedPlace items deterministically — NO LLM.

Your job: implement `fetch()` to read the visible place(s) from the URL/page, then
the overridden `extract()` maps each one to an ExtractedPlace (name + address/region
hint). The shared Place Matching step still resolves each to a google_place_id.

What to fill in `fetch()`:
  - place: parse the Maps URL (and/or follow redirects on shortened maps.app.goo.gl
           links) to get the place name; emit a single ContentSegment with the name.
  - list:  read the publicly visible places on the list page; emit one
           ContentSegment per place (text = name, optionally address). Set
           suggested_collection_name to the list's title.

Note: there is no clean official API for a user's saved lists; design around a
PUBLIC / shared list URL whose places are visible on the page.

You may use app/integrations/google_maps_client.py for URL parsing helpers.
"""
from __future__ import annotations

import re

from app.core.errors import ParseError
from app.integrations.base import ContentSegment, ExtractedPlace, SourceContent, SourceParser


class GoogleMapsParser(SourceParser):
    platform = "google_maps"
    uses_llm = False  # places are explicit; no AI extraction needed
    url_patterns = [
        r"google\.[a-z.]+/maps",
        r"maps\.app\.goo\.gl/",
        r"goo\.gl/maps/",
    ]

    @classmethod
    def detect_source_type(cls, url: str) -> str:
        # A shared saved-list URL contains a list token; otherwise treat as a place.
        if re.search(r"/maps/.*list", url) or "shortlink=list" in url:
            return "list"
        return "place"

    def fetch(self, url: str) -> list[SourceContent]:
        # place -> [one SourceContent with a single segment (the place name)]
        # list  -> [one SourceContent with one segment PER place on the list]
        #          (no LLM here, so one content with many segments is fine)
        # TODO(google maps owner): implement.
        raise ParseError("GoogleMapsParser.fetch not implemented yet")

    def extract(self, content: SourceContent) -> list[ExtractedPlace]:
        """Deterministic mapping — each fetched place becomes one ExtractedPlace."""
        segments = content.segments or [ContentSegment(text=content.text)]
        places: list[ExtractedPlace] = []
        for seg in segments:
            name = seg.text.strip()
            if not name:
                continue
            places.append(
                ExtractedPlace(
                    name=name,
                    source_url=seg.source_url or content.source_url,
                    confidence=1.0,  # the user explicitly chose this place
                )
            )
        return places

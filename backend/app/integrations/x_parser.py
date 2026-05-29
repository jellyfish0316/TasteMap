"""X / Twitter parser — OWNER: <x engineer>.

Supports: Single Post URL, Thread URL, Profile URL.
Your job: turn the URL into a SourceContent. The shared LLM step does extraction.

What to fill in `fetch()`:
  - post:    the tweet text.
  - thread:  all related posts in the thread — emit ONE ContentSegment per post
             (with its own source_url) so the LLM can attribute each place to the
             right tweet. Threads often ARE ranked lists, so this maps cleanly to
             multiple ExtractedPlace items.
  - profile: recent posts via GET /2/users/{id}/tweets; filter to food posts.

Reference: X API v2 (GET /2/users/{id}/tweets). Profile import is well-supported.
"""
from __future__ import annotations

import re

from app.core.errors import ParseError
from app.integrations.base import SourceContent, SourceParser


class XParser(SourceParser):
    platform = "x"
    url_patterns = [r"(twitter\.com|x\.com)/"]
    # TODO(x owner): tune this. You own extraction quality; not the format.
    extraction_guidance = (
        "Input is terse posts; a thread is often a ranked list — emit one place per "
        "tweet/segment and set each place's source_url to that tweet. Posts are "
        "short, so confidence should reflect how explicit the recommendation is."
    )

    @classmethod
    def detect_source_type(cls, url: str) -> str:
        # A status URL is a post or thread; bare /<handle> is a profile.
        if re.search(r"/status/\d+", url):
            return "post"  # promote to "thread" in fetch() if it has replies by same author
        return "profile"

    def fetch(self, url: str) -> list[SourceContent]:
        # post    -> [one SourceContent]
        # thread  -> [one SourceContent with one ContentSegment per tweet]
        #            (keep thread context together -> single cheaper LLM call)
        # profile -> one SourceContent PER recent food post
        # TODO(x owner): implement.
        raise ParseError("XParser.fetch not implemented yet")

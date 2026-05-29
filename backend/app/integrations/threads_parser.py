"""Threads parser — OWNER: <threads engineer>.

Supports: Single Post URL, Profile URL (profile scan can be a later/advanced phase).
Your job: turn the URL into a SourceContent. The shared LLM step does extraction.

What to fill in `fetch()`:
  - post:    visible post text. Threads posts are short, situational write-ups —
             great for context_tags (適合讀書, 約會, 排隊久). Just give the LLM the
             text; it fills those tags.
  - profile: scan public posts, filter to food, merge.

Reference: like Instagram, public post import first; profile scan as advanced.
"""
from __future__ import annotations

import re

from app.core.errors import ParseError
from app.integrations.base import SourceContent, SourceParser


class ThreadsParser(SourceParser):
    platform = "threads"
    url_patterns = [r"threads\.(net|com)/"]
    # TODO(threads owner): tune this. You own extraction quality; not the format.
    extraction_guidance = (
        "Input is short situational write-ups. Be aggressive about context_tags "
        "(適合讀書, 約會, 排隊久, 安靜, CP值高) — that's Threads' strength. Keep "
        "summary to the one-line vibe; don't invent dishes that aren't mentioned."
    )

    @classmethod
    def detect_source_type(cls, url: str) -> str:
        # Post URLs look like threads.net/@user/post/<id>; bare @user is a profile.
        if re.search(r"/post/", url):
            return "post"
        return "profile"

    def fetch(self, url: str) -> list[SourceContent]:
        # post    -> [one SourceContent]
        # profile -> one SourceContent PER food post
        # TODO(threads owner): implement. Put visible post text in `text`.
        raise ParseError("ThreadsParser.fetch not implemented yet")

"""YouTube parser — OWNER: <youtube engineer>.

Supports: Video URL, Channel URL.
Your job: turn the URL into a SourceContent. The shared LLM step does extraction.

What to fill in `fetch()`:
  - video:   title, description, chapters, transcript (use youtube-transcript-api
             or the captions fallback). Put the transcript in `text`, and ideally
             emit one ContentSegment per chapter/transcript window WITH
             `timestamp_seconds` + a `source_url` like https://youtu.be/<id>?t=<sec>
             — this is what powers TasteMap's "jump back to the moment" feature.
  - channel: list recent food videos, fetch each, and merge their segments.

Reference: YouTube Data API for metadata; youtube-transcript-api for transcripts.
"""
from __future__ import annotations

import re

from app.core.errors import ParseError
from app.integrations.base import SourceContent, SourceParser


class YouTubeParser(SourceParser):
    platform = "youtube"
    url_patterns = [
        r"youtube\.com/watch\?v=",
        r"youtu\.be/",
        r"youtube\.com/(@|channel/|c/)",
    ]
    # TODO(youtube owner): tune this. You own extraction quality; not the format.
    extraction_guidance = (
        "Input is a spoken-video transcript, often with timestamps. For EACH "
        "restaurant, set timestamp_seconds to when it is first discussed and "
        "source_url to the deep link of that segment. Transcripts are messy/ASR — "
        "infer the real restaurant name. Capture the host's verdict in summary."
    )

    @classmethod
    def detect_source_type(cls, url: str) -> str:
        if re.search(r"(@|channel/|c/)", url):
            return "channel"
        return "video"

    def fetch(self, url: str) -> list[SourceContent]:
        # video  -> return [one SourceContent] (one LLM call, segments per chapter)
        # channel-> return [one SourceContent per food video]
        # TODO(youtube owner): implement. Build segments with timestamp_seconds.
        raise ParseError("YouTubeParser.fetch not implemented yet")
        # Example (single video):
        # return [SourceContent(
        #     platform=self.platform,
        #     source_url=url,
        #     source_type=self.detect_source_type(url),
        #     author=channel_handle,
        #     title=video_title,
        #     text=full_transcript,
        #     segments=[ContentSegment(text=chunk, timestamp_seconds=t,
        #                              source_url=f"https://youtu.be/{vid}?t={t}")],
        #     suggested_collection_name=video_title,
        # )]

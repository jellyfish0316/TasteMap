"""Instagram parser — OWNER: <instagram engineer>.

Supports: Profile URL, Post URL, Reel URL. (MVP: public content only — no stories,
no private accounts, no comments.)
Your job: turn the URL into a SourceContent. The shared LLM step does extraction.

What to fill in `fetch()`:
  - post:    caption + creator handle (oEmbed gives embed HTML + basic metadata);
             add image_urls so the LLM step can OCR text baked into images.
  - reel:    caption + hashtags + on-screen text (OCR of frames) into `text`/
             `image_urls`; audio transcript optional.
  - profile: scrape the public post list, fetch each post/reel, merge results.
             Set suggested_collection_name to e.g. "@<handle> 推薦地圖".

Reference: Instagram oEmbed for single-post preview/metadata; a scraper for the
public profile feed. Caption text is often the richest signal.
"""
from __future__ import annotations

import re

from app.core.errors import ParseError
from app.integrations.base import SourceContent, SourceParser


class InstagramParser(SourceParser):
    platform = "instagram"
    url_patterns = [r"instagram\.com/"]
    # TODO(instagram owner): tune this. You own extraction quality; not the format.
    extraction_guidance = (
        "Input is a caption (emoji/hashtags) plus any OCR'd on-screen text. Treat "
        "text baked into images as primary signal. Set is_ad=true on sponsored/業配 "
        "posts and is_negative=true on 踩雷. Pull dishes from hashtags when relevant."
    )

    @classmethod
    def detect_source_type(cls, url: str) -> str:
        if re.search(r"instagram\.com/reel/", url):
            return "reel"
        if re.search(r"instagram\.com/p/", url):
            return "post"
        return "profile"

    def fetch(self, url: str) -> list[SourceContent]:
        # post/reel -> return [one SourceContent]
        # profile   -> return one SourceContent PER post/reel (each gets its own
        #              LLM extraction; one bad post won't sink the whole import)
        # TODO(instagram owner): implement. Put caption/OCR text in `text`,
        # frame/post images in `image_urls`.
        raise ParseError("InstagramParser.fetch not implemented yet")

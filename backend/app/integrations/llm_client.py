"""Shared LLM extractor — turns raw SourceContent into structured ExtractedPlace[].

This is the SHARED extraction step every platform parser uses by default
(`SourceParser.extract`). Platform owners normally do NOT touch this file; you
just feed it good `SourceContent` and it returns the canonical place format.

The backend is selectable via `LLM_PROVIDER` (anthropic | openai):
  * anthropic — uses prompt caching; the long system prompt (extraction rules +
    JSON schema) is marked `cache_control`, so repeated imports reuse the cached
    prefix and only pay for the per-source content.
  * openai — uses Chat Completions JSON mode (`response_format=json_object`);
    gpt-4o models cache long prompt prefixes automatically.
Either way the output is the same canonical `ExtractedPlace[]`.
"""
from __future__ import annotations

import json
from typing import TYPE_CHECKING

from app.core.config import settings
from app.core.errors import ParseError
from app.integrations.base import ExtractedPlace, SourceContent

if TYPE_CHECKING:
    from anthropic import Anthropic
    from openai import OpenAI

_anthropic_client: "Anthropic | None" = None
_openai_client: "OpenAI | None" = None


def _get_anthropic_client() -> "Anthropic":
    global _anthropic_client
    if _anthropic_client is None:
        if not settings.anthropic_api_key:
            raise ParseError("ANTHROPIC_API_KEY is not set; cannot run LLM extraction.")
        from anthropic import Anthropic

        _anthropic_client = Anthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


def _get_openai_client() -> "OpenAI":
    global _openai_client
    if _openai_client is None:
        if not settings.openai_api_key:
            raise ParseError("OPENAI_API_KEY is not set; cannot run LLM extraction.")
        from openai import OpenAI

        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


# --------------------------------------------------------------------------- #
# The prompt is two blocks:
#   1. _FORMAT_CONTRACT  — SHARED & FIXED. Guarantees every platform emits the same
#                          ExtractedPlace shape. Do NOT let platform owners edit this.
#   2. <guidance>        — per-platform, owner-authored (SourceParser.extraction_guidance):
#                          platform quirks, what to emphasize, few-shot examples.
# Both are sent as separate cache_control system blocks, so each stays prompt-cached.
# --------------------------------------------------------------------------- #

# Stable, cacheable format contract. Keep edits rare so the cache stays warm.
_FORMAT_CONTRACT = """\
You extract restaurant / food-spot recommendations from social media content for \
TasteMap. The content may be a caption, a video transcript, an X thread, or OCR'd \
on-screen text, in any language (often Traditional Chinese or English).

Return ONLY restaurants that are genuinely recommended (or warned against). Ignore \
generic chatter. If the content mentions multiple places, return one object per place.

For each place produce this exact JSON shape:
{
  "name": str,                      // restaurant name as said in the content
  "region_hint": str | null,        // locality clue for matching, e.g. "台南", "Tokyo"
  "address_hint": str | null,
  "dishes": [str],                  // recommended dishes
  "summary": str | null,            // one-line why-go takeaway
  "quote": str | null,              // a short verbatim line if quotable
  "context_tags": [str],            // situational tags: 適合讀書, 約會, quiet, queue-long...
  "timestamp_seconds": int | null,  // when the place appears, if the source has timestamps
  "source_url": str | null,         // deep link to this specific mention if available
  "is_ad": bool | null,             // true if sponsored / 業配
  "is_negative": bool | null,       // true if it's a warning / 踩雷
  "confidence": number              // 0..1, your confidence this is a real food rec
}

Respond with a JSON object: {"places": [ ... ]}. No prose, no markdown fences.
"""


def _build_user_content(content: SourceContent) -> str:
    parts: list[str] = [
        f"platform: {content.platform}",
        f"source_type: {content.source_type}",
        f"source_url: {content.source_url}",
    ]
    if content.author:
        parts.append(f"author: {content.author}")
    if content.title:
        parts.append(f"title: {content.title}")
    if content.text:
        parts.append(f"\n--- text ---\n{content.text}")
    for i, seg in enumerate(content.segments):
        ts = f" @ {seg.timestamp_seconds}s" if seg.timestamp_seconds is not None else ""
        link = f" ({seg.source_url})" if seg.source_url else ""
        parts.append(f"\n--- segment {i}{ts}{link} ---\n{seg.text}")
    # image_urls are passed as references; wire real vision input here if/when needed.
    if content.image_urls:
        parts.append("\n--- images (URLs; OCR/caption if relevant) ---\n" + "\n".join(content.image_urls))
    return "\n".join(parts)


def extract_places(content: SourceContent, *, guidance: str | None = None) -> list[ExtractedPlace]:
    """Run the shared LLM extraction and return validated ExtractedPlace items.

    `guidance` is the calling platform's `extraction_guidance`: appended after the
    fixed format contract to tune extraction for that platform, without changing the
    output shape. Routes to the backend named by `LLM_PROVIDER`.
    """
    user_content = _build_user_content(content)
    provider = settings.llm_provider.lower()
    if provider == "openai":
        text = _complete_openai(user_content, guidance)
    elif provider == "anthropic":
        text = _complete_anthropic(user_content, guidance)
    else:
        raise ParseError(f"Unknown LLM_PROVIDER {settings.llm_provider!r}; use 'anthropic' or 'openai'.")

    text = text.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ParseError(f"LLM returned non-JSON output: {text[:200]}") from exc

    return [ExtractedPlace.model_validate(item) for item in data.get("places", [])]


def _complete_anthropic(user_content: str, guidance: str | None) -> str:
    client = _get_anthropic_client()
    system: list[dict] = [
        {"type": "text", "text": _FORMAT_CONTRACT, "cache_control": {"type": "ephemeral"}}
    ]
    if guidance:
        system.append(
            {
                "type": "text",
                "text": f"Platform-specific guidance:\n{guidance}",
                "cache_control": {"type": "ephemeral"},
            }
        )
    try:
        resp = client.messages.create(
            model=settings.llm_model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user_content}],
        )
    except Exception as exc:  # network / API errors
        raise ParseError(f"LLM extraction failed: {exc}") from exc
    return "".join(block.text for block in resp.content if block.type == "text")


def _complete_openai(user_content: str, guidance: str | None) -> str:
    client = _get_openai_client()
    system_text = _FORMAT_CONTRACT
    if guidance:
        system_text += f"\n\nPlatform-specific guidance:\n{guidance}"
    try:
        resp = client.chat.completions.create(
            model=settings.openai_model,
            max_tokens=4096,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_text},
                {"role": "user", "content": user_content},
            ],
        )
    except Exception as exc:  # network / API errors
        raise ParseError(f"LLM extraction failed: {exc}") from exc
    return resp.choices[0].message.content or ""

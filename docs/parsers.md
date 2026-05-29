# Platform Parsers — Contributor Guide

This is the guide for the 5 platform owners. Each person owns **one** importer:

| Platform | Owner | File | LLM extraction? |
|----------|-------|------|-----------------|
| Google Maps | _name_ | `backend/app/integrations/google_maps_parser.py` | No (places are explicit) |
| YouTube | _name_ | `backend/app/integrations/youtube_parser.py` | Yes (shared) |
| Instagram | _name_ | `backend/app/integrations/instagram_parser.py` | Yes (shared) |
| Threads | _name_ | `backend/app/integrations/threads_parser.py` | Yes (shared) |
| X / Twitter | _name_ | `backend/app/integrations/x_parser.py` | Yes (shared) |

You all implement the **same contract** and emit the **same output format**, so the
rest of TasteMap (place matching → collections → map) works identically no matter
where the data came from.

---

## The one rule

> Take a URL → produce a **list of `SourceContent`** (one per extraction unit).
> Return it from `fetch()`. The shared pipeline does the rest
> (LLM extraction per unit → google_place_id matching → dedup).

You normally implement **exactly one method**: `fetch(self, url) -> list[SourceContent]`.

The contract and both data formats live in
[`backend/app/integrations/base.py`](../backend/app/integrations/base.py). Read it first.

### One SourceContent == one LLM extraction unit

This is the key concept. Decide your granularity per `source_type`:

| Source | What `fetch()` returns |
|--------|------------------------|
| single post / single video | `[1 SourceContent]` |
| **profile / channel** | **one SourceContent per post/video** — each extracted independently |
| thread / chaptered video | `[1 SourceContent with N segments]` (keep context together = one cheaper call) |

So a 120-post profile becomes 120 units, each its own LLM call — one bad post can't
sink the whole import, and you never blow the context window. **Merging duplicate
restaurants is NOT your job** — that happens downstream, keyed on `google_place_id`.

---

## The pipeline

```
URL ──get_parser_for_url()──► YourParser
        │
        ├─ fetch(url)      ← YOU implement (platform scraping/API)
        │     └─► list[SourceContent]   (one per post/video; raw text/segments/images)
        │
        ├─ extract(unit)   ← SHARED (LLM), run once PER unit. Override only for Google Maps.
        │     └─► list[ExtractedPlace]
        │
        └─ parse(url)      ← SHARED. Fans out over units (per-unit failure isolation),
                  └─► ParseResult  → place matching → google_place_id → dedup → collection
```

## What you produce: `SourceContent`

Fill in whatever the platform gives you; leave the rest as defaults.

| Field | Use it for |
|-------|-----------|
| `platform`, `source_url`, `source_type` | identity (already known from the URL) |
| `author`, `title` | creator handle, video/page title |
| `text` | the main blob: caption + transcript + post body |
| `segments[]` | **multi-place** sources — one chunk per place. Carry `timestamp_seconds` (YouTube) and a deep-link `source_url` (thread post, video moment) |
| `image_urls[]` | images the LLM step should OCR (reel frames, post images) |
| `suggested_collection_name` | a good default list name (handle / video title / thread topic) |

The shared LLM step reads `text` + `segments` + `image_urls` and returns clean
`ExtractedPlace` items — **you don't write extraction logic** (except Google Maps,
which sets `uses_llm = False` and builds places deterministically; the override is
already written for you there).

## Tuning your extraction prompt (you own this)

The LLM prompt is two blocks:

1. **Format contract** — shared & fixed in `llm_client.py`. Guarantees the
   `ExtractedPlace` shape. **Don't touch it.**
2. **Your guidance** — set `extraction_guidance` on your parser class. This is where
   you encode platform quirks, what to emphasize, and (optionally) few-shot examples.

```python
class YouTubeParser(SourceParser):
    extraction_guidance = (
        "Input is a spoken-video transcript with timestamps. For each restaurant, "
        "set timestamp_seconds and a deep-link source_url to that moment..."
    )
```

It's appended after the format contract and sent as its own prompt-cached block, so
you control extraction **quality** without changing the **output format**. Each stub
already ships a starter `extraction_guidance` — refine it for your platform. (Google
Maps has none: it sets `uses_llm = False` and builds places deterministically.)

## Detection is automatic

Your parser declares `url_patterns` (regexes). The
[`registry`](../backend/app/integrations/registry.py) routes any matching URL to you.
Nothing else to wire. Refine `detect_source_type()` so post vs profile vs video is
classified correctly.

---

## Dev loop: test your parser end to end

```bash
docker compose -f ../infra/docker-compose.yml up -d   # Postgres+PostGIS + Redis

cd backend
python3.12 -m venv .venv            # one-time (needs Python >= 3.11)
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env                # add ANTHROPIC_API_KEY + GOOGLE_PLACES_API_KEY

alembic upgrade head                # create the schema (one-time / after model changes)
uvicorn app.main:app --reload       # http://localhost:8000/docs
```

> The preview endpoint is stateless, so you can iterate on `fetch()` without the DB
> up. You only need Postgres for the persisted flow (jobs/candidates/collections).

Then hit the synchronous preview endpoint with YOUR url:

```bash
curl -s localhost:8000/api/v1/imports/preview \
  -H 'content-type: application/json' \
  -d '{"url":"https://youtu.be/VIDEO_ID"}' | jq
```

You get back the detected platform, source type, and the extracted `places[]` in
the canonical format. Iterate on `fetch()` until the places look right.

> Before you implement `fetch()`, the endpoint returns a clean
> `502 parse_error: "<Parser>.fetch not implemented yet"` — that's expected.

## Definition of done (per platform)

- [ ] `fetch()` handles every `source_type` your platform supports and returns a `list[SourceContent]`
- [ ] profile/channel fans out to one `SourceContent` per post/video; single posts return a 1-element list
- [ ] multi-place single-unit sources (thread / chaptered video) emit one `segment` per place (with `timestamp_seconds` / `source_url` where applicable)
- [ ] `suggested_collection_name` set to something sensible
- [ ] `extraction_guidance` tuned for your platform (you own quality, not the format)
- [ ] `preview` returns correct `ExtractedPlace` items for 2–3 real URLs
- [ ] failures raise `app.core.errors.ParseError` (never crash the worker)
- [ ] no extra fields invented — stick to the canonical format

## Don't (MVP scope)

- No private accounts, stories, comments, or login-gated content.
- Tune your prompt via `extraction_guidance` only — don't edit the **format contract**
  in `llm_client.py`, and don't change `base.py` or `google_places_client.py` without
  telling the team. Those are shared contracts.
- Don't resolve `google_place_id` yourself — that's the shared Place Matching step.

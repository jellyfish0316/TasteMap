# Platform Parsers — Contributor Guide

Everything a platform owner needs: **set up → where you write → how to test**.

TasteMap turns a social-media link into restaurant cards pinned on a map. Five of us
each own **one** importer; they all implement the **same contract** and emit the
**same output**, so the rest of the app (place matching → collections → map → social)
works identically no matter where the data came from.

| Platform | Owner | File you edit | Your `.env` key | LLM extraction? |
|----------|-------|---------------|------------------|-----------------|
| Google Maps | _name_ | [`google_maps_parser.py`](../backend/app/integrations/google_maps_parser.py) | `GOOGLE_MAPS_API_KEY` | No (places are explicit) |
| YouTube | _name_ | [`youtube_parser.py`](../backend/app/integrations/youtube_parser.py) | `YOUTUBE_API_KEY` | Yes (shared) |
| Instagram | _name_ | [`instagram_parser.py`](../backend/app/integrations/instagram_parser.py) | `INSTAGRAM_TOKEN` | Yes (shared) |
| Threads | _name_ | [`threads_parser.py`](../backend/app/integrations/threads_parser.py) | `THREADS_TOKEN` | Yes (shared) |
| X / Twitter | _name_ | [`x_parser.py`](../backend/app/integrations/x_parser.py) | `X_BEARER_TOKEN` | Yes (shared) |

> The 6th teammate owns the shared backend/pipeline/frontend — the contract files
> (`base.py`, `llm_client.py`, `google_places_client.py`), matching, and the app. If you
> think you need to change one of those, talk to them first.

---

## 1. Set up your machine (one-time)

**macOS, Linux, and Windows all work** — the backend is pure Python. Only the Docker
engine install and the virtualenv-activate command differ by OS. You need **Python
3.11+** and **Docker** (for Postgres + Redis).

### 1a. Install the Docker engine

| OS | How |
|----|-----|
| **Linux** | Docker Engine + Compose plugin via your package manager, e.g. `sudo apt install docker.io docker-compose-plugin`. Add yourself to the `docker` group (`sudo usermod -aG docker $USER`, then re-login). |
| **Windows** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) **with the WSL2 backend** — then do all the steps below *inside* your WSL2 Ubuntu shell (recommended), so paths/line-endings behave. |
| **macOS** | Docker Desktop, or [Colima](https://github.com/abiosoft/colima): `brew install colima docker docker-compose && colima start`. |

### 1b. Start the infra (same on every OS)

```bash
cd TasteMap
docker compose -f infra/docker-compose.yml up -d     # Postgres+PostGIS + Redis
```

> ⚠️ **`docker compose` vs `docker-compose`.** Modern Docker (Desktop, Linux engine) uses
> the v2 spelling `docker compose` shown above. If that errors with
> `unknown shorthand flag: 'f'`, you have v1 — use the **hyphenated** `docker-compose`
> instead (this is the common case on Colima). They're otherwise equivalent.

### 1c. Backend + config

```bash
cd backend
python3 -m venv .venv          # Windows: py -3 -m venv .venv

# Activate the venv:
source .venv/bin/activate       # macOS / Linux / WSL / Git-Bash
# .venv\Scripts\Activate.ps1    # Windows PowerShell
# .venv\Scripts\activate.bat    # Windows cmd.exe

pip install -e '.[dev]'

cp .env.example .env            # Windows cmd: copy .env.example .env  — then edit it

alembic upgrade head            # create the DB schema (re-run after model changes)
uvicorn app.main:app --reload   # http://localhost:8000/docs
```

> ⚠️ **zsh/bash eats `#`.** Don't paste trailing `# comments` onto shell commands —
> the shell can treat `#` literally, so `cp .env.example .env # foo` fails with a
> confusing error and your `.env` never gets created. Run the bare command (in zsh you
> can also `setopt interactive_comments` first).

### What to put in `.env`

The defaults already point at the docker-compose Postgres/Redis. You only need to add
the keys for **your** work:

| Key | Who needs it | Notes |
|-----|--------------|-------|
| `ANTHROPIC_API_KEY` | YouTube / IG / Threads / X | Powers the shared LLM extractor. Not needed for Google Maps or FAKE_IMPORTS. |
| `GOOGLE_PLACES_API_KEY` | everyone (for real matching) | Aligns extracted names to a `google_place_id`. **Must enable “Places API (New)”** — see Troubleshooting. |
| your platform key (table above) | you | Whatever your scraper/API client needs. |
| `FAKE_IMPORTS` | — | `true` to test the whole flow with no scraping/keys (see §3a). Turn **off** to run your real parser. |
| `CELERY_TASK_ALWAYS_EAGER` | — | `true` (default) runs imports inline, so you don't need a separate Celery worker in dev. |

---

## 2. Where you write — the one rule

> Take a URL → produce a **list of `SourceContent`** (one per extraction unit) and
> return it from `fetch()`. The shared pipeline does the rest (LLM extraction per unit
> → `google_place_id` matching → dedup → cards).

You normally implement **exactly one method**: `fetch(self, url) -> list[SourceContent]`.
The contract and data formats are in [`base.py`](../backend/app/integrations/base.py) —
**read it first.** Your file is a stub today with `fetch()` raising
`ParseError("…not implemented yet")` and an example in comments.

In **your parser file** you own four things:

```python
class YouTubeParser(SourceParser):
    platform = "youtube"                      # 1. stable id
    url_patterns = [r"youtu\.be/", r"youtube\.com/watch\?v="]   # 2. detection regexes

    extraction_guidance = "Input is a transcript… set timestamp_seconds…"  # 3. your prompt tuning

    @classmethod
    def detect_source_type(cls, url): ...      # 4. post|video|profile|thread…

    def fetch(self, url) -> list[SourceContent]:   # ← THE WORK: scrape/API → SourceContent[]
        ...
```

### `SourceContent`: one == one LLM extraction unit

This is the key decision. Pick your granularity per `source_type`:

| Source | What `fetch()` returns |
|--------|------------------------|
| single post / single video | `[1 SourceContent]` |
| **profile / channel** | **one SourceContent per post/video** (each extracted independently) |
| thread / chaptered video | `[1 SourceContent with N segments]` (shared context = one cheaper call) |

A 120-post profile → 120 units → 120 isolated LLM calls; one bad post can't sink the
import, and you never blow the context window. **Merging duplicate restaurants is NOT
your job** — that happens downstream, keyed on `google_place_id`.

Fill in what the platform gives you; leave the rest as defaults:

| Field | Use it for |
|-------|-----------|
| `platform`, `source_url`, `source_type` | identity (known from the URL) |
| `author`, `title` | creator handle, video/page title |
| `text` | the main blob: caption + transcript + post body |
| `segments[]` | multi-place sources — one chunk per place; carry `timestamp_seconds` (YouTube) + a deep-link `source_url` |
| `image_urls[]` | images the LLM step should OCR (reel frames, post images) |
| `suggested_collection_name` | default list name (handle / video title / thread topic) |

### Extraction quality is yours; the format is not

The LLM prompt is two blocks. The **format contract** (the `ExtractedPlace` JSON shape)
is fixed and shared in [`llm_client.py`](../backend/app/integrations/llm_client.py) —
**don't touch it.** Your **`extraction_guidance`** string is appended after it (as its
own prompt-cached block) to encode platform quirks, what to emphasize, and few-shot
examples. Tune that freely; keep it stable so it stays cached.

> **Google Maps is the exception:** it sets `uses_llm = False` and overrides
> `extract()` to build `ExtractedPlace` deterministically from the list/place data — no
> LLM. That override is already scaffolded for you.

### Detection is automatic

Your `url_patterns` register you with the
[`registry`](../backend/app/integrations/registry.py). Any matching URL routes to you —
nothing else to wire.

### The pipeline (for context)

```
URL ──get_parser_for_url()──► YourParser
        ├─ fetch(url)      ← YOU: platform scraping/API → list[SourceContent]
        ├─ extract(unit)   ← SHARED LLM, once PER unit (override only for Google Maps)
        └─ parse(url)      ← SHARED: fans out over units, isolates per-unit failures
                  └─► ParseResult → place matching → google_place_id → dedup → cards
```

---

## 3. How to test your result

Three levels, smallest loop first.

> **Parser owners only need to use the backend preview endpoint for parser work.**
> The web client is not actively maintained right now, and not everyone has a Mac for
> testing the mobile end-to-end flow, so those are **not required** for parser
> validation. If the preview response has the right platform/source type, stats, and
> canonical `places[]`, your parser side is ready to review.

### a) See the whole app work *without* your parser — `FAKE_IMPORTS`

Before (or while) you build `fetch()`, prove your machine + the full flow are healthy.
In `.env` set `FAKE_IMPORTS=true`, restart uvicorn, then in the frontend paste **any**
URL and import. A built-in fake parser returns canned Tainan restaurants and they flow
all the way to the map. (With no `GOOGLE_PLACES_API_KEY`, matching is faked too; with a
key set, the fake names get **real** `google_place_id`s.) Turn `FAKE_IMPORTS=false` to
run your real parser.

### b) Iterate on `fetch()` — the preview endpoint (the main parser test)

The preview endpoint runs your parser **synchronously** and returns the extracted
places — the tightest loop for developing `fetch()`. This is the default way to test
and review parser changes:

```bash
curl -s localhost:8000/api/v1/imports/preview \
  -H 'content-type: application/json' \
  -d '{"url":"https://youtu.be/VIDEO_ID"}' | jq
```

You get back the detected `platform`, `source_type`, `stats`, and `places[]` in the
canonical format. Iterate until the places look right.

> Before you implement `fetch()`, this returns a clean
> `502 parse_error: "<Parser>.fetch not implemented yet"` — that's expected.

You can also drive it from Python without HTTP:

```python
from app.services import import_service
print(import_service.preview("https://youtu.be/VIDEO_ID").model_dump_json(indent=2))
```

### c) Optional full end-to-end — import → review → map

With `FAKE_IMPORTS=false`, Postgres up, and your keys set, use the real async flow:
`POST /imports` (returns a job) → poll `GET /imports/{id}` → `GET /imports/{id}/candidates`
→ `POST /imports/{id}/confirm`. This is useful for the pipeline/app owner, but parser
owners do **not** need to complete it before review. The interactive API docs at
`http://localhost:8000/docs` let you click through every endpoint if you want to test
the full backend flow.

---

## 4. Project conventions

### Adding a Python dependency (your scraper needs a library)

Dependencies are declared in **[`backend/pyproject.toml`](../backend/pyproject.toml)** —
**not** a `requirements.txt`, and there's no separate lockfile. To add one:

1. Add it to the `[project].dependencies` list (runtime dep) — or `[project.optional-dependencies].dev`
   if it's only for tests/tooling. **Pin a sensible floor**, matching the existing style:
   ```toml
   dependencies = [
       ...
       "youtube-transcript-api>=0.6",     # YouTube owner
       "instaloader>=4.10",               # Instagram owner
   ]
   ```
2. Reinstall into your venv so it's available locally:
   ```bash
   cd backend && source .venv/bin/activate
   pip install -e '.[dev]'
   ```
3. **Commit `pyproject.toml`.** That file *is* how your dependency reaches teammates and
   CI — CI runs `pip install -e '.[dev]'` from it on every push, so anything not in
   `pyproject.toml` will fail for everyone else even if it works on your machine.

Guidelines: keep deps **minimal and scoped** to your parser; prefer well-maintained
libraries; don't pin an exact `==` version unless you must (it causes resolver conflicts
across the 5 parsers); and flag anything heavy (native builds, huge transitive trees) to
the pipeline owner before adding it.

### Adding a credential or config value

All config flows through **[`app/core/config.py`](../backend/app/core/config.py)**
(pydantic-settings, reads `.env`). To add a new secret/setting:

1. Add a field to the `Settings` class (snake_case; the env var is the UPPER_CASE form):
   ```python
   class Settings(BaseSettings):
       ...
       youtube_api_key: str = ""        # ← reads YOUTUBE_API_KEY from .env
   ```
   *(The five platform keys already exist — only add if you need something new.)*
2. Add it to **`backend/.env.example`** with an empty/default value and a comment, so
   teammates know it exists. **Never commit a real secret** — `.env` is gitignored;
   `.env.example` is the template.
3. Read it in your parser via `from app.core.config import settings` → `settings.youtube_api_key`.
   Raise `ParseError("YOUTUBE_API_KEY is not set")` if a required key is missing.

### Code style & checks (CI enforces these)

```bash
cd backend && source .venv/bin/activate
ruff check .            # lint — must pass (CI runs this on every push/PR)
ruff check . --fix      # auto-fix what it can
ruff format .           # format (line length 100)
pytest                  # run tests
```

Ruff config lives in `pyproject.toml` (`line-length = 100`, rules `E,F,I,B,UP`). Imports
are auto-sorted (`I`). **A failing `ruff check` blocks the PR**, so run it before pushing.

### Git workflow

- Branch off `main`; **don't push directly to `main`.** Open a PR.
- CI (lint + smoke test) runs on every push and must be green to merge.
- Keep your PR scoped to **your** parser file (+ `pyproject.toml` / `config.py` /
  `.env.example` if you added a dep/setting). Touching shared contract files
  (`base.py`, `llm_client.py`, `google_places_client.py`) needs the pipeline owner's sign-off.

### Writing robust `fetch()` (network code)

- Wrap platform/API failures and raise **`app.core.errors.ParseError`** — never let a raw
  exception escape (it would crash the worker). A whole-source failure → raise; a single
  bad post in a profile → skip it and continue.
- Use the already-installed **`httpx`** for HTTP unless your platform needs a specific SDK.
- Be polite to platforms: reasonable timeouts, don't hammer (respect rate limits), and
  **MVP scope only** — public content, no login-gated/private data.
- `fetch()` should be reasonably **idempotent**: importing the same URL twice must not
  double-create places (downstream dedup by `google_place_id` handles this, so just return
  clean data).

### Where do I put…? (cheat sheet)

| I need to… | Edit |
|------------|------|
| turn a URL into content | `integrations/<you>_parser.py` → `fetch()` |
| improve extraction quality | `extraction_guidance` on your parser class |
| add a scraping library | `backend/pyproject.toml` → reinstall → commit |
| add an API key / setting | `core/config.py` **and** `backend/.env.example` |
| change the output *shape* | ❌ don't — `base.py` is a shared contract (ask the owner) |
| resolve a `google_place_id` | ❌ don't — that's the shared matching step |

---

## Troubleshooting (real issues we hit)

- **`places key loaded: False` / matching stuck on `pending`** — your
  `GOOGLE_PLACES_API_KEY` isn't loading. Check it's in `backend/.env` (not the
  frontend's), under the right name, no stray inline `#` comment.
- **403 `SERVICE_DISABLED` from Places** — enable **“Places API (New)”** (not the legacy
  “Places API”) for your Google Cloud project, then wait ~1–2 min. The error message
  contains the exact activation URL.
- **403 `API_KEY_HTTP_REFERRER_BLOCKED`** — that key is restricted to HTTP referrers (a
  browser/Maps-JS key) and can't be used server-side. Use a key with **no referrer
  restriction** for `GOOGLE_PLACES_API_KEY`.
- **`command not found: docker`** — start Colima (`colima start`); install via
  `brew install colima docker docker-compose`.
- **`unknown shorthand flag: 'f'`** — use hyphenated `docker-compose` (Compose v1).
- **`cp … # comment` fails** — zsh treats `#` literally; drop the comment.

---

## Definition of done (per platform)

- [ ] `fetch()` handles every `source_type` your platform supports and returns `list[SourceContent]`
- [ ] profile/channel fans out to one `SourceContent` per post/video; single posts return a 1-element list
- [ ] multi-place single-unit sources (thread / chaptered video) emit one `segment` per place (with `timestamp_seconds` / `source_url` where applicable)
- [ ] `suggested_collection_name` set to something sensible
- [ ] `extraction_guidance` tuned for your platform (you own quality, not the format)
- [ ] `preview` returns correct `ExtractedPlace` items for 2–3 real URLs
- [ ] failures raise `app.core.errors.ParseError` (never crash the worker)
- [ ] no extra fields invented — stick to the canonical format

## Don't (MVP scope)

- No private accounts, stories, comments, or login-gated content.
- Tune your prompt via `extraction_guidance` only — don't edit the **format contract** in
  `llm_client.py`, and don't change `base.py` or `google_places_client.py` without
  telling the team. Those are shared contracts.
- Don't resolve `google_place_id` yourself — that's the shared Place Matching step.

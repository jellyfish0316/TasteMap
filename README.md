# TasteMap 🍜🗺️

**Layer the food recommendations scattered across Instagram, YouTube, X, Threads, and
Google Maps onto a single personal map — every restaurant aligned to one
`google_place_id`.**

It lets you follow other people and see the spots *they've* saved.

![TasteMap Overall Architecture](<docs/architecture/TasteMap_Overall_Architecture.drawio.svg>)
![TasteMap Backend API Detail Diagram](<docs/architecture/TasteMap_Backend_API_Detail_Diagram.drawio.svg>)

---

## The core idea

Every restaurant resolves to a stable **`google_place_id`**. Google provides the base
data (name, address, hours, rating, photos, coordinates); TasteMap layers two voices on
top of it:

- **the creator's voice** — what an Instagram reel / YouTube video / thread said about it
  (author, summary, dishes, a quote, a deep link back to the moment)
- **your voice** — your own note, status, and which of *your* lists it lives in

Because a place is **global and deduplicated** by `google_place_id`, the same restaurant
shared by ten different creators is one pin with ten voices — never ten duplicates.

---

## Key features

### 🔗 Import from a link (Level 1)
- Paste any IG / YouTube / X / Threads / Google Maps URL → a background job scrapes it,
  an LLM extracts the recommended restaurants, and each is matched to a `google_place_id`.
- **Review screen** before saving: matched / needs-review / unmatched candidates, with
  **manual search** to resolve anything the matcher missed.
- **Runs in the background** — keep using the app while it works; a global indicator
  tracks progress and links you to the review when it's done.
- **`FAKE_IMPORTS` dev mode** — exercise the whole flow with zero scraping/API keys.

### 📍 Save places by hand
- A Google-Maps-style **search bar** over the map: search → pick → drop into a new or
  existing list with your own note. No import needed.

### 🗂️ Collections & the map
- Organize saves into **lists** (public or private), each rendered as pins on your map.
- Click a pin for the **place sheet**: Google base data + every card saved for it,
  attributed to its creator or to you.
- The map **flies to** a place when you search or click it.

### 👥 Taste Circle — social (Level 2)
- **Follow** people, browse their **public lists** on their profile, and see a **feed**
  of what they share.
- Followees' public places appear **on your map** and in your **sidebar** (attributed),
  so your map grows with your circle. Private lists never leak.

### 🔐 Accounts
- Email/password auth with JWT; every list and note is owner-scoped.

### 🔭 Coming next (Level 3)
- Personalized recommendations of **who to follow**, computed over the follow graph.

---

## Tech stack

| Layer | Tech |
|-------|------|
| **Backend** | FastAPI · SQLAlchemy 2.0 · Pydantic · Alembic |
| **Data** | PostgreSQL + **PostGIS** (geo) · Redis |
| **Async** | Celery (imports run as background jobs) |
| **AI** | Anthropic Claude (shared extraction) · Google **Places API (New)** (matching) |
| **Frontend** | React 18 · TypeScript · Vite · Tailwind · Zustand · React Router · `@vis.gl/react-google-maps` |
| **Infra** | Docker Compose (Postgres/PostGIS + Redis) · GitHub Actions CI |

---

## Project structure

```
TasteMap/
├── backend/                      # FastAPI app (API → Service → Repository layering)
│   ├── app/
│   │   ├── api/v1/               # HTTP routes: auth, imports, collections, places, social
│   │   ├── services/             # business logic (import, place_matching, collection, social…)
│   │   ├── repositories/         # data access (one per aggregate; Session-first, composable)
│   │   ├── models/               # SQLAlchemy models — user, place, collection,
│   │   │                         #   recommendation, import_job/candidate, follow
│   │   ├── schemas/              # Pydantic request/response models
│   │   ├── integrations/         # ⭐ platform parsers + shared clients
│   │   │   ├── base.py           #    the parser CONTRACT (read this first)
│   │   │   ├── {youtube,instagram,threads,x,google_maps}_parser.py   # the 5 owners' files
│   │   │   ├── llm_client.py     #    shared LLM extractor (fixed format contract)
│   │   │   ├── google_places_client.py   # google_place_id matching
│   │   │   ├── registry.py       #    URL → parser routing
│   │   │   └── fake_parser.py    #    FAKE_IMPORTS dev stub
│   │   ├── workers/              # Celery app + import/extraction/matching tasks
│   │   ├── core/                 # config, database, errors, security, redis
│   │   └── utils/                # geo, name normalization, ranking
│   ├── alembic/                  # DB migrations (0001_initial_schema = full schema + PostGIS)
│   └── pyproject.toml
│
├── frontend/                     # React + Vite SPA
│   └── src/
│       ├── pages/                # Map, ImportReview, Collection, Explore, Profile, UserProfile, Login
│       ├── components/           # MapView, MapSearchBar, PlaceDetailPanel, AddPlaceModal,
│       │                         #   FollowButton, PlaceSearch, BackgroundImportIndicator
│       ├── stores/               # Zustand: auth, user, map, import
│       ├── api/                  # axios clients (auth, import, collection, place, social)
│       └── types/                # TS types mirroring the backend schemas
│
├── infra/                        # docker-compose.yml + nginx / postgres / redis config
├── shared/                       # cross-team API contracts (JSON) shared by FE/BE
└── docs/                         # parsers guide, system design, product concept, per-API docs
```

---

## Getting started

**Prereqs:** Python 3.11+, Node 18+, and Docker (works on macOS / Linux / Windows-WSL2 —
see [docs/parsers.md](docs/parsers.md#1-set-up-your-machine-one-time) for per-OS setup).

```bash
# 1. Infra: Postgres+PostGIS + Redis
docker compose -f infra/docker-compose.yml up -d     # or hyphenated docker-compose on v1

# 2. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e '.[dev]'
cp .env.example .env                                  # then add your API keys (see below)
alembic upgrade head
uvicorn app.main:app --reload                         # API + docs at http://localhost:8000/docs

# 3. Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env                                  # set VITE_GOOGLE_MAPS_API_KEY
npm run dev                                            # http://localhost:5173
```

**Keys you'll want in `backend/.env`:** `ANTHROPIC_API_KEY` (extraction) and
`GOOGLE_PLACES_API_KEY` (matching — must have **Places API (New)** enabled). To try the
app with neither, set `FAKE_IMPORTS=true`.

> **Just want to click around?** Set `FAKE_IMPORTS=true`, start the backend + frontend,
> register an account, and paste *any* URL — canned demo restaurants flow all the way to
> the map.

---

## The import pipeline

```
URL ──registry──► Parser.fetch()  → SourceContent[]   (platform scraping/API — the 5 owners)
                       │
                       ├─ extract()        → ExtractedPlace[]   (shared Claude extractor)
                       ├─ place matching    → google_place_id   (Google Places, dedup point)
                       └─ ImportCandidate[]  → review → confirm → Recommendation in a Collection
```

Each platform owner implements **one** parser against the same contract; everything
downstream (matching → dedup → cards → map → social) is shared. Full contributor guide:
**[docs/parsers.md](docs/parsers.md)**.

---

## Documentation

| Doc | What |
|-----|------|
| [docs/product_concept.md](docs/product_concept.md) | The product vision (zh) |
| [docs/system-design.md](docs/system-design.md) | Architecture & data model |
| [docs/parsers.md](docs/parsers.md) | **Platform-parser contributor guide** (setup, where to write, how to test) |
| [docs/api/](docs/api/) | Per-surface API docs: auth, import, place, collection, recommendation, social |
| `http://localhost:8000/docs` | Live interactive OpenAPI docs |

---

## Team

Six contributors: five each own one platform parser
([`integrations/*_parser.py`](backend/app/integrations/)), and one owns the shared
backend pipeline, matching, and frontend. See the ownership table in
[docs/parsers.md](docs/parsers.md).

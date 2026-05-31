# TasteMap — UI Design Brief

*Hand this to Claude (or any designer) to generate the visual design. It's self-contained:
you shouldn't need the codebase to understand what to design.*

---

## 1. What TasteMap is (in one paragraph)

Food recommendations are scattered across Instagram, YouTube, X, Threads, and Google
Maps. **TasteMap pulls them onto one personal map.** A user pastes a link (an IG reel, a
YouTube video, a thread) and TasteMap extracts the restaurants, pins them on a map, and
keeps the *context* Google Maps throws away — **who** recommended it, the **dishes**, the
**takeaway**, a link back to the source. Users organize pins into **lists**, mark places
private or public, and **follow** other people to see the spots they've saved. Every
restaurant is aligned to one canonical Google place, so the same spot shared by many
creators is **one pin with many voices**, never duplicates.

**The emotional job:** "I saw a place I want to try — capture it in one tap, and find it
again when I'm actually nearby or planning."

---

## 2. Who it's for & the tone

- **Users:** food-curious people (early market: Taiwan, so content is often **Traditional
  Chinese** mixed with English — design must handle CJK text gracefully). Mobile-first
  mindset even though today it's a web app.
- **Tone:** warm, appetizing, trustworthy, uncluttered. The map and the food content are
  the stars; chrome should recede. Think "a tasteful personal guide," not a busy social
  feed. Closer to Google Maps' clarity than Instagram's density.

---

## 3. The "two voices" — the core data concept to express visually

Every saved place card carries two distinct voices. **The design should make them feel
different but related:**

1. **The creator's voice** (from the imported source): `@author`, the platform it came
   from, a one-line **summary**, recommended **dishes**, an optional **quote**, and a link
   back (e.g. a YouTube timestamp).
2. **The user's voice** (their overlay): their own **note**, a **status** (want-to-go /
   visited), and which of **their lists** it's in.

When a place comes from someone you **follow**, a third attribution appears: *"saved by
@person."* Cards should clearly answer **"who is telling me this?"** at a glance.

---

## 4. Screens to design

The product is ~7 screens. For each: what it's for, what it shows, key actions. Current
layout is described so you can **redesign/elevate it**, not reinvent the IA.

### A. Map (home) — the most important screen
The heart of the app. Today: a left **sidebar** + a full-bleed **Google map** with pins.
- **Sidebar** contains: an **import box** ("paste a link" + Import button), the user's
  **Collections** list, and a **"Following"** section (public lists from people they
  follow, each labeled *· by @owner*).
- **Over the map:** a **Google-Maps-style search bar** (search a place → pick → add to a
  list). Pins for every place the user saved **plus** places from people they follow.
- **Place detail panel** (slides in when a pin is tapped): the place's Google base data
  (name, ⭐ rating, address, "View on Google Maps" link) and **all the saved cards** for
  it (the two voices, attributed).
- **Background import indicator** (bottom corner, global): shows an import's progress and
  turns into a "Found N places — Review" link when done.
- *Design questions to solve:* sidebar vs. map balance; how the detail panel should feel
  (bottom sheet on mobile vs. side panel on desktop?); how to visually distinguish "my
  pins" from "my circle's pins."

### B. Import review
After an import finishes, the user reviews extracted restaurants before saving.
- A **destination** chooser (new list — with name + public toggle — or an existing list).
- A list of **candidate cards**, each with a **match status badge**: `matched` (green,
  checkbox enabled), `needs_review` (amber), `unmatched`/`pending` (grey). Each card shows
  the name, dishes, summary, author.
- Non-matched cards expose a **"Search manually"** action → inline place search → pick the
  right place → the card flips to matched.
- A **"Save N to list"** action.
- *Design goal:* make triage fast and reassuring — clear what's confidently matched vs.
  what needs a human, with the match badges doing a lot of work.

### C. Collection (a single list)
The places inside one list.
- Header: list name, public/private + place count, and (owner only) a **Delete list**
  action.
- A list of saved cards: place name, dishes, summary, the user's **note** (📝), and
  attribution (`@creator · platform`, or "added by you"). Owner sees a **Remove** per item.
- Viewing **someone else's public list** is read-only (no edit/delete).

### D. Explore (discover + feed) — the social screen
- A **search people** box → results with a **Follow/Following** toggle, each linking to a
  profile.
- A **feed** of public lists "from people you follow," each card → opens that list.

### E. User profile (someone else)
- Their name/@handle, a **Follow** button, and their **public lists**.

### F. My profile
- The user's name/@handle/email and **their own lists**.

### G. Login / Register
- Email + password (+ username/display name on register). Currently minimal — needs a
  proper welcoming first impression that sells the concept.

---

## 5. Key components & their states (please design these explicitly)

- **Place card** — the recurring unit. Variants: in a list, in the pin detail panel, as an
  import candidate. States: matched / needs-review / unmatched; from-creator vs. added-by-me
  vs. from-someone-you-follow; with/without dishes/quote/note. This is **the** component to
  nail.
- **Match-status badge** — matched / needs_review / unmatched / pending.
- **Map pin** — default, selected, and ideally a "from my circle" variant.
- **Place detail panel / bottom sheet** — the pin sheet.
- **Search bar** (map search + people search + manual place search share a pattern).
- **Follow button** — follow / following (hover = unfollow) states.
- **Background import indicator** — running / done / failed / dismissible.
- **Add-place modal** — search → pick → choose list + note → save.
- **Empty states** — no lists yet, empty list, empty feed, no search results, no pins.
- **Loading & error states** — imports, map load, page loads.

---

## 6. Primary user flows (design should make these effortless)

1. **Import:** paste link → (keep using app while it runs) → "Review" → triage candidates →
   save to a list → pins appear on the map.
2. **Capture by hand:** search bar → pick a place → add to a list with a note.
3. **Recall:** open the map / a list → tap a pin → see the place + why it was saved →
   open in Google Maps to navigate.
4. **Discover:** Explore → find a person → follow → their public pins join your map.

---

## 7. Visual direction & constraints

- **Implementation reality:** built in **React + Tailwind CSS**. Please design within a
  Tailwind-friendly system (8px spacing scale, standard radii/shadows, a small token set).
  Output that maps to Tailwind classes is ideal.
- **Base map:** Google Maps (we can style it via a Map ID / JSON style — feel free to
  propose a custom map style that fits the brand).
- **Current palette (a starting point, not a constraint):** warm **orange** accent
  (`#ea580c`-ish) on a **neutral grey** scale, white surfaces. You may propose a refined
  palette — keep it appetizing and accessible (WCAG AA contrast).
- **Type:** must render **Traditional Chinese + English** cleanly (suggest a font pairing
  that covers CJK, e.g. a Noto Sans TC + a Latin pairing).
- **Responsive:** **mobile-first** — design phone layouts first (the map likely becomes
  full-screen with a bottom sheet and a bottom nav), then desktop (sidebar + map). We may
  ship this as a mobile app later, so phone ergonomics matter.
- **Iconography:** clean line icons; we currently use emoji as placeholders (🍽 📍 📝 ⭐) —
  propose real icons but the meanings (dishes, location, note, rating) should stay legible.

---

## 8. What we'd love back from you

1. A **visual style / mini design-system**: color tokens, type scale, spacing, radii,
   elevation, button & input styles, the icon set.
2. **High-fidelity mockups** of the priority screens, **mobile + desktop**:
   **Map (home)** and the **Place card** first, then **Import review**, **Collection**,
   **Explore**, and **Login**.
3. The **place-card** and **place-detail-sheet** component designs with all states from §5.
4. A proposed **Google Maps style** (pin design + map theme) that matches the brand.
5. **Empty/loading/error** states for the priority screens.

Optimize for **clarity and appetite**: the map and the food cards should feel inviting and
instantly scannable, with the chrome quiet. If you must choose, favor mobile.

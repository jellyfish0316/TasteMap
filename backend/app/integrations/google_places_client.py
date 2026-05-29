"""Shared Google Places (new) client — aligns an ExtractedPlace to a google_place_id.

This is the LAST shared step of every import, run by the Place Matching Service:
each ExtractedPlace (just a name + region hint) is searched here and resolved to a
stable `google_place_id` plus base place data (address, rating, photos...).

Platform owners do NOT call this — you only produce ExtractedPlace items. It lives
here so matching is uniform across all sources.

Docs: Places API (New) Text Search & Place Details use a field mask header.
"""
from __future__ import annotations

import httpx
from pydantic import BaseModel

from app.core.config import settings
from app.core.errors import AppError

_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
_DETAILS_URL = "https://places.googleapis.com/v1/places/{place_id}"

# Field mask is required by Places API (New). Keep it lean to control cost.
_SEARCH_FIELDS = (
    "places.id,places.displayName,places.formattedAddress,"
    "places.location,places.rating,places.userRatingCount,places.googleMapsUri"
)
_DETAILS_FIELDS = (
    "id,displayName,formattedAddress,location,rating,userRatingCount,"
    "internationalPhoneNumber,regularOpeningHours,googleMapsUri,photos"
)


class PlaceCandidate(BaseModel):
    google_place_id: str
    name: str
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    rating: float | None = None
    user_rating_count: int | None = None
    google_maps_uri: str | None = None


def _key() -> str:
    if not settings.google_places_api_key:
        raise AppError("GOOGLE_PLACES_API_KEY is not set; cannot match places.")
    return settings.google_places_api_key


def text_search(query: str, *, region_hint: str | None = None, limit: int = 5) -> list[PlaceCandidate]:
    """Search Places by free text and return ranked candidates (best first)."""
    text_query = f"{query} {region_hint}".strip() if region_hint else query
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": _key(),
        "X-Goog-FieldMask": _SEARCH_FIELDS,
    }
    body = {"textQuery": text_query, "maxResultCount": limit}
    resp = httpx.post(_TEXT_SEARCH_URL, headers=headers, json=body, timeout=15)
    resp.raise_for_status()
    out: list[PlaceCandidate] = []
    for p in resp.json().get("places", []):
        loc = p.get("location", {})
        out.append(
            PlaceCandidate(
                google_place_id=p["id"],
                name=p.get("displayName", {}).get("text", ""),
                address=p.get("formattedAddress"),
                lat=loc.get("latitude"),
                lng=loc.get("longitude"),
                rating=p.get("rating"),
                user_rating_count=p.get("userRatingCount"),
                google_maps_uri=p.get("googleMapsUri"),
            )
        )
    return out


def place_details(google_place_id: str) -> dict:
    """Fetch full base data for a resolved place (raw Places API JSON)."""
    headers = {"X-Goog-Api-Key": _key(), "X-Goog-FieldMask": _DETAILS_FIELDS}
    resp = httpx.get(_DETAILS_URL.format(place_id=google_place_id), headers=headers, timeout=15)
    resp.raise_for_status()
    return resp.json()

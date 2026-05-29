"""Place API — read access to the shared place layer + the user's map.

  GET /places/search           proxy Google Places (manual add)
  GET /places/me               distinct places I've saved (map pins)
  GET /places/{id}             shared place detail (the pin sheet)
  GET /places/{id}/recommendations   my cards for this place, across my lists

Literal routes are declared before /{place_id} so they aren't shadowed.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db
from app.integrations.google_places_client import PlaceCandidate
from app.schemas.place import PlaceDetailResponse, PlaceSummary
from app.schemas.recommendation import RecommendationResponse
from app.services import place_service

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/search", response_model=list[PlaceCandidate])
def search_places(
    q: str = Query(..., min_length=1, description="Free-text place query."),
    region: str | None = Query(None, description="Locality hint to disambiguate (e.g. 台南)."),
    limit: int = Query(5, ge=1, le=10),
    _: uuid.UUID = Depends(get_current_user_id),
) -> list[PlaceCandidate]:
    return place_service.search(q, region_hint=region, limit=limit)


@router.get("/me", response_model=list[PlaceSummary])
def my_map(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> list[PlaceSummary]:
    return [PlaceSummary.model_validate(p) for p in place_service.list_map(db, user_id)]


@router.get("/{place_id}", response_model=PlaceDetailResponse)
def get_place(
    place_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: uuid.UUID = Depends(get_current_user_id),
) -> PlaceDetailResponse:
    return PlaceDetailResponse.model_validate(place_service.get_detail(db, place_id))


@router.get("/{place_id}/recommendations", response_model=list[RecommendationResponse])
def place_recommendations(
    place_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> list[RecommendationResponse]:
    recs = place_service.list_recommendations_for_place(db, place_id, user_id)
    return [RecommendationResponse.model_validate(r) for r in recs]

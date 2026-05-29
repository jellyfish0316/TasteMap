"""Collection API — CRUD for lists and the saved cards inside them.

All routes require auth. Reads honor visibility (owner, or public); mutations
require ownership. The list-detail response is what the frontend renders the map
and cards from.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db
from app.schemas.collection import (
    CollectionCreateRequest,
    CollectionDetailResponse,
    CollectionResponse,
    CollectionUpdateRequest,
)
from app.schemas.recommendation import RecommendationResponse, RecommendationUpdateRequest
from app.services import collection_service

router = APIRouter(prefix="/collections", tags=["collections"])


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    payload: CollectionCreateRequest,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> CollectionResponse:
    collection = collection_service.create(
        db, user_id=user_id, name=payload.name,
        description=payload.description, is_public=payload.is_public,
    )
    return CollectionResponse.model_validate(collection)


@router.get("", response_model=list[CollectionResponse])
def list_collections(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> list[CollectionResponse]:
    return [CollectionResponse.model_validate(c) for c in collection_service.list_for_user(db, user_id)]


@router.get("/{collection_id}", response_model=CollectionDetailResponse)
def get_collection(
    collection_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> CollectionDetailResponse:
    collection, recs = collection_service.get_detail(db, collection_id, user_id)
    return CollectionDetailResponse(
        **CollectionResponse.model_validate(collection).model_dump(),
        recommendations=[RecommendationResponse.model_validate(r) for r in recs],
    )


@router.patch("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: uuid.UUID,
    payload: CollectionUpdateRequest,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> CollectionResponse:
    collection = collection_service.update(
        db, collection_id, user_id, payload.model_dump(exclude_unset=True)
    )
    return CollectionResponse.model_validate(collection)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> None:
    collection_service.delete(db, collection_id, user_id)


@router.patch("/{collection_id}/items/{rec_id}", response_model=RecommendationResponse)
def update_recommendation(
    collection_id: uuid.UUID,
    rec_id: uuid.UUID,
    payload: RecommendationUpdateRequest,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> RecommendationResponse:
    rec = collection_service.update_recommendation(
        db, collection_id, rec_id, user_id, payload.model_dump(exclude_unset=True)
    )
    return RecommendationResponse.model_validate(rec)


@router.delete("/{collection_id}/items/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_recommendation(
    collection_id: uuid.UUID,
    rec_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> None:
    collection_service.remove_recommendation(db, collection_id, rec_id, user_id)

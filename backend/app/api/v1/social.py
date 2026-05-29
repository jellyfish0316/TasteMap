"""Social API (L2) — follow/unfollow, following/followers, and the explore feed."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db
from app.schemas.collection import CollectionResponse
from app.schemas.social import FeedItem, FollowRequest, FollowStatusResponse, UserPublic
from app.services import social_service

router = APIRouter(prefix="/social", tags=["social"])


@router.get("/search", response_model=list[UserPublic])
def search_users(
    q: str = Query(..., min_length=1, description="Match against username / display name."),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> list[UserPublic]:
    return [UserPublic.model_validate(u) for u in social_service.search_users(db, viewer_id=user_id, q=q)]


@router.post("/follows", status_code=status.HTTP_204_NO_CONTENT)
def follow_user(
    payload: FollowRequest,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> None:
    social_service.follow(db, follower_id=user_id, followee_id=payload.followee_id)


@router.delete("/follows/{followee_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
    followee_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> None:
    social_service.unfollow(db, follower_id=user_id, followee_id=followee_id)


@router.get("/following", response_model=list[UserPublic])
def following(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> list[UserPublic]:
    return [UserPublic.model_validate(u) for u in social_service.list_following(db, user_id)]


@router.get("/followers", response_model=list[UserPublic])
def followers(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> list[UserPublic]:
    return [UserPublic.model_validate(u) for u in social_service.list_followers(db, user_id)]


@router.get("/users/{target_id}", response_model=FollowStatusResponse)
def user_follow_status(
    target_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> FollowStatusResponse:
    user, is_following = social_service.follow_status(db, viewer_id=user_id, target_id=target_id)
    return FollowStatusResponse(user=UserPublic.model_validate(user), is_following=is_following)


@router.get("/users/{target_id}/collections", response_model=list[CollectionResponse])
def user_public_collections(
    target_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: uuid.UUID = Depends(get_current_user_id),
) -> list[CollectionResponse]:
    """A user's public lists — shown on their profile."""
    return [
        CollectionResponse.model_validate(c)
        for c in social_service.list_public_collections(db, target_id)
    ]


@router.get("/feed", response_model=list[FeedItem])
def explore_feed(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> list[FeedItem]:
    return [
        FeedItem(
            owner=UserPublic.model_validate(owner),
            collection=CollectionResponse.model_validate(collection),
            created_at=collection.created_at,
        )
        for collection, owner in social_service.explore_feed(db, user_id)
    ]

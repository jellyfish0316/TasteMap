"""Import API endpoints.

Two paths, both backed by `import_service`:

  * Dev / review:  POST /imports/preview   — synchronous, DB-free parser test.
  * Production:    POST /imports           — enqueue an async job (202)
                   GET  /imports/{id}      — poll status
                   GET  /imports/{id}/candidates — review extracted+matched cards
                   POST /imports/{id}/confirm    — save chosen cards to a collection
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db
from app.schemas.collection import CollectionResponse
from app.schemas.import_job import (
    CandidateResolveRequest,
    ImportCandidateResponse,
    ImportConfirmRequest,
    ImportJobResponse,
    ImportPreviewResponse,
    ImportRequest,
)
from app.services import import_service

router = APIRouter(prefix="/imports", tags=["imports"])


@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_import(payload: ImportRequest) -> ImportPreviewResponse:
    platform = import_service.detect(payload.url)
    # parsers are synchronous (scraping / blocking I/O) -> run off the event loop.
    result = await run_in_threadpool(import_service.preview, payload.url)
    return ImportPreviewResponse(
        platform=platform,
        source_type=result.source_type,
        result=result,
        stats=result.stats,
    )


@router.post("", response_model=ImportJobResponse, status_code=status.HTTP_202_ACCEPTED)
def create_import(payload: ImportRequest, db: Session = Depends(get_db)) -> ImportJobResponse:
    """Submit a URL for async import. Returns the pending job to poll."""
    job = import_service.enqueue(db, payload.url)
    return ImportJobResponse.model_validate(job)


@router.get("/{job_id}", response_model=ImportJobResponse)
def get_import(job_id: uuid.UUID, db: Session = Depends(get_db)) -> ImportJobResponse:
    from app.core.errors import NotFoundError
    from app.repositories import import_repository

    job = import_repository.get_job(db, job_id)
    if job is None:
        raise NotFoundError(f"Import job {job_id} not found")
    return ImportJobResponse.model_validate(job)


@router.get("/{job_id}/candidates", response_model=list[ImportCandidateResponse])
def list_candidates(job_id: uuid.UUID, db: Session = Depends(get_db)) -> list[ImportCandidateResponse]:
    from app.repositories import import_repository

    candidates = import_repository.list_candidates(db, job_id)
    return [ImportCandidateResponse.model_validate(c) for c in candidates]


@router.post("/{job_id}/candidates/{candidate_id}/resolve", response_model=ImportCandidateResponse)
def resolve_candidate(
    job_id: uuid.UUID,
    candidate_id: uuid.UUID,
    payload: CandidateResolveRequest,
    db: Session = Depends(get_db),
    _: uuid.UUID = Depends(get_current_user_id),
) -> ImportCandidateResponse:
    """Manually pin an unmatched/ambiguous candidate to a chosen Google place."""
    cand = import_service.resolve_candidate(db, job_id, candidate_id, candidate=payload.place)
    return ImportCandidateResponse.model_validate(cand)


@router.post("/{job_id}/confirm", response_model=CollectionResponse)
def confirm_import(
    job_id: uuid.UUID,
    payload: ImportConfirmRequest,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> CollectionResponse:
    """Save selected, matched candidates into an existing or new collection."""
    collection = import_service.confirm(
        db, job_id,
        user_id=user_id,
        collection_id=payload.collection_id,
        new_collection_name=payload.new_collection_name,
        is_public=payload.is_public,
        candidate_ids=payload.candidate_ids,
    )
    return CollectionResponse.model_validate(collection)

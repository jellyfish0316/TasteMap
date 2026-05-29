"""Data access for ImportJob + ImportCandidate (the import pipeline state)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.import_candidate import ImportCandidate, MatchStatus
from app.models.import_job import ImportJob, ImportStatus


# --- jobs ------------------------------------------------------------------- #
def create_job(db: Session, *, url: str, user_id: uuid.UUID | None = None,
               platform: str | None = None, source_type: str | None = None) -> ImportJob:
    job = ImportJob(url=url, user_id=user_id, platform=platform, source_type=source_type)
    db.add(job)
    db.flush()
    return job


def get_job(db: Session, job_id: uuid.UUID) -> ImportJob | None:
    return db.get(ImportJob, job_id)


def mark_running(db: Session, job: ImportJob) -> ImportJob:
    job.status = ImportStatus.running
    db.flush()
    return job


def mark_succeeded(db: Session, job: ImportJob, *, units_total: int, units_failed: int,
                   suggested_collection_name: str | None = None) -> ImportJob:
    job.status = ImportStatus.succeeded
    job.units_total = units_total
    job.units_failed = units_failed
    job.suggested_collection_name = suggested_collection_name
    job.finished_at = datetime.now(timezone.utc)
    db.flush()
    return job


def mark_failed(db: Session, job: ImportJob, *, error: str) -> ImportJob:
    job.status = ImportStatus.failed
    job.error = error
    job.finished_at = datetime.now(timezone.utc)
    db.flush()
    return job


# --- candidates ------------------------------------------------------------- #
def add_candidate(db: Session, *, import_job_id: uuid.UUID, **fields) -> ImportCandidate:
    candidate = ImportCandidate(import_job_id=import_job_id, **fields)
    db.add(candidate)
    db.flush()
    return candidate


def get_candidate(db: Session, candidate_id: uuid.UUID) -> ImportCandidate | None:
    return db.get(ImportCandidate, candidate_id)


def list_candidates(db: Session, job_id: uuid.UUID) -> list[ImportCandidate]:
    return list(
        db.scalars(
            select(ImportCandidate)
            .where(ImportCandidate.import_job_id == job_id)
            .order_by(ImportCandidate.created_at)
        )
    )


def set_match(db: Session, candidate: ImportCandidate, *, status: MatchStatus,
              matched_place_id: uuid.UUID | None = None,
              match_options: list | None = None) -> ImportCandidate:
    candidate.match_status = status
    candidate.matched_place_id = matched_place_id
    candidate.match_options = match_options
    db.flush()
    return candidate

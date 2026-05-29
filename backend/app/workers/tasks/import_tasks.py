"""Celery task that runs one import job end to end.

Thin wrapper: it owns a DB session and delegates all logic to `import_service`, so
the pipeline stays testable without Celery. Today one task processes a whole job
(fetch -> per-unit extract -> per-place match -> persist candidates); per-unit /
per-place fan-out across workers can be layered on later via `extraction_tasks` /
`place_matching_tasks`.
"""
from __future__ import annotations

import uuid

from app.core.database import SessionLocal
from app.services import import_service
from app.workers.celery_app import celery_app


@celery_app.task(name="imports.run_import", bind=True, max_retries=2, default_retry_delay=10)
def run_import(self, job_id: str) -> str:  # noqa: ANN001 (Celery task self)
    db = SessionLocal()
    try:
        import_service.run_import_job(db, uuid.UUID(job_id))
    finally:
        db.close()
    return job_id

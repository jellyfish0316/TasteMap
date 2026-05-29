"""Worker entrypoint alias.

The Celery app lives in `app.workers.celery_app`; this re-export lets you start a
worker as either module:
    celery -A app.workers.celery_app worker
    celery -A app.workers.import_worker worker
"""
from __future__ import annotations

from app.workers.celery_app import celery_app

__all__ = ["celery_app"]

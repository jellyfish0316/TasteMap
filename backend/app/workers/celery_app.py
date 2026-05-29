"""Celery application for async import processing.

Run a worker locally with:
    celery -A app.workers.celery_app worker --loglevel=info

For tests / quick local runs without a broker, set CELERY_TASK_ALWAYS_EAGER=true
in the environment and tasks run inline in the calling process.
"""
from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "tastemap",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks.import_tasks"],
)

celery_app.conf.update(
    task_always_eager=settings.celery_task_always_eager,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

"""TasteMap FastAPI application entrypoint.

Run locally:  uvicorn app.main:app --reload
Docs:         http://localhost:8000/docs
"""
from __future__ import annotations

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import register_exception_handlers

app = FastAPI(title="TasteMap API", version="0.1.0")
register_exception_handlers(app)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}

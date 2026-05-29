"""Aggregate v1 router. Feature routers are included here as they land."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, collections, imports, places

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(imports.router)
api_router.include_router(collections.router)
api_router.include_router(places.router)

# TODO: include social, recommendations routers as their owners implement them.

"""ORM models package.

Importing this package imports every model, so `Base.metadata` is fully populated
for Alembic autogenerate and for `Base.metadata.create_all()` in tests. Always add
new models to the imports below.
"""
from __future__ import annotations

from app.models.collection import Collection
from app.models.follow import Follow
from app.models.import_candidate import ImportCandidate, MatchStatus
from app.models.import_job import ImportJob, ImportStatus
from app.models.place import Place
from app.models.recommendation import Recommendation
from app.models.user import User

__all__ = [
    "Collection",
    "Follow",
    "ImportCandidate",
    "ImportJob",
    "ImportStatus",
    "MatchStatus",
    "Place",
    "Recommendation",
    "User",
]

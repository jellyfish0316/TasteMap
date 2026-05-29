"""Reserved: per-unit extraction tasks (future fan-out optimization).

Today `import_tasks.run_import` runs extraction inline for every unit of an import.
When profile/channel imports get large enough to benefit from parallelism, each
unit's `extraction_service.extract()` can be dispatched here as its own task and
fanned in with a Celery chord. Intentionally empty until that's needed — keeping
the single-task pipeline simple for the MVP.
"""
from __future__ import annotations

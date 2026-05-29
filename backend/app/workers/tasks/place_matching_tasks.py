"""Reserved: per-place matching tasks (future fan-out optimization).

Today `import_tasks.run_import` calls `place_matching_service.match()` inline per
extracted place. If Google Places latency becomes the bottleneck on large imports,
each place's match can be dispatched here as its own task. Intentionally empty
until that's needed.
"""
from __future__ import annotations

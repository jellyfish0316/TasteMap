"""Dev tool: drive the FULL import pipeline for a URL and print the result.

Unlike preview (fetch+extract only), this runs the real worker body end to end:
    fetch -> extract (LLM) -> place_matching (Google Places) -> persist candidates
in the DB. Needs Postgres+Redis up and CELERY_TASK_ALWAYS_EAGER=true so the job
runs inline.

Usage:
    FAKE_IMPORTS=false python scripts/run_pipeline.py <url>
"""
from __future__ import annotations

import sys


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: python scripts/run_pipeline.py <url>")
    url = sys.argv[1]

    from app.core.database import SessionLocal
    from app.repositories import import_repository
    from app.services import import_service

    db = SessionLocal()
    try:
        # Eager Celery => enqueue() runs the whole pipeline before it returns.
        job = import_service.enqueue(db, url)
        db.refresh(job)

        print("=" * 72)
        print(f"JOB {job.id}")
        print(f"  status:     {job.status}")
        print(f"  platform:   {job.platform}    source_type: {job.source_type}")
        print(f"  units:      total={job.units_total} failed={job.units_failed}")
        print(f"  suggested:  {job.suggested_collection_name}")
        if job.error:
            print(f"  error:      {job.error}")

        candidates = import_repository.list_candidates(db, job.id)
        print(f"\n{len(candidates)} CANDIDATE(S)  (name -> match):")
        print("=" * 72)
        for c in candidates:
            p = c.matched_place
            if p is not None:
                match = f"✓ {c.match_status.value} -> {p.name}"
                extra = f"[{p.google_place_id}]"
                if p.rating is not None:
                    extra += f" ★{p.rating}"
                if p.address:
                    extra += f"  {p.address}"
            else:
                n = len(c.match_options or [])
                match = f"… {c.match_status.value}" + (f" ({n} option(s) to pick from)" if n else "")
                extra = ""
            print(f"  • {c.name}")
            print(f"      {match}")
            if extra:
                print(f"      {extra}")
    finally:
        db.close()


if __name__ == "__main__":
    main()

"""Dev tool: run import preview on one or more URLs and print a compact report.

For each URL: source_type / author, the scraped caption (so you can confirm it's
THIS post), the extracted places[], and stats. Per-URL errors are isolated so one
bad link doesn't stop the rest.

Usage:
    FAKE_IMPORTS=false python scripts/preview_urls.py <url> [<url> ...]
"""
from __future__ import annotations

import sys


def main() -> None:
    urls = sys.argv[1:]
    if not urls:
        sys.exit("usage: python scripts/preview_urls.py <url> [<url> ...]")

    from app.integrations.registry import get_parser_for_url
    from app.services import import_service

    for i, url in enumerate(urls, 1):
        print(f"\n{'#'*72}\n# [{i}/{len(urls)}] {url}\n{'#'*72}")
        try:
            content = get_parser_for_url(url).fetch(url)[0]
            print(f"source_type: {content.source_type}   author: {content.author}")
            print(f"images: {len(content.image_urls)}")
            print("\n--- scraped caption (is this the right post?) ---")
            print(content.text or "(empty)")

            result = import_service.preview(url)
            print(f"\n--- extracted {len(result.places)} place(s)  stats={result.stats} ---")
            for p in result.places:
                bits = [p.name]
                if p.region_hint:
                    bits.append(f"region={p.region_hint}")
                if p.dishes:
                    bits.append(f"dishes={p.dishes}")
                if p.context_tags:
                    bits.append(f"tags={p.context_tags}")
                print("  - " + "  ".join(bits))
        except Exception as exc:  # noqa: BLE001 — dev tool: show, don't crash the batch
            print(f"!! {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()

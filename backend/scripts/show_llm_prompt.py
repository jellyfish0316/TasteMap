"""Dev tool: run an import preview and print EXACTLY what gets sent to the LLM.

Wraps the OpenAI / Anthropic client's request method so the real system+user
payload is dumped right before the network call, then runs the normal preview.

Usage:
    FAKE_IMPORTS=false python scripts/show_llm_prompt.py <url>
"""
from __future__ import annotations

import json
import sys


def _dump(provider: str, kwargs: dict) -> None:
    print(f"\n{'='*70}\nLLM REQUEST  (provider={provider}, model={kwargs.get('model')})\n{'='*70}")
    if provider == "openai":
        for msg in kwargs.get("messages", []):
            print(f"\n----- {msg['role'].upper()} MESSAGE -----\n{msg['content']}")
    else:  # anthropic: system is a list of blocks, messages are user/assistant
        for i, block in enumerate(kwargs.get("system", [])):
            print(f"\n----- SYSTEM BLOCK {i} (cache_control={block.get('cache_control')}) -----\n{block['text']}")
        for msg in kwargs.get("messages", []):
            print(f"\n----- {msg['role'].upper()} MESSAGE -----\n{msg['content']}")
    print(f"\n{'='*70}\n(sending to LLM...)\n")


def _patch() -> None:
    from openai.resources.chat.completions import Completions

    _orig_openai = Completions.create

    def openai_create(self, *a, **kw):
        _dump("openai", kw)
        return _orig_openai(self, *a, **kw)

    Completions.create = openai_create

    from anthropic.resources.messages import Messages

    _orig_anthropic = Messages.create

    def anthropic_create(self, *a, **kw):
        _dump("anthropic", kw)
        return _orig_anthropic(self, *a, **kw)

    Messages.create = anthropic_create


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: python scripts/show_llm_prompt.py <url>")
    url = sys.argv[1]
    _patch()
    from app.services import import_service

    result = import_service.preview(url)
    print(f"{'='*70}\nPARSE RESULT\n{'='*70}")
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    main()

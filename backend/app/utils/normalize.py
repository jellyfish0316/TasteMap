"""Text normalization helpers, used by place matching to compare names.

Kept dependency-free and Unicode-aware so it works for CJK names too (we only
strip punctuation/whitespace and casefold; we do NOT transliterate).
"""
from __future__ import annotations

import re
import unicodedata

# Punctuation / symbol categories to drop when comparing names.
_PUNCT_RE = re.compile(r"[\s　]+")
_DROP_CATEGORIES = {"P", "S"}  # Punctuation, Symbol


def normalize_name(value: str) -> str:
    """Casefold, NFKC-normalize, and strip punctuation/whitespace.

    "Aunt Stella's Café!" -> "auntstellascafe"  (well, "auntstellascafé" -> NFKC
    keeps the accent; matching uses similarity so that's fine). Empty in -> empty.
    """
    if not value:
        return ""
    text = unicodedata.normalize("NFKC", value).casefold()
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] not in _DROP_CATEGORIES)
    return _PUNCT_RE.sub("", text).strip()

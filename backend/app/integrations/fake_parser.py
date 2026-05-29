"""Fake parser — DEV/TEST ONLY, gated behind settings.fake_imports.

Returns canned, realistic-looking recommendations for ANY url so the full L1 flow
(import -> review -> confirm -> map) can be exercised without scraping or API keys.
The registry routes to this only when `fake_imports` is on; place matching is also
synthesized (see place_matching_service), so no Google call happens either.

This is NOT one of the 5 real platform parsers — it never participates in normal
url routing.
"""
from __future__ import annotations

from typing import ClassVar

from app.integrations.base import ExtractedPlace, SourceContent, SourceParser

# A few real-ish Taiwan food spots so the review/cards/map look believable.
_FAKE_PLACES: list[dict] = [
    {
        "name": "阿堂鹹粥",
        "region_hint": "台南",
        "dishes": ["虱目魚粥", "魚肚"],
        "summary": "台南經典早餐，湯頭鮮甜、魚肉新鮮。",
        "quote": "在地人從小吃到大的味道。",
        "context_tags": ["排隊久", "傳統早餐"],
        "confidence": 0.95,
    },
    {
        "name": "文章牛肉湯",
        "region_hint": "台南",
        "dishes": ["牛肉湯", "肉燥飯"],
        "summary": "現宰溫體牛，湯頭清甜，配肉燥飯一絕。",
        "quote": "早上六點就開始排。",
        "context_tags": ["早餐", "排隊久"],
        "confidence": 0.9,
    },
    {
        "name": "莉莉水果店",
        "region_hint": "台南",
        "dishes": ["水果切盤", "蜜豆冰"],
        "summary": "孔廟旁的老字號冰果室，料多新鮮。",
        "quote": "飯後散步來一碗剛剛好。",
        "context_tags": ["甜點", "散步順路"],
        "confidence": 0.88,
    },
]


class FakeParser(SourceParser):
    platform: ClassVar[str] = "fake"
    url_patterns: ClassVar[list[str]] = []  # routed explicitly by the registry, not by pattern
    uses_llm: ClassVar[bool] = False

    @classmethod
    def detect_source_type(cls, url: str) -> str:
        return "demo"

    def fetch(self, url: str) -> list[SourceContent]:
        return [
            SourceContent(
                platform=self.platform,
                source_url=url,
                source_type="demo",
                author="tastemap_demo",
                title="示範匯入",
                text="(fake import for testing)",
                suggested_collection_name="台南示範清單",
            )
        ]

    def extract(self, content: SourceContent) -> list[ExtractedPlace]:
        return [ExtractedPlace(source_url=content.source_url, **p) for p in _FAKE_PLACES]

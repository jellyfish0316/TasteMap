from app.integrations.base import ExtractedPlace
from app.services.import_service import _dedup_by_name, _merge_place


def test_dedup_by_name_merges_same_restaurant_across_posts() -> None:
    places = [
        ExtractedPlace(
            name="Little Bowl",
            dishes=["beef noodles"],
            context_tags=["cozy"],
            source_url="https://t/post/AAA",
        ),
        ExtractedPlace(
            name="little  bowl!",  # same shop, different post: punctuation/spacing differ
            dishes=["dumplings"],
            context_tags=["cheap"],
            summary="great spot",
            source_url="https://t/post/BBB",
        ),
        ExtractedPlace(name="Other Place"),
    ]

    out = _dedup_by_name(places)

    assert len(out) == 2  # the two "Little Bowl" mentions collapsed into one
    merged = out[0]
    assert merged.name == "Little Bowl"  # first-seen name wins
    assert merged.dishes == ["beef noodles", "dumplings"]  # union, order-preserving
    assert merged.context_tags == ["cozy", "cheap"]
    assert merged.summary == "great spot"  # first non-empty scalar filled in
    assert merged.source_url == "https://t/post/AAA"  # first deep link kept


def test_merge_place_ors_flags_and_takes_max_confidence() -> None:
    into = ExtractedPlace(name="X", is_ad=False, is_negative=None, confidence=0.4)
    other = ExtractedPlace(name="X", is_ad=True, is_negative=True, confidence=0.9)

    _merge_place(into, other)

    assert into.is_ad is True
    assert into.is_negative is True
    assert into.confidence == 0.9


def test_dedup_keeps_nameless_places_separate() -> None:
    places = [ExtractedPlace(name=""), ExtractedPlace(name="")]

    out = _dedup_by_name(places)

    assert len(out) == 2  # empty names must not all collapse into one

import pytest

from app.core.errors import ParseError
from app.integrations.threads_parser import ThreadsParser


def test_threads_post_from_meta_tags() -> None:
    parser = ThreadsParser()
    html = """
    <html>
      <head>
        <meta property="og:title" content="Tester on Threads">
        <meta property="og:description" content="Loved this ramen shop for dinner.">
        <meta property="og:image" content="https://example.com/ramen.jpg">
        <link rel="canonical" href="https://www.threads.net/@tester/post/ABC123">
      </head>
    </html>
    """

    content = parser._parse_post(
        url="https://www.threads.net/@tester/post/ABC123",
        final_url="https://www.threads.net/@tester/post/ABC123",
        html=html,
    )

    assert content.platform == "threads"
    assert content.source_type == "post"
    assert content.source_url == "https://www.threads.net/@tester/post/ABC123"
    assert content.author == "tester"
    assert content.title == "Tester on Threads"
    assert content.text == "Loved this ramen shop for dinner."
    assert content.image_urls == ["https://example.com/ramen.jpg"]
    assert content.suggested_collection_name == "@tester Threads food finds"
    assert content.raw["post_id"] == "ABC123"


def test_threads_post_prefers_food_text_from_json() -> None:
    parser = ThreadsParser()
    html = """
    <html>
      <head>
        <meta property="og:description" content="A normal day out.">
        <link rel="canonical" href="https://www.threads.net/@foodie/post/XYZ789">
        <script type="application/json">
          {
            "post": {
              "text": "Dinner at Little Bowl was great. Order the beef noodles."
            }
          }
        </script>
      </head>
    </html>
    """

    content = parser._parse_post(
        url="https://www.threads.net/@foodie/post/XYZ789",
        final_url="https://www.threads.net/@foodie/post/XYZ789",
        html=html,
    )

    assert content.text == "Dinner at Little Bowl was great. Order the beef noodles."


def test_threads_post_anchors_on_matching_node_not_longer_decoy() -> None:
    # The page embeds OTHER posts too (author's other posts, recommendations).
    # The parser must pick the node whose `code` matches the URL — even when a
    # different embedded post has much longer text.
    parser = ThreadsParser()
    html = """
    <html>
      <head>
        <meta property="og:description" content="short fallback caption">
        <link rel="canonical" href="https://www.threads.com/@chef/post/TARGET1">
      </head>
      <body>
        <script type="application/json">
          {"data": {"media": {"code": "OTHER99", "caption":
            {"text": "DECOY a totally different and much much much longer post about ramen and sushi dinner"}}}}
        </script>
        <script type="application/json">
          {"data": {"media": {"code": "TARGET1",
            "user": {"username": "chef"},
            "caption": {"text": "Beef noodles at Little Bowl."},
            "image_versions2": {"candidates": [{"url": "https://img/real.jpg"}]}}}}
        </script>
      </body>
    </html>
    """

    content = parser._parse_post(
        url="https://www.threads.com/@chef/post/TARGET1",
        final_url="https://www.threads.com/@chef/post/TARGET1",
        html=html,
    )

    assert content.text == "Beef noodles at Little Bowl."
    assert content.author == "chef"
    assert content.image_urls == ["https://img/real.jpg"]


_PROFILE_HTML = """
<html>
  <head><link rel="canonical" href="https://www.threads.com/@chef"></head>
  <body>
    <script type="application/json">
      {"data": {"posts": [
        {"code": "AAA", "user": {"username": "chef"},
         "caption": {"text": "Ramen at Ichiran was great."},
         "image_versions2": {"candidates": [{"url": "https://img/a.jpg"}]}},
        {"code": "BBB", "user": {"username": "chef"},
         "caption": {"text": "Coffee at Fika, lovely."}},
        {"code": "REF1"}
      ]}}
    </script>
  </body>
</html>
"""


def test_threads_profile_fans_out_one_unit_per_post() -> None:
    parser = ThreadsParser()

    units = parser._parse_profile(
        url="https://www.threads.com/@chef",
        final_url="https://www.threads.com/@chef",
        html=_PROFILE_HTML,
    )

    # Two real posts; the bare {"code": "REF1"} reference (no caption) is ignored.
    assert len(units) == 2
    assert all(u.source_type == "post" for u in units)
    assert units[0].source_url == "https://www.threads.com/@chef/post/AAA"
    assert units[0].text == "Ramen at Ichiran was great."
    assert units[0].image_urls == ["https://img/a.jpg"]
    assert units[1].source_url == "https://www.threads.com/@chef/post/BBB"
    assert all(u.suggested_collection_name == "@chef Threads food finds" for u in units)


def test_threads_profile_skips_reposts_from_other_users() -> None:
    parser = ThreadsParser()
    html = """
    <html>
      <head><link rel="canonical" href="https://www.threads.com/@chef"></head>
      <body>
        <script type="application/json">
          {"data": {"posts": [
            {"code": "AAA", "user": {"username": "chef"},
             "caption": {"text": "My own post about dinner."}},
            {"code": "ZZZ", "user": {"username": "someone_else"},
             "caption": {"text": "A recommended post from another account."}}
          ]}}
        </script>
      </body>
    </html>
    """

    units = parser._parse_profile(
        url="https://www.threads.com/@chef",
        final_url="https://www.threads.com/@chef",
        html=html,
    )

    assert len(units) == 1
    assert units[0].author == "chef"
    assert units[0].source_url == "https://www.threads.com/@chef/post/AAA"


def test_threads_profile_respects_max_posts_cap(monkeypatch) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "profile_max_posts", 1)
    parser = ThreadsParser()

    units = parser._parse_profile(
        url="https://www.threads.com/@chef",
        final_url="https://www.threads.com/@chef",
        html=_PROFILE_HTML,
    )

    assert len(units) == 1
    assert units[0].source_url == "https://www.threads.com/@chef/post/AAA"


def test_threads_profile_with_no_posts_is_clear_error() -> None:
    parser = ThreadsParser()

    with pytest.raises(ParseError, match="No public posts found"):
        parser._parse_profile(
            url="https://www.threads.com/@empty",
            final_url="https://www.threads.com/@empty",
            html="<html><body>nothing here</body></html>",
        )

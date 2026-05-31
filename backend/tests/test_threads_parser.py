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


def test_threads_profile_is_clear_unsupported_error() -> None:
    parser = ThreadsParser()

    with pytest.raises(ParseError, match="profile import is not supported"):
        parser.fetch("https://www.threads.net/@tester")
